import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with Google AI
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});

// Helper function to get the AI model
export function getAIModel() {
  return 'googleai/gemini-2.0-flash';
}

// Suggest related resources based on content
export async function suggestRelatedResources(content: string, category?: string, excludeIds: string[] = []) {
  try {
    const prompt = `
      Given this content: "${content}"
      ${category ? `In the category: ${category}` : ''}
      
      Suggest 3-5 related academic resources that would be helpful for learning or understanding this topic better.
      
      For each suggestion, provide:
      1. A descriptive title
      2. The type of resource (e.g., "Research Paper", "Tutorial", "Documentation", "Video", "Book", "Article")
      3. A brief description of why it's relevant
      4. Suggested category if not provided
      
      Format as JSON array:
      [
        {
          "title": "Resource Title",
          "type": "Resource Type",
          "description": "Why this resource is relevant and helpful",
          "category": "Suggested category",
          "relevanceScore": 0.95
        }
      ]
      
      Focus on educational and academic resources that would genuinely help students.
    `;

    const response = await ai.generate({
      model: getAIModel(),
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    try {
      const suggestions = JSON.parse(response.text);
      return suggestions.filter((s: any) => s.title && s.description);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating resource suggestions:', error);
    return [];
  }
}

// Suggest related forum topics based on thread content
export async function suggestRelatedThreads(threadTitle: string, threadContent: string, category?: string) {
  try {
    const prompt = `
      Given this forum thread:
      Title: "${threadTitle}"
      Content: "${threadContent}"
      ${category ? `Category: ${category}` : ''}
      
      Suggest 3-5 related discussion topics or questions that students might be interested in exploring further.
      
      For each suggestion, provide:
      1. A compelling thread title
      2. A brief description of the discussion topic
      3. Why it's related to the original thread
      4. Suggested category
      
      Format as JSON array:
      [
        {
          "title": "Suggested Thread Title",
          "description": "What this discussion would cover",
          "relation": "How it relates to the original thread",
          "category": "Suggested category",
          "relevanceScore": 0.95
        }
      ]
      
      Focus on educational discussions that would help students learn and engage.
    `;

    const response = await ai.generate({
      model: getAIModel(),
      prompt: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      },
    });

    try {
      const suggestions = JSON.parse(response.text);
      return suggestions.filter((s: any) => s.title && s.description);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating thread suggestions:', error);
    return [];
  }
}

// Generate study suggestions based on user activity
export async function generateStudySuggestions(userActivity: {
  recentThreads: string[];
  recentResources: string[];
  userRole: string;
  interests?: string[];
}) {
  try {
    const prompt = `
      Based on this user activity:
      - Recent forum threads: ${userActivity.recentThreads.join(', ')}
      - Recent resources accessed: ${userActivity.recentResources.join(', ')}
      - User role: ${userActivity.userRole}
      ${userActivity.interests ? `- Interests: ${userActivity.interests.join(', ')}` : ''}
      
      Generate 3-5 personalized study suggestions that would help this user learn and grow.
      
      Include:
      1. Recommended topics to explore
      2. Suggested study methods
      3. Resource types that would be most helpful
      4. Forum discussions they might want to join or start
      
      Format as JSON array:
      [
        {
          "type": "topic|method|resource|discussion",
          "title": "Suggestion Title",
          "description": "Detailed description",
          "reason": "Why this is recommended based on their activity",
          "priority": "high|medium|low"
        }
      ]
    `;

    const response = await ai.generate({
      model: getAIModel(),
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    });

    try {
      const suggestions = JSON.parse(response.text);
      return suggestions.filter((s: any) => s.title && s.description);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating study suggestions:', error);
    return [];
  }
}

// Answer questions about resources or forum content
export async function getSmartAnswer(question: string, context: string) {
  try {
    const prompt = `
      Context: ${context}
      
      Question: ${question}
      
      Provide a helpful, accurate answer based on the context. If the context doesn't contain enough information to answer the question, say so and suggest where the user might find more information.
      
      Keep the answer concise but informative, suitable for a student audience.
    `;

    const response = await ai.generate({
      model: getAIModel(),
      prompt: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return response.text;
  } catch (error) {
    console.error('Error generating smart answer:', error);
    return 'I apologize, but I cannot provide an answer at the moment. Please try again later.';
  }
}
