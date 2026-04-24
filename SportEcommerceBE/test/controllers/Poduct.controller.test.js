import ProductController from "../../src/controllers/Product.controller.js";
import * as productService from "../../src/services/Product.service.js";
import Product from "../../src/models/Product.model.js";
import {
  uploadImgProduct,
  processUploadedFiles,
  mapProductImages,
  updateProductImages,
} from "../../src/utils/UploadUtil.js";

jest.mock("../../src/services/Product.service.js");
jest.mock("../../src/models/Product.model.js");
jest.mock("../../src/utils/UploadUtil.js");

const mockRes = () => {
  const res = {};
  res.success = jest.fn();
  res.error = jest.fn();
  res.InternalError = jest.fn();
  return res;
};

describe("ProductController", () => {
  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      const req = {
        body: {
          colors: JSON.stringify(["Red", "Green"]),
        },
      };
      const res = mockRes();

      uploadImgProduct.mockResolvedValue({ success: true });
      processUploadedFiles.mockReturnValue({ img1: "url1" });
      mapProductImages.mockReturnValue({
        colors: ["Red", "Green"],
        images: ["url1"],
      });
      productService.createProduct.mockResolvedValue({
        EC: 0,
        EM: "Created successfully",
      });

      await ProductController.createProduct(req, res);

      expect(res.success).toHaveBeenCalledWith(null, "Created successfully");
    });

    it("should return internal error when colors is invalid JSON", async () => {
      const req = {
        body: {
          colors: "{invalidJson", // lỗi JSON
        },
      };
      const res = mockRes();

      uploadImgProduct.mockResolvedValue({ success: true });

      await ProductController.createProduct(req, res);

      expect(res.InternalError).toHaveBeenCalledWith(
        expect.stringContaining(
          "Expected property name or '}' in JSON at position 1",
        ),
      );
    });

    it("should return error if image upload fails", async () => {
      const req = {
        body: {},
      };
      const res = mockRes();

      uploadImgProduct.mockResolvedValue({
        success: false,
        error: "Upload failed",
      });

      await ProductController.createProduct(req, res);

      expect(res.error).toHaveBeenCalledWith(1, "Upload failed");
    });
  });

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const req = {
        params: { id: "123" },
        body: {
          colors: JSON.stringify(["Yellow"]),
        },
      };
      const res = mockRes();

      Product.findById.mockResolvedValue({ _id: "123", colors: ["Blue"] });
      uploadImgProduct.mockResolvedValue({ success: true });
      processUploadedFiles.mockReturnValue({ img1: "url1" });
      updateProductImages.mockReturnValue({
        colors: ["Yellow"],
        images: ["url1"],
      });

      productService.updateProduct.mockResolvedValue({
        EC: 0,
        EM: "Updated successfully",
        data: {},
      });

      await ProductController.updateProduct(req, res);

      expect(res.success).toHaveBeenCalledWith({}, "Updated successfully");
    });

    it("should return error if product not found", async () => {
      const req = {
        params: { id: "notfound" },
      };
      const res = mockRes();

      Product.findById.mockResolvedValue(null);

      await ProductController.updateProduct(req, res);

      expect(res.error).toHaveBeenCalledWith(1, "Product doesn't exist");
    });
  });
});
