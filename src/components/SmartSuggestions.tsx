'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSuggestedResources } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, Wand2, Loader2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await getSuggestedResources();
      if(result && result.suggestedResources) {
        setSuggestions(result.suggestedResources);
      } else {
        toast({
            variant: "destructive",
            title: "Suggestion Failed",
            description: "Could not generate resource suggestions. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "An unexpected error occurred while fetching suggestions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Wand2 className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Smart Resource Suggestions</CardTitle>
        </div>
        <CardDescription>
          Get AI-powered resource recommendations based on recent forum discussions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : suggestions.length > 0 ? (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Recommendations Found!</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
            <div className="text-center text-muted-foreground p-4 border-dashed border-2 rounded-lg">
                Click the button to generate suggestions.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSuggest} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Suggest Resources
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
