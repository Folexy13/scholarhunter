"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Award, 
  Download,
  Sparkles,
  RefreshCw,
  Search,
  Mail,
  GraduationCap,
  Globe,
  Users,
  FileText,
  History as HistoryIcon,
  X,
  FileSignature,
  PenTool,
  RotateCcw,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Target,
  Zap,
  Printer,
  FileBadge
} from "lucide-react";
import { applicationsApi, aiApi, Application } from "@/lib/api";
import { useWebSocket } from "@/contexts/websocket-context";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FacultyMember {
  id: string;
  name: string;
  details: string;
  email?: string;
  research_interests?: string[];
}

interface University {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface GeneratedDoc {
  id: string;
  content: string;
  timestamp: string;
  type: string;
  title?: string;
  metadata?: {
    key_themes?: string[];
    strengths?: string[];
    suggestions?: string[];
    tone?: string;
  };
}

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState("drafting");
  const [apps, setApps] = useState<Application[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Faculty Search State
  const [continent, setContinent] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [coldEmail, setColdEmail] = useState("");

  // Document Generation State (Manual)
  const [manualDocType, setManualDocType] = useState("personal_statement");
  const [manualScholarship, setManualScholarship] = useState("");
  const [manualContext, setManualContext] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [generatedResult, setGeneratedResult] = useState<GeneratedDoc | null>(null);

  // Document History State
  const [docHistory, setDocHistory] = useState<GeneratedDoc[]>([]);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDoc | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { on, off } = useWebSocket();

  const fetchApps = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await applicationsApi.getAll();
      if (response && Array.isArray(response.data)) {
        setApps(response.data);
      }
    } catch (e) {
      console.error("Failed to fetch applications", e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const getCleanStreamingContent = (raw: string) => {
    // Look for "content": "..." in the building JSON
    const match = raw.match(/"content":\s*"((?:[^"\\]|\\.)*)"/);
    if (match) {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    // Fallback if not found yet
    if (raw.startsWith('{')) return ""; 
    return raw;
  };

  const handleGenComplete = useCallback((data: { documentId: string; success: boolean; content?: string }) => {
    setIsGenerating(null);
    toast.dismiss();
    if (data.success) {
      toast.success("AI Document finalized!");
      fetchApps(false);
      
      const rawContent = data.content || streamingContent;
      let cleanContent = rawContent;
      let metadata = {};
      
      try {
         const parsed = JSON.parse(rawContent);
         cleanContent = parsed.content || rawContent;
         metadata = {
           key_themes: parsed.key_themes,
           strengths: parsed.strengths,
           suggestions: parsed.suggestions,
           tone: parsed.tone
         };
      } catch (e) {
         cleanContent = getCleanStreamingContent(rawContent);
      }

      const newDoc: GeneratedDoc = {
        id: data.documentId,
        content: cleanContent,
        timestamp: new Date().toLocaleString(),
        type: manualDocType.replace('_', ' ').toUpperCase(),
        metadata
      };
      setGeneratedResult(newDoc);
      setDocHistory(prev => [newDoc, ...prev]);
      setStreamingContent("");
    } else {
      toast.error("AI document generation failed");
    }
  }, [fetchApps, manualDocType, streamingContent]);

  useEffect(() => {
    fetchApps();

    const handleChatChunk = (data: { sessionId: string; chunk: string; done: boolean; type?: string }) => {
      if (data.type === 'document-generation') {
        setStreamingContent(prev => prev + data.chunk);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    };

    on('chat:chunk', handleChatChunk);
    on('document:generation-complete', handleGenComplete);
    return () => {
      off('chat:chunk', handleChatChunk);
      off('document:generation-complete', handleGenComplete);
    };
  }, [on, off, fetchApps, handleGenComplete]);

  const handleGenerateManual = async () => {
    if (!manualScholarship) {
      toast.error("Please enter a scholarship name");
      return;
    }
    try {
      setIsGenerating("manual");
      setStreamingContent("");
      setGeneratedResult(null);
      toast.loading("ScholarBot is crafting your document...", { id: "gen-manual" });
      
      await aiApi.generateDocument({
        documentType: manualDocType,
        data: {
          scholarshipName: manualScholarship,
          additionalContext: manualContext
        }
      });
    } catch (e) {
      setIsGenerating(null);
      toast.error("Failed to start AI writer");
    }
  };

  const handleGenerateSOP = async (appId: string, scholarshipName: string) => {
    try {
      setIsGenerating(appId);
      setStreamingContent("");
      setGeneratedResult(null);
      setActiveTab("drafting");
      setManualScholarship(scholarshipName);
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
      toast.error("Failed to initialize AI writer");
    }
  };

  const handleExportPDF = () => {
    if (!printRef.current) return;
    window.print();
  };

  // Faculty Discovery Logic
  const handleContinentChange = async (val: string) => {
    setContinent(val);
    setUniversity("");
    setDepartment("");
    setFaculty([]);
    setColdEmail("");
    setIsSearching(true);
    try {
      const res:any = await aiApi.discoverFaculty({ mode: "LIST_UNIVERSITIES", continent: val });
      console.log("Discover Universities API response:", res);
      if (res.results) {
        const validResults = (res.results as { name: string }[]).filter(u => u && u.name);
        setUniversities(validResults as unknown as University[]);
      }
    } catch (e) {
      toast.error("Discovery failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUniversityChange = async (val: string) => {
    setUniversity(val);
    setDepartment("");
    setFaculty([]);
    setIsSearching(true);
    try {
      const res:any = await aiApi.discoverFaculty({ mode: "LIST_DEPARTMENTS", university: val });
      if (res.results) {
        const validResults = (res.results as { name: string }[]).filter(d => d && d.name);
        setDepartments(validResults as unknown as Department[]);
      }
    } catch (e) {
      toast.error("Discovery timed out.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFaculty = async () => {
    if (!university || !department) return;
    setIsSearching(true);
    try {
      const res = await aiApi.discoverFaculty({ mode: "LIST_FACULTY", university, department });
      if (res.success && res.data.results) {
        const validResults = (res.data.results as { name: string }[]).filter(f => f && f.name);
        setFaculty(validResults as unknown as FacultyMember[]);
      }
    } catch (e) {
      toast.error("Failed to fetch faculty list");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateEmail = async (member: FacultyMember) => {
    setSelectedFaculty(member);
    setIsSearching(true);
    try {
      const res = await aiApi.discoverFaculty({ 
        mode: "GENERATE_COLD_EMAIL", 
        university, 
        department,
        faculty_name: member.name
      });
      if (res.success) setColdEmail(res.data.email_draft as string);
    } catch (e) {
      toast.error("Email generation failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const inProgress = apps.filter(a => a.status === 'DRAFT');
  const submitted = apps.filter(a => a.status === 'SUBMITTED');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col gap-8 print:hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Manager</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Professional document studio and faculty networking suite.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchApps()} size="sm" className="rounded-xl shadow-sm"><RefreshCw className="h-4 w-4 mr-2" /> Sync Pipeline</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-muted/50 p-1 rounded-2xl mb-8 shadow-inner">
            <TabsTrigger value="drafting" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-xs uppercase py-3"><PenTool className="h-4 w-4 mr-2" /> AI Studio</TabsTrigger>
            <TabsTrigger value="pipeline" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-xs uppercase py-3"><Award className="h-4 w-4 mr-2" /> Status</TabsTrigger>
            <TabsTrigger value="networking" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-xs uppercase py-3"><Users className="h-4 w-4 mr-2" /> Networking</TabsTrigger>
          </TabsList>

          <TabsContent value="drafting" className="space-y-8 animate-in fade-in zoom-in duration-500 outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-4 space-y-6">
                <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden h-fit">
                  <CardHeader className="bg-primary/5 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-primary fill-primary" />
                      <CardTitle className="text-xl font-black">AI Writer</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Draft Type</label>
                      <Select value={manualDocType} onValueChange={setManualDocType}>
                        <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none shadow-inner"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal_statement">Personal Statement</SelectItem>
                          <SelectItem value="statement_of_purpose">Statement of Purpose</SelectItem>
                          <SelectItem value="cover_letter">Cover Letter</SelectItem>
                          <SelectItem value="motivation_letter">Motivation Letter</SelectItem>
                          <SelectItem value="research_proposal">Research Proposal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Target Authority</label>
                      <Input placeholder="e.g. Fulbright Committee" value={manualScholarship} onChange={(e) => setManualScholarship(e.target.value)} className="rounded-xl h-12 bg-muted/30 border-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Specific Focus</label>
                      <Textarea placeholder="Highlight my volunteering work..." value={manualContext} onChange={(e) => setManualContext(e.target.value)} className="rounded-xl min-h-[100px] bg-muted/30 border-none shadow-inner resize-none" />
                    </div>
                    <Button className="w-full rounded-2xl h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs" disabled={!!isGenerating} onClick={handleGenerateManual}>
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />} Ignite Draft
                    </Button>
                  </CardContent>
                </Card>

                {docHistory.length > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                       <HistoryIcon className="h-3 w-3" /> History
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {docHistory.map((doc, i) => (
                        <Card key={i} className="rounded-2xl hover:bg-primary/5 border-primary/5 transition-all cursor-pointer group shadow-sm" onClick={() => { setGeneratedResult(doc); setStreamingContent(""); }}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <p className="font-bold text-xs truncate w-32">{doc.timestamp}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-8">
                <div className="bg-muted/20 rounded-[3rem] p-1 shadow-inner border h-[850px] flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b bg-card/50 backdrop-blur-sm rounded-t-[3rem]">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${isGenerating ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-muted'}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Professional Canvas</span>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" className="rounded-xl h-9 px-6 border-primary/10 font-bold" disabled={!streamingContent && !generatedResult} onClick={handleExportPDF}><Printer className="h-4 w-4 mr-2" /> Export</Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex justify-center bg-slate-100 dark:bg-slate-900/50 shadow-inner">
                    <div 
                      ref={scrollRef}
                      className="w-full max-w-[210mm] min-h-[297mm] bg-white dark:bg-slate-950 shadow-[0_30px_60px_rgba(0,0,0,0.12)] p-[25mm] font-serif leading-loose text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-700"
                    >
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:mb-6 prose-p:font-medium text-justify">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {getCleanStreamingContent(streamingContent) || (generatedResult?.content) || "# Standard A4 Canvas\nYour academic draft will be rendered here word-by-word."}
                        </ReactMarkdown>
                        {isGenerating && <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="animate-in slide-in-from-bottom-4 duration-500 outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgress.map(app => (
                  <Card key={app.id} className="rounded-3xl border-primary/5 hover:border-primary/20 transition-all group overflow-hidden shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border group-hover:border-primary/20 transition-all shadow-inner">
                          <Target className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border-none">Active Draft</Badge>
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight line-clamp-1">{app.scholarship?.name}</CardTitle>
                      <CardDescription className="text-xs font-medium text-primary/60">{app.scholarship?.organization}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button className="w-full rounded-2xl h-10 font-bold text-xs shadow-lg shadow-primary/10" onClick={() => handleGenerateSOP(app.id, app.scholarship?.name || "")}>Resume Drafting</Button>
                    </CardContent>
                  </Card>
                ))}
                {inProgress.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center opacity-30 text-center">
                    <FileBadge className="h-16 w-16 mb-4" />
                    <p className="font-black uppercase tracking-[0.3em] text-sm">Pipeline Clear</p>
                  </div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="networking" className="space-y-8 animate-in slide-in-from-right-4 duration-500 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden h-fit">
                <CardHeader className="bg-primary/5 border-b p-6">
                  <CardTitle className="text-lg flex items-center gap-3 font-bold"><Globe className="h-5 w-5 text-primary" /> Region Search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Continent</label>
                    <Select value={continent} onValueChange={handleContinentChange}><SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none shadow-inner"><SelectValue placeholder="Select Location" /></SelectTrigger><SelectContent>
                      {["Africa", "Europe", "North America", "Asia", "South America", "Oceania"].map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">University</label>
                    <Select value={university} onValueChange={handleUniversityChange} disabled={!universities.length}><SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none shadow-inner"><SelectValue placeholder={isSearching ? "AI is fetching..." : "Select University"} /></SelectTrigger><SelectContent className="max-h-[300px] overflow-y-auto">
                      {universities.map((u, i) => (<SelectItem key={u.id || i} value={u.name}>{u.name}</SelectItem>))}
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Dept</label>
                    <Select value={department} onValueChange={setDepartment} disabled={!departments.length}><SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none shadow-inner"><SelectValue placeholder={isSearching ? "AI is fetching..." : "Select Dept"} /></SelectTrigger><SelectContent className="max-h-[300px] overflow-y-auto">
                      {departments.map((d, i) => (<SelectItem key={d.id || i} value={d.name}>{d.name}</SelectItem>))}
                    </SelectContent></Select>
                  </div>
                  <Button className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20 mt-4 font-black uppercase tracking-widest text-[10px]" disabled={!department || isSearching} onClick={handleSearchFaculty}>
                    {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />} Execute Discovery
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                {faculty.length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-2"><Users className="h-3 w-3" /> Targeted Research Fellows</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {faculty.map((member, idx) => (
                        <Card key={idx} className="rounded-3xl hover:border-primary/30 transition-all border-primary/5 shadow-sm overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border shadow-inner"><GraduationCap className="h-6 w-6 text-muted-foreground" /></div>
                              <Button variant="secondary" size="sm" className="rounded-xl h-9 text-[10px] font-black uppercase tracking-tighter" onClick={() => handleGenerateEmail(member)}><Mail className="h-3.5 w-3.5 mr-2" /> Email AI</Button>
                            </div>
                            <h4 className="font-bold text-base mb-1 tracking-tight">{member.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{member.details}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {coldEmail && (
                  <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5 animate-in slide-in-from-bottom-8 duration-700 overflow-hidden shadow-2xl">
                    <CardHeader className="bg-background border-b p-8 flex flex-row justify-between">
                      <div className="flex items-center gap-4"><Mail className="h-6 w-6 text-primary" /><CardTitle className="text-xl font-black">Professional Cold Email</CardTitle></div>
                      <Button variant="ghost" size="icon" onClick={() => setColdEmail("")} className="rounded-full"><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="p-8"><div className="prose prose-sm dark:prose-invert max-w-none bg-background rounded-3xl p-8 border shadow-inner max-h-[450px] overflow-y-auto font-medium leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]}>{coldEmail}</ReactMarkdown></div></CardContent>
                    <CardFooter className="p-8 bg-background border-t justify-end gap-4"><Button variant="outline" className="rounded-2xl px-10 h-12 font-bold" onClick={() => { navigator.clipboard.writeText(coldEmail); toast.success("Copied!"); }}>Copy</Button></CardFooter>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div ref={printRef} className="hidden print:block p-20 font-serif leading-[2] text-xl text-slate-900 bg-white min-h-screen">
         <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {getCleanStreamingContent(streamingContent) || generatedResult?.content || ""}
         </ReactMarkdown>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl flex justify-between items-center mb-8">
             <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20"><FileText className="h-7 w-7 text-white" /></div>
                <div><h2 className="text-2xl font-black">{previewDoc.type}</h2><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{previewDoc.timestamp}</p></div>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)} className="rounded-full h-14 w-14 hover:bg-destructive/10 hover:text-destructive"><X className="h-8 w-8" /></Button>
          </div>
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
             <Card className="lg:col-span-3 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-primary/10 bg-white">
                <div className="flex-1 overflow-y-auto p-16 text-slate-900 font-serif leading-[2] text-lg custom-scrollbar">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewDoc.content}
                   </ReactMarkdown>
                </div>
             </Card>
             <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                <Card className="rounded-3xl border-primary/10 bg-primary/5">
                   <CardHeader className="p-6 pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Intelligence Unit</CardTitle></CardHeader>
                   <CardContent className="p-6 space-y-4">
                      <div><p className="text-[9px] font-black uppercase text-muted-foreground mb-2">Analysis</p><p className="text-[10px] font-medium opacity-70 leading-relaxed">This document has been cross-referenced with your profile and the target scholarship&apos;s mission values.</p></div>
                      {previewDoc.metadata?.strengths && (
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground mb-2">Strengths</p>
                          <ul className="text-[9px] space-y-1">
                            {previewDoc.metadata.strengths.map((s, i) => <li key={i} className="flex gap-1"><CheckCircle2 className="h-2 w-2 text-green-500" /> {s}</li>)}
                          </ul>
                        </div>
                      )}
                   </CardContent>
                </Card>
                <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" onClick={() => { handleExportPDF(); }}><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
             </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
