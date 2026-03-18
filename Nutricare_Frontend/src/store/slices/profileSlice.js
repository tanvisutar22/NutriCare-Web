import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users/me");
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      return rejectWithValue(
        err.response?.data || { message: "Failed to load profile" },
      );
    }
  },
);

export const saveProfile = createAsyncThunk(
  "profile/save",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/users", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to save profile" },
      );
    }
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    data: null,
    hasProfile: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.hasProfile = !!action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load profile";
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.data = action.payload;
        state.hasProfile = true;
      });
  },
});

export default profileSlice.reducer;
