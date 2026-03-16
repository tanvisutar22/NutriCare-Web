import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
console.log(process.env.MONGODB_URL);
const connectDB = async () => {
  try {
    //need to be changed to env variable
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}${DB_NAME}`
    );
    console.log("Connected to MongoDB" + connectionInstance.connection.host);
  } catch (error) {
    console.log("MongoDB Connection error" + error);
    process.exit(1);
  }
};
export default connectDB;
