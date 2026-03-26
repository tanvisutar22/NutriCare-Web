import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { auth as AuthModel } from "../models/auth.model.js";
async function Auth(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    // 1️⃣ If access token exists
    if (accessToken) {
      try {
        const user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = user;
        console.log("User in Auth middleware:", req.user); // Debugging line
        return next();
      } catch (err) {
        console.log(err);
        return res.status(401).json(new ApiError(401, "Unauthorized"));
      }
    }

    // 2️⃣ If refresh token exists
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
        );

        const existedUser = await AuthModel
          .findById(decoded._id)
          .select("-password -refreshToken");

        if (!existedUser) {
          return res.status(401).json(new ApiError(401, "Unauthorized"));
        }

        const newAccessToken = existedUser.generateAccessToken();

        res.cookie("accessToken", newAccessToken, { httpOnly: true });

        req.user = decoded;
        return next();
      } catch (err) {
        console.log(err);
        return res.status(401).json(new ApiError(401, "Unauthorized"));
      }
    }

    // 3️⃣ No tokens at all
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  } catch (error) {
    console.log("error in auth middleware", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
}

export default Auth;
