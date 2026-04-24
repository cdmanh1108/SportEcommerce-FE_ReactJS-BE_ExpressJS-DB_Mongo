import upload from "../middlewares/UploadMiddleWare.js";
import * as storeService from "../services/Store.service.js";
import { processFiles } from "../utils/UploadUtil.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createStore = async (req, res) => {
  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res.error(-1, err.message);
      }
      try {
        const { store_address, store_phone, store_email } = req.body;

        if (!store_address || !store_phone || !store_email) {
          return res.error(3, "Thông tin là bắt buộc");
        }

        const { images } = processFiles(req.files);

        const newStore = {
          store_address,
          store_phone,
          store_email,
          store_banner: images,
        };

        const result = await storeService.createStore(newStore);
        return res.success(result, "Tạo cửa hàng thành công");
      } catch (error) {
        return handleControllerError(res, error);
      }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateStore = async (req, res) => {
  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res.error(-1, err.message);
      }
      try {
        const store_id = req.params.id;
        const { store_address, store_phone, store_email, existing_banners } =
          req.body;

        let bannersToKeep = [];
        if (existing_banners) {
          bannersToKeep = JSON.parse(existing_banners);
        }

        const { images } = processFiles(req.files);

        const updatedStore = {
          store_address,
          store_phone,
          store_email,
          store_banner: [...bannersToKeep, ...images],
        };

        const result = await storeService.updateStore(updatedStore, store_id);
        return res.success(result, "Cập nhật cửa hàng thành công");
      } catch (error) {
        return handleControllerError(res, error);
      }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getDetailStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const result = await storeService.getDetailStore(storeId);
    return res.success(result, "Lấy chi tiết cửa hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export { createStore, updateStore, getDetailStore };
