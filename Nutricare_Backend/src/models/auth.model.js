import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const authSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["User", "Docter", "Admin"],
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);
authSchema.pre("save", async function () {
  try {
    console.log("Pre-save Hook Triggered for:", this.email);

    if (!this.isModified("password")) {
      console.log("Password not modified, skipping hash.");
      return; // just return
    }

    console.log("Hashing password...");
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Password hashed successfully!");
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error; // IMPORTANT: throw instead of next(error)
  }
});
authSchema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  console.log(isMatch);
  return isMatch;
};
authSchema.methods.generateAccessToken = function () {
  try {
    const token = jwt.sign(
      { _id: this._id, email: this.email, userType: this.userType },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );

    return token;
  } catch (error) {
    console.error("Error generating access token:", error.message);
  }
};
authSchema.methods.generateRefreshToken = function () {
  try {
    const token = jwt.sign(
      { _id: this._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
    );

    return token;
  } catch (error) {
    console.error("Error generating refresh token:", error.message);
  }
};

export const auth = mongoose.model("Auth", authSchema);
