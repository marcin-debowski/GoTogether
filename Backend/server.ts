import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import eventRoutes from "./routes/eventRoutes";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/events", eventRoutes);
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  });
