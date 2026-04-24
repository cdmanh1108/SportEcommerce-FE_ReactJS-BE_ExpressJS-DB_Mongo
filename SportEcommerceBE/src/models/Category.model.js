import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const categorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category_slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      unique: true,
      index: true,
    },

    category_parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    category_level: {
      type: Number,
      required: true,
      default: 1,
    },

    // biểu diễn loại category rõ hơn
    // category_kind: {
    //   type: String,
    //   enum: ["root", "sport", "subcategory"],
    //   default: "sport",
    //   index: true,
    // },

    // domain chuẩn hóa
    // sport_type: {
    //   type: String,
    //   enum: [
    //     "bong_da",
    //     "bong_ro",
    //     "bong_chuyen",
    //     "cau_long",
    //     "chay_bo",
    //     "tap_luyen",
    //     "lifestyle",
    //     null,
    //   ],
    //   default: null,
    //   index: true,
    // },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "Category",
  },
);

categorySchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
