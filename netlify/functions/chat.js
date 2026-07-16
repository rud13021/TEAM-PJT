// netlify/functions/chat.js
export const handler = async (event) => {
  // 프론트엔드에서 보낸 요청 파싱
  const { messages } = JSON.parse(event.body);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 넷리파이에 등록한 환경변수를 여기서 안전하게 사용합니다
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 또는 사용 중인 모델명
        messages: messages
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch from OpenAI' })
    };
  }
};