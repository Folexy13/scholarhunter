"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { scholarshipsApi, applicationsApi, Scholarship, Application } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    topMatch: 0,
    totalApplications: 0,
    upcomingDeadlines: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch scholarship matches
        const scholarshipsResponse = await scholarshipsApi.getMatches();
        const scholarshipsData = Array.isArray(scholarshipsResponse) ? scholarshipsResponse : [];
        setScholarships(scholarshipsData.slice(0, 3)); // Show top 3

        // Fetch applications
        const applicationsResponse = await applicationsApi.getAll({ limit: 100 });
        const applicationsData = applicationsResponse?.data || [];
        setApplications(applicationsData);

        // Calculate stats
        const topMatch = scholarshipsData.length > 0 ? 94 : 0; // Mock match percentage
        const upcomingDeadlines = scholarshipsData.filter((s) => {
          const deadline = new Date(s.deadline);
          const now = new Date();
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 30 && daysUntil > 0;
        }).length;

        setStats({
          totalMatches: scholarshipsData.length,
          topMatch,
          totalApplications: applicationsResponse?.total || 0,
          upcomingDeadlines,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        // Set empty data on error
        setScholarships([]);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return "Amount varies";
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      // Fallback if currency code is invalid
      return `${currency || 'USD'} ${amount.toLocaleString()}`;
    }
  };

  const getDeadlineText = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return "Expired";
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil <= 14) return `${daysUntil} Days Left`;
    if (daysUntil <= 30) return `${daysUntil} Days`;
    
    return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isDeadlineUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 14 && daysUntil >= 0;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Here are your top scholarship matches
            </p>
          </div>
          <div className="bg-card p-1 rounded-xl border flex shadow-sm">
            <Button className="shadow-lg shadow-primary/20">Agent Recommended</Button>
            <Button variant="ghost" asChild>
              <Link href="/matches">View All</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Matches</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMatches}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+{Math.floor(stats.totalMatches * 0.15)}</span> this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Top Match</CardDescription>
              <CardTitle className="text-3xl">{stats.topMatch}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {scholarships[0]?.name || "No matches yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Applications</CardDescription>
              <CardTitle className="text-3xl">{stats.totalApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {(applications || []).filter(a => a.status === 'DRAFT' || a.status === 'SUBMITTED').length} in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Deadlines</CardDescription>
              <CardTitle className="text-3xl">{stats.upcomingDeadlines}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Scholarship Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {scholarships.length === 0 ? (
            <Card className="col-span-2 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <Award className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete your profile to get personalized scholarship matches
                  </p>
                  <Button asChild>
                    <Link href="/profile">Complete Profile</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            scholarships.map((scholarship, index) => (
              <Card
                key={scholarship.id}
                className="overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-primary/50 transition-all group"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center p-2 shrink-0">
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {scholarship.name}
                        </CardTitle>
                        <CardDescription>{scholarship.organization}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {94 - index * 6}% Match
                      </Badge>
                      <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                        #{index + 1} Recommendation
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                          Total Value
                        </span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {scholarship.amount ? formatCurrency(scholarship.amount, scholarship.currency) : 'Varies'}
                      </p>
                    </div>
                    <div className="border p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                          Deadline
                        </span>
                      </div>
                      <p
                        className={`text-lg font-bold ${
                          isDeadlineUrgent(scholarship.deadline) ? "text-red-500" : "text-foreground"
                        }`}
                      >
                        {getDeadlineText(scholarship.deadline)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg">
                        psychology
                      </span>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        About This Scholarship
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {scholarship.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {scholarship.eligibility && Array.isArray(scholarship.eligibility) && scholarship.eligibility.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {scholarship.eligibility.slice(0, 3).map((criteria: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {criteria}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="mt-auto p-4 bg-muted/30 border-t flex gap-3">
                  <Button className="flex-1 shadow-lg shadow-primary/20" asChild>
                    <Link href={`/matches/${scholarship.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/applications/new?scholarshipId=${scholarship.id}`}>Apply</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}

          {/* Loading Card - Show if we have scholarships */}
          {scholarships.length > 0 && scholarships.length < 10 && (
            <Card className="overflow-hidden flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing More Matches</h3>
              <p className="text-muted-foreground text-sm max-w-[240px] mb-6">
                Our AI agent is currently scanning databases for scholarships that match your profile.
              </p>
              <div className="w-full max-w-xs bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "72%" }}></div>
              </div>
              <span className="text-[10px] font-bold text-primary mt-2 uppercase tracking-widest">
                72% Complete
              </span>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
