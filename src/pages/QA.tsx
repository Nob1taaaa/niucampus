import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, Sparkles, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { moderateContent } from "@/lib/moderation";
import ReactMarkdown from "react-markdown";

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const QAPage = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => !!SpeechRecognition);
  const lastSentRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const COOLDOWN_MS = 3000;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const toggleVoice = useCallback(() => {
    if (!voiceSupported) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition. Try Chrome or Edge.", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
      } else if (event.error !== "aborted") {
        toast({ title: "Voice error", description: "Could not recognize speech. Please try again." });
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isListening, voiceSupported, toast]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) {
      toast({ title: "Slow down ⏳", description: "Please wait a few seconds between messages." });
      return;
    }
    lastSentRef.current = now;

    const modResult = await moderateContent(trimmed, "qa");
    if (!modResult.safe) {
      toast({ title: "⚠️ Question not allowed", description: modResult.reason || "Please keep questions appropriate.", variant: "destructive" });
      return;
    }

    const userMessage = { role: "user" as const, content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    const { data, error } = await supabase.functions.invoke<{ assistantMessage: string; remainingToday?: number; dailyLimit?: boolean }>("qa-assistant", { body: { messages: nextMessages } });

    if (error) {
      const errorBody = typeof error === "object" && "message" in error ? error.message : "";
      if (errorBody.includes("Daily limit") || errorBody.includes("daily")) {
        toast({ title: "Daily limit reached 📚", description: "You've used all your questions for today. Come back tomorrow!", variant: "destructive" });
      } else if (errorBody.includes("busy") || errorBody.includes("429")) {
        toast({ title: "AI is busy ⏳", description: "Too many students asking right now. Wait 30 seconds.", variant: "destructive" });
      } else {
        toast({ title: "AI assistant error", description: "Unable to get a response. Try again.", variant: "destructive" });
      }
      setIsSending(false);
      return;
    }

    if (data?.remainingToday !== undefined) setRemainingToday(data.remainingToday);
    const reply = data?.assistantMessage?.trim();
    if (reply) setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setIsSending(false);
  };

  const quickQuestions = [
    "How do I balance DSA practice with semester labs?",
    "Best way to prepare for off-campus placements?",
    "How to start competitive programming?",
    "Tips for managing time during exam season?",
  ];

  return (
    <main className="mx-auto max-w-3xl px-2 pb-20 pt-4 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader
        icon="❓"
        title="Anonymous Q&A"
        subtitle="Ask anything about academics, careers, or campus life. Type or use voice input — the AI gives concise, student-friendly answers."
      />

      <Card className="border-primary/15 bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
        <CardHeader className="px-3 pb-2 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            <span>AI Campus Assistant</span>
            {voiceSupported && (
              <Badge variant="outline" className="ml-auto text-[0.6rem] border-primary/20 bg-primary/5 text-primary gap-1">
                <Mic className="h-2.5 w-2.5" /> Voice ready
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-3 sm:px-6 sm:space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-60 sm:h-72 md:h-80 rounded-xl border border-primary/10 bg-background/50 p-3 sm:p-4">
            <div ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex h-52 sm:h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                    <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ask me anything!</p>
                    <p className="text-[0.7rem] sm:text-xs mt-1 max-w-sm text-muted-foreground/80">
                      Type your question or tap the <Mic className="inline h-3 w-3 text-primary" /> mic button to speak. I help with academics, careers, study tips & more.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-[0.8rem] sm:text-sm leading-relaxed shadow-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary/80 text-secondary-foreground rounded-bl-md border border-primary/5"
                        }`}
                      >
                        <span className={`block text-[0.6rem] sm:text-[0.65rem] font-bold mb-1 ${m.role === "user" ? "opacity-70" : "text-primary/70"}`}>
                          {m.role === "user" ? "You" : "✨ AI Assistant"}
                        </span>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-sm prose-headings:font-bold prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-secondary/80 border border-primary/5 px-4 py-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Voice Listening Indicator */}
          {isListening && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 px-4 py-2.5 animate-pulse">
              <div className="relative">
                <Mic className="h-5 w-5 text-destructive" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-destructive">Listening...</p>
                <p className="text-[0.65rem] text-muted-foreground">Speak your question clearly</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 rounded-full px-3 text-[0.65rem]"
                onClick={toggleVoice}
              >
                <Square className="h-3 w-3 mr-1" /> Stop
              </Button>
            </div>
          )}

          {/* Quick Questions */}
          <div>
            <p className="text-[0.65rem] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
              {messages.length > 0 ? "Ask another question:" : "💡 Frequently asked:"}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[0.65rem] sm:text-xs text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/25 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={isListening ? "🎙️ Listening... speak now" : "Type your question or tap 🎤 to speak..."}
                className="min-h-[60px] sm:min-h-[80px] resize-none rounded-xl pr-12"
                disabled={isListening}
              />
              {/* Mic button inside textarea area */}
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  className={`absolute right-2 bottom-2 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening
                      ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 scale-110"
                      : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[0.6rem] sm:text-xs text-muted-foreground hidden sm:block truncate">
                  Press Enter to send · Shift+Enter for new line
                </p>
                {remainingToday !== null && (
                  <Badge variant="outline" className="text-[0.6rem] border-primary/20 bg-primary/5 text-primary shrink-0">
                    {remainingToday} left today
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                className="h-8 sm:h-9 rounded-full px-4 sm:px-5 text-xs sm:text-sm shrink-0 shadow-sm"
                disabled={isSending || !input.trim()}
                onClick={sendMessage}
              >
                {isSending ? "Thinking..." : "✨ Ask AI"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default QAPage;
