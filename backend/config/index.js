import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const currentDir = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(currentDir, '../../.env') })
dotenv.config({ path: resolve(currentDir, '../.env') })

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  naverClientId: process.env.NAVER_CLIENT_ID || '',
  naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
}
