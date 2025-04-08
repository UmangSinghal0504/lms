import { Webhook } from "svix";
import User from "../models/User.js";

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
