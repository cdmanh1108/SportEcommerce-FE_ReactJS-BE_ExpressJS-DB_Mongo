import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connect succesfully !!!");
  } catch (error) {
    console.log(error);
    console.log("Connect fail !!!");
  }
}

export { connect };
