import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks } from "./controllers/webhooks.js"; // ✅ Import from correct path
import getRawBody from "raw-body"; // ✅ New import

const app = express();
await connectDB();

// ✅ General Middleware
app.use(cors());

// ✅ Use rawBody middleware before /clerk route
app.use("/clerk", (req, res, next) => {
  getRawBody(req)
    .then((buf) => {
      req.rawBody = buf;
      next();
    })
    .catch((err) => {
      res.status(400).send("Invalid body");
    });
});

// ✅ Route using clerkWebhooks without express.json
app.post("/clerk", clerkWebhooks);

// ✅ Other Routes
app.get("/", (req, res) => res.send("API Working"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
