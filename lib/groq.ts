import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY ?? ''
})

export const MODEL = 'llama-3.3-70b-versatile'

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0,
  maxTokens = 2000
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
  return completion.choices[0]?.message?.content ?? ''
}
