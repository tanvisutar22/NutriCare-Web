import Express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
import authRouter from "./routes/auth.routes.js";
import otpRouter from "./routes/otp.routes.js";
// import userRouter from "./routes/user.routes.js";
// import variableMetricRouter from "./routes/variableMetric.routes.js";
// import goalHistoryRouter from "./routes/goalHistory.routes.js";
// import dietRouter from "./routes/diet.routes.js";
// import dietLogRouter from "./routes/dietLog.routes.js";
// app.use("/api/v1/dietLog", dietLogRouter);
// app.use("/api/v1/diet", dietRouter);
// // im
// app.use("/api/v1/variableMetric", variableMetricRouter);
// app.use("/api/v1/goalHistory", goalHistoryRouter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/otp", otpRouter);
// app.use("/api/v1/user", userRouter);
export default app;
