"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Brain, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Hero Section */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h1 className="text-2xl font-bold">ScholarHunter</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Scholarship Matching
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Find Your Perfect
              <span className="text-primary"> Scholarship</span> Match
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Let our AI agent scan global databases, match you with 284+ scholarships, 
              and automate your applications. Your dream education is just one click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg h-14 px-8 shadow-xl shadow-primary/30">
                  Start Matching Now
                  <Award className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="text-lg h-14 px-8">
                  View Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">284+</p>
                <p className="text-sm text-muted-foreground">Scholarships</p>
              </div>
              <div>
                <p className="text-3xl font-bold">94%</p>
                <p className="text-sm text-muted-foreground">Match Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$2M+</p>
                <p className="text-sm text-muted-foreground">Awarded</p>
              </div>
            </div>
          </div>

          {/* Deadline Widget */}
          <Card className="shadow-2xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Upcoming Deadlines</CardTitle>
                <Badge variant="destructive" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              </div>
              <CardDescription>Don&apos;t miss these opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DeadlineItem
                name="Chevening Scholarship"
                deadline="12 Days Left"
                amount="£45,000+"
                urgent
              />
              <DeadlineItem
                name="Fulbright Program"
                deadline="45 Days"
                amount="$35,000+"
              />
              <DeadlineItem
                name="Erasmus Mundus"
                deadline="Jan 15, 2024"
                amount="€24,000/yr"
              />
              <Link href="/dashboard">
                <Button className="w-full mt-4">View All Matches</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl lg:text-4xl font-bold mb-4">
            Powered by AI, Built for Success
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our autonomous agent works 24/7 to find, match, and apply to scholarships on your behalf
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="AI Matching"
            description="Smart algorithms analyze your profile against 284+ global scholarships"
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8" />}
            title="Auto-Apply"
            description="Agent fills forms, drafts essays, and submits applications automatically"
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8" />}
            title="Interview Prep"
            description="Practice with AI mock interviews tailored to each scholarship"
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Success Tracking"
            description="Monitor applications, deadlines, and success rates in real-time"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <Card className="bg-primary text-primary-foreground border-none shadow-2xl">
          <CardContent className="p-12 text-center space-y-6">
            <h3 className="text-4xl font-bold">Ready to Start Your Journey?</h3>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of students who have found their perfect scholarship match
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg h-14 px-8">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <span className="font-bold text-lg">ScholarHunter</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered scholarship matching for ambitious students worldwide
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/scholarships">Scholarships</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ScholarHunter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DeadlineItem({ 
  name, 
  deadline, 
  amount, 
  urgent = false 
}: { 
  name: string; 
  deadline: string; 
  amount: string; 
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className={`text-xs ${urgent ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
            {deadline}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          {amount}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
