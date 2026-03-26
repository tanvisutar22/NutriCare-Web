import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import doctorAuthReducer from "./slices/doctorAuthSlice";
import adminAuthReducer from "./slices/adminAuthSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    doctorAuth: doctorAuthReducer,
    adminAuth: adminAuthReducer,
  },
});

export default store;
