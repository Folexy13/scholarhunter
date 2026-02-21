"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, VolumeX, Play, PhoneOff, Mic, MicOff, MoreVertical, Check, Settings, MessageSquare, AlertCircle, Timer, ShieldAlert, Send } from "lucide-react";
import { aiApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import apiClient from "@/lib/api-client";
import { useWebSocket } from "@/contexts/websocket-context";

interface InterviewSessionProps {
  onClose: () => void;
  interviewType: string;
  persona: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Voice mapping for Azure Neural Voices - using multilingual voices for better quality
const VOICE_MAP: Record<string, string> = {
  sarah: "en-US-JennyNeural",
  michael: "en-US-GuyNeural", 
  dr_emily: "en-US-AriaNeural"
};

const INTERVIEWERS = [
  {
    id: "sarah",
    name: "Dr. Sarah Mitchell",
    role: "Lead Interviewer",
    title: "Associate Professor of International Relations",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    description: "Friendly & Encouraging",
    voice: "en-US-JennyNeural"
  },
  {
    id: "michael",
    name: "Prof. Michael Chen",
    role: "Technical Lead",
    title: "Department Chair, Computer Science",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    description: "Strict & Analytical",
    voice: "en-US-GuyNeural"
  },
  {
    id: "dr_emily",
    name: "Dr. Emily Rodriguez",
    role: "Academic Dean",
    title: "Dean of Graduate Studies",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
    description: "Thoughtful & Deep",
    voice: "en-US-AriaNeural"
  }
];

export function InterviewSession({ onClose, interviewType, persona }: InterviewSessionProps) {
  // WebSocket for real-time communication
  const { sendMessage, on, off, isConnected } = useWebSocket();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const [joinProgress, setJoinProgress] = useState("");
  
  // WebSocket state
  const [useWebSocketMode, setUseWebSocketMode] = useState(true); // Use WebSocket by default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingResponseRef = useRef<{
    resolve: (value: { success: boolean; data: Record<string, unknown> }) => void;
    reject: (error: Error) => void;
  } | null>(null);
  
  // Timer State
  const [interviewDuration, setInterviewDuration] = useState(30); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // In seconds
  const [hasWarned5Min, setHasWarned5Min] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-send silence detection
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  
  // Flag to track intentional audio stop (barge-in) vs actual error
  const isIntentionalStopRef = useRef<boolean>(false);
  
  // Confirmation Modal State
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
  // Audio Feedback State
  const [volume, setVolume] = useState(0);
  const [isSecure, setIsSecure] = useState(true);
  const [lastError, setLastError] = useState<string>("");
  const [audioContextState, setAudioContextState] = useState<string>("unknown");

  // Live Caption State
  const [captionText, setCaptionText] = useState("");
  const [captionSpeaker, setCaptionSpeaker] = useState("");

  // Multi-Interviewer State
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>(["sarah"]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("sarah");

  // Streaming State
  const [streamedResponse, setStreamedResponse] = useState("");
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Azure Config - Auto-enabled by default for better voice quality
  const [azureToken, setAzureToken] = useState<string | null>(null);
  const [azureRegion, setAzureRegion] = useState<string | null>(null);
  const [useAzure, setUseAzure] = useState(true); // Auto-enable Azure
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isAzureReady, setIsAzureReady] = useState(false);

  // Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const azureSynthesizerRef = useRef<any>(null); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechStartTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const captionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track current state values for use in callbacks
  const isRecordingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen, streamedResponse]);

  // Pre-fetch Azure token on component mount for faster startup
  useEffect(() => {
    const prefetchAzureToken = async () => {
      if (useAzure) {
        try {
          const res = await apiClient.post('/llm/speech-token');
          const { token, region } = res.data;
          setAzureToken(token);
          setAzureRegion(region);
          setTokenExpiry(Date.now() + 9 * 60 * 1000);
          setIsAzureReady(true);
          console.log("Azure token pre-fetched successfully");
        } catch (err) {
          console.error("Failed to pre-fetch Azure token:", err);
          setIsAzureReady(false);
        }
      }
    };
    
    prefetchAzureToken();
  }, [useAzure]);

  // WebSocket event listeners for interview
  useEffect(() => {
    if (!useWebSocketMode) return;

    const handleInterviewResponse = (data: { success: boolean; data: Record<string, unknown>; timestamp: string }) => {
      console.log("WebSocket interview:response received:", data);
      if (pendingResponseRef.current) {
        pendingResponseRef.current.resolve(data);
        pendingResponseRef.current = null;
      }
    };

    const handleInterviewError = (data: { error: string; timestamp: string }) => {
      console.error("WebSocket interview:error received:", data);
      if (pendingResponseRef.current) {
        pendingResponseRef.current.reject(new Error(data.error));
        pendingResponseRef.current = null;
      }
    };

    const handleInterviewProcessing = () => {
      console.log("WebSocket interview:processing - AI is thinking...");
      // Show a "thinking" indicator
      setStreamedResponse("...");
    };

    const handleInterviewChunk = (data: { chunk: string; timestamp: string }) => {
      // Append chunk to streamed response for real-time display
      setStreamedResponse(prev => {
        // Remove the "..." thinking indicator if present
        const cleaned = prev === "..." ? "" : prev;
        return cleaned + data.chunk;
      });
    };

    on('interview:response', handleInterviewResponse);
    on('interview:error', handleInterviewError);
    on('interview:processing', handleInterviewProcessing);
    on('interview:chunk', handleInterviewChunk);

    return () => {
      off('interview:response', handleInterviewResponse);
      off('interview:error', handleInterviewError);
      off('interview:processing', handleInterviewProcessing);
      off('interview:chunk', handleInterviewChunk);
    };
  }, [useWebSocketMode, on, off]);

  // Function to send interview message via WebSocket
  const sendInterviewMessageWS = useCallback(async (
    mode: string,
    userAnswer?: string,
    history?: { role: string; content: string }[],
    isConclusion?: boolean
  ): Promise<{ success: boolean; data: Record<string, unknown> }> => {
    return new Promise((resolve, reject) => {
      // Get the names of selected interviewers to pass to the AI
      const selectedPanelists = selectedInterviewers
        .map(id => {
          const interviewer = INTERVIEWERS.find(i => i.id === id);
          return interviewer ? { id: interviewer.id, name: interviewer.name, role: interviewer.role, title: interviewer.title } : null;
        })
        .filter((p): p is { id: string; name: string; role: string; title: string } => p !== null);

      // Store the promise handlers
      pendingResponseRef.current = { resolve, reject };

      // Set a timeout for the response
      const timeout = setTimeout(() => {
        if (pendingResponseRef.current) {
          pendingResponseRef.current.reject(new Error('Interview response timeout'));
          pendingResponseRef.current = null;
        }
      }, 60000); // 60 second timeout

      // Send the message via WebSocket
      sendMessage('interview:message', {
        mode,
        persona,
        interview_type: interviewType,
        user_answer: userAnswer,
        history,
        selected_panelists: selectedPanelists,
        is_conclusion: isConclusion,
      });

      // Clear timeout when response is received
      const originalResolve = pendingResponseRef.current.resolve;
      const originalReject = pendingResponseRef.current.reject;
      pendingResponseRef.current.resolve = (value) => {
        clearTimeout(timeout);
        originalResolve(value);
      };
      pendingResponseRef.current.reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };
    });
  }, [selectedInterviewers, persona, interviewType, sendMessage]);

  // Timer countdown effect
  useEffect(() => {
    if (hasStarted && !isTimeUp) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimeUp(true);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [hasStarted, isTimeUp]);

  // Auto-send event listener
  useEffect(() => {
    const handleAutoSend = () => {
      if (transcript.trim() && !isSpeaking && !isLoading) {
        console.log("Auto-send triggered via event");
        handleSendResponse();
      }
    };
    
    window.addEventListener('interview-auto-send', handleAutoSend);
    
    return () => {
      window.removeEventListener('interview-auto-send', handleAutoSend);
      // Clear silence timer on unmount
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [transcript, isSpeaking, isLoading]);

  // 5-minute warning effect - trigger AI to conclude
  useEffect(() => {
    if (hasStarted && timeRemaining <= 300 && timeRemaining > 0 && !hasWarned5Min && !isSpeakingRef.current && !isLoading) {
      setHasWarned5Min(true);
      // Trigger AI to conclude the interview
      triggerInterviewConclusion();
    }
  }, [hasStarted, timeRemaining, hasWarned5Min, isLoading]);

  // Trigger AI to conclude the interview with advice
  const triggerInterviewConclusion = async () => {
    console.log("Triggering interview conclusion - 5 minutes remaining");
    
    // Stop any ongoing recording
    stopRecording();
    setIsLoading(true);
    
    try {
      let response;
      
      // Use WebSocket if connected, otherwise fall back to REST API
      if (useWebSocketMode && isConnected) {
        console.log("Triggering conclusion via WebSocket...");
        response = await sendInterviewMessageWS(
          "continue",
          "[TIME WARNING: 5 minutes remaining. Please conclude the interview.]",
          messages.map(m => ({ role: m.role, content: m.content })),
          true // is_conclusion
        );
      } else {
        console.log("Triggering conclusion via REST API...");
        // Get the names of selected interviewers to pass to the AI
        const selectedPanelists = selectedInterviewers
          .map(id => {
            const interviewer = INTERVIEWERS.find(i => i.id === id);
            return interviewer ? { id: interviewer.id, name: interviewer.name, role: interviewer.role, title: interviewer.title } : null;
          })
          .filter((p): p is { id: string; name: string; role: string; title: string } => p !== null);
        
        // Send a conclusion request to the AI
        response = await aiApi.conductInterview({
          mode: "continue",
          persona,
          interview_type: interviewType,
          user_answer: "[TIME WARNING: 5 minutes remaining. Please conclude the interview.]",
          history: messages.map(m => ({ role: m.role, content: m.content })),
          selected_panelists: selectedPanelists,
          is_conclusion: true
        });
      }

      if (response.success && response.data) {
        // Handle both direct speech field and nested transcription field
        const aiMessage = (response.data.speech as string) || (response.data.transcription as string) || "";
        
        if (!aiMessage) {
          console.error("No speech content in conclusion response:", response.data);
          setLastError("AI conclusion response missing speech content");
          setIsLoading(false);
          startRecording();
          return;
        }
        
        const speakerId = (response.data.speaker_id as string) || selectedInterviewers[0] || "sarah";
        const speakerName = (response.data.speaker_name as string) || INTERVIEWERS.find(i => i.id === speakerId)?.name || "AI";
        
        // Update messages
        addMessage("assistant", aiMessage);
        setActiveSpeakerId(speakerId);
        setCaptionSpeaker(speakerName);
        
        setIsLoading(false);
        
        // Speak the conclusion
        if (useAzure) {
          const tokenData = await getAzureToken();
          if (tokenData) {
            speakAzure(aiMessage, speakerId, tokenData.token, tokenData.region);
          } else {
            speakNative(aiMessage, speakerId);
          }
        } else {
          speakNative(aiMessage, speakerId);
        }
      } else {
        throw new Error("Failed to get conclusion from AI");
      }
    } catch (error) {
      console.error("Error triggering conclusion:", error);
      setIsLoading(false);
      setLastError("Failed to get conclusion from AI");
      startRecording();
    }
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = (): string => {
    if (timeRemaining <= 60) return "text-red-500"; // Last minute - red
    if (timeRemaining <= 300) return "text-amber-500"; // Last 5 minutes - amber
    return "text-white"; // Normal - white
  };

  // Page leave warning (like Google Meet)
  useEffect(() => {
    if (hasStarted) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "You are in an active interview session. Are you sure you want to leave?";
        return e.returnValue;
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [hasStarted]);

  // Handle end interview with confirmation
  const handleEndInterview = () => {
    setShowEndConfirmation(true);
  };

  // Confirm end interview
  const confirmEndInterview = () => {
    setShowEndConfirmation(false);
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Stop recording
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors
      }
    }
    setIsRecording(false);
    
    // Stop any ongoing speech (don't restart recording)
    stopSpeaking(false);
    
    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore errors
      }
    }
    
    // Close the session
    onClose();
  };

  const stopSpeaking = useCallback((shouldRestartRecording: boolean = true) => {
    try {
        // Set flag to indicate this is an intentional stop (not an error)
        isIntentionalStopRef.current = true;
        
        // Cancel native speech synthesis
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
        }
        
        // Stop audio element if playing
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.currentTime = 0;
            audioElementRef.current.src = '';
        }
        
        // Close Azure synthesizer safely
        if (azureSynthesizerRef.current) {
            const synth = azureSynthesizerRef.current;
            azureSynthesizerRef.current = null; // Clear ref first to prevent double-close
            try {
                synth.close();
            } catch {
                // Synthesizer already disposed, ignore
                console.debug("Synthesizer already disposed during stopSpeaking");
            }
        }
        
        // Clear typewriter interval
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        
        // Clear caption interval
        if (captionIntervalRef.current) {
            clearInterval(captionIntervalRef.current);
            captionIntervalRef.current = null;
        }
        
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsLoading(false);
        setCaptionText("");
        
        // Reset the intentional stop flag after a short delay
        setTimeout(() => {
            isIntentionalStopRef.current = false;
        }, 100);
        
        // Start recording after a short delay (only if requested)
        if (shouldRestartRecording) {
            setTimeout(() => {
                if (!isRecording && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                        setIsRecording(true);
                    } catch {
                        // Ignore start errors (may already be running)
                    }
                }
            }, 300);
        }
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setLastError(errorMessage);
    }
  }, [isRecording]);

  // Initialize Audio & Speech
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext);
      
      try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const windowWithWebkit = window as any;
          const AudioContextClass = windowWithWebkit.AudioContext || windowWithWebkit.webkitAudioContext;
          if (AudioContextClass) {
              const ctx = new AudioContextClass();
              audioContextRef.current = ctx;
              setAudioContextState(ctx.state);
              
              ctx.onstatechange = () => {
                  setAudioContextState(ctx.state || "unknown");
              };
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SpeechRecognition = windowWithWebkit.SpeechRecognition || windowWithWebkit.webkitSpeechRecognition;
          if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
              let interimTranscript = "";
              let hasFinalResult = false;
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  setTranscript((prev) => prev + " " + event.results[i][0].transcript);
                  hasFinalResult = true;
                } else {
                  interimTranscript += event.results[i][0].transcript;
                }
              }
              
              const currentText = interimTranscript || transcript;
              if (currentText.trim()) {
                  setCaptionSpeaker("You");
                  setCaptionText(currentText);
              }
              
              // Track last speech time for auto-send
              lastSpeechTimeRef.current = Date.now();
              
              // Clear existing silence timer
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
              
              // Start silence detection timer after final result (auto-send after 1 second of silence)
              if (hasFinalResult) {
                silenceTimerRef.current = setTimeout(() => {
                  // Check if we have transcript and not currently speaking/loading
                  setTranscript((currentTranscript) => {
                    if (currentTranscript.trim() && !isSpeakingRef.current && !isLoading) {
                      console.log("Auto-sending after silence detected, transcript:", currentTranscript.trim().substring(0, 50) + "...");
                      // Trigger send - we need to call handleSendResponse
                      // Use a custom event to trigger the send
                      window.dispatchEvent(new CustomEvent('interview-auto-send'));
                    }
                    return currentTranscript;
                  });
                }, 1000); // 1 second of silence for faster response
              }

              // Barge-in Check (Grace period 3s, min length 10 characters)
              // This allows the user to interrupt the AI by speaking clearly
              if (isSpeakingRef.current && (interimTranscript.trim().length > 10) && (Date.now() - speechStartTimeRef.current > 3000)) {
                  console.log("Barge-in detected - user is speaking");
                  stopSpeaking();
              }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onerror = (event: any) => {
              // Only log critical errors, ignore common ones like 'aborted' and 'no-speech'
              if (event.error === 'not-allowed') {
                console.error("Mic Error", event.error);
                setLastError(`Mic Error: ${event.error}`);
                toast.error("Microphone access denied.");
                setIsRecording(false);
              } else if (event.error === 'network') {
                console.error("Mic Error", event.error);
                setLastError(`Mic Error: ${event.error}`);
              } else {
                // 'aborted', 'no-speech', 'audio-capture' are common and not critical
                console.log("Speech recognition event:", event.error);
              }
            };
            
            // Handle recognition end - restart if needed
            recognitionRef.current.onend = () => {
              console.log("Speech recognition ended, isRecording:", isRecordingRef.current, "isSpeaking:", isSpeakingRef.current);
              // Only restart if we're supposed to be recording and not speaking
              if (isRecordingRef.current && !isSpeakingRef.current) {
                console.log("Restarting speech recognition...");
                // Add a small delay to avoid race conditions
                setTimeout(() => {
                  if (isRecordingRef.current && !isSpeakingRef.current && recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {
                      // Ignore - recognition may already be running
                      console.debug("Recognition restart skipped:", e);
                    }
                  }
                }, 100);
              }
            };
          }

          synthesisRef.current = window.speechSynthesis;
      } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          setLastError(`Init Error: ${errorMessage}`);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      if (synthesisRef.current) {
        try { synthesisRef.current.cancel(); } catch { /* ignore */ }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch { /* ignore */ }
      }
      if (azureSynthesizerRef.current) {
        const synth = azureSynthesizerRef.current;
        azureSynthesizerRef.current = null;
        try { synth.close(); } catch { /* ignore - already disposed */ }
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isSpeaking, transcript, stopSpeaking]);

  // Volume Meter Logic
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRecording && audioContextRef.current) {
          interval = setInterval(() => {
              if (analyserRef.current) {
                  const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                  analyserRef.current.getByteFrequencyData(dataArray);
                  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                  setVolume(average);
              }
          }, 100);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  // Silence Detection
  useEffect(() => {
    if (!isRecording || !transcript.trim() || isSpeaking) return;
    const timer = setTimeout(() => {
        handleSendResponse();
    }, 3000); 
    return () => clearTimeout(timer);
  }, [transcript, isRecording, isSpeaking]);

  const toggleInterviewer = (id: string) => {
    setSelectedInterviewers(prev => {
      if (prev.includes(id)) {
        // Don't allow deselecting if it's the only one selected
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter(i => i !== id);
      } else {
        // Allow selecting up to 3 interviewers
        if (prev.length >= 3) {
          toast.error("Maximum 3 interviewers allowed");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Function to get a fresh Azure token (tokens expire after 10 minutes)
  const getAzureToken = useCallback(async (): Promise<{ token: string; region: string } | null> => {
    const now = Date.now();
    // Refresh token if it's expired or will expire in the next minute
    if (azureToken && azureRegion && tokenExpiry > now + 60000) {
      return { token: azureToken, region: azureRegion };
    }

    try {
      const res = await apiClient.post('/llm/speech-token');
      const { token, region } = res.data;
      setAzureToken(token);
      setAzureRegion(region);
      // Azure tokens expire after 10 minutes, set expiry to 9 minutes from now
      setTokenExpiry(now + 9 * 60 * 1000);
      return { token, region };
    } catch (err) {
      console.error("Failed to get Azure token:", err);
      setLastError("Failed to get Azure speech token");
      return null;
    }
  }, [azureToken, azureRegion, tokenExpiry]);

  const setupMicrophone = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          if (audioContextRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              const analyser = audioContextRef.current.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              analyserRef.current = analyser;
          }
          return true;
      } catch (e: unknown) {
          console.error("Mic Setup Error", e);
          const errorMessage = e instanceof Error ? e.message : 'Permission denied';
          setLastError(`Microphone Error: ${errorMessage}`);
          return false;
      }
  };

  const handleStartSession = async () => {
    // Start joining animation
    setIsJoiningMeeting(true);
    setJoinProgress("Setting up microphone...");
    
    const micOk = await setupMicrophone();
    if (!micOk) {
        toast.error("Please allow microphone access to proceed.");
        setIsJoiningMeeting(false);
        return;
    }

    setJoinProgress("Initializing audio...");
    if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
        setAudioContextState("running");
    }
    
    // Create audio element for Azure speech output
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.autoplay = true;
    }
    
    // Set the timer based on selected duration
    setTimeRemaining(interviewDuration * 60);
    setHasWarned5Min(false);
    setIsTimeUp(false);
    
    if (useAzure) {
        setJoinProgress("Connecting to Azure Speech Services...");
        const tokenData = await getAzureToken();
        if (tokenData) {
            setJoinProgress("Joining interview room...");
            // Small delay to show the final progress message
            await new Promise(resolve => setTimeout(resolve, 500));
            setIsJoiningMeeting(false);
            setHasStarted(true);
            startInterview(tokenData.token, tokenData.region);
        } else {
            console.warn("Failed to get Azure token, falling back to native speech");
            setUseAzure(false);
            setJoinProgress("Using browser speech...");
            await new Promise(resolve => setTimeout(resolve, 300));
            setIsJoiningMeeting(false);
            setHasStarted(true);
            startInterview();
        }
    } else {
        setJoinProgress("Joining interview room...");
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsJoiningMeeting(false);
        setHasStarted(true);
        startInterview();
    }
  };

  const testAudio = async () => {
      // Prevent multiple simultaneous tests
      if (isSpeaking) {
        console.log("Already speaking, ignoring test request");
        return;
      }
      
      setIsLoading(true);
      
      try {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // Create audio element if not exists
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
          audioElementRef.current.autoplay = true;
        }
        
        if (useAzure) {
            // Wait for token with a small delay to ensure it's ready
            const tokenData = await getAzureToken();
            if (tokenData) {
                await speakAzure("This is a test of the Azure neural voice. Can you hear me clearly?", "sarah", tokenData.token, tokenData.region);
            } else {
                toast.error("Failed to get Azure token, using browser voice");
                speakNative("This is a test of the browser voice system.", "sarah");
            }
        } else {
            speakNative("This is a test of the browser voice system. Can you hear me clearly?", "sarah");
        }
      } catch (error) {
        console.error("Test audio error:", error);
        setIsLoading(false);
        toast.error("Audio test failed");
      }
  };

  const startTypewriter = (text: string) => {
      setStreamedResponse("");
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      let i = 0;
      typingIntervalRef.current = setInterval(() => {
          if (i < text.length) {
              setStreamedResponse(prev => prev + text.charAt(i));
              i++;
          } else {
              if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          }
      }, 40); 
  };

  const startInterview = async (token?: string, region?: string) => {
    setIsLoading(true);
    try {
      let response;
      
      // Use WebSocket if connected, otherwise fall back to REST API
      if (useWebSocketMode && isConnected) {
        console.log("Starting interview via WebSocket...");
        response = await sendInterviewMessageWS("start");
      } else {
        console.log("Starting interview via REST API...");
        // Get the names of selected interviewers to pass to the AI
        const selectedPanelists = selectedInterviewers
          .map(id => {
            const interviewer = INTERVIEWERS.find(i => i.id === id);
            return interviewer ? { id: interviewer.id, name: interviewer.name, role: interviewer.role, title: interviewer.title } : null;
          })
          .filter((p): p is { id: string; name: string; role: string; title: string } => p !== null);
        
        response = await aiApi.conductInterview({
          mode: "start",
          persona,
          interview_type: interviewType,
          selected_panelists: selectedPanelists,
        });
      }

      if (response.success && response.data) {
        // Handle both direct speech field and nested transcription field
        const aiMessage = (response.data.speech as string) || (response.data.transcription as string) || "";
        
        if (!aiMessage) {
          console.error("No speech content in response:", response.data);
          setLastError("AI response missing speech content");
          setIsLoading(false);
          return;
        }
        
        addMessage("assistant", aiMessage);
        
        // Use speaker_id from AI response, fallback to first selected interviewer
        const speakerId = (response.data.speaker_id as string) || selectedInterviewers[0] || "sarah";
        const speakerName = (response.data.speaker_name as string) || INTERVIEWERS.find(i => i.id === speakerId)?.name || "AI";
        console.log("AI selected speaker:", speakerId, "speaker_name:", speakerName);
        setActiveSpeakerId(speakerId);
        setCaptionSpeaker(speakerName);
        startTypewriter(aiMessage);
        
        if (useAzure || (token && region)) {
            speakAzure(aiMessage, speakerId, token, region);
        } else {
            speakNative(aiMessage, speakerId);
        }
      } else {
        console.error("Interview response failed or missing data:", response);
        setLastError("Failed to get interview response");
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(`Start Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    // Use ref to check speaking state since this may be called from a callback
    // where state hasn't updated yet
    if (recognitionRef.current && !isSpeakingRef.current) {
      try {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscript(""); 
        setCaptionText("");
        console.log("Speech recognition started successfully");
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    } else {
      console.warn("Cannot start recording: recognitionRef not available or isSpeaking. isSpeakingRef:", isSpeakingRef.current);
    }
  };

  const stopRecording = () => {
    console.log("Stopping speech recognition...");
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
        console.log("Speech recognition stopped");
      } catch(e) {
        console.error("Error stopping recognition:", e);
      }
      setIsRecording(false);
    }
  };

  const handleSendResponse = async () => {
    if (!transcript.trim()) return;
    stopRecording();

    const userMessage = transcript;
    addMessage("user", userMessage);
    setTranscript("");
    setIsLoading(true);

    try {
      let response;
      
      // Use WebSocket if connected, otherwise fall back to REST API
      if (useWebSocketMode && isConnected) {
        console.log("Sending response via WebSocket...");
        response = await sendInterviewMessageWS(
          "continue",
          userMessage,
          messages.map(m => ({ role: m.role, content: m.content }))
        );
      } else {
        console.log("Sending response via REST API...");
        // Get the names of selected interviewers to pass to the AI
        const selectedPanelists = selectedInterviewers
          .map(id => {
            const interviewer = INTERVIEWERS.find(i => i.id === id);
            return interviewer ? { id: interviewer.id, name: interviewer.name, role: interviewer.role, title: interviewer.title } : null;
          })
          .filter((p): p is { id: string; name: string; role: string; title: string } => p !== null);
        
        response = await aiApi.conductInterview({
          mode: "continue",
          persona,
          interview_type: interviewType,
          user_answer: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          selected_panelists: selectedPanelists,
        });
      }

      if (response.success && response.data) {
        // Handle both direct speech field and nested transcription field
        const aiMessage = (response.data.speech as string) || (response.data.transcription as string) || "";
        
        if (!aiMessage) {
          console.error("No speech content in response:", response.data);
          setLastError("AI response missing speech content");
          setIsLoading(false);
          startRecording();
          return;
        }
        
        addMessage("assistant", aiMessage);
        
        // Use speaker_id from AI response, but VALIDATE it's one of the selected panelists
        let speakerId = (response.data.speaker_id as string) || activeSpeakerId;
        
        // Validate speaker_id is in selected panelists - if not, use the first selected panelist
        if (!selectedInterviewers.includes(speakerId)) {
          console.warn(`AI returned invalid speaker_id "${speakerId}" - not in selected panelists. Using first selected panelist.`);
          speakerId = selectedInterviewers[0] || "sarah";
        }
        
        const speakerName = (response.data.speaker_name as string) || INTERVIEWERS.find(i => i.id === speakerId)?.name || "AI";
        console.log("AI selected speaker:", speakerId, "speaker_name:", speakerName, "selected panelists:", selectedInterviewers);
        setActiveSpeakerId(speakerId);
        setCaptionSpeaker(speakerName);
        
        startTypewriter(aiMessage);
        
        if (useAzure) {
            // Get fresh token before speaking
            const tokenData = await getAzureToken();
            if (tokenData) {
                speakAzure(aiMessage, speakerId, tokenData.token, tokenData.region);
            } else {
                speakNative(aiMessage, speakerId);
            }
        } else {
            speakNative(aiMessage, speakerId);
        }
      } else {
        console.error("Interview response failed or missing data:", response);
        setLastError("Failed to get interview response");
        setIsLoading(false);
        startRecording();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(`API Error: ${errorMessage}`);
      setIsLoading(false);
      startRecording();
    }
  };

  // Subtitle-style caption display - shows words one by one
  const startSubtitleCaption = (text: string, speakerName: string, durationMs: number) => {
      // Guard against undefined or empty text
      if (!text || typeof text !== 'string') {
          console.warn("startSubtitleCaption called with invalid text:", text);
          return null;
      }
      const words = text.split(' ');
      if (words.length === 0) {
          console.warn("startSubtitleCaption called with empty text");
          return null;
      }
      const wordDuration = durationMs / words.length;
      let currentIndex = 0;
      
      setCaptionSpeaker(speakerName);
      setCaptionText('');
      
      const interval = setInterval(() => {
          if (currentIndex < words.length) {
              // Show last 8 words for subtitle effect
              const startIdx = Math.max(0, currentIndex - 7);
              const visibleWords = words.slice(startIdx, currentIndex + 1).join(' ');
              setCaptionText(visibleWords);
              currentIndex++;
          } else {
              clearInterval(interval);
          }
      }, wordDuration);
      
      return interval;
  };

  const speakAzure = (text: string, speakerId: string, directToken?: string, directRegion?: string): Promise<void> => {
      return new Promise(async (resolve) => {
          console.log("speakAzure called with:", { speakerId, textLength: text?.length, hasDirectToken: !!directToken });
          
          // Guard against undefined text
          if (!text || typeof text !== 'string') {
              console.warn("speakAzure called with invalid text:", text);
              resolve();
              return;
          }
          
          const interviewer = INTERVIEWERS.find(i => i.id === speakerId);
          const speakerName = interviewer?.name || "AI";
          const voiceName = VOICE_MAP[speakerId] || "en-US-JennyNeural";
          
          console.log("Using voice:", voiceName, "for speaker:", speakerName);

          const token = directToken || azureToken;
          const region = directRegion || azureRegion;

          if (!token || !region) {
              console.warn("No Azure token/region available, falling back to native speech. Token:", !!token, "Region:", region);
              speakNative(text, speakerId);
              resolve();
              return;
          }

          console.log("Azure token available, region:", region);

          // Stop recording while speaking to avoid feedback
          stopRecording();
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          speechStartTimeRef.current = Date.now();
          
          // Start showing captions immediately (estimate ~150 words per minute = 400ms per word)
          const estimatedDurationMs = text.split(' ').length * 400;
          setCaptionSpeaker(speakerName);
          setCaptionText("");
          const captionInterval = startSubtitleCaption(text, speakerName, estimatedDurationMs);
          captionIntervalRef.current = captionInterval;

          // Track if we've already handled completion
          let hasCompleted = false;
          
          const handleCompletion = () => {
              if (hasCompleted) return;
              hasCompleted = true;
              
              console.log("Audio playback completed, cleaning up");
              
              if (captionIntervalRef.current) {
                  clearInterval(captionIntervalRef.current);
                  captionIntervalRef.current = null;
              }
              
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              setIsLoading(false);
              setCaptionText("");
              
              // Start recording after a short delay to ensure audio has fully stopped
              console.log("Audio playback ended, starting recording in 500ms...");
              setTimeout(() => {
                  console.log("Attempting to start recording now, isSpeakingRef:", isSpeakingRef.current);
                  startRecording();
              }, 500);
              
              resolve();
          };

          try {
              // Use Azure REST API instead of SDK for more reliable synthesis
              // This avoids WebSocket state issues that occur with the SDK
              const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
              
              // Build SSML for the request
              const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
                  <voice name='${voiceName}'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</voice>
              </speak>`;
              
              console.log("Starting Azure REST API synthesis for", text.split(' ').length, "words");
              
              // Create an AbortController for timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                  controller.abort();
              }, 15000); // 15 second timeout
              
              // Store controller reference so we can abort on barge-in
              azureSynthesizerRef.current = { abort: () => controller.abort() };
              
              const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/ssml+xml',
                      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                      'User-Agent': 'ScholarHunter'
                  },
                  body: ssml,
                  signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                  throw new Error(`Azure TTS API error: ${response.status} ${response.statusText}`);
              }
              
              console.log("Azure REST API synthesis completed, getting audio data");
              
              const audioData = await response.arrayBuffer();
              console.log("Audio data received, length:", audioData.byteLength);
              
              // Create a blob from the audio data and play it
              const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
              const audioUrl = URL.createObjectURL(audioBlob);
              
              // Create or reuse audio element
              if (!audioElementRef.current) {
                  audioElementRef.current = new Audio();
              }
              
              const audio = audioElementRef.current;
              audio.src = audioUrl;
              audio.volume = isMuted ? 0 : 1;
              
              // Handle audio end
              audio.onended = () => {
                  console.log("Audio playback ended");
                  URL.revokeObjectURL(audioUrl);
                  azureSynthesizerRef.current = null;
                  handleCompletion();
              };
              
              audio.onerror = (e) => {
                  // Check if this was an intentional stop (barge-in)
                  if (isIntentionalStopRef.current) {
                      console.log("Audio stopped intentionally (barge-in), not an error");
                      URL.revokeObjectURL(audioUrl);
                      return; // Don't do anything, stopSpeaking already handled cleanup
                  }
                  
                  console.error("Audio playback error:", e);
                  URL.revokeObjectURL(audioUrl);
                  azureSynthesizerRef.current = null;
                  // Fallback to native speech on actual error (not barge-in)
                  speakNative(text, speakerId);
                  handleCompletion();
              };
              
              // Update captions to use actual audio duration once loaded
              audio.onloadedmetadata = () => {
                  const actualDurationMs = audio.duration * 1000;
                  console.log("Actual audio duration:", actualDurationMs, "ms");
                  // Restart captions with actual duration
                  if (captionIntervalRef.current) {
                      clearInterval(captionIntervalRef.current);
                  }
                  const newCaptionInterval = startSubtitleCaption(text, speakerName, actualDurationMs);
                  captionIntervalRef.current = newCaptionInterval;
              };
              
              // Start playing
              audio.play().then(() => {
                  console.log("Audio playback started successfully");
              }).catch((e) => {
                  // Check if this was an intentional stop (barge-in)
                  if (isIntentionalStopRef.current) {
                      console.log("Audio play interrupted (barge-in), not an error");
                      return;
                  }
                  console.error("Failed to play audio:", e);
                  // Fallback to native speech on actual error
                  speakNative(text, speakerId);
                  handleCompletion();
              });
              
          } catch (error) {
              // Check if this was an abort (timeout or barge-in)
              if (error instanceof Error && error.name === 'AbortError') {
                  if (isIntentionalStopRef.current) {
                      console.log("Azure synthesis aborted (barge-in)");
                      return;
                  }
                  console.warn("Azure synthesis timed out after 15 seconds, falling back to native speech");
              } else {
                  console.error("Azure REST API error:", error);
                  setLastError(`Azure TTS Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              
              azureSynthesizerRef.current = null;
              // Fallback to native speech
              speakNative(text, speakerId);
              handleCompletion();
          }
      });
  };


  const speakNative = (text: string, speakerId: string, retryCount = 0) => {
    const speakerName = INTERVIEWERS.find(i => i.id === speakerId)?.name || "AI";
    setCaptionSpeaker(speakerName);
    setCaptionText(text);

    if (!synthesisRef.current) {
      console.error("Speech synthesis not available");
      setIsLoading(false);
      startRecording();
      return;
    }
    
    const voices = synthesisRef.current.getVoices();
    if (voices.length === 0 && retryCount < 5) {
        setTimeout(() => speakNative(text, speakerId, retryCount + 1), 200);
        return;
    }

    // Stop recording while speaking to avoid feedback
    stopRecording();
    setIsSpeaking(true);
    speechStartTimeRef.current = Date.now();
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Better voice selection based on speaker
    let selectedVoice: SpeechSynthesisVoice | null = null;
    if (speakerId === "michael") {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes("male") || 
        v.name.includes("David") || 
        v.name.includes("Guy") ||
        v.name.includes("Mark")
      ) || null;
    } else {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes("female") || 
        v.name.includes("Samantha") ||
        v.name.includes("Jenny") ||
        v.name.includes("Aria") ||
        v.name.includes("Sara")
      ) || null;
    }
    
    utterance.voice = selectedVoice || (voices.length > 0 ? voices[0] : null);
    utterance.rate = 1.0; 
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      console.log("Native speech synthesis completed");
      // Update ref immediately before state
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsLoading(false);
      setCaptionText("");
      // Start recording after speech completes
      console.log("Native speech complete, starting recording in 300ms...");
      setTimeout(() => {
        console.log("Attempting to start recording now, isSpeakingRef:", isSpeakingRef.current);
        startRecording();
      }, 300);
    };
    utterance.onerror = (event) => {
        console.error("Native speech synthesis error:", event);
        // Update ref immediately before state
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsLoading(false);
        setCaptionText("");
        // Start recording after error
        setTimeout(() => {
          startRecording();
        }, 300);
    };
    
    synthesisRef.current.speak(utterance);
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  // Show joining meeting animation
  if (isJoiningMeeting) {
      return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="text-center space-y-8">
                {/* Animated circles */}
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 rounded-full border-4 border-primary/50 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></div>
                    <div className="absolute inset-4 rounded-full border-4 border-primary/70 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.4s' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mic className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Joining Interview Room</h2>
                    <p className="text-muted-foreground animate-pulse">{joinProgress}</p>
                </div>
                
                {/* Selected panelists preview */}
                <div className="flex justify-center gap-4">
                    {selectedInterviewers.map((id, index) => {
                        const interviewer = INTERVIEWERS.find(i => i.id === id);
                        if (!interviewer) return null;
                        return (
                            <div
                                key={id}
                                className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 animate-bounce"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <img src={interviewer.image} alt={interviewer.name} className="w-full h-full object-cover" />
                            </div>
                        );
                    })}
                </div>
                
                <p className="text-xs text-muted-foreground">
                    {selectedInterviewers.length} panelist{selectedInterviewers.length > 1 ? 's' : ''} joining...
                </p>
            </div>
        </div>
      );
  }

  if (!hasStarted) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full bg-background/95 border-primary/20 shadow-2xl overflow-hidden">
                <CardContent className="p-8 text-center space-y-8">
                    {!isSecure && (
                        <div className="bg-amber-500/10 border border-amber-500/50 p-3 rounded-lg flex items-center gap-3 text-amber-200 text-sm text-left">
                            <ShieldAlert className="shrink-0" />
                            <p>Warning: Browser is not in a secure context (HTTPS). Microphone may not work.</p>
                        </div>
                    )}
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Assemble Your Panel</h2>
                        <p className="text-muted-foreground">Select up to 3 interviewers for your session.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {INTERVIEWERS.map((interviewer) => (
                            <div key={interviewer.id} className={`relative cursor-pointer group rounded-xl p-4 border-2 transition-all ${selectedInterviewers.includes(interviewer.id) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`} onClick={() => toggleInterviewer(interviewer.id)}>
                                <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-2 border-border mb-3 group-hover:scale-105"><img src={interviewer.image} alt={interviewer.name} className="w-full h-full object-cover" /></div>
                                <h3 className="font-bold text-sm">{interviewer.name}</h3>
                                <p className="text-xs text-muted-foreground">{interviewer.role}</p>
                                <p className="text-[10px] text-muted-foreground/70">{interviewer.title}</p>
                                {selectedInterviewers.includes(interviewer.id) && <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                            </div>
                        ))}
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg text-left space-y-4">
                        {/* Interview Duration Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Timer className="w-4 h-4" /> Interview Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[5, 10, 15, 30].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => {
                                            setInterviewDuration(mins);
                                            setTimeRemaining(mins * 60);
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            interviewDuration === mins
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted hover:bg-muted/80"
                                        }`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[45, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => {
                                            setInterviewDuration(mins);
                                            setTimeRemaining(mins * 60);
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            interviewDuration === mins
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted hover:bg-muted/80"
                                        }`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The interview will conclude with advice at 5 minutes remaining.
                            </p>
                        </div>
                        
                        <div className="border-t border-border pt-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2"><Settings className="w-4 h-4" /> Use Azure Neural Voice</label>
                                <input type="checkbox" checked={useAzure} onChange={(e) => setUseAzure(e.target.checked)} className="toggle" />
                            </div>
                            {useAzure && (
                                <div className="text-xs text-green-400 mt-1">
                                    Azure Key Configured on Backend
                                </div>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={testAudio} className="w-full"><Volume2 className="mr-2 h-4 w-4" /> Test Audio</Button>
                    </div>
                    <Button size="lg" className="w-full rounded-full h-12 text-lg shadow-lg" onClick={handleStartSession}><Play className="mr-2 h-5 w-5 fill-current" /> Start Interview</Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                </CardContent>
            </Card>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col">
      {/* End Interview Confirmation Modal */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">End Interview?</DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to end this interview session? Your conversation history will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndConfirmation(false)} className="border-white/20 text-white hover:bg-white/10">
              Continue Interview
            </Button>
            <Button variant="destructive" onClick={confirmEndInterview}>
              <PhoneOff className="h-4 w-4 mr-2" />
              End Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="bg-background/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 text-white">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-sm font-medium">{interviewType}</span>
            </div>
            {lastError && <div className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50 text-red-200 text-[10px] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {lastError}</div>}
        </div>
        
        {/* Timer Display */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
            <div className={`bg-background/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 ${getTimerColor()}`}>
                <Timer className="h-4 w-4" />
                <span className="text-lg font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
            {timeRemaining <= 300 && timeRemaining > 0 && (
                <span className="text-amber-400 text-xs animate-pulse">Time running low!</span>
            )}
            {isTimeUp && (
                <span className="text-red-400 text-xs font-bold">Time&apos;s up!</span>
            )}
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="icon" className="rounded-full bg-background/20 backdrop-blur-md border-white/10 text-white" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</Button>
            <Button variant="destructive" size="icon" className="rounded-full" onClick={handleEndInterview}>
                <PhoneOff className="h-5 w-5" />
            </Button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        <div className={`flex-1 relative ${selectedInterviewers.length === 1 ? "flex items-center justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 items-center justify-center h-full"}`}>
            {selectedInterviewers.map((id) => {
                const interviewer = INTERVIEWERS.find(i => i.id === id);
                const isActive = activeSpeakerId === id && isSpeaking;
                if (!interviewer) return null;
                return (
                    <div key={id} className={`relative transition-all duration-500 ${selectedInterviewers.length === 1 ? "w-full h-full flex items-center justify-center" : "w-full h-[300px] md:h-[400px] bg-black/20 rounded-3xl border border-white/5 overflow-hidden"}`}>
                        {selectedInterviewers.length === 1 && <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110" style={{ backgroundImage: `url(${interviewer.image})` }}></div>}
                        <div className={`relative z-10 ${selectedInterviewers.length === 1 ? "w-72 h-72 md:w-96 md:h-96" : "w-40 h-40 md:w-56 md:h-56 mx-auto mt-10 md:mt-20"}`}>
                            <div className={`relative w-full h-full rounded-full p-1 ${isActive ? "bg-gradient-to-tr from-green-400 to-primary shadow-2xl scale-105" : "bg-gradient-to-tr from-white/10 to-white/5"}`}>
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-black/50 relative"><img src={interviewer.image} alt={interviewer.name} className="w-full h-full object-cover" />{isActive && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}</div>
                                {isActive && <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping"></div>}
                            </div>
                            <div className="mt-4 text-center"><h3 className="text-white text-lg font-medium drop-shadow-md flex items-center justify-center gap-2">{interviewer.name} {isActive && <Mic className="h-4 w-4 text-green-400" />}</h3><p className="text-white/60 text-xs">{isActive ? "Speaking..." : interviewer.role}</p></div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className={`absolute bottom-24 left-0 right-0 flex flex-col items-center pointer-events-none transition-opacity duration-300 ${captionText ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-black/70 backdrop-blur-md px-6 py-4 rounded-2xl max-w-2xl text-center border border-white/10 shadow-2xl"><p className="text-primary text-[10px] font-bold uppercase mb-1">{captionSpeaker}</p><p className="text-white text-lg font-medium leading-relaxed">{captionText}</p></div>
            {captionSpeaker === "You" && <div className="mt-2 h-1 bg-white/20 w-32 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-100" style={{ width: `${Math.min(volume * 2, 100)}%` }}></div></div>}
        </div>

        <div className="absolute bottom-24 right-6 pointer-events-auto">
             <Button variant="secondary" size="icon" className="rounded-full w-12 h-12 shadow-xl bg-white/10 hover:bg-white/20 border border-white/5" onClick={() => setIsChatOpen(true)}><MessageSquare className="h-6 w-6 text-white" /></Button>
        </div>

        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="bg-black/90 backdrop-blur-xl border-l-white/10 text-white w-full sm:w-[400px] flex flex-col">
                <SheetHeader><SheetTitle className="text-white">History</SheetTitle></SheetHeader>
                <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                    {messages.map((msg, idx) => {
                        const isLast = idx === messages.length - 1;
                        const content = (isLast && msg.role === 'assistant' && isSpeaking) 
                            ? streamedResponse 
                            : msg.content;

                        return (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm border border-white/5"}`}><p className="text-[10px] opacity-50 mb-1 font-bold">{msg.role === 'user' ? 'You' : 'Panel'}</p>{content}{isLast && msg.role === 'assistant' && isSpeaking && <span className="inline-block w-1.5 h-3 ml-1 bg-white/70 animate-pulse align-middle"></span>}</div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>
            </SheetContent>
        </Sheet>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center gap-4 pb-4 z-20">
         <div className={`p-4 rounded-full transition-all duration-500 ${isRecording ? "bg-red-500/20 border border-red-500/50 scale-110" : "bg-white/5 border border-white/10"}`}>
             {isRecording ? <Mic className="h-6 w-6 text-red-500 animate-pulse" /> : <MicOff className="h-6 w-6 text-white/30" />}
         </div>
         {/* Send button - visible when there's transcript and not speaking */}
         <Button 
           variant="default" 
           size="lg" 
           className={`rounded-full px-6 h-12 shadow-lg transition-all duration-300 ${
             transcript.trim() && !isSpeaking && !isLoading 
               ? "bg-green-600 hover:bg-green-700 scale-100 opacity-100" 
               : "bg-green-600/30 scale-95 opacity-50 cursor-not-allowed"
           }`}
           onClick={handleSendResponse}
           disabled={!transcript.trim() || isSpeaking || isLoading}
         >
           <Send className="mr-2 h-5 w-5" /> Send Response
         </Button>
         <Button variant="destructive" size="lg" className="rounded-full px-6 h-12 shadow-lg shadow-red-900/20 hover:bg-red-600" onClick={handleEndInterview}><PhoneOff className="mr-2 h-5 w-5" /> End</Button>
         <Button variant="secondary" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5"><MoreVertical className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
