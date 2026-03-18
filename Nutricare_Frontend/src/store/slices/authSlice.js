import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { fetchProfile } from "./profileSlice";

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        userType: "User",
      });
      await dispatch(fetchProfile());
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Login failed" });
    }
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await api.get("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
