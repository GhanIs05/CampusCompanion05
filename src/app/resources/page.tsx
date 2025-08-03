import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resourceLibrary } from '@/lib/data';
import { Download, FileText, Search, Upload } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';

export default function ResourcesPage() {
  const getFileIcon = (fileType: string) => {
    // In a real app, you'd have more icons for different file types
    return <FileText className="h-5 w-5 text-primary" />;
  };

  return (
    <PageWrapper title="Resource Library">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <CardTitle className="font-headline">Shared Materials</CardTitle>
              <div className="flex w-full md:w-auto items-center gap-2">
                <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search resources..." className="pl-10" />
                </div>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Uploader</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {resourceLibrary.map((resource) => (
                    <TableRow key={resource.id}>
                        <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            {getFileIcon(resource.fileType)}
                            <span className="truncate">{resource.name}</span>
                        </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{resource.category}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{resource.uploader}</TableCell>
                        <TableCell className="hidden lg:table-cell">{resource.date}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                            <Download className="h-5 w-5 text-muted-foreground" />
                            <span className="sr-only">Download</span>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}
