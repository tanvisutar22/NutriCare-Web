import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../shared/api/http";

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
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLoginThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(adminLogoutThunk.fulfilled, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export default adminAuthSlice.reducer;

