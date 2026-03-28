import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../shared/api/http";

export const checkDoctorSessionThunk = createAsyncThunk(
  "doctorAuth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      await http.get("/doctors/profile");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Unauthorized" });
    }
  },
);

export const doctorLoginThunk = createAsyncThunk(
  "doctorAuth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await http.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        userType: "Docter",
      });
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Login failed" });
    }
  },
);

export const doctorLogoutThunk = createAsyncThunk("doctorAuth/logout", async () => {
  await http.get("/auth/logout");
});

const doctorAuthSlice = createSlice({
  name: "doctorAuth",
  initialState: {
    isAuthenticated: false,
    initialized: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkDoctorSessionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkDoctorSessionThunk.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
      })
      .addCase(checkDoctorSessionThunk.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
      })
      .addCase(doctorLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(doctorLoginThunk.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
      })
      .addCase(doctorLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(doctorLogoutThunk.fulfilled, (state) => {
        state.initialized = true;
        state.isAuthenticated = false;
      });
  },
});

export default doctorAuthSlice.reducer;

