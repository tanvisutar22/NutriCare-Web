import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../shared/api/http";

export const checkAdminSessionThunk = createAsyncThunk(
  "adminAuth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      await http.get("/admin/wallet");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Unauthorized" });
    }
  },
);

export const adminLoginThunk = createAsyncThunk(
  "adminAuth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await http.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        userType: "Admin",
      });
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Login failed" });
    }
  },
);

export const adminLogoutThunk = createAsyncThunk("adminAuth/logout", async () => {
  await http.get("/auth/logout");
});

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    isAuthenticated: false,
    initialized: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkAdminSessionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAdminSessionThunk.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
      })
      .addCase(checkAdminSessionThunk.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
      })
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLoginThunk.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
      })
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(adminLogoutThunk.fulfilled, (state) => {
        state.initialized = true;
        state.isAuthenticated = false;
      });
  },
});

export default adminAuthSlice.reducer;

