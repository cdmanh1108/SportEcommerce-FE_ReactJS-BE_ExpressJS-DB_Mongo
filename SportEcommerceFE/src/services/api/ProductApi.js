import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const createProduct = async (productData) => {
  const formData = new FormData();

  // Thông tin cơ bản của sản phẩm
  formData.append("product_title", productData.product_title);
  formData.append("product_brand", productData.product_brand);
  formData.append("product_price", productData.product_price);
  formData.append("product_selled", productData.product_selled || 0);
  formData.append(
    "product_percent_discount",
    productData.product_percent_discount || 0,
  );
  formData.append("product_rate", productData.product_rate || 0);
  formData.append("product_description", productData.product_description);
  formData.append("product_category", productData.product_category);
  formData.append("product_display", productData.product_display);
  formData.append("product_famous", productData.product_famous);

  if (productData.usage_level) {
    formData.append("usage_level", productData.usage_level);
  }
  if (productData.foot_shape) {
    formData.append("foot_shape", productData.foot_shape);
  }
  if (productData.comfort_level) {
    formData.append("comfort_level", productData.comfort_level);
  }
  if (productData.material_type) {
    formData.append("material_type", productData.material_type);
  }
  if (productData.weight_level) {
    formData.append("weight_level", productData.weight_level);
  }
  if (productData.attributes !== undefined && productData.attributes !== null) {
    formData.append("attributes", JSON.stringify(productData.attributes));
  }

  // Ảnh chính của sản phẩm
  if (productData.product_img && productData.product_img[0]) {
    const imageFile =
      productData.product_img[0].originFileObj || productData.product_img[0];
    if (imageFile instanceof File) {
      formData.append("product_img", imageFile);
    }
  }

  // Xử lý danh sách màu sắc
  if (productData.colors && productData.colors.length > 0) {
    // Tạo một bản sao của dữ liệu màu để gửi dưới dạng JSON
    const colorsPayload = productData.colors.map((color) => {
      // Chuẩn bị dữ liệu màu sắc (không bao gồm file ảnh)
      return {
        color_name: color.color_name,
        variants: color.variants || [],
      };
    });

    // Thêm thông tin màu sắc dưới dạng JSON
    formData.append("colors", JSON.stringify(colorsPayload));

    // Xử lý riêng các file hình ảnh cho từng màu
    productData.colors.forEach((color, colorIndex) => {
      // Xử lý ảnh chính của màu
      if (color.imgs?.img_main?.[0]) {
        const mainImageFile =
          color.imgs.img_main[0].originFileObj || color.imgs.img_main[0];
        if (mainImageFile instanceof File) {
          formData.append(`color_img_${colorIndex}_main`, mainImageFile);
        }
      }

      // Xử lý các ảnh phụ của màu
      if (color.imgs?.img_subs?.length > 0) {
        color.imgs.img_subs.forEach((subImg) => {
          const subImageFile = subImg.originFileObj || subImg;
          if (subImageFile instanceof File) {
            formData.append(`color_img_${colorIndex}_subs`, subImageFile);
          }
        });
      }
    });
  }

  try {
    const response = await AxiosInstance.post("/product/create", formData);
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Hàm cập nhật sản phẩm
export const updateProduct = async (productId, productData) => {
  const formData = new FormData();
  // Thông tin cơ bản của sản phẩm
  formData.append("product_title", productData.product_title);
  formData.append("product_brand", productData.product_brand);
  formData.append("product_price", productData.product_price);
  formData.append("product_selled", productData.product_selled || 0);
  formData.append(
    "product_percent_discount",
    productData.product_percent_discount || 0,
  );
  formData.append("product_rate", productData.product_rate || 0);
  formData.append("product_description", productData.product_description);
  formData.append("product_category", productData.product_category);
  formData.append("product_display", productData.product_display);
  formData.append("product_famous", productData.product_famous);

  if (productData.usage_level) {
    formData.append("usage_level", productData.usage_level);
  }
  if (productData.foot_shape) {
    formData.append("foot_shape", productData.foot_shape);
  }
  if (productData.comfort_level) {
    formData.append("comfort_level", productData.comfort_level);
  }
  if (productData.material_type) {
    formData.append("material_type", productData.material_type);
  }
  if (productData.weight_level) {
    formData.append("weight_level", productData.weight_level);
  }
  if (productData.attributes !== undefined && productData.attributes !== null) {
    formData.append("attributes", JSON.stringify(productData.attributes));
  }

  // Ảnh chính của sản phẩm
  if (productData.product_img && productData.product_img[0]) {
    const imageFile =
      productData.product_img[0].originFileObj || productData.product_img[0];
    if (imageFile instanceof File) {
      formData.append("product_img", imageFile);
    }
  }

  // Xử lý danh sách màu sắc
  if (productData.colors && productData.colors.length > 0) {
    // Tạo một bản sao của dữ liệu màu để gửi dưới dạng JSON
    const colorsPayload = productData.colors.map((color) => {
      // Chuẩn bị dữ liệu màu sắc
      return {
        color_name: color.color_name,
        variants: color.variants || [],
      };
    });

    // Thêm thông tin màu sắc dưới dạng JSON
    formData.append("colors", JSON.stringify(colorsPayload));

    // Xử lý riêng các file hình ảnh cho từng màu
    productData.colors.forEach((color, colorIndex) => {
      // Xử lý ảnh chính của màu
      if (color.imgs?.img_main?.[0]) {
        const mainImageFile =
          color.imgs.img_main[0].originFileObj || color.imgs.img_main[0];
        if (mainImageFile instanceof File) {
          formData.append(`color_img_${colorIndex}_main`, mainImageFile);
        }
      }

      // Xử lý các ảnh phụ của màu
      if (color.imgs?.img_subs?.length > 0) {
        color.imgs.img_subs.forEach((subImg) => {
          const subImageFile = subImg.originFileObj || subImg;
          if (subImageFile instanceof File) {
            formData.append(`color_img_${colorIndex}_subs`, subImageFile);
          }
        });
      }
    });
  }

  try {
    const response = await AxiosInstance.patch(
      `/product/update/${productId}`,
      formData,
    );
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getDetailsProduct = async (productId) => {
  try {
    const res = await AxiosInstance.get(`/product/get-details/${productId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const deleteProduct = async (productId) => {
  try {
    const res = await AxiosInstance.delete(`/product/delete/${productId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getAllProducts = async (filters) => {
  if (typeof filters === "string") {
    filters = JSON.parse(filters);
  }
  try {
    const response = await AxiosInstance.get("/product/get-all", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getHomeProducts = async (params = {}) => {
  try {
    const response = await AxiosInstance.get("/product/get-home", {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getBestSellerProducts = async (params = {}) => {
  try {
    const response = await AxiosInstance.get("/product/get-best-seller", {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const updateProductCategory = async (productId, categoryId) => {
  try {
    const res = await AxiosInstance.patch(`/product/update-category/${productId}`, {
      product_category: categoryId,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
