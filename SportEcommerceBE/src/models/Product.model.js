import mongoose from "mongoose";
import mongooseDelete from "mongoose-delete";

const variantSchema = new mongoose.Schema(
  {
    variant_size: {
      type: String,
      required: true,
      trim: true,
    },
    variant_price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    variant_countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const colorSchema = new mongoose.Schema(
  {
    color_name: {
      type: String,
      required: true,
      trim: true,
    },
    imgs: {
      img_main: {
        type: String,
        required: true,
        trim: true,
      },
      img_subs: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    product_title: {
      type: String,
      required: true,
      trim: true,
    },

    product_brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    product_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    product_description: {
      type: String,
      required: true,
      trim: true,
    },

    product_img: {
      type: String,
      required: true,
      trim: true,
    },

    product_price: {
      type: Number,
      default: 0,
      min: 0,
    },

    product_percent_discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    colors: {
      type: [colorSchema],
      default: [],
    },

    product_display: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },

    product_countInStock: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    product_famous: {
      type: Boolean,
      required: true,
      default: false,
    },

    product_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    product_feedbacks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback",
      },
    ],

    product_selled: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Domain taxonomy attributes
    attributes: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "Product",
  },
);

productSchema.index({ product_brand: 1, product_category: 1 });
productSchema.index({ attributes: 1 });

productSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Product = mongoose.model("Product", productSchema);
export default Product;
