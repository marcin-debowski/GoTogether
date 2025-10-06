import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(express.json());

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
