import Product from "../models/Product.model.js";
import Category from "../models/Category.model.js";
import AppError from "../utils/AppError.js";
import redis from "../config/Redis.js";
import mongoose from "mongoose";

const HOME_PRODUCTS_CACHE_KEY = "product:home:v1";
const HOME_BEST_SELLER_CACHE_KEY = "product:home:best-seller:v1";
const HOME_PRODUCTS_CACHE_TTL_SECONDS = 300;

const parseFilterValues = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .flatMap((item) => String(item || "").split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const slugifyValue = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildSlugCandidates = (values = []) => {
  const candidates = new Set();
  const addSlugVariants = (candidate) => {
    const normalized = String(candidate || "")
      .trim()
      .toLowerCase();
    if (!normalized) return;

    candidates.add(normalized);
    candidates.add(normalized.replace(/-/g, "_"));
    candidates.add(normalized.replace(/_/g, "-"));
  };

  values.forEach((value) => {
    const raw = String(value || "")
      .trim()
      .toLowerCase();
    if (!raw) {
      return;
    }

    const rawCandidate = raw.replace(/\s+/g, "_");
    const slugified = slugifyValue(raw);

    addSlugVariants(rawCandidate);
    addSlugVariants(slugified);
  });

  return [...candidates];
};

const resolveCategoryIdsFromSlugFilters = async (filters = {}) => {
  const categoryValues = parseFilterValues(filters.category);
  const subCategoryValues = parseFilterValues(filters.category_sub);

  const allCategoryValues = [...categoryValues, ...subCategoryValues];

  const hasCategoryFilter = allCategoryValues.length > 0;

  if (!hasCategoryFilter) {
    return {
      hasCategoryFilter: false,
      categoryObjectIds: [],
    };
  }

  const categoryDocs = await Category.find({
    category_slug: { $in: buildSlugCandidates(allCategoryValues) },
    is_active: { $ne: false },
  })
    .select("_id category_level category_parent_id")
    .lean();

  const levelOneCategoryIds = categoryDocs
    .filter((category) => Number(category?.category_level) === 1)
    .map((category) => String(category._id));

  const directCategoryIds = categoryDocs
    .filter((category) => Number(category?.category_level) !== 1)
    .map((category) => String(category._id));

  const finalCategoryIds = new Set();

  directCategoryIds.forEach((categoryId) => finalCategoryIds.add(categoryId));
  levelOneCategoryIds.forEach((categoryId) => finalCategoryIds.add(categoryId));

  if (levelOneCategoryIds.length > 0) {
    const levelTwoCategories = await Category.find({
      category_parent_id: { $in: levelOneCategoryIds },
      is_active: { $ne: false },
    })
      .select("_id")
      .lean();

    levelTwoCategories.forEach((category) =>
      finalCategoryIds.add(String(category._id)),
    );
  }

  return {
    hasCategoryFilter: true,
    categoryObjectIds: [...finalCategoryIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    ),
  };
};

const invalidateHomeProductsCache = async () => {
  try {
    await redis.del(HOME_PRODUCTS_CACHE_KEY);
    await redis.del(HOME_BEST_SELLER_CACHE_KEY);
  } catch (error) {
    console.error(
      "Redis invalidate home products cache error:",
      error?.message,
    );
  }
};

const createProduct = async (newProduct) => {
  const {
    product_title,
    product_category,
    product_brand,
    product_img,
    product_description,
    product_display,
    product_famous,
    product_rate,
    product_percent_discount,
    colors,
    attributes,
  } = newProduct;

  let product_price = 0;
  let product_countInStock = 0;

  const allPrices = colors.flatMap((color) =>
    color.variants.map((variant) => Number(variant.variant_price)),
  );

  product_price = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  product_countInStock = colors.reduce((acc, color) => {
    return (
      acc +
      color.variants.reduce(
        (sum, variant) => sum + Number(variant.variant_countInStock),
        0,
      )
    );
  }, 0);

  const newProductData = {
    product_title,
    product_category,
    product_description,
    product_display,
    product_famous,
    product_rate,
    product_brand,
    product_img,
    product_percent_discount,
    colors,
    product_price,
    product_countInStock,
    attributes,
  };

  const newProductInstance = await Product.create(newProductData);
  await invalidateHomeProductsCache();
  return {
    data: newProductInstance,
  };
};

const updateProduct = async (productId, updatedProduct) => {
  const existingProduct = await Product.findById(productId);

  if (!existingProduct) {
    throw new AppError("Không tìm thấy sản phẩm", 404, 1);
  }

  let updateData = { ...updatedProduct };

  if (updateData.colors) {
    const validPrices = updateData.colors
      .flatMap((color) =>
        color.variants.map((variant) => Number(variant.variant_price)),
      )
      .filter((price) => !isNaN(price) && price > 0);

    updateData.product_price =
      validPrices.length > 0
        ? Math.min(...validPrices)
        : existingProduct.product_price;

    const countInStockOfEachColor = updateData.colors.map((color) =>
      color.variants.reduce((sum, variant) => {
        const countInStock = variant._doc
          ? Number(variant._doc.variant_countInStock)
          : Number(variant.variant_countInStock);
        return sum + (countInStock || 0);
      }, 0),
    );
    updateData.product_countInStock = countInStockOfEachColor.reduce(
      (sum, count) => {
        return sum + count;
      },
      0,
    );
  }

  const updatedProductInstance = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true },
  );

  if (!updatedProductInstance) {
    throw new AppError("Cập nhật sản phẩm thất bại", 500, 2);
  }
  await invalidateHomeProductsCache();
  return updatedProductInstance;
};

const getDetailsProduct = async (id) => {
  const product = await Product.findById(id).populate("product_category");

  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404, 1);
  }

  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404, 1);
  }

  await product.deleteOne();
  await invalidateHomeProductsCache();
  return { message: "Xóa sản phẩm thành công" };
};

