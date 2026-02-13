"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Eye, 
  Download,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";
import { applicationsApi, aiApi, Application } from "@/lib/api";
import { useWebSocket } from "@/contexts/websocket-context";
import { toast } from "react-hot-toast";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { on, off } = useWebSocket();

  const fetchApps = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await applicationsApi.getAll();
      if (response && Array.isArray(response.data)) {
        setApps(response.data);
      }
    } catch (e) {
      console.error("Failed to fetch applications", e);
      toast.error("Failed to sync application pipeline");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();

    const handleGenComplete = (data: { documentId: string; success: boolean; content?: string }) => {
      setIsGenerating(null);
      toast.dismiss(); // Clear any loading toast
      if (data.success) {
        toast.success("AI Document generated and saved to draft!", { duration: 5000 });
        fetchApps(false);
      } else {
        toast.error("AI document generation failed");
      }
    };

    on('document:generation-complete', handleGenComplete);
    return () => off('document:generation-complete', handleGenComplete);
  }, [on, off]);

  const handleGenerateSOP = async (appId: string, scholarshipName: string) => {
    try {
      setIsGenerating(appId);
      toast.loading("ScholarBot is crafting your Statement of Purpose...", { id: `gen-${appId}` });
      
      await aiApi.generateDocument({
        documentType: "personal_statement",
        data: {
          applicationId: appId,
          scholarshipName: scholarshipName
        }
      });
    } catch (e) {
      setIsGenerating(null);
      toast.error("Failed to initialize AI writer", { id: `gen-${appId}` });
    }
  };

  // Group applications by status
  const inProgress = apps.filter(a => a.status === 'DRAFT');
  const submitted = apps.filter(a => a.status === 'SUBMITTED');
  const other = apps.filter(a => a.status !== 'DRAFT' && a.status !== 'SUBMITTED');

  if (isLoading && apps.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground animate-pulse font-medium">Syncing your application pipeline...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI-automated scholarship applications and generated documents.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchApps()} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="shadow-lg shadow-primary/20 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
          {/* In Progress Column */}
          <div className="min-w-[350px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">In Progress</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">{inProgress.length}</Badge>
              </div>
            </div>

            {inProgress.length === 0 && (
              <div className="border-2 border-dashed rounded-3xl p-12 text-center opacity-40 bg-muted/20">
                < Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-xs font-medium">No active drafts</p>
                <p className="text-[10px] mt-1">Matches you start applying for will appear here.</p>
              </div>
            )}

            {inProgress.map((app) => (
              <Card key={app.id} className="hover:border-primary/50 transition-all rounded-2xl shadow-sm border-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 uppercase text-[10px] font-bold">
                      Draft
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{app.scholarship?.name || "Unknown Scholarship"}</CardTitle>
                  <CardDescription className="text-xs font-medium text-primary/80">{app.scholarship?.organization}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/30 rounded-xl p-3 border border-muted-foreground/5">
                     <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">AI Assistance Available</p>
                     <Button 
                        size="sm"
                        className="w-full shadow-md bg-primary hover:bg-primary/90 text-white rounded-lg h-9" 
                        onClick={() => handleGenerateSOP(app.id, app.scholarship?.name || "")}
                        disabled={isGenerating === app.id}
                      >
                        <Sparkles className={`h-3.5 w-3.5 mr-2 ${isGenerating === app.id ? 'animate-spin' : ''}`} />
                        {isGenerating === app.id ? "AI is writing..." : "Draft Personal Statement"}
                      </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-lg h-9">
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Edit Application
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submitted Column */}
          <div className="min-w-[350px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Submitted</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{submitted.length}</Badge>
              </div>
            </div>
            
            {submitted.length === 0 && (
              <div className="border-2 border-dashed rounded-3xl p-12 text-center opacity-20 bg-muted/10">
                <p className="text-xs font-medium">No submitted apps</p>
              </div>
            )}

            {submitted.map((app) => (
              <Card key={app.id} className="rounded-2xl shadow-sm border-green-500/10">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/5 flex items-center justify-center border border-green-500/10">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 uppercase text-[10px] font-bold">
                      Submitted
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{app.scholarship?.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Sent on {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'recently'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" size="sm" className="w-full text-primary border-primary/20 bg-primary/5 rounded-lg h-9">
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Download Packet
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
