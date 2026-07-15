import express from 'express'

const router = express.Router()

router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' })
    const body = { model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', messages: [...history, { role: 'user', content: message }] }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const txt = await r.text()
    try {
      const parsed = JSON.parse(txt)
      res.status(r.status).json(parsed)
    } catch (e) {
      res.status(r.status).send(txt)
    }
  } catch (err) {
    next(err)
  }
})

router.post('/chat/stream', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' })
    const body = { model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', messages: [...history, { role: 'user', content: message }], stream: true }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    })

    if (!r.ok) {
      const txt = await r.text()
      res.status(r.status).send(txt)
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = r.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        const chunk = decoder.decode(value)
        res.write(chunk)
      }
    }

    res.end()
  } catch (err) {
    next(err)
  }
})

export default router
