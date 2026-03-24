import { useState, useRef } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { moderateContent } from "@/lib/moderation";

const QAPage = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const lastSentRef = useRef(0);
  const COOLDOWN_MS = 3000; // 3 second cooldown between messages

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    // Client-side cooldown to prevent spam
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) {
      toast({ title: "Slow down ⏳", description: "Please wait a few seconds between messages." });
      return;
    }
    lastSentRef.current = now;

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
        subtitle="Ask anything about academics, careers, or campus life. The AI assistant gives concise, student-friendly answers."
      />

      <Card className="border-primary/15 bg-card/80 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
        <CardHeader className="px-3 pb-2 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground" />
            </div>
            AI Campus Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6 sm:space-y-4">
          <ScrollArea className="h-56 sm:h-72 md:h-80 rounded-xl border border-primary/10 bg-background/50 p-3 sm:p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 sm:gap-3 text-center text-muted-foreground">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/8 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ask me anything!</p>
                  <p className="text-[0.7rem] sm:text-xs mt-1 max-w-sm">I can help with academics, career guidance, campus life, study tips, and more.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[0.8rem] sm:text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary/70 text-secondary-foreground rounded-bl-sm"
                      }`}
                    >
                      <span className="block text-[0.6rem] sm:text-[0.65rem] font-semibold opacity-60 mb-0.5">
                        {m.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-secondary/70 px-3 py-2 sm:px-4 sm:py-2.5 text-[0.8rem] sm:text-sm text-muted-foreground animate-pulse">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Quick questions */}
          <div>
            <p className="text-[0.65rem] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
              {messages.length > 0 ? "Ask another question:" : "Frequently asked:"}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[0.65rem] sm:text-xs text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="space-y-1.5 sm:space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your question here..."
              className="min-h-[60px] sm:min-h-[80px] resize-none text-[0.8rem] sm:text-sm rounded-xl border-primary/15"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[0.6rem] sm:text-xs text-muted-foreground hidden sm:block">Press Enter to send</p>
                {remainingToday !== null && (
                  <Badge variant="outline" className="text-[0.6rem] border-primary/20 bg-primary/5 text-primary">
                    {remainingToday} left today
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                className="h-8 sm:h-9 rounded-full px-4 sm:px-5 text-xs sm:text-sm ml-auto"
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
