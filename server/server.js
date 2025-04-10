import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js"; // ✅ Import from correct path
import getRawBody from "raw-body"; // ✅ New import
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
await connectDB();
await connectCloudinary();


// ✅ General Middleware
app.use(cors());
app.use(clerkMiddleware())

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

app.post('/stripe', express.raw({ type: 'application/json'}), stripeWebhooks)

// ✅ Other Routes
app.get("/", (req, res) => res.send("API Working"));

app.use('/api/educator', express.json(), educatorRouter);
app.use('/api/course', express.json(), courseRouter);
app.use('/api/user', express.json(), userRouter)



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
