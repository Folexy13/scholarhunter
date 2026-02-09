"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  Star,
  Eye,
  Clock,
  Users,
  Globe,
  Briefcase,
  GraduationCap
} from "lucide-react";

const upcomingSessions = [
  {
    id: 1,
    name: "Chevening Leadership Mock",
    date: "OCT 14",
    time: "2:00 PM • 30 Minutes Session",
    status: "active",
  },
  {
    id: 2,
    name: "General Motivation Pack",
    date: "OCT 16",
    time: "10:30 AM • 45 Minutes Session",
    status: "scheduled",
  },
];

const scenarioPacks = [
  {
    id: 1,
    name: "Chevening Leadership",
    description: "Focuses on networking, leadership influence, and UK study goals.",
    icon: <Users className="h-6 w-6" />,
    iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    questions: 12,
    duration: "20m",
    status: "Mastered",
    statusColor: "bg-green-100 dark:bg-green-900/30 text-green-600",
  },
  {
    id: 2,
    name: "Fulbright Cultural Exchange",
    description: "Scenarios on ambassadorial roles, community impact, and U.S. values.",
    icon: <Globe className="h-6 w-6" />,
    iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
    questions: 15,
    duration: "25m",
    status: "New",
    statusColor: "bg-muted text-muted-foreground",
  },
  {
    id: 3,
    name: "Erasmus Motivation",
    description: "Interdisciplinary goals and European mobility focus.",
    icon: <GraduationCap className="h-6 w-6" />,
    iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
    questions: 10,
    duration: "15m",
    status: "In Progress",
    statusColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  },
  {
    id: 4,
    name: "DAAD Professional Goals",
    description: "Technical expertise and long-term career planning in Germany.",
    icon: <Briefcase className="h-6 w-6" />,
    iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600",
    questions: 14,
    duration: "30m",
    status: "82% Score",
    statusColor: "bg-muted text-muted-foreground",
  },
];

const recentSessions = [
  { name: "Fulbright Prep #02", date: "Oct 12 • 12:45" },
  { name: "Intro Session #01", date: "Oct 10 • 15:20" },
];

export default function InterviewPrepPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Hero Section */}
        <Card className="relative overflow-hidden border-2">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h1 className="text-3xl font-bold tracking-tight mb-3">Master Your Interview</h1>
                <p className="text-muted-foreground text-lg mb-6">
                  Practice with our autonomous AI agent. Get real-time feedback on your tone, 
                  body language, and answer structure based on global scholarship standards.
                </p>
                <Button size="lg" className="shadow-xl shadow-primary/30">
                  <Video className="h-5 w-5 mr-2" />
                  Start AI Mock Interview
                </Button>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 aspect-square bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-primary/40 mb-2">
                    mic
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">
                    Voice & Video Enabled
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Upcoming Sessions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </h2>
                <Button variant="link" className="text-primary">
                  View All
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={session.status === "active" ? "border-primary" : ""}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                            session.status === "active"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span className="text-xs font-bold">
                            {session.date.split(" ")[0]}
                          </span>
                          <span className="text-lg font-bold">
                            {session.date.split(" ")[1]}
                          </span>
                        </div>
                        <div className={session.status === "scheduled" ? "opacity-70" : ""}>
                          <h4 className="font-bold">{session.name}</h4>
                          <p className="text-xs text-muted-foreground">{session.time}</p>
                        </div>
                      </div>
                      <Button
                        variant={session.status === "active" ? "default" : "outline"}
                        disabled={session.status === "scheduled"}
                      >
                        {session.status === "active" ? "Join Room" : "Scheduled"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Scenario Packs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Scenario Packs
                </h2>
                <Button variant="outline" size="icon">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarioPacks.map((pack) => (
                  <Card
                    key={pack.id}
                    className="hover:border-primary transition-all cursor-pointer group"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`h-10 w-10 ${pack.iconBg} rounded-lg flex items-center justify-center`}>
                          {pack.icon}
                        </div>
                        <Badge className={pack.statusColor}>{pack.status}</Badge>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {pack.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{pack.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">quiz</span>
                          {pack.questions} Qns
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pack.duration}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              History & Metrics
            </h2>

            {/* Communication Score */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Communication Score
                  </span>
                  <span className="material-symbols-outlined text-muted-foreground text-sm">
                    info
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold">85</span>
                  <span className="text-green-500 text-sm font-bold flex items-center mb-1">
                    <TrendingUp className="h-4 w-4" />
                    12%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Avg. over last 5 sessions</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 h-12 items-end">
                  {[40, 60, 55, 80, 85].map((height, idx) => (
                    <div
                      key={idx}
                      className={`${
                        idx === 4 ? "bg-primary" : "bg-primary/20"
                      } hover:bg-primary transition-colors w-full rounded-sm`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Confidence Rating */}
            <Card>
              <CardHeader className="pb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Confidence Rating
                </span>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                    <Star className="h-4 w-4 fill-current opacity-50" />
                  </div>
                  <span className="font-bold">4.2/5</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Eye Contact</span>
                  <span className="text-xs font-bold">Excellent</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pace of Speech</span>
                  <span className="text-xs font-bold text-amber-500">Too Fast</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Filler Words</span>
                  <span className="text-xs font-bold">Low</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-sm">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSessions.map((session, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{session.name}</p>
                      <p className="text-[10px] text-muted-foreground">{session.date}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-6 border-primary/20">
                  View Full Archive
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
