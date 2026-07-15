import 'dotenv/config'
import app from './app.js'
import { config } from './config/index.js'

const PORT = config.port

app.listen(PORT, () => {
  console.log(`LocalHub backend listening on port ${PORT}`)
})