const getHomeProducts = async (options = {}) => {
  const page = Math.max(1, Number.parseInt(options.page, 10) || 1);
  const limit = Math.max(1, Number.parseInt(options.limit, 10) || 16);

  const mapProductCard = (product) => ({
    _id: product._id,
    product_title: product.product_title,
    product_img: product.product_img,
    product_price: product.product_price,
    product_percent_discount: product.product_percent_discount || 0,
    product_rate: product.product_rate || 0,
    product_category: product.product_category
      ? {
          _id: product.product_category._id,
          category_type: product.product_category.category_type,
          category_gender: product.product_category.category_gender,
        }
      : null,
  });

  let allProducts = [];
  try {
    const cachedData = await redis.get(HOME_PRODUCTS_CACHE_KEY);
    if (cachedData) {
      allProducts = JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Redis get home products cache error:", error?.message);
  }

  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    const products = await Product.find(
      {},
      {
        _id: 1,
        product_title: 1,
        product_img: 1,
        product_price: 1,
        product_percent_discount: 1,
        product_rate: 1,
        product_category: 1,
      },
    )
      .populate("product_category", "_id category_type category_gender")
      .sort({ createdAt: -1 })
      .lean();

    allProducts = products.map(mapProductCard);

    try {
      await redis.set(HOME_PRODUCTS_CACHE_KEY, JSON.stringify(allProducts), {
        EX: HOME_PRODUCTS_CACHE_TTL_SECONDS,
      });
    } catch (error) {
      console.error("Redis set home products cache error:", error?.message);
    }
  }

  const totalItems = allProducts.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;
  const startIndex = (page - 1) * limit;
  const products = allProducts.slice(startIndex, startIndex + limit);

  return {
    products,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

const getBestSellerProducts = async (options = {}) => {
  const limit = Math.max(1, Number.parseInt(options.limit, 10) || 8);

  const mapProductCard = (product) => ({
    _id: product._id,
    product_title: product.product_title,
    product_img: product.product_img,
    product_price: product.product_price,
    product_percent_discount: product.product_percent_discount || 0,
    product_rate: product.product_rate || 0,
    product_category: product.product_category
      ? {
          _id: product.product_category._id,
          category_type: product.product_category.category_type,
          category_gender: product.product_category.category_gender,
        }
      : null,
  });

  let bestSellerProducts = [];
  try {
    const cachedData = await redis.get(HOME_BEST_SELLER_CACHE_KEY);
    if (cachedData) {
      bestSellerProducts = JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Redis get best-seller cache error:", error?.message);
  }

  if (!Array.isArray(bestSellerProducts) || bestSellerProducts.length === 0) {
    const products = await Product.find(
      {},
      {
        _id: 1,
        product_title: 1,
        product_img: 1,
        product_price: 1,
        product_percent_discount: 1,
        product_rate: 1,
        product_selled: 1,
        product_category: 1,
      },
    )
      .populate("product_category", "_id category_type category_gender")
      .sort({ product_selled: -1, createdAt: -1 })
      .lean();

    bestSellerProducts = products.map(mapProductCard);

    try {
      await redis.set(
        HOME_BEST_SELLER_CACHE_KEY,
        JSON.stringify(bestSellerProducts),
        {
          EX: HOME_PRODUCTS_CACHE_TTL_SECONDS,
        },
      );
    } catch (error) {
      console.error("Redis set best-seller cache error:", error?.message);
    }
  }

  return {
    products: bestSellerProducts.slice(0, limit),
  };
};

const getAllProduct = async (filters = {}) => {
  const query = {};
  const { hasCategoryFilter, categoryObjectIds } =
    await resolveCategoryIdsFromSlugFilters(filters);

  if (hasCategoryFilter) {
    query.product_category = { $in: categoryObjectIds };
  }

  if (filters.price_min || filters.price_max) {
    const minPrice = Number(filters.price_min);
    const maxPrice = Number(filters.price_max);
    const priceRangeQuery = {};

    if (Number.isFinite(minPrice)) {
      priceRangeQuery.$gte = minPrice;
    }
    if (Number.isFinite(maxPrice)) {
      priceRangeQuery.$lte = maxPrice;
    }

    if (Object.keys(priceRangeQuery).length > 0) {
      query.product_price = priceRangeQuery;
    }
  }

  if (filters.product_color) {
    const colorArray = parseFilterValues(filters.product_color);
    if (colorArray.length > 0) {
      query["colors.color_name"] = { $in: colorArray };
    }
  }

  const productBrands = parseFilterValues(filters.product_brand);
  if (productBrands.length > 0) {
    query.product_brand = { $in: productBrands };
  }

  if (filters.search) {
    query.product_title = { $regex: filters.search, $options: "i" };
  }

  if (hasCategoryFilter && categoryObjectIds.length === 0) {
    query.product_category = { $in: [] };
  }

  const products = await Product.find(query).populate("product_category");
  const totalProducts = await Product.countDocuments(query);

  return {
    total: totalProducts,
    products,
  };
};

const updateProductCategory = async (productId, categoryId) => {
  const updatedProductInstance = await Product.findByIdAndUpdate(
    productId,
    { product_category: categoryId },
    { new: true, runValidators: true }
  ).populate("product_category");

  if (!updatedProductInstance) {
    throw new AppError("Không tìm thấy sản phẩm hoặc cập nhật thất bại", 404, 1);
  }
  await invalidateHomeProductsCache();
  return updatedProductInstance;
};

export {
  createProduct,
  updateProduct,
  getDetailsProduct,
  deleteProduct,
  getHomeProducts,
  getBestSellerProducts,
  getAllProduct,
  updateProductCategory,
};
