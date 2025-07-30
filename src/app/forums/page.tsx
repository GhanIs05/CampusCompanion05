import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { forumThreads } from '@/lib/data';
import { ArrowUp, MessageCircle, Search, Tag } from 'lucide-react';

export default function ForumsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Forums" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search forums..." className="pl-10" />
          </div>
          <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            Create New Post
          </Button>
        </div>

        <div className="space-y-4">
          {forumThreads.map((thread) => (
            <Card key={thread.id}>
              <CardHeader>
                <CardTitle className="font-headline text-lg">{thread.title}</CardTitle>
                <CardDescription>
                  Posted by {thread.author} in <Badge variant="secondary">{thread.course}</Badge> - {thread.timestamp}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ArrowUp className="h-5 w-5" />
                  <span>{thread.upvotes} Upvotes</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span>{thread.replies} Replies</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
