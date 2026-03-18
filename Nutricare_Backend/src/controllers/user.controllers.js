import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";

// Create or overwrite the profile for the logged-in auth user
export const createUserProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { name, gender, age, height, foodPreference, medicalConditions, allergies } =
      req.body || {};

    if (!name || !gender || !age || !height) {
      return res
        .status(400)
        .json(new ApiError(400, "name, gender, age and height are required"));
    }

    const payload = {
      authId,
      name,
      gender,
      age,
      height,
      foodPreference,
      medicalConditions,
      allergies,
    };

    // Upsert style: if profile exists, update it; otherwise create new
    const profile = await User.findOneAndUpdate({ authId }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile saved successfully"));
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while saving profile"));
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const profile = await User.findOne({ authId });
    if (!profile) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile fetched successfully"));
  } catch (error) {
    console.error("Error in getMyProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching profile"));
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const updates = req.body || {};

    const profile = await User.findOneAndUpdate({ authId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!profile) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile updated successfully"));
  } catch (error) {
    console.error("Error in updateMyProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while updating profile"));
  }
};

