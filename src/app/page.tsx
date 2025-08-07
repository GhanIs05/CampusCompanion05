'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar, MessageSquare, FolderKanban, Users, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Show loading only while checking auth state
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">CampusCompanion</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                <Link href="/home">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 bg-orange-50 text-orange-700 border-orange-200">
            🎓 Your Campus Community Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-gray-900 dark:text-white mb-6">
            Connect, Learn, and
            <span className="text-orange-500"> Grow Together</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            CampusCompanion brings your university community together through events, forums, and resource sharing. 
            Discover opportunities, engage in meaningful discussions, and access academic resources all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                <Link href="/home">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-gray-300 hover:bg-gray-50 px-8 py-3">
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need for Campus Life
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            From event discovery to academic collaboration, CampusCompanion provides all the tools to enhance your university experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Event Management */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="font-headline">Event Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-left">
                Find and join campus events, from study groups to social gatherings. Create your own events and build community connections.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Community Forums */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="font-headline">Discussion Forums</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-left">
                Engage in meaningful conversations with fellow students. Ask questions, share insights, and collaborate on academic topics.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Resource Sharing */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="font-headline">Resource Library</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-left">
                Share and access study materials, lecture notes, and academic resources. Build a collaborative knowledge base.
              </CardDescription>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="font-headline">Secure Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-left">
                Role-based access control ensures a safe environment. Admins and moderators maintain community standards.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 dark:text-white mb-6">
                Why Choose CampusCompanion?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Updates</h3>
                    <p className="text-gray-600 dark:text-gray-300">Stay updated with live notifications for events, forum replies, and new resources.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Mobile Responsive</h3>
                    <p className="text-gray-600 dark:text-gray-300">Access your campus community from any device, anywhere, anytime.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Easy to Use</h3>
                    <p className="text-gray-600 dark:text-gray-300">Intuitive interface designed for students by students. No learning curve required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">File Sharing</h3>
                    <p className="text-gray-600 dark:text-gray-300">Upload and share documents, images, and study materials with integrated cloud storage.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 text-white">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8" />
                    <div>
                      <h3 className="font-bold text-xl">10,000+</h3>
                      <p className="opacity-90">Active Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8" />
                    <div>
                      <h3 className="font-bold text-xl">500+</h3>
                      <p className="opacity-90">Events Created</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-8 w-8" />
                    <div>
                      <h3 className="font-bold text-xl">1,200+</h3>
                      <p className="opacity-90">Forum Discussions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <FolderKanban className="h-8 w-8" />
                    <div>
                      <h3 className="font-bold text-xl">3,000+</h3>
                      <p className="opacity-90">Shared Resources</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 dark:text-white mb-6">
            Ready to Join Your Campus Community?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Create your free account today and start connecting with fellow students, discover exciting events, and access valuable academic resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                <Link href="/home">
                  Access Your Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-gray-300 hover:bg-gray-50 px-8 py-3">
                  <Link href="/login">Already have an account?</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="font-headline font-semibold text-gray-900 dark:text-white">CampusCompanion</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <Link href="https://github.com/kkek-041405/CampusCompanion" className="hover:text-orange-500 transition-colors">
              GitHub Repository
            </Link>
            <span>Built with ❤️ for campus communities</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
