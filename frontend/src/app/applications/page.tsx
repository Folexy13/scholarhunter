"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  AlertCircle, 
  FileSignature, 
  Upload, 
  Eye, 
  Download,
  Calendar,
  Sparkles
} from "lucide-react";

const applications = {
  inProgress: [
    {
      id: 1,
      name: "Chevening Scholarship",
      program: "Master's in Data Science",
      logo: "https://via.placeholder.com/40",
      progress: 65,
      status: "Agent Active",
      statusColor: "primary",
    },
    {
      id: 2,
      name: "DAAD EPOS Program",
      program: "Environmental Management",
      logo: "https://via.placeholder.com/40",
      progress: 20,
      status: "Paused",
      statusColor: "muted",
    },
  ],
  submitted: [
    {
      id: 3,
      name: "Fulbright Scholarship",
      submittedDate: "Oct 24, 2023",
      confirmationId: "FB-2024-99210-AX",
      logo: "https://via.placeholder.com/40",
    },
  ],
  interview: [
    {
      id: 4,
      name: "Erasmus Mundus (EMJM)",
      program: "Digital Transformation Master's",
      interviewDate: "Nov 15, 10:00 AM",
      logo: "https://via.placeholder.com/40",
    },
  ],
};

const actionItems = [
  {
    icon: <FileSignature className="h-5 w-5 text-amber-500" />,
    title: "Signature Needed",
    description: "Fulbright Consent Form",
    action: "Sign Now",
  },
  {
    icon: <Upload className="h-5 w-5 text-amber-500" />,
    title: "Missing Document",
    description: "Latest Semester Marksheet",
    action: "Upload",
  },
];

export default function ApplicationsPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your AI-automated scholarship applications.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button className="shadow-lg shadow-primary/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Start New App
            </Button>
          </div>
        </div>

        {/* Action Required Banner */}
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Action Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-card p-4 rounded-xl border border-amber-200 dark:border-amber-900/20 shadow-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="link" className="text-primary">
                    {item.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
          {/* In Progress Column */}
          <div className="min-w-[320px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">In Progress (Agent)</h3>
                <Badge variant="secondary">{applications.inProgress.length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="material-symbols-outlined text-sm">more_horiz</span>
              </Button>
            </div>

            {applications.inProgress.map((app) => (
              <Card
                key={app.id}
                className="hover:border-primary transition-all"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <Badge
                      variant={app.statusColor === "primary" ? "default" : "secondary"}
                      className={
                        app.statusColor === "primary"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : ""
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm mb-1">{app.name}</CardTitle>
                  <CardDescription className="text-xs">{app.program}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-muted-foreground uppercase">
                        Automation Progress
                      </span>
                      <span className={app.statusColor === "primary" ? "text-primary" : "text-muted-foreground"}>
                        {app.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={app.statusColor === "primary" ? "bg-primary" : "bg-muted-foreground"}
                        style={{ width: `${app.progress}%` }}
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Agent Actions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submitted Column */}
          <div className="min-w-[320px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Submitted</h3>
                <Badge variant="secondary">{applications.submitted.length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="material-symbols-outlined text-sm">more_horiz</span>
              </Button>
            </div>

            {applications.submitted.map((app) => (
              <Card key={app.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <Badge className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30">
                      Submitted
                    </Badge>
                  </div>
                  <CardTitle className="text-sm mb-1">{app.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Submitted on {app.submittedDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Confirmation ID
                    </p>
                    <p className="text-xs font-mono font-bold">{app.confirmationId}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-primary border-primary/20 bg-primary/5">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interview Invited Column */}
          <div className="min-w-[320px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Interview Invited</h3>
                <Badge variant="secondary">{applications.interview.length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="material-symbols-outlined text-sm">more_horiz</span>
              </Button>
            </div>

            {applications.interview.map((app) => (
              <Card
                key={app.id}
                className="border-primary/40 shadow-lg shadow-primary/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30">
                      {app.interviewDate}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm mb-1">{app.name}</CardTitle>
                  <CardDescription className="text-xs">{app.program}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Prep with Agent
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
