"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, DollarSign, CheckCircle2, Sparkles, UserCircle, Search } from "lucide-react";
import { scholarshipsApi, Scholarship } from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { useWebSocket } from "@/contexts/websocket-context";

export default function MatchesPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const { on, off } = useWebSocket();

  const fetchMatches = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const scholarshipsResponse = await scholarshipsApi.getMatches();
      const scholarshipsData = Array.isArray(scholarshipsResponse) ? scholarshipsResponse : [];
      setScholarships(scholarshipsData); // Show all matches
      
      // Update progress based on number of matches found (limit 10)
      setAnalyzingProgress(Math.min(100, Math.round((scholarshipsData.length / 10) * 100)));
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to update scholarship matches");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profileResponse = await apiClient.get('/users/profile');
        const profile = profileResponse.data;
        const isComplete = !!(profile.major && profile.gpa && profile.university);
        setProfileComplete(isComplete);
        if (isComplete) fetchMatches();
      } catch (error) {
        setProfileComplete(false);
        setIsLoading(false);
      }
    };

    checkProfile();

    // Listen for new matches via WebSocket
    const handleNewMatch = (data: { scholarship: Scholarship }) => {
      setScholarships(prev => {
        // Prevent duplicates
        if (prev.find(s => s.id === data.scholarship.id)) return prev;
        const newMatches = [data.scholarship, ...prev];
        setAnalyzingProgress(Math.min(100, Math.round((newMatches.length / 10) * 100)));
        return newMatches;
      });
      toast.success(`Found a new match: ${data.scholarship.name}`, { icon: '🎓' });
    };

    on('scholarship:new-match', handleNewMatch);

    return () => {
      off('scholarship:new-match', handleNewMatch);
    };
  }, [on, off]);

  // Periodic poll as backup if websocket fails or for slow updates
  useEffect(() => {
    if (!profileComplete) return;
    
    const interval = setInterval(() => {
      if (scholarships.length < 10) {
        fetchMatches(false);
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [profileComplete, scholarships.length]);

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
    if (daysUntil <= 30) return `${daysUntil} Days Left`;
    
    return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDeadlineUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 14;
  };

  const getEligibilityArray = (eligibility: string[] | Record<string, unknown>): string[] => {
    if (Array.isArray(eligibility)) {
      return eligibility;
    }
    if (typeof eligibility === 'object' && eligibility !== null) {
      return Object.values(eligibility).filter((v): v is string => typeof v === 'string');
    }
    return [];
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Scholarship Match Rankings</h1>
            <p className="text-muted-foreground">
              Our AI agent has identified {scholarships.length} scholarship matches tailored to your academic profile.
            </p>
          </div>
          <div className="bg-card p-1 rounded-xl border flex shadow-sm">
            <Button className="shadow-lg shadow-primary/20">Agent Recommended</Button>
            <Button variant="ghost">High Funding</Button>
          </div>
        </div>

        {/* Scholarship Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Blur Overlay if Profile Incomplete */}
          {!profileComplete && (
            <div className="absolute inset-0 backdrop-blur-sm bg-background/30 z-10 rounded-lg flex items-center justify-center">
              <Card className="max-w-md p-8 text-center shadow-2xl">
                <UserCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Complete Your Profile</h3>
                <p className="text-muted-foreground mb-6">
                  To see personalized scholarship matches tailored to your profile, please complete your profile information.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href="/profile">Update Profile Now</Link>
                </Button>
              </Card>
            </div>
          )}

          {isLoading ? (
            <Card className="col-span-2 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <p className="text-muted-foreground">Loading scholarship matches...</p>
              </div>
            </Card>
          ) : scholarships.length === 0 ? (
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
              </div> F
            </Card>
          ) : (
            <>
              {scholarships.map((scholarship, index) => {
                const eligibilityList = getEligibilityArray(scholarship.eligibility);
                const matchPercentage = Math.max(70, Math.min(98, 95 - index * 3)); // Mock match percentage

                return (
                  <Card
                    key={scholarship.id}
                    className="overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-primary/50 transition-all group"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center p-2 shrink-0">
                            <Award className="h-10 w-10 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                              {scholarship.name}
                            </CardTitle>
                            <CardDescription className="text-sm">{scholarship.organization}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {matchPercentage}% Match
                          </Badge>
                          <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                            #{index + 1} Recommendation
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="border p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">
                              Total Value
                            </span>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(scholarship.amount, scholarship.currency)}
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

                    <CardContent className="space-y-6">
                      {/* AI Rationale */}
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 rationale-gradient">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            AI Rationale
                          </span>
                        </div>
                        <ul className="space-y-2">
                          <li className="flex gap-2 text-sm">
                            <span className="text-primary text-xs mt-0.5">●</span>
                            <span className="text-muted-foreground">
                              Strong alignment with your academic profile and goals
                            </span>
                          </li>
                          {eligibilityList.slice(0, 2).map((criteria, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <span className="text-primary text-xs mt-0.5">●</span>
                              <span className="text-muted-foreground">{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {scholarship.isActive && (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {scholarship.fieldOfStudy && scholarship.fieldOfStudy.length > 0 && (
                          <Badge variant="secondary">
                            {scholarship.fieldOfStudy[0]}
                          </Badge>
                        )}
                        {scholarship.educationLevel && scholarship.educationLevel.length > 0 && (
                          <Badge variant="secondary">
                            {scholarship.educationLevel[0]}
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="mt-auto p-4 bg-muted/30 border-t flex gap-3">
                      <Button className="flex-1 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                        Start Auto-Apply
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/matches/${scholarship.id}`}>Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}

              {/* Loading Card - Show if we have scholarships but less than expected */}
              {scholarships.length > 0 && scholarships.length < 10 && (
                <Card className="overflow-hidden flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/50 relative">
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary border-primary/20">
                      LIVE DISCOVERY
                    </Badge>
                  </div>
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Analyzing Deep Matches</h3>
                  <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
                    Our AI agent is currently scouring global databases to find more scholarships that perfectly align with your profile.
                  </p>
                  <div className="w-full max-w-xs bg-muted h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-full transition-all duration-1000 ease-out" 
                      style={{ width: `${analyzingProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                      {analyzingProgress}% Vetted
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {scholarships.length} matches found
                    </span>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
