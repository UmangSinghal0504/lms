import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

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
    res.status(400).json({ success: false, message: error.message }); // 🔁 Changed to status 400
  }
};


const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    ;
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { purchaseId, courseId, userId } = session.metadata;

      console.log("✅ Stripe webhook received: checkout.session.completed");
      console.log("Session metadata:", session.metadata);

      try {
        const purchaseData = await Purchase.findById(purchaseId);
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId.toString());

        if (!courseData.enrolledStudents.includes(userId)) {
          courseData.enrolledStudents.push(userId);
          await courseData.save();
          console.log("📚 Course updated with enrolled student:", userId);
        }

        if (!userData.enrolledCourses.includes(courseId)) {
          userData.enrolledCourses.push(courseId);
          await userData.save();
          console.log("👤 User updated with enrolled course:", courseId);
        }

        purchaseData.status = 'completed';
        await purchaseData.save();
        console.log("✅ Purchase status updated to 'completed'");
      } catch (err) {
        console.error("❌ Error handling checkout.session.completed:", err.message);
      }

      break;
    }

    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object;
      const { purchaseId } = session.metadata;

      try {
        const purchaseData = await Purchase.findById(purchaseId);
        purchaseData.status = 'failed';
        await purchaseData.save();
        console.log("❌ Purchase failed or expired:", purchaseId);
      } catch (err) {
        console.error("❌ Error handling failed/expired session:", err.message);
      }

      break;
    }

    default:
      console.warn(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true }); // ✅ Final response
};
