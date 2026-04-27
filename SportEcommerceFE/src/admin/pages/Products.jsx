import { useEffect, useMemo, useState } from "react";
import { Table, Input, Select, Button, Modal, Form, InputNumber } from "antd";
import {
  DeleteOutlined,
  ExportOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Upload, Switch, Card, Divider } from "antd";
import { useProduct } from "../../context/ProductContext";
import { useCategories } from "../../context/CategoriesContext";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import { usePopup } from "../../context/PopupContext";
import {
  generateKnowledgeChunkFromProduct,
  getKnowledgeChunksByProduct,
  upsertKnowledgeChunkFromProduct,
} from "../../services/api/KnowledgeChunkApi";

const { Option } = Select;

const PRODUCT_ATTRIBUTES_OPTIONS = {
  sport_type: {
    label: "Loại môn thể thao",
    values: [
      { label: "Bóng đá", value: "bong_da" },
      { label: "Bóng rổ", value: "bong_ro" },
      { label: "Bóng chuyền", value: "bong_chuyen" },
      { label: "Cầu lông", value: "cau_long" },
      { label: "Chạy bộ", value: "chay_bo" },
    ],
  },
  surface_type: {
    label: "Loại mặt sân",
    values: [
      { label: "Sân 5", value: "san_5" },
      { label: "Sân 7", value: "san_7" },
      { label: "Sân 11", value: "san_11" },
      { label: "Sân cỏ tự nhiên", value: "san_co_tu_nhien" },
      { label: "Sân cỏ nhân tạo", value: "san_co_nhan_tao" },
      { label: "Sân trong nhà", value: "san_trong_nha" },
      { label: "Sân futsal", value: "san_futsal" },
    ],
  },
  outsole_type: {
    label: "Loại đế ngoài",
    values: [
      { label: "Đinh thấp", value: "dinh_thap" },
      { label: "Đinh cao", value: "dinh_cao" },
      { label: "Đế bệt", value: "de_bet" },
    ],
  },
  position: {
    label: "Vị trí chơi",
    values: [
      { label: "Tiền đạo", value: "tien_dao" },
      { label: "Tiền vệ", value: "tien_ve" },
      { label: "Hậu vệ", value: "hau_ve" },
    ],
  },
  ankle_support: {
    label: "Hỗ trợ cổ chân",
    values: [
      { label: "Cổ thấp", value: "co_thap" },
      { label: "Cổ trung", value: "co_trung" },
      { label: "Cổ cao", value: "co_cao" },
    ],
  },
  cushioning: {
    label: "Độ đệm",
    values: [
      { label: "Thấp", value: "thap" },
      { label: "Vừa", value: "vua" },
      { label: "Cao", value: "cao" },
    ],
  },
  foot_shape: {
    label: "Dáng bàn chân",
    values: [
      { label: "Thon", value: "thon" },
      { label: "Trung bình", value: "trung_binh" },
      { label: "Bè", value: "be" },
    ],
  },
  material: {
    label: "Chất liệu",
    values: [
      { label: "Da thật", value: "da_that" },
      { label: "Da nhân tạo", value: "da_nhan_tao" },
      { label: "Vải", value: "vai" },
      { label: "Lưới", value: "luoi" },
    ],
  },
  weight_level: {
    label: "Mức trọng lượng",
    values: [
      { label: "Nhẹ", value: "nhe" },
      { label: "Trung bình", value: "trung_binh" },
      { label: "Nặng", value: "nang" },
    ],
  },
  traction_level: {
    label: "Độ bám",
    values: [
      { label: "Thấp", value: "thap" },
      { label: "Vừa", value: "vua" },
      { label: "Cao", value: "cao" },
    ],
  },
  durability: {
    label: "Độ bền",
    values: [
      { label: "Thấp", value: "thap" },
      { label: "Vừa", value: "vua" },
      { label: "Cao", value: "cao" },
    ],
  },
  price_segment: {
    label: "Phân khúc giá",
    values: [
      { label: "Rẻ", value: "re" },
      { label: "Vừa", value: "vua" },
      { label: "Đắt", value: "dat" },
    ],
  },
};

const KNOWLEDGE_CHUNK_TYPE_OPTIONS = [
  { label: "tổng quan", value: "overview" },
  { label: "thông số", value: "specification" },
  { label: "tư vấn", value: "advice" },
  { label: "chính sách", value: "policy" },
  { label: "câu hỏi thường gặp", value: "faq" },
];

