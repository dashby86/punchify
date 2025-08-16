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

interface MediaInput {
  base64: string
  type: 'image' | 'video' | 'audio'
  description?: string
}

export async function analyzeTaskFromMedia(
  mediaInputs: MediaInput[]
): Promise<any> {
  const client = getOpenAIClient()
  
  // Add retry logic for rate limits
  const makeRequest = async (retries = 3): Promise<any> => {
    try {
      // Build message content with actual images
      const messageContent: any[] = [
        {
          type: "text",
          text: `You are analyzing media files for a task management system. Based on the uploaded images, video frames, and audio transcripts, generate a detailed task description.

CRITICAL INSTRUCTIONS:
1. IF A VIDEO TRANSCRIPT IS PROVIDED: The transcript contains the person's actual description of the problem. This is the PRIMARY source of information about what needs to be fixed. Trust what the person says over what you see.
2. Video frames provide visual context but the TRANSCRIPT describes the actual issue
3. For example: If the transcript says "the door won't shut and maybe the issue is the hinges", focus on that specific problem, not other things you might see like the doorknob appearance
4. Multiple sequential images are frames from the same video - analyze them together

Analyze the content and provide:

1. Task Title: A clear, concise title for the work needed
2. Summary: A brief 1-2 sentence overview
3. Detailed Description: A comprehensive description of the work required, including:
   - What needs to be done
   - Current condition/problem
   - Recommended approach
   - Materials or tools likely needed
   - Estimated complexity/time
4. Location: If identifiable from the images (e.g., "Kitchen", "Bathroom", "Exterior siding", "Garage", "Living Room")
5. Professional Type: What type of professional would handle this (e.g., "Plumber", "Electrician", "Handyman", "Carpenter", "HVAC Technician", "Painter")

Please respond with ONLY valid JSON in this format:
{
  "title": "...",
  "summary": "...",
  "description": "...",
  "location": "...",
  "professional": "..."
}`
        }
      ]

      // Add images and text to the message
      mediaInputs.forEach((media, index) => {
        if (media.type === 'text') {
          // Pure text input (like transcripts)
          messageContent.push({
            type: "text",
            text: media.description || ''
          })
        } else if (media.type === 'image') {
          // Add the image
          messageContent.push({
            type: "image_url",
            image_url: {
              url: media.base64,
              detail: "high"
            }
          })
          
          // If there's a description (like for video frames), add it as text
          if (media.description) {
            messageContent.push({
              type: "text",
              text: media.description
            })
          }
        } else if (media.description) {
          // For other media types with descriptions
          messageContent.push({
            type: "text",
            text: `Media ${index + 1}: ${media.description}`
          })
        }
      })

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const aiResponse = response.choices[0].message?.content
      
      if (!aiResponse) {
        throw new Error('OpenAI returned an empty response')
      }
      
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanedResponse = aiResponse.trim()
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        return JSON.parse(cleanedResponse)
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse)
        throw new Error(`Invalid JSON response from OpenAI. Raw response: ${aiResponse}`)
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

export async function transcribeAudio(audioFile: File): Promise<string> {
  const client = getOpenAIClient()
  
  try {
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    })
    
    return transcription
  } catch (error: any) {
    console.error('Transcription failed:', error)
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.')
    }
    throw new Error('Failed to transcribe audio')
  }
}