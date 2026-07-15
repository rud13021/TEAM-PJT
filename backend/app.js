import express from 'express'
import healthRoutes from './routes/health.js'
import dataRoutes from './routes/data.js'
import chatRoutes from './routes/chat.js'
import recommendRoutes from './routes/recommend.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(express.json())

// simple CORS for dev (adjust in production)
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
	if (req.method === 'OPTIONS') return res.sendStatus(200)
	next()
})

// Simple root page to show backend is running
app.get('/', (req, res) => {
	res.type('html').send(`
		<html>
			<head><title>LocalHub Backend</title></head>
			<body>
				<h1>LocalHub Backend</h1>
				<p>API endpoints:</p>
				<ul>
					<li><a href="/api/health">/api/health</a></li>
					<li>POST /api/chat (JSON body: { message, history })</li>
					<li>POST /api/chat/stream (streaming)</li>
				</ul>
			</body>
		</html>
	`)
})

app.use('/api', healthRoutes)
app.use('/api', dataRoutes)
app.use('/api', chatRoutes)
app.use('/api', recommendRoutes)
app.use(errorHandler)

export default app