const formatCategoryLabel = (category) => {
  if (!category || typeof category !== "object") {
    return "Danh mục không xác định";
  }

  if (category.category_name) {
    return category.category_name;
  }

  const parts = [category.category_type, category.category_gender].filter(
    Boolean,
  );
  if (parts.length > 0) {
    return parts.join(" - ");
  }

  return category.category_slug || category._id || "Danh mục không xác định";
};

const getCategoryId = (category) => {
  if (!category || typeof category !== "object") {
    return null;
  }
  return category._id || null;
};

const getCategoryParentId = (category) => {
  if (!category || typeof category !== "object") {
    return null;
  }

  const parentId = category.category_parent_id;
  if (!parentId) {
    return null;
  }

  if (typeof parentId === "object") {
    return parentId._id || null;
  }

  return parentId;
};

const CHUNK_TYPE_LABELS = {
  "tổng quan": "overview",
  "thông số": "specification",
  "tư vấn": "advice",
  "chính sách": "policy",
  "câu hỏi thường gặp": "faq",
  overview: "overview",
  specification: "specification",
  advice: "advice",
  policy: "policy",
  faq: "faq",
};

const normalizeChunkType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return CHUNK_TYPE_LABELS[normalized] || "overview";
};

const normalizeValue = (value) => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
};

const ATTRIBUTE_OPTION_MAP = Object.fromEntries(
  Object.entries(PRODUCT_ATTRIBUTES_OPTIONS).map(([key, config]) => [
    key,
    Object.fromEntries(
      config.values.map((option) => [
        option.value,
        { ...option, normalizedLabel: normalizeValue(option.label) },
      ]),
    ),
  ]),
);

const LEGACY_ATTRIBUTE_VALUE_MAP = Object.fromEntries(
  Object.entries(PRODUCT_ATTRIBUTES_OPTIONS).map(([key, config]) => [
    key,
    Object.fromEntries(
      config.values.flatMap((option) => [
        [normalizeValue(option.value), option.value],
        [normalizeValue(option.label), option.value],
      ]),
    ),
  ]),
);

const getSafeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeAttributes = (attributes = {}) => {
  if (!attributes || typeof attributes !== "object") return {};

  const normalized = {};

  Object.keys(attributes).forEach((key) => {
    const values = getSafeArray(attributes[key])
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (values.length === 0) return;

    normalized[key] = values
      .map((value) => {
        if (ATTRIBUTE_OPTION_MAP[key]?.[value]) return value;

        const normalizedInput = normalizeValue(value);
        return LEGACY_ATTRIBUTE_VALUE_MAP[key]?.[normalizedInput] || value;
      })
      .filter(Boolean);
  });

  return normalized;
};

const denormalizeAttributes = (attributes = {}) => {
  if (!attributes || typeof attributes !== "object") return {};

  const result = {};

  Object.keys(attributes).forEach((key) => {
    const values = getSafeArray(attributes[key])
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (values.length === 0) return;

    result[key] = values.map((value) => {
      if (ATTRIBUTE_OPTION_MAP[key]?.[value]) return value;

      const normalizedInput = normalizeValue(value);
      return LEGACY_ATTRIBUTE_VALUE_MAP[key]?.[normalizedInput] || value;
    });
  });

  return result;
};

const normalizeProductMetadata = (productData) => ({
  ...productData,
  attributes: normalizeAttributes(productData.attributes),
});

const normalizeKnowledgeChunkPayload = (payload) => {
  const metadata = payload?.metadata || {};

  const normalizeNullable = (value) => {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  };

  const normalizeTags = (values = []) => {
    if (!Array.isArray(values)) {
      return [];
    }
    return [
      ...new Set(
        values.map((value) => String(value || "").trim()).filter(Boolean),
      ),
    ];
  };

  return {
    chunk_type: normalizeChunkType(payload?.chunk_type),
    title: String(payload?.title || "").trim(),
    content: String(payload?.content || "").trim(),
    language: String(payload?.language || "vi")
      .trim()
      .toLowerCase(),
    is_active:
      payload?.is_active !== undefined ? Boolean(payload.is_active) : true,
    metadata: {
      product_title: normalizeNullable(metadata.product_title),
      product_brand: normalizeNullable(metadata.product_brand),
      category_type: normalizeNullable(metadata.category_type),
      category_gender: normalizeNullable(metadata.category_gender),
      attributes: normalizeAttributes(metadata.attributes || {}),
      min_price: Number(metadata.min_price || 0),
      max_price: Number(metadata.max_price || 0),
      in_stock: Boolean(metadata.in_stock),
      display:
        metadata.display !== undefined ? Boolean(metadata.display) : true,
      rating: Number(metadata.rating || 0),
      sold: Number(metadata.sold || 0),
      available_colors: normalizeTags(metadata.available_colors),
      available_sizes: normalizeTags(metadata.available_sizes),
    },
  };
};

