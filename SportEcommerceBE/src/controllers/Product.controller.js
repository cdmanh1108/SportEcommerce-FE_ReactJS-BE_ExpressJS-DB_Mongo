import * as productService from "../services/Product.service.js";
import Product from "../models/Product.model.js";
import AppError from "../utils/AppError.js";
import handleControllerError from "../utils/HandleControllerError.js";
import {
  uploadImgProduct,
  processUploadedFiles,
  mapProductImages,
  updateProductImages,
} from "../utils/UploadUtil.js";

const createProduct = async (req, res) => {
  try {
    const uploadResult = await uploadImgProduct(req, res);
    if (!uploadResult.success) {
      throw new AppError(uploadResult.error, 400, 1);
    }

    let productData = { ...req.body };
    productData.colors =
      typeof productData.colors === "string"
        ? JSON.parse(productData.colors)
        : productData.colors || [];

    if (!Array.isArray(productData.colors)) {
      throw new AppError("Định dạng màu không hợp lệ", 400, 1);
    }

    if (typeof productData.attributes === "string") {
      productData.attributes = JSON.parse(productData.attributes);
    }
    if (productData.attributes !== undefined) {
      productData.attributes = normalizeAttributes(productData.attributes);
    }

    const filesMap = processUploadedFiles(req);
    productData = mapProductImages(productData, filesMap);

    const { data } = await productService.createProduct(productData);
    return res.success(data, "Tạo sản phẩm mới thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.error(1, "Không tìm thấy sản phẩm", 404);
    }

    const uploadResult = await uploadImgProduct(req, res);
    if (!uploadResult.success) {
      return res.error(1, uploadResult.error);
    }

    let productData = { ...req.body };
    if (req.body.colors) {
      try {
        productData.colors = JSON.parse(req.body.colors);
        if (!Array.isArray(productData.colors)) {
          return res.error(1, "Định dạng màu không hợp lệ");
        }
      } catch {
        return res.error(1, "Định dạng JSON không hợp lệ cho các biến thể");
      }
    } else {
      productData.colors = existingProduct.colors || [];
    }

    if (req.body.attributes !== undefined) {
      try {
        productData.attributes =
          typeof req.body.attributes === "string"
            ? JSON.parse(req.body.attributes)
            : req.body.attributes;
        productData.attributes = normalizeAttributes(productData.attributes);
      } catch {
        return res.error(1, "Định dạng JSON không hợp lệ cho biến attributes");
      }
    }

    const filesMap = processUploadedFiles(req);
    productData = updateProductImages(filesMap, productData, existingProduct);

    const result = await productService.updateProduct(productId, productData);
    return res.success(result, "Cập nhật sản phẩm thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await productService.deleteProduct(productId);
    return res.success(null, result.message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getDetailsProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await productService.getDetailsProduct(productId);
    return res.success(result, "Lấy chi tiết sản phẩm thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllProduct = async (req, res) => {
  try {
    const {
      category,
      category_gender,
      price_min,
      price_max,
      product_color,
      product_brand,
    } = req.query;
    const filters = {
      category,
      category_gender,
      price_min,
      price_max,
      product_color,
      product_brand,
    };

    const result = await productService.getAllProduct(filters);
    return res.success(result, "Lấy danh sách sản phẩm thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getHomeProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await productService.getHomeProducts({ page, limit });
    return res.success(result, "Lấy sản phẩm trang chủ thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getBestSellerProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await productService.getBestSellerProducts({ limit });
    return res.success(result, "Lấy sản phẩm best seller thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export {
  createProduct,
  uploadImgProduct,
  updateProduct,
  deleteProduct,
  getDetailsProduct,
  getAllProduct,
  getHomeProducts,
  getBestSellerProducts,
};
