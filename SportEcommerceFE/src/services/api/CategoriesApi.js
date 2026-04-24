import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

const createCategory = async (categoryData) => {
  try {
    const response = await AxiosInstance.post("/category/create", categoryData);
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

const getDetailCategory = async (id) => {
  try {
    const response = await AxiosInstance.get(`/category/get-detail/${id}`);
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

const getAllCategory = async (categoryLevel = 1) => {
  try {
    const response = await AxiosInstance.get(
      `/category/get-all?category_level=${categoryLevel}`
    );
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

const getSubCategory = async (id) => {
  try {
    const response = await AxiosInstance.get(`/category/get-sub/${id}`);
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

const updateCategory = async (id, updateData) => {
  try {
    const response = await AxiosInstance.patch(`/category/update/${id}`, updateData);
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

const deleteCategory = async (id) => {
  try {
    const response = await AxiosInstance.delete(`/category/delete/${id}`);
    return response;
  } catch (error) {
    return { data: error.response?.data || networkError() };
  }
};

export {
  createCategory,
  getDetailCategory,
  getAllCategory,
  getSubCategory,
  updateCategory,
  deleteCategory,
};
