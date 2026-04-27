import { createContext, useContext, useState } from "react";
import {
  getAllProducts,
  getHomeProducts,
  getBestSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getDetailsProduct,
  updateProductCategory,
} from "../services/api/ProductApi";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [homeProducts, setHomeProducts] = useState([]);
  const [homePagination, setHomePagination] = useState({
    page: 1,
    limit: 16,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchProducts = async (filters = {}) => {
    const res = await getAllProducts(filters);
    if (res?.EC === 0) {
        setProducts(res.result.products);
    } else {
        return;
    }
    return res;
  };

  const fetchHomeProducts = async (options = {}) => {
    const { page = 1, limit = 16, append = false } = options;
    const res = await getHomeProducts({ page, limit });
    if (res?.EC === 0) {
      const nextProducts = Array.isArray(res?.result?.products)
        ? res.result.products
        : [];
      setHomeProducts((prev) => (append ? [...prev, ...nextProducts] : nextProducts));
      setHomePagination(
        res?.result?.pagination || {
          page,
          limit,
          totalItems: nextProducts.length,
          totalPages: nextProducts.length > 0 ? 1 : 0,
          hasMore: false,
        }
      );
    }
    return res;
  };

  const fetchBestSellerProducts = async (options = {}) => {
    const { limit = 8 } = options;
    const res = await getBestSellerProducts({ limit });
    if (res?.EC === 0) {
      const nextProducts = Array.isArray(res?.result?.products)
        ? res.result.products
        : [];
      setBestSellerProducts(nextProducts);
    }
    return res;
  };

  const fetchProductDetails = async (productId) => {
    const res = await getDetailsProduct(productId);
    if (res?.EC === 0) {
        setProductDetails(res.result);
    } else {
        return;
    }
    return res.result;
    
  };

  const addProduct = async (productData) => {
    const res = await createProduct(productData);
    setProducts((prev) => [...prev, res.data]);
    return res;
  };

  const editProduct = async (productId, updatedData) => {
    const res = await updateProduct(productId, updatedData);
    
    setProducts((prev) =>
      prev.map((product) =>
        product?._id === productId ? res.data : product
      )
    );

    return res;
  };

  const editProductCategory = async (productId, categoryId) => {
    const res = await updateProductCategory(productId, categoryId);
    
    setProducts((prev) =>
      prev.map((product) =>
        product?._id === productId ? res.result : product
      )
    );

    return res;
  };

  const removeProduct = async (productId) => {
    const res = await deleteProduct(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    return res;
  };

  

  return (
    <ProductContext.Provider
      value={{
        products,
        productDetails,
        bestSellerProducts,
        homeProducts,
        homePagination,
        setProducts,
        setProductDetails,
        fetchProducts,
        fetchBestSellerProducts,
        fetchHomeProducts,
        fetchProductDetails,
        addProduct,
        editProduct,
        editProductCategory,
        removeProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  return useContext(ProductContext);
};
