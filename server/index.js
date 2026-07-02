import 'dotenv/config'
import express from "express"
import cors from "cors"
import userRoutes from "./routes/user.routes.js";
import urlRoutes from "./routes/url.routes.js"
import { authenticationMiddleware } from "./middlewares/auth.middleware.js";
import { sendFail } from "./utils/error.js";

const app = express();
const PORT = process.env.PORT ?? 8000;
// Middlewares
app.use(express.json({ limit: '10kb' }))
app.use(cors({ origin: true, credentials: true }))
app.use(authenticationMiddleware)

// Routes
app.use('/user', userRoutes)
app.use('/url', urlRoutes)

app.get('/', (req, res) => {
    return res.json({ status: 'Sever is up and running' })
})

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err)
    return sendFail(res, 500, 'Internal server error', 'server')
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
});