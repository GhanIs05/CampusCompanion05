import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileX className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/home">
                <Home className="h-4 w-4 mr-2" />
                Go to home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/resources">
                <Search className="h-4 w-4 mr-2" />
                Browse resources
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
