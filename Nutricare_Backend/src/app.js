import Express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import otpRouter from "./routes/otp.routes.js";
import userRouter from "./routes/user.routes.js";
import bodyMetricsRouter from "./routes/bodyMetrics.routes.js";
import dietRouter from "./routes/diet.routes.js";
import recipeRouter from "./routes/recipe.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import doctorPatientRoutes from "./routes/doctorPatient.routes.js";
import doctorDashboardRoutes from "./routes/doctorDashboard.routes.js";
import aiRouter from "./routes/ai.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import adminRouter from "./routes/admin.routes.js";
const app = Express();

app.use(
  cors({
    // origin: "*",
    // credentials: true, //this break cookies
    origin: "http://localhost:5173", // Vite default
    credentials: true,
  }),
);

app.use(Express.json({ limit: "16kb" }));
app.use(Express.urlencoded({ extended: true, limit: "16kb" }));
app.use(Express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/body-metrics", bodyMetricsRouter);
app.use("/api/v1/diets", dietRouter);
app.use("/api/v1/recipe", recipeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/doctors", doctorPatientRoutes);
app.use("/api/v1/doctors", doctorDashboardRoutes);

app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/dashboard", dashboardRouter);
export default app;
