import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../shared/api/http";
import { fetchProfile, resetProfileState } from "./profileSlice";

export const checkSessionThunk = createAsyncThunk(
  "auth/checkSession",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const profileAction = await dispatch(fetchProfile());

      if (fetchProfile.rejected.match(profileAction)) {
        throw profileAction.payload || new Error("Unauthorized");
      }

      return true;
    } catch (error) {
      return rejectWithValue(error?.message || "Unauthorized");
    }
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        userType: "User",
      });

      const profileAction = await dispatch(fetchProfile());

      if (fetchProfile.rejected.match(profileAction)) {
        throw profileAction.payload || new Error("Failed to load profile");
      }

      return true;
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: "Login failed" });
    }
  },
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await api.get("/auth/logout");
    } finally {
      dispatch(resetProfileState());
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    initialized: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkSessionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSessionThunk.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
      })
      .addCase(checkSessionThunk.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
      })
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
