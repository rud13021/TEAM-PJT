import express from 'express'
import healthRoutes from './routes/health.js'
import dataRoutes from './routes/data.js'
import naverRoutes from './routes/naver.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(express.json())
app.use('/api', healthRoutes)
app.use('/api', dataRoutes)
app.use('/api/naver', naverRoutes)
app.use(errorHandler)

export default app
