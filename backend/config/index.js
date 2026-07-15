export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  naverClientId: process.env.NAVER_CLIENT_ID || '',
  naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
}
