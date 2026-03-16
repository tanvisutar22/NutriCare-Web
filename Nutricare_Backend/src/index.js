import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import dns from 'node:dns/promises';
dns.setServers(['1.1.1.1', '8.8.8.8']);
import app from "./app.js";
import connectDB from "./DB/index.js";
connectDB()
  .then(() =>
    app.listen(process.env.PORT || 8001, (req, res) => {
      console.log("server is running on port: " + process.env.PORT || 8001);
    }),
  )
  .catch((error) => {
    console.log("Index file error" + error);
  });
  import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const models = await genAI.listModels();
// console.log(models);
