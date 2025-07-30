'use server';

import { suggestResources } from "@/ai/flows/smart-resource-suggestions";
import { forumThreads, resourceLibrary } from "@/lib/data";

export async function getSuggestedResources() {
  try {
    const forumActivity = forumThreads
        .map(thread => `Title: ${thread.title}, Course: ${thread.course}, Tags: ${thread.tags.join(', ')}`)
        .join('\n');
    
    const availableResources = resourceLibrary
        .map(resource => `${resource.name} (${resource.category})`)
        .join(', ');

    const result = await suggestResources({
        forumActivity,
        resourceLibrary: availableResources,
    });
    
    return result;

  } catch (error) {
    console.error("Error in getSuggestedResources server action:", error);
    return null;
  }
}
