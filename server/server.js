import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import getRawBody from 'raw-body' // 👈 For Clerk webhook
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

const app = express()
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB()

    // 2. Middlewares
    app.use(cors())

    // 3. Routes
    app.get('/', (req, res) => res.send("✅ API Working"))

    // 4. Clerk Webhook (with raw body middleware)
    app.post(
      '/clerk',
      async (req, res, next) => {
        req.rawBody = await getRawBody(req)
        next()
      },
      express.json({
        verify: (req, res, buf) => {
          req.rawBody = buf
        }
      }),
      clerkWebhooks
    )

    // 5. Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err.message)
    process.exit(1)
  }
}

startServer()
