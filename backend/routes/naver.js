import express from 'express'
import { getNaverBlogs } from '../controllers/naverController.js'

const router = express.Router()

router.get('/blog', getNaverBlogs)

export default router