'use server';

/**
 * @fileOverview A smart resource suggestion AI agent.
 *
 * - suggestResources - A function that suggests relevant study resources.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResourcesInputSchema = z.object({
  forumActivity: z.string().describe('The recent activity in the discussion forums.'),
  resourceLibrary: z.string().describe('The list of resources available in the library, with descriptions.'),
});
export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const SuggestResourcesOutputSchema = z.object({
  suggestedResources: z.array(
    z.string().describe('The names of the resources suggested for the user.')
  ).describe('A list of resources suggested for the user based on their forum activity.'),
});
export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant study resources to students based on their forum activity.

  You are provided with the recent activity in the discussion forums and a list of resources available in the library.

  Based on the forum activity, identify the most relevant resources from the library that could help the student.

  Forum Activity:
  {{forumActivity}}

  Resource Library:
  {{resourceLibrary}}

  Suggested Resources:
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const suggestResourcesFlow = ai.defineFlow(
  {
    name: 'suggestResourcesFlow',
    inputSchema: SuggestResourcesInputSchema,
    outputSchema: SuggestResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
