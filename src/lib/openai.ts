import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAIClient() {
  const apiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('Please set your OpenAI API key')
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }
  
  return openaiClient
}

export async function analyzeTaskFromMedia(mediaDescriptions: string[]): Promise<any> {
  const client = getOpenAIClient()
  
  // Add retry logic for rate limits
  const makeRequest = async (retries = 3): Promise<any> => {
    try {
      const prompt = `You are analyzing media files for a task management system. Based on the descriptions of uploaded images/videos, generate a detailed task description with the following information:

1. Task Title: A clear, concise title for the work needed
2. Summary: A brief 1-2 sentence overview
3. Detailed Description: A comprehensive description of the work required, including:
   - What needs to be done
   - Current condition/problem
   - Recommended approach
   - Materials or tools likely needed
   - Estimated complexity/time
4. Location: If identifiable from the description (e.g., "Kitchen", "Bathroom", "Exterior siding")
5. Professional Type: What type of professional would handle this (e.g., "Plumber", "Electrician", "Handyman", "Carpenter")

Media descriptions:
${mediaDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Please respond with ONLY valid JSON in this format:
{
  "title": "...",
  "summary": "...",
  "description": "...",
  "location": "...",
  "professional": "..."
}`

      const response = await client.chat.completions.create({
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const aiResponse = response.choices[0].message?.content || '{}'
      
      try {
        return JSON.parse(aiResponse)
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse)
        return {
          title: 'Task Analysis',
          summary: 'Work needs to be done based on uploaded media',
          description: aiResponse,
          location: 'Unknown',
          professional: 'General Contractor'
        }
      }
    } catch (error: any) {
      if (error.status === 429 && retries > 0) {
        // Rate limit hit - wait and retry
        const waitTime = Math.pow(2, 3 - retries) * 1000 // Exponential backoff
        console.log(`Rate limit hit, retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return makeRequest(retries - 1)
      }
      
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please add billing to your OpenAI account at https://platform.openai.com/account/billing')
      }
      
      throw error
    }
  }
  
  return makeRequest()
}