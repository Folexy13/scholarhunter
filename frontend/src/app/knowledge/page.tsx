"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, User, Trash2, History, MessageCircle, Brain, Plus, Paperclip, Image as ImageIcon, X, FileText } from "lucide-react";
import { useWebSocket } from "@/contexts/websocket-context";
import { MainLayout } from "@/components/layout/main-layout";
import apiClient from "@/lib/api-client";
import { aiApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment {
  name: string;
  base64: string;
  mime_type: string;
  preview?: string;
}

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: string;
  suggestions?: string[];
  followUpQuestions?: string[];
  isStreaming?: boolean;
  attachments?: Attachment[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const CHAT_HISTORY_KEY = "scholarhunter_chat_history";
const MAX_SESSIONS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Parse AI response to extract message and suggestions
function parseAIResponse(content: string): { 
  message: string; 
  suggestions: string[]; 
  followUpQuestions: string[];
  action?: { type: string; document_type: string };
} {
  try {
    // Clean content - sometimes LLM wraps JSON in markdown blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(cleanContent);
    return {
      message: parsed.message || content,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      followUpQuestions: Array.isArray(parsed.follow_up_questions) ? parsed.follow_up_questions : 
                        (Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : []),
      action: parsed.action
    };
  } catch {
    // Not JSON, return as-is
    return {
      message: content,
      suggestions: [],
      followUpQuestions: [],
    };
  }
}

// Get display content from a message (parses JSON if needed)
function getMessageDisplay(msg: Message): { 
  content: string; 
  suggestions: string[]; 
  followUpQuestions: string[];
  action?: { type: string; document_type: string };
} {
  // If it's streaming and starts with {, it's likely JSON we shouldn't show raw
  const isLikelyJson = msg.content.trim().startsWith('{') || msg.content.trim().startsWith('```json');
  
  if (msg.isStreaming && isLikelyJson) {
    return {
      content: "Thinking...",
      suggestions: [],
      followUpQuestions: [],
    };
  }

  // If already parsed, use those
  if (msg.suggestions || msg.followUpQuestions) {
    return {
      content: msg.content,
      suggestions: msg.suggestions || [],
      followUpQuestions: msg.followUpQuestions || [],
    };
  }
  
  // Otherwise, try to parse the content as JSON
  const parsed = parseAIResponse(msg.content);
  return {
    content: parsed.message,
    suggestions: parsed.suggestions,
    followUpQuestions: parsed.followUpQuestions,
    action: parsed.action
  };
}

export default function KnowledgePage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, off, isConnected } = useWebSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const preview = file.type.startsWith('image/') ? (event.target?.result as string) : undefined;
        
        setSelectedFiles(prev => [...prev, {
          name: file.name,
          base64: base64,
          mime_type: file.type,
          preview: preview
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const sessions = JSON.parse(savedHistory) as ChatSession[];
        setChatSessions(sessions);
        // Load the most recent session if available
        if (sessions.length > 0) {
          const mostRecent = sessions[0];
          setActiveSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  const saveChatHistory = useCallback((sessions: ChatSession[]) => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  }, []);

  // Update current session in history
  const updateCurrentSession = useCallback((newMessages: Message[]) => {
    if (newMessages.length === 0) return;

    setChatSessions(prev => {
      const sessions = [...prev];
      const existingIndex = sessions.findIndex(s => s.id === activeSessionId);
      
      // Generate title from first user message
      const firstUserMessage = newMessages.find(m => m.type === "user");
      const title = firstUserMessage 
        ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
        : "New Chat";

      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex] = {
          ...sessions[existingIndex],
          messages: newMessages,
          updatedAt: new Date().toISOString(),
        };
        // Move to top
        const [updated] = sessions.splice(existingIndex, 1);
        sessions.unshift(updated);
      } else if (activeSessionId) {
        // Create new session
        sessions.unshift({
          id: activeSessionId,
          title,
          messages: newMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      saveChatHistory(sessions);
      return sessions;
    });
  }, [activeSessionId, saveChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleChatChunk = (data: { sessionId: string; chunk: string; done: boolean }) => {
      if (data.sessionId === currentSessionId) {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          let newMessages: Message[];
          
          if (lastMessage && lastMessage.type === "agent" && lastMessage.id === data.sessionId) {
            newMessages = [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + data.chunk, isStreaming: true },
            ];
          } else {
            newMessages = [
              ...prev,
              {
                id: data.sessionId,
                type: "agent",
                content: data.chunk,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: true,
              },
            ];
          }

          if (data.done) {
            setIsLoading(false);
            setCurrentSessionId(null);
            
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.type === "agent") {
              const parsed = parseAIResponse(lastMsg.content);
              newMessages = [
                ...newMessages.slice(0, -1),
                {
                  ...lastMsg,
                  content: parsed.message,
                  suggestions: parsed.suggestions,
                  followUpQuestions: parsed.followUpQuestions,
                  isStreaming: false,
                },
              ];
            }
            
            updateCurrentSession(newMessages);
          }

          return newMessages;
        });
      }
    };

    const handleChatError = (data: { sessionId: string; error: string }) => {
      if (data.sessionId === currentSessionId) {
        toast.error(data.error || "Failed to get response");
        setIsLoading(false);
        setCurrentSessionId(null);
      }
    };

    on('chat:chunk', handleChatChunk);
    on('chat:error', handleChatError);

    return () => {
      off('chat:chunk', handleChatChunk);
      off('chat:error', handleChatError);
    };
  }, [currentSessionId, on, off, updateCurrentSession]);

  const handleExecuteAction = async (action: { type: string; document_type: string }) => {
    if (action.type === 'GENERATE_DOC') {
      try {
        toast.loading(`ScholarBot is starting to draft your ${action.document_type}...`);
        await aiApi.generateDocument({
          documentType: action.document_type,
          data: {
            context: "Generated from chat conversation"
          }
        });
      } catch (e) {
        toast.error("Failed to start generation");
      }
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || message;
    if ((!textToSend.trim() && selectedFiles.length === 0) || isLoading) return;

    // Create new session if needed
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      setActiveSessionId(sessionId);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: selectedFiles.length > 0 ? [...selectedFiles] : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage("");
    setSelectedFiles([]);
    setIsLoading(true);

    updateCurrentSession(newMessages);

    try {
      const response = await apiClient.post('/llm/chat', {
        message: textToSend || "Analyzing attached files...",
        conversation_history: messages.slice(-10).map(m => ({
          role: m.type === 'agent' ? 'assistant' : 'user',
          content: m.content
        })),
        attachments: userMessage.attachments
      });

      setCurrentSessionId(response.data.sessionId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setCurrentSessionId(null);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
    setCurrentSessionId(null);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveChatHistory(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      startNewChat();
    }
  };

  const clearAllHistory = () => {
    if (confirm("Clear all chat history?")) {
      setChatSessions([]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
      startNewChat();
      toast.success("History cleared");
    }
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4.1rem)] overflow-hidden">
        {/* Sidebar */}
        {showHistory && (
          <aside className="w-72 flex-shrink-0 border-r bg-muted/20 flex flex-col hidden lg:flex">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </h2>
              <Button variant="ghost" size="icon" onClick={clearAllHistory} title="Clear all">
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>

            <div className="p-4">
              <Button onClick={startNewChat} className="w-full justify-start gap-2 shadow-sm rounded-2xl">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`group relative p-3 rounded-2xl cursor-pointer transition-all hover:bg-muted ${
                    activeSessionId === session.id ? 'bg-muted border shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate pr-6">{session.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deleteSession(session.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <p className="text-xs">No chat history</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowHistory(!showHistory)}
                className="hidden lg:flex"
              >
                <History className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  ScholarBot AI
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    {isConnected ? "Agent Ready" : "Connecting..."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 animate-in fade-in zoom-in duration-500 shadow-xl shadow-primary/5">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you?</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  I&apos;m your AI scholarship assistant. Ask me anything about applications, requirements, or deadlines.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    "Find international master's scholarships",
                    "Tips for writing a personal statement",
                    "How to prepare for a scholarship interview",
                    "Check Erasmus Mundus deadlines"
                  ].map((text) => (
                    <Button
                      key={text}
                      variant="outline"
                      className="h-auto py-4 px-6 justify-start text-left font-normal rounded-2xl border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                      onClick={() => handleSendMessage(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-8">
                {messages.map((msg, index) => {
                  const display = msg.type === 'agent' ? getMessageDisplay(msg) : null;
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-4 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0 shadow-sm border border-muted">
                        <AvatarFallback className={msg.type === "user" ? "bg-primary text-primary-foreground font-bold" : "bg-muted"}>
                          {msg.type === "user" ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5 text-primary" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[80%] min-w-0`}>
                        <Card className={`p-4 md:p-5 ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'} overflow-hidden shadow-sm border-primary/5 rounded-2xl`}>
                          {/* Display Attachments if any */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {msg.attachments.map((att, i) => (
                                <div key={i} className="relative group">
                                  {att.preview ? (
                                    <img src={att.preview} alt={att.name} className="h-20 w-20 object-cover rounded-lg border border-white/20" />
                                  ) : (
                                    <div className="h-20 w-20 bg-muted/20 rounded-lg flex flex-col items-center justify-center p-2 border border-white/20">
                                      <FileText className="h-6 w-6 mb-1" />
                                      <span className="text-[8px] truncate w-full text-center">{att.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {msg.type === 'agent' && display ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere prose-p:leading-relaxed prose-headings:mb-3 prose-headings:mt-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {display.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          )}
                        </Card>
                        <span className="text-[10px] text-muted-foreground mt-2 px-1 uppercase font-bold tracking-widest opacity-60">{msg.timestamp}</span>

                        {/* Suggestions and Follow-up Questions */}
                        {msg.type === 'agent' && !msg.isStreaming && display && (
                          <div className="mt-6 w-full flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
                             {/* Action Card if AI triggers a generation */}
                             {display.action && (
                               <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between shadow-sm">
                                 <div className="flex items-center gap-3">
                                   <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                   <div>
                                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Action Ready</p>
                                     <p className="text-sm font-semibold">{display.action.type === 'GENERATE_DOC' ? `Draft ${display.action.document_type}` : 'Start Task'}</p>
                                   </div>
                                 </div>
                                 <Button 
                                   size="sm" 
                                   onClick={() => handleExecuteAction(display.action!)}
                                   className="rounded-xl shadow-lg"
                                 >
                                   Generate Now
                                 </Button>
                               </div>
                             )}

                             <div className="flex items-center gap-2 mb-1">
                                <div className="h-px flex-1 bg-muted" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Follow-up Questions</span>
                                <div className="h-px flex-1 bg-muted" />
                             </div>
                             <div className="flex flex-wrap gap-2">
                              {display.followUpQuestions.map((q, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSendMessage(q)}
                                  className="text-xs bg-muted/40 hover:bg-primary/10 hover:text-primary border border-primary/10 rounded-xl px-4 py-2.5 transition-all text-left shadow-sm flex items-center gap-2 group"
                                >
                                  <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && !currentSessionId && (
                  <div className="flex gap-4 animate-pulse">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-3 pt-2">
                      <div className="h-4 w-64 bg-muted rounded-full opacity-60"></div>
                      <div className="h-4 w-48 bg-muted rounded-full opacity-40"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 border-t bg-card/30 backdrop-blur-md">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <div className="h-16 w-16 bg-muted/50 rounded-xl flex flex-col items-center justify-center p-2 border overflow-hidden">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <>
                            <FileText className="h-5 w-5 mb-1" />
                            <span className="text-[8px] truncate w-full text-center">{file.name}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex items-center group">
                <div className="absolute left-3 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-muted-foreground hover:text-primary rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </div>
                
                <Input
                  placeholder="Type your question or drop a file..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  className="pl-24 pr-14 py-6 md:py-8 rounded-2xl border-primary/10 focus-visible:ring-primary shadow-sm bg-background/50"
                />
                
                <Button 
                  size="icon" 
                  onClick={() => handleSendMessage()} 
                  disabled={isLoading || (!message.trim() && selectedFiles.length === 0)}
                  className="absolute right-2 h-10 w-10 md:h-12 md:w-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary" /> Gemini 3.0 Flash</span>
                  <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                  <span>Multimodal Input Ready</span>
                </div>
                <span>ScholarBot v1.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
