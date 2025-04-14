import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
import getRawBody from "raw-body";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import { errorLogger } from './middlewares/errorLogger.js';
import { verifyUserExists } from './middlewares/authMiddleware.js';

const app = express();

// Connect to databases
await connectDB();
await connectCloudinary();

// Stripe Webhook (must come before express.json())
app.post('/stripe', express.raw({ type: 'application/json'}), stripeWebhooks);

// Clerk Webhook
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
app.post("/clerk", clerkWebhooks);

// General Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Apply user verification middleware to all API routes
app.use('/api', verifyUserExists);

// Routes
app.get("/", (req, res) => res.send("API Working"));
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);

// Error handling
app.use(errorLogger);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});