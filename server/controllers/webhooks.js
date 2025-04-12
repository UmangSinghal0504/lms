import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

// Clerk Webhook Handler
export const clerkWebhooks = async (req, res) => {
  try {
    // ✅ LOGGING: Helps debug incoming requests
    console.log("🔥 Incoming webhook");
    console.log("Headers:", req.headers);
    console.log("Raw Body:", req.rawBody?.toString());

    // ✅ SECRET VERIFICATION using rawBody
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const evt = whook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    // ✅ Extract from verified event, not req.body
    const { data, type } = evt;

    console.log("📦 Webhook type:", type);
    console.log("👤 User data:", data);

    // ✅ Handle event types
    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        console.log("✅ User created:", userData);
        res.json({});
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        console.log("🔄 User updated:", data.id);
        res.json({});
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        console.log("❌ User deleted:", data.id);
        res.json({});
        break;
      }

      default:
        console.log("⚠️ Unhandled event type:", type);
        res.json({});
        break;
    }
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.rawBody || req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { purchaseId, courseId, userId } = session.metadata;
    
      console.log("✅ Stripe webhook received: checkout.session.completed");
      console.log("Full session object:", JSON.stringify(session, null, 2));
      console.log("Extracted metadata - purchaseId:", purchaseId, "courseId:", courseId, "userId:", userId);
      console.log("Current database connection state:", mongoose.connection.readyState);

      try {
        // Start a MongoDB session for transactions
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
          // 1. Find and update the purchase document
          const purchaseData = await Purchase.findById(purchaseId).session(session);
          if (!purchaseData) {
            console.error("❌ Purchase not found with ID:", purchaseId);
            await session.abortTransaction();
            session.endSession();
            break;
          }

          console.log("Found purchase document:", JSON.stringify(purchaseData, null, 2));

          // 2. Verify the purchase matches the session metadata
          if (purchaseData.userId !== userId || purchaseData.courseId.toString() !== courseId) {
            console.error("❌ Purchase metadata mismatch!");
            console.log("Purchase userId:", purchaseData.userId, "vs session userId:", userId);
            console.log("Purchase courseId:", purchaseData.courseId, "vs session courseId:", courseId);
            await session.abortTransaction();
            session.endSession();
            break;
          }

          // 3. Update user and course
          const [userData, courseData] = await Promise.all([
            User.findById(userId).session(session),
            Course.findById(courseId).session(session)
          ]);

          if (!courseData.enrolledStudents.includes(userId)) {
            courseData.enrolledStudents.push(userId);
            await courseData.save({ session });
            console.log("📚 Course updated with enrolled student:", userId);
          }

          if (!userData.enrolledCourses.includes(courseId)) {
            userData.enrolledCourses.push(courseId);
            await userData.save({ session });
            console.log("👤 User updated with enrolled course:", courseId);
          }

          // 4. Update purchase status
          purchaseData.status = 'completed';
          purchaseData.updatedAt = new Date();
          await purchaseData.save({ session });

          // Commit the transaction
          await session.commitTransaction();
          session.endSession();

          console.log("✅ Purchase status updated to 'completed'");
          console.log("Updated purchase document:", JSON.stringify(purchaseData, null, 2));

          // Verify the update by querying the database again
          const verifiedPurchase = await Purchase.findById(purchaseId);
          console.log("Verified purchase status:", verifiedPurchase.status);
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          throw err;
        }
      } catch (err) {
        console.error("❌ Error handling checkout.session.completed:", err.message);
        console.error("Stack trace:", err.stack);
      }
      break;
    }

    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object;
      const { purchaseId } = session.metadata;

      try {
        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.error("❌ Purchase not found with ID:", purchaseId);
          break;
        }
        purchaseData.status = 'failed';
        await purchaseData.save();
        console.log("❌ Purchase failed or expired:", purchaseId);
      } catch (err) {
        console.error("❌ Error handling failed/expired session:", err.message);
      }
      break;
    }

    case 'payment_intent.succeeded':
      console.log("ℹ️ payment_intent.succeeded event received - no action needed");
      break;

    default:
      console.warn(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};