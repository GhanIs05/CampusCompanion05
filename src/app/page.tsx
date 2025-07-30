import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { Book, Calendar, MessageSquare, Users } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'New Forum Posts', value: '12', icon: MessageSquare },
    { title: 'Resources Added', value: '8', icon: Book },
    { title: 'Upcoming Events', value: '3', icon: Calendar },
    { title: 'Active Mentees', value: '5', icon: Users },
  ];

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <SmartSuggestions />
      </main>
    </div>
  );
}