const Products = () => {
  const { products, fetchProducts, removeProduct, addProduct, editProduct, editProductCategory } =
    useProduct();
  const [form] = Form.useForm();
  const [knowledgeChunkForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddProductModalVisible, setIsAddProductModalVisible] =
    useState(false);
  const [isEditProductModalVisible, setIsEditProductgModalVisible] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isKnowledgeChunkModalVisible, setIsKnowledgeChunkModalVisible] =
    useState(false);
  const [
    isKnowledgeChunkViewModalVisible,
    setIsKnowledgeChunkViewModalVisible,
  ] = useState(false);
  const [selectedKnowledgeProduct, setSelectedKnowledgeProduct] =
    useState(null);
  const [productKnowledgeChunks, setProductKnowledgeChunks] = useState([]);
  const [allCategoryOptions, setAllCategoryOptions] = useState([]);
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const { showPopup } = usePopup();
  const { categories, fetchCategories, fetchSubCategories } = useCategories();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadAllCategoryOptions = async () => {
      const currentCategories = Array.isArray(categories) ? categories : [];
      if (currentCategories.length === 0) {
        if (!isCancelled) {
          setAllCategoryOptions([]);
        }
        return;
      }

      const parentCategories = currentCategories.filter(
        (category) => Number(category?.category_level) === 1,
      );
      const existingSubCategories = currentCategories.filter(
        (category) => Number(category?.category_level) > 1,
      );

      const subCategoryResponses = await Promise.all(
        parentCategories.map((category) => fetchSubCategories(category._id)),
      );

      const fetchedSubCategories = subCategoryResponses.flatMap((response) =>
        Array.isArray(response?.data?.result) ? response.data.result : [],
      );

      const mergedCategories = [
        ...parentCategories,
        ...existingSubCategories,
        ...fetchedSubCategories,
      ];

      const uniqueCategoryMap = new Map();
      mergedCategories.forEach((category) => {
        const categoryId = getCategoryId(category);
        if (categoryId) {
          uniqueCategoryMap.set(categoryId, category);
        }
      });

      const sortedCategories = Array.from(uniqueCategoryMap.values()).sort(
        (a, b) => {
          const levelA = Number(a?.category_level) || 0;
          const levelB = Number(b?.category_level) || 0;
          if (levelA !== levelB) {
            return levelA - levelB;
          }
          return formatCategoryLabel(a).localeCompare(formatCategoryLabel(b));
        },
      );

      if (!isCancelled) {
        setAllCategoryOptions(sortedCategories);
      }
    };

    loadAllCategoryOptions();

    return () => {
      isCancelled = true;
    };
  }, [categories, fetchSubCategories]);

  const categoryLabelById = useMemo(() => {
    const labelMap = new Map();
    allCategoryOptions.forEach((category) => {
      const categoryId = getCategoryId(category);
      if (categoryId) {
        labelMap.set(categoryId, formatCategoryLabel(category));
      }
    });
    return labelMap;
  }, [allCategoryOptions]);

  const categorySelectOptions = useMemo(() => {
    return allCategoryOptions.map((category) => {
      const categoryId = getCategoryId(category);
      const parentId = getCategoryParentId(category);
      const ownLabel = formatCategoryLabel(category);
      const parentLabel = parentId ? categoryLabelById.get(parentId) : null;

      return {
        value: categoryId,
        label: parentLabel ? `${parentLabel} / ${ownLabel}` : ownLabel,
      };
    });
  }, [allCategoryOptions, categoryLabelById]);

  const attributeKeys = useMemo(
    () => Object.keys(PRODUCT_ATTRIBUTES_OPTIONS),
    [],
  );

  const handleDelete = async () => {
    try {
      await Promise.all(selectedRowKeys.map((id) => removeProduct(id)));
      fetchProducts();
      setSelectedRowKeys([]);
      setIsModalVisible(false);
      showPopup("Xóa sản phẩm thành công");
    } catch {
      showPopup("Lỗi khi xóa sản phẩm", false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList || [];
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true, "Đang thêm sản phẩm");
      await form.validateFields();
      const newProduct = normalizeProductMetadata(form.getFieldsValue());

      const res = await addProduct(newProduct);
      if (res?.EC === 0) {
        fetchProducts();
        form.resetFields();
        setIsAddProductModalVisible(false);
      }
    } catch {
      return;
    }
    setLoading(false);
  };

  const urlToFile = async (url, filename, mimeType = "image/png") => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
  };

  const handleEditProduct = async (record) => {
    setLoading(true, "Đang mở form sản phẩm");
    try {
      const productImages = await Promise.all(
        (Array.isArray(record.product_img)
          ? record.product_img
          : [record.product_img]
        )
          .filter(Boolean)
          .map(async (url, index) => ({
            uid: `${index}`,
            name: `product-image-${index}.png`,
            status: "done",
            originFileObj: await urlToFile(url, `product-image-${index}.png`),
          })),
      );

      const colorImages = await Promise.all(
        (record.colors || []).map(async (color, colorIndex) => {
          const imgMain = color.imgs?.img_main
            ? [
                {
                  uid: `main-${colorIndex}`,
                  name: `main-color-${colorIndex}.png`,
                  status: "done",
                  url: color.imgs.img_main,
                  originFileObj: await urlToFile(
                    color.imgs.img_main,
                    `main-color-${colorIndex}.png`,
                  ),
                },
              ]
            : [];

          const imgSubs = Array.isArray(color.imgs?.img_subs)
            ? await Promise.all(
                color.imgs.img_subs.map(async (url, idx) => ({
                  uid: `sub-${colorIndex}-${idx}`,
                  name: `sub-color-${colorIndex}-${idx}.png`,
                  status: "done",
                  originFileObj: await urlToFile(
                    url,
                    `sub-color-${colorIndex}-${idx}.png`,
                  ),
                })),
              )
            : [];

          return {
            ...color,
            imgs: {
              img_main: imgMain,
              img_subs: imgSubs,
            },
          };
        }),
      );

      const recordWithNormalizedImages = {
        ...record,
        product_img: productImages,
        product_category:
          record.product_category?._id || record.product_category,
        colors: colorImages,
        attributes: denormalizeAttributes(record.attributes || {}),
      };

      setSelectedProduct(recordWithNormalizedImages);
      form.setFieldsValue(recordWithNormalizedImages);
      setIsEditProductgModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true, "Đang sửa sản phẩm");
    try {
      await form.validateFields();
      const updatedFields = normalizeProductMetadata(form.getFieldsValue());
      const res = await editProduct(selectedProduct._id, updatedFields);
      if (res?.EC === 0) {
        fetchProducts();
        form.resetFields();
        setIsEditProductgModalVisible(false);
      }
    } catch {
      showPopup("Lỗi khi cập nhật sản phẩm", false);
    }
    setLoading(false);
  };

  const handleCategoryChange = async (productId, categoryId) => {
    setLoading(true, "Đang cập nhật danh mục...");
    try {
      const res = await editProductCategory(productId, categoryId);
      if (res?.EC === 0) {
        showPopup("Cập nhật danh mục thành công");
      } else {
        showPopup(res?.EM || "Cập nhật danh mục thất bại", false);
      }
    } catch {
      showPopup("Lỗi cập nhật danh mục", false);
    }
    setLoading(false);
  };

  const handleOpenKnowledgeChunkForm = async (record) => {
    setLoading(true, "Đang tạo nháp KnowledgeChunk");
    try {
      const res = await generateKnowledgeChunkFromProduct(record._id);
      if (res?.EC !== 0) {
        showPopup(res?.EM || "Không thể tạo nháp KnowledgeChunk", false);
        return;
      }

      const draft = res?.result || {};
      const metadata = draft?.metadata || {};
      setSelectedKnowledgeProduct(record);

      const chunkAttributes = Array.isArray(metadata.attributes)
        ? metadata.attributes.reduce((attributesMap, attribute) => {
            if (
              attribute &&
              typeof attribute === "object" &&
              attribute.key &&
              Array.isArray(attribute.values)
            ) {
              attributesMap[attribute.key] = attribute.values;
            }
            return attributesMap;
          }, {})
        : metadata.attributes || {};

      knowledgeChunkForm.setFieldsValue({
        source_type: draft.source_type || "product",
        chunk_type: draft.chunk_type || "overview",
        title: draft.title || "",
        content: draft.content || "",
        language: draft.language || "vi",
        is_active: draft.is_active !== undefined ? draft.is_active : true,
        metadata: {
          ...metadata,
          attributes: denormalizeAttributes(chunkAttributes),
          available_colors: Array.isArray(metadata.available_colors)
            ? metadata.available_colors
            : [],
          available_sizes: Array.isArray(metadata.available_sizes)
            ? metadata.available_sizes
            : [],
        },
      });

      setIsKnowledgeChunkModalVisible(true);
    } catch {
      showPopup("Không thể tạo nháp KnowledgeChunk", false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKnowledgeChunk = async () => {
    if (!selectedKnowledgeProduct?._id) {
      showPopup("Thiếu thông tin sản phẩm để lưu KnowledgeChunk", false);
      return;
    }

    setLoading(true, "Đang lưu KnowledgeChunk");
    try {
      await knowledgeChunkForm.validateFields();
      const payload = normalizeKnowledgeChunkPayload(
        knowledgeChunkForm.getFieldsValue(),
      );
      const res = await upsertKnowledgeChunkFromProduct(
        selectedKnowledgeProduct._id,
        payload,
      );

      if (res?.EC === 0) {
        showPopup("Lưu KnowledgeChunk thành công");
        setIsKnowledgeChunkModalVisible(false);
      } else {
        showPopup(res?.EM || "Lưu KnowledgeChunk thất bại", false);
      }
    } catch {
      showPopup("Lưu KnowledgeChunk thất bại", false);
    } finally {
      setLoading(false);
    }
  };

  const handleViewKnowledgeChunks = async (record) => {
    setLoading(true, "Đang lấy danh sách KnowledgeChunk");
    try {
      const res = await getKnowledgeChunksByProduct(record._id);
      if (res?.EC !== 0) {
        showPopup(res?.EM || "Không thể lấy danh sách KnowledgeChunk", false);
        return;
      }

      setSelectedKnowledgeProduct(record);
      setProductKnowledgeChunks(Array.isArray(res?.result) ? res.result : []);
      setIsKnowledgeChunkViewModalVisible(true);
    } catch {
      showPopup("Không thể lấy danh sách KnowledgeChunk", false);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    let productStatus;
    if (product.product_countInStock === 0) {
      productStatus = "Hết hàng";
    } else if (product.product_countInStock < 10) {
      productStatus = "Cần nhập";
    } else {
      productStatus = "Còn hàng";
    }

    const matchesStatus = filterStatus ? productStatus === filterStatus : true;

    const matchesSearch = searchText
      ? product.product_title.toLowerCase().includes(searchText.toLowerCase())
      : true;

    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "product_img",
      key: "product_img",
      render: (product_img) => (
        <img
          src={product_img}
          alt="Ảnh sản phẩm"
          className="w-16 h-16 object-cover rounded"
        />
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "product_title", key: "product_title" },
    {
      title: "Danh mục",
      dataIndex: "product_category",
      key: "product_category",
      render: (product_category, record) => {
        const categoryId = getCategoryId(product_category);
        return (
          <Select
            value={categoryId}
            onChange={(value) => handleCategoryChange(record._id, value)}
            style={{ width: 200 }}
            options={categorySelectOptions}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
    },
    { title: "Thương hiệu", dataIndex: "product_brand", key: "product_brand" },
    {
      title: "Số lượng tồn",
      dataIndex: "product_countInStock",
      key: "product_countInStock",
      render: (value) => `${value}`,
    },
    {
      title: "Đã bán",
      dataIndex: "product_selled",
      key: "product_selled",
      render: (value) => value ?? 0,
    },
    {
      title: "Giá gốc",
      dataIndex: "product_price",
      key: "product_price",
      render: (value) => `${value}đ`,
    },
    {
      title: "Giảm giá (%)",
      dataIndex: "product_percent_discount",
      key: "product_percent_discount",
      render: (value) => `${value}%`,
    },
    {
      title: "Đánh giá",
      dataIndex: "product_rate",
      key: "product_rate",
      render: (value) => value ?? "Chưa có",
    },
    {
      title: "Chỉnh sửa",
      key: "edit",
      render: (_, record) => (
        <Button type="link" onClick={() => handleEditProduct(record)}>
          Chỉnh sửa
        </Button>
      ),
    },
    {
      title: "Xem chi tiết",
      key: "view",
      render: (_, record) => (
        <span
          className="text-blue-500 cursor-pointer"
          onClick={() => navigate(`/admin/product-details/${record._id}`)}
        >
          Chi tiết
        </span>
      ),
    },
    {
      title: "Tạo KnowledgeChunk",
      key: "create-knowledge-chunk",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleOpenKnowledgeChunkForm(record)}
        >
          Tạo chunk
        </Button>
      ),
    },
    {
      title: "Xem KnowledgeChunk",
      key: "view-knowledge-chunk",
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewKnowledgeChunks(record)}>
          Xem chunk
        </Button>
      ),
    },
  ];

  return (
    <div className="lg:ml-[300px] mt-[64px] px-2 py-4 lg:p-6 min-h-screen">
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <Input
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-none"
          />
          <Button
            type="primary"
            icon={<ExportOutlined />}
            className="rounded-none"
          >
            Xuất file
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddProductModalVisible(true)}
            className="rounded-none"
          >
            Thêm sản phẩm
          </Button>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-4 justify-between">
          <Select
            placeholder="Trạng thái sản phẩm"
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
            className="w-[300px]"
          >
            <Option value="Còn hàng">Còn hàng</Option>
            <Option value="Hết hàng">Hết hàng</Option>
            <Option value="Cần nhập">Cần nhập</Option>
          </Select>

          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => setIsModalVisible(true)}
            className="rounded-none"
          >
            Xóa ({selectedRowKeys.length})
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 shadow-lg">
        <Table
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          dataSource={filteredProducts}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
          className="rounded-none cursor-pointer"
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title="Xác nhận xóa"
        open={isModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={500}
        styles={{ padding: "20px" }}
      >
        <p>Bạn có chắc muốn xóa các sản phẩm đã chọn?</p>
      </Modal>

      <Modal
        title="Thêm sản phẩm mới"
        open={isAddProductModalVisible}
        onOk={form.submit}
        onCancel={() => setIsAddProductModalVisible(false)}
        okText="Thêm"
        cancelText="Hủy"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddProduct}
          initialValues={{
            product_price: 0,
            product_percent_discount: 0,
            product_rate: 0,
            product_selled: 0,
            product_display: true,
            product_famous: false,
            colors: [],
            attributes: {},
          }}
        >
          <Form.Item
            label="Tên sản phẩm"
            name="product_title"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Thương hiệu"
            name="product_brand"
            rules={[{ required: true, message: "Vui lòng nhập thương hiệu" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Giá gốc" name="product_price">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Đã bán" name="product_selled">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Giảm giá chung (%)" name="product_percent_discount">
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>

          <Form.Item label="Đánh giá" name="product_rate">
            <InputNumber min={0} max={5} step={0.1} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            name="product_category"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select>
              {categorySelectOptions.map((categoryOption) => (
                <Select.Option
                  key={categoryOption.value}
                  value={categoryOption.value}
                >
                  {categoryOption.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mô tả sản phẩm"
            name="product_description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Divider orientation="left">Attributes</Divider>

          {attributeKeys.map((key) => (
            <Form.Item
              key={key}
              name={["attributes", key]}
              label={PRODUCT_ATTRIBUTES_OPTIONS[key].label}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder={`Chọn ${PRODUCT_ATTRIBUTES_OPTIONS[
                  key
                ].label.toLowerCase()}`}
              >
                {PRODUCT_ATTRIBUTES_OPTIONS[key].values.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ))}

          <Form.Item
            label="Ảnh sản phẩm"
            name="product_img"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: "Vui lòng tải ảnh sản phẩm" }]}
          >
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              listType="picture"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Tải ảnh sản phẩm lên</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="product_display"
            label="Hiển thị sản phẩm"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="product_famous"
            label="Sản phẩm nổi bật"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">Màu sắc và kích thước</Divider>

          <Form.List name="colors">
            {(colorFields, { add: addColor, remove: removeColor }) => (
              <>
                {colorFields.map(
                  ({ key: colorKey, name: colorName, ...colorRestField }) => (
                    <Card
                      key={colorKey}
                      title={`Màu sắc ${colorKey + 1}`}
                      className="mb-4"
                      extra={
                        <Button danger onClick={() => removeColor(colorName)}>
                          Xóa màu
                        </Button>
                      }
                    >
                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "color_name"]}
                        label="Tên màu"
                        rules={[
                          { required: true, message: "Vui lòng nhập tên màu" },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "imgs", "img_main"]}
                        label="Ảnh chính của màu"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[
                          { required: true, message: "Vui lòng tải ảnh chính" },
                        ]}
                      >
                        <Upload
                          accept="image/*"
                          beforeUpload={() => false}
                          listType="picture"
                          maxCount={1}
                        >
                          <Button icon={<UploadOutlined />}>
                            Tải ảnh chính lên
                          </Button>
                        </Upload>
                      </Form.Item>

                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "imgs", "img_subs"]}
                        label="Ảnh phụ của màu"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng tải ít nhất một ảnh phụ",
                          },
                        ]}
                      >
                        <Upload
                          accept="image/*"
                          beforeUpload={() => false}
                          listType="picture"
                          multiple
                        >
                          <Button icon={<UploadOutlined />}>
                            Tải ảnh phụ lên
                          </Button>
                        </Upload>
                      </Form.Item>

                      <Divider orientation="left">Các kích thước</Divider>

                      <Form.List name={[colorName, "variants"]}>
                        {(
                          variantFields,
                          { add: addVariant, remove: removeVariant },
                        ) => (
                          <>
                            {variantFields.map(
                              ({
                                key: variantKey,
                                name: variantName,
                                ...variantRestField
                              }) => (
                                <Card
                                  key={variantKey}
                                  type="inner"
                                  title={`Kích thước ${variantKey + 1}`}
                                  className="mb-2"
                                  extra={
                                    <Button
                                      danger
                                      size="small"
                                      onClick={() => removeVariant(variantName)}
                                    >
                                      Xóa
                                    </Button>
                                  }
                                >
                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_size"]}
                                    label="Kích thước"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập kích thước",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Ví dụ: S, M, L, XL" />
                                  </Form.Item>

                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_price"]}
                                    label="Giá"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập giá",
                                      },
                                    ]}
                                  >
                                    <InputNumber min={0} className="w-full" />
                                  </Form.Item>

                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_countInStock"]}
                                    label="Số lượng tồn"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập số lượng tồn",
                                      },
                                    ]}
                                  >
                                    <InputNumber min={0} className="w-full" />
                                  </Form.Item>
                                </Card>
                              ),
                            )}

                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => addVariant()}
                                block
                                icon={<PlusOutlined />}
                              >
                                Thêm kích thước
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ),
                )}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => addColor()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm màu sắc
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa sản phẩm"
        open={isEditProductModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsEditProductgModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={selectedProduct}
        >
          <Form.Item
            label="Tên sản phẩm"
            name="product_title"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Thương hiệu"
            name="product_brand"
            rules={[{ required: true, message: "Vui lòng nhập thương hiệu" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Giá gốc"
            name="product_price"
            rules={[{ required: true, message: "Vui lòng nhập giá" }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Đã bán" name="product_selled">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Giảm giá chung (%)" name="product_percent_discount">
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>

          <Form.Item label="Đánh giá" name="product_rate">
            <InputNumber min={0} max={5} step={0.1} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            name="product_category"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select>
              {categorySelectOptions.map((categoryOption) => (
                <Select.Option
                  key={categoryOption.value}
                  value={categoryOption.value}
                >
                  {categoryOption.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mô tả sản phẩm"
            name="product_description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Divider orientation="left">Attributes</Divider>

          {attributeKeys.map((key) => (
            <Form.Item
              key={key}
              name={["attributes", key]}
              label={PRODUCT_ATTRIBUTES_OPTIONS[key].label}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder={`Chọn ${PRODUCT_ATTRIBUTES_OPTIONS[
                  key
                ].label.toLowerCase()}`}
              >
                {PRODUCT_ATTRIBUTES_OPTIONS[key].values.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ))}

          <Form.Item
            label="Ảnh sản phẩm"
            name="product_img"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              listType="picture"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Tải ảnh sản phẩm lên</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="product_display"
            label="Hiển thị sản phẩm"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="product_famous"
            label="Sản phẩm nổi bật"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">Màu sắc và kích thước</Divider>

          <Form.List name="colors">
            {(colorFields, { add: addColor, remove: removeColor }) => (
              <>
                {colorFields.map(
                  ({ key: colorKey, name: colorName, ...colorRestField }) => (
                    <Card
                      key={colorKey}
                      title={`Màu sắc ${colorKey + 1}`}
                      className="mb-4"
                      extra={
                        <Button danger onClick={() => removeColor(colorName)}>
                          Xóa màu
                        </Button>
                      }
                    >
                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "color_name"]}
                        label="Tên màu"
                        rules={[
                          { required: true, message: "Vui lòng nhập tên màu" },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "imgs", "img_main"]}
                        label="Ảnh chính của màu"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                      >
                        <Upload
                          accept="image/*"
                          beforeUpload={() => false}
                          listType="picture"
                          maxCount={1}
                        >
                          <Button icon={<UploadOutlined />}>
                            Tải ảnh chính lên
                          </Button>
                        </Upload>
                      </Form.Item>

                      <Form.Item
                        {...colorRestField}
                        name={[colorName, "imgs", "img_subs"]}
                        label="Ảnh phụ của màu"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                      >
                        <Upload
                          accept="image/*"
                          beforeUpload={() => false}
                          listType="picture"
                          multiple
                        >
                          <Button icon={<UploadOutlined />}>
                            Tải ảnh phụ lên
                          </Button>
                        </Upload>
                      </Form.Item>

                      <Divider orientation="left">Các kích thước</Divider>

                      <Form.List name={[colorName, "variants"]}>
                        {(
                          variantFields,
                          { add: addVariant, remove: removeVariant },
                        ) => (
                          <>
                            {variantFields.map(
                              ({
                                key: variantKey,
                                name: variantName,
                                ...variantRestField
                              }) => (
                                <Card
                                  key={variantKey}
                                  type="inner"
                                  title={`Kích thước ${variantKey + 1}`}
                                  className="mb-2"
                                  extra={
                                    <Button
                                      danger
                                      size="small"
                                      onClick={() => removeVariant(variantName)}
                                    >
                                      Xóa
                                    </Button>
                                  }
                                >
                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_size"]}
                                    label="Kích thước"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập kích thước",
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Ví dụ: S, M, L, XL" />
                                  </Form.Item>

                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_price"]}
                                    label="Giá"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập giá",
                                      },
                                    ]}
                                  >
                                    <InputNumber min={0} className="w-full" />
                                  </Form.Item>

                                  <Form.Item
                                    {...variantRestField}
                                    name={[variantName, "variant_countInStock"]}
                                    label="Số lượng tồn"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Vui lòng nhập số lượng tồn",
                                      },
                                    ]}
                                  >
                                    <InputNumber min={0} className="w-full" />
                                  </Form.Item>
                                </Card>
                              ),
                            )}

                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => addVariant()}
                                block
                                icon={<PlusOutlined />}
                              >
                                Thêm kích thước
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ),
                )}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => addColor()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm màu sắc
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={`Tạo KnowledgeChunk - ${
          selectedKnowledgeProduct?.product_title || ""
        }`}
        open={isKnowledgeChunkModalVisible}
        onOk={handleSaveKnowledgeChunk}
        onCancel={() => setIsKnowledgeChunkModalVisible(false)}
        okText="Lưu chunk"
        cancelText="Hủy"
        width={900}
      >
        <Form form={knowledgeChunkForm} layout="vertical">
          <Form.Item label="Source type" name="source_type">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Chunk type"
            name="chunk_type"
            rules={[{ required: true, message: "Vui lòng chọn chunk type" }]}
          >
            <Select>
              {KNOWLEDGE_CHUNK_TYPE_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>

          <Form.Item label="Ngôn ngữ" name="language">
            <Input />
          </Form.Item>

          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider orientation="left">Metadata</Divider>

          <Form.Item label="Tên sản phẩm" name={["metadata", "product_title"]}>
            <Input />
          </Form.Item>

          <Form.Item label="Thương hiệu" name={["metadata", "product_brand"]}>
            <Input />
          </Form.Item>

          <Form.Item label="Giá thấp nhất" name={["metadata", "min_price"]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Giá cao nhất" name={["metadata", "max_price"]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name={["metadata", "in_stock"]}
            label="Còn hàng"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={["metadata", "display"]}
            label="Hiển thị"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item label="Đánh giá" name={["metadata", "rating"]}>
            <InputNumber min={0} max={5} step={0.1} className="w-full" />
          </Form.Item>

          <Form.Item label="Đã bán" name={["metadata", "sold"]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Màu hiện có"
            name={["metadata", "available_colors"]}
          >
            <Select mode="tags" tokenSeparators={[","]} />
          </Form.Item>

          <Form.Item
            label="Size hiện có"
            name={["metadata", "available_sizes"]}
          >
            <Select mode="tags" tokenSeparators={[","]} />
          </Form.Item>

          <Divider orientation="left">Attributes</Divider>

          {attributeKeys.map((key) => (
            <Form.Item
              key={key}
              name={["metadata", "attributes", key]}
              label={PRODUCT_ATTRIBUTES_OPTIONS[key].label}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder={`Chọn ${PRODUCT_ATTRIBUTES_OPTIONS[
                  key
                ].label.toLowerCase()}`}
              >
                {PRODUCT_ATTRIBUTES_OPTIONS[key].values.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ))}
        </Form>
      </Modal>

      <Modal
        title={`KnowledgeChunk - ${
          selectedKnowledgeProduct?.product_title || ""
        }`}
        open={isKnowledgeChunkViewModalVisible}
        onCancel={() => setIsKnowledgeChunkViewModalVisible(false)}
        footer={null}
        width={900}
      >
        {productKnowledgeChunks.length === 0 ? (
          <p>Chưa có KnowledgeChunk cho sản phẩm này.</p>
        ) : (
          productKnowledgeChunks.map((chunk) => (
            <Card
              key={chunk._id}
              className="mb-3"
              title={chunk.title}
              extra={<span>{chunk.chunk_type}</span>}
            >
              <p className="mb-2 whitespace-pre-wrap">{chunk.content}</p>
              <Divider className="my-3" />
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded">
                {JSON.stringify(chunk.metadata, null, 2)}
              </pre>
            </Card>
          ))
        )}
      </Modal>
    </div>
  );
};

export default Products;
