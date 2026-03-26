import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../shared/api/http";

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
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(doctorLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(doctorLoginThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(doctorLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(doctorLogoutThunk.fulfilled, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export default doctorAuthSlice.reducer;

