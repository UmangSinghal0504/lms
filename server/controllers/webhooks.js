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


const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
  
    try {
      event = Stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId)
      const userData = await User.findById(purchaseData.userId)
      const courseData = await Course.findById(purchaseData.courseId.toString())

      courseData.enrolledStudents.push(userData._id)
      await courseData.save()

      userData.enrolledCourses.push(courseData._id)
      await userData.save()

      purchaseData.status = 'completed'
      await purchaseData.save()

        break;
    }
    case 'payment_intent.payment_failed':{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
  
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        })
  
        const { purchaseId } = session.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId)
        
        purchaseData.status = 'failed'
        await purchaseData.save()

      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
}
