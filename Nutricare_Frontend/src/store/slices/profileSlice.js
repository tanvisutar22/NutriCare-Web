import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../shared/api/http";

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users/me");
      return {
        profile: res.data.data,
        hasProfile: true,
      };
    } catch (err) {
      if (err?.response?.status === 404) {
        return {
          profile: null,
          hasProfile: false,
        };
      }

      return rejectWithValue(
        err?.response?.data || { message: "Failed to load profile" },
      );
    }
  },
);

export const saveProfile = createAsyncThunk(
  "profile/save",
  async ({ payload, isUpdate }, { rejectWithValue }) => {
    try {
      const res = isUpdate
        ? await api.put("/users/me", payload)
        : await api.post("/users", payload);

      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Failed to save profile" },
      );
    }
  },
);

const initialState = {
  data: null,
  hasProfile: false,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfileState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.profile;
        state.hasProfile = action.payload.hasProfile;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load profile";
      })
      .addCase(saveProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.hasProfile = true;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to save profile";
      });
  },
});

export const { resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
