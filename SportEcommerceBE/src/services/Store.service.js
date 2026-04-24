import Store from "../models/Store.model.js";
import AppError from "../utils/AppError.js";
import redis from "../config/Redis.js";

const STORE_CACHE_TTL_SECONDS = 300;
const buildStoreDetailCacheKey = (storeId) => `store:detail:${storeId}:v1`;

const invalidateStoreCache = async (storeId) => {
  try {
    await redis.del(
      buildStoreDetailCacheKey(String(storeId)),
      buildStoreBannerCacheKey(String(storeId)),
    );
  } catch (error) {
    console.error("Redis invalidate store cache error:", error?.message);
  }
};

const createStore = async (newStore) => {
  const store = new Store(newStore);
  await store.save();
  await invalidateStoreCache(store._id);
  return store;
};

const updateStore = async (updateData, storeId) => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Cửa hàng không tồn tại", 404, 2);
  }

  const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, {
    new: true,
    runValidators: true,
  });
  await invalidateStoreCache(storeId);

  return updatedStore;
};

const getDetailStore = async (storeId) => {
  const cacheKey = buildStoreDetailCacheKey(storeId);

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Redis get store detail cache error:", error?.message);
  }

  const store = await Store.findById(storeId).lean();
  if (!store) {
    throw new AppError("Cửa hàng không tồn tại", 404, 2);
  }

  try {
    await redis.set(cacheKey, JSON.stringify(store), {
      EX: STORE_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("Redis set store detail cache error:", error?.message);
  }

  return store;
};

export { createStore, updateStore, getDetailStore };
