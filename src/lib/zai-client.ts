export async function isZaiAvailable(): Promise<boolean> {
  return !!(process.env.ZAI_API_KEY && process.env.ZAI_API_KEY.length > 0)
}

export async function generateFixesWithZai(issues: string): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY
  if (!apiKey) {
    throw new Error('Z.AI API key is not configured')
  }

  const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4.7',
      messages: [
        {
          role: 'system',
          content: `You are a helpful code review assistant. Analyze SonarQube issues and provide clear, actionable suggestions for fixing them. Focus on:
1. Explaining what the issue means
2. Why it's a problem
3. How to fix it with specific code examples
4. Best practices to avoid similar issues

Format your response with clear sections for each issue.`
        },
        {
          role: 'user',
          content: `Here are SonarQube issues that need to be fixed. Please provide suggestions for each issue:

${issues}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Z.AI API error: ${response.statusText} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
