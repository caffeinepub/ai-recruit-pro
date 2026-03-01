import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useListJobs } from '../hooks/useQueries';
import { JobStatus } from '../backend';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  'What jobs are open?',
  'How do I apply?',
  'What is the interview process?',
  'How long does hiring take?',
  'How do I check my status?',
];

const FAQ_RESPONSES: Record<string, string> = {
  apply: "To apply for a position, navigate to the **Jobs** page, find a role that matches your skills, and click **View Candidates** to submit your application. Make sure to include your resume and relevant skills.",
  jobs: "FETCH_JOBS",
  open: "FETCH_JOBS",
  interview: "Our interview process typically includes: 1) **Phone Screen** (15-30 min), 2) **Technical/Skills Interview** (1 hr), 3) **Panel Interview** with the team (1-2 hrs), and 4) **Final Decision** within 5 business days.",
  process: "Our hiring process: Application Review → Phone Screen → Technical Assessment → Panel Interview → Offer. Each stage is tracked in our pipeline system.",
  long: "Our average time-to-hire is **14-21 days** from application to offer. We aim to provide updates within 3-5 business days after each stage.",
  status: "You can check your application status by contacting your recruiter directly. They have real-time access to your pipeline stage in our ATS system.",
  documents: "Typically required: **Resume/CV**, **Portfolio** (for creative roles), **References** (2-3 professional), and any **certifications** relevant to the role.",
  remote: "We offer flexible work arrangements including **fully remote**, **hybrid**, and **on-site** positions. Each job listing specifies the work arrangement.",
  benefits: "Our benefits package includes: **Health Insurance**, **401(k) matching**, **Flexible PTO**, **Learning & Development budget**, **Remote work stipend**, and **Stock options** for eligible roles.",
  contact: "You can reach our HR team at **hr@company.com** or through the contact form on our website. Response time is typically within 1 business day.",
  salary: "Salary ranges vary by role and experience level. We believe in **pay transparency** and include salary ranges in all job postings. Compensation is competitive with market rates.",
  skills: "Required skills are listed in each job description. We use an **AI matching system** to score candidates based on skill overlap and experience level.",
  reject: "If your application was not selected, you'll receive a notification. We encourage you to apply for other open positions that match your profile.",
  offer: "Offer letters are generated digitally and include salary, start date, and all terms. You'll have **5 business days** to accept or decline.",
};

function matchIntent(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('open') || lower.includes('available') || lower.includes('position') || lower.includes('job')) return 'jobs';
  if (lower.includes('apply') || lower.includes('application') || lower.includes('submit')) return 'apply';
  if (lower.includes('interview') && (lower.includes('process') || lower.includes('stage') || lower.includes('step'))) return 'process';
  if (lower.includes('interview')) return 'interview';
  if (lower.includes('long') || lower.includes('time') || lower.includes('days') || lower.includes('week')) return 'long';
  if (lower.includes('status') || lower.includes('check') || lower.includes('track')) return 'status';
  if (lower.includes('document') || lower.includes('require') || lower.includes('need')) return 'documents';
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('hybrid')) return 'remote';
  if (lower.includes('benefit') || lower.includes('perk') || lower.includes('insurance')) return 'benefits';
  if (lower.includes('contact') || lower.includes('hr') || lower.includes('reach')) return 'contact';
  if (lower.includes('salary') || lower.includes('pay') || lower.includes('compensation')) return 'salary';
  if (lower.includes('skill') || lower.includes('qualification') || lower.includes('requirement')) return 'skills';
  if (lower.includes('reject') || lower.includes('not selected') || lower.includes('declined')) return 'reject';
  if (lower.includes('offer') || lower.includes('accept')) return 'offer';
  return '';
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: "Hi! I'm **HireIQ Assistant** 👋 I can help you with questions about our recruitment process, open positions, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: jobs } = useListJobs();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const addBotMessage = (text: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      role: 'bot',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 600));
    setIsTyping(false);

    const intent = matchIntent(userText);

    if (intent === 'jobs') {
      const openJobs = jobs?.filter((j) => j.status === JobStatus.open) || [];
      if (openJobs.length === 0) {
        addBotMessage("We don't have any open positions at the moment. Please check back soon or set up a job alert!");
      } else {
        const jobList = openJobs.slice(0, 8).map((j) => `• **${j.title}** — ${j.department} (${j.location})`).join('\n');
        addBotMessage(`We currently have **${openJobs.length} open position${openJobs.length > 1 ? 's' : ''}**:\n\n${jobList}\n\nVisit the **Jobs** page for full details and to apply!`);
      }
    } else if (intent && FAQ_RESPONSES[intent]) {
      addBotMessage(FAQ_RESPONSES[intent]);
    } else {
      addBotMessage("I'm not sure about that specific question. Here are some things I can help with:\n\n• Open job positions\n• Application process\n• Interview stages\n• Benefits & compensation\n• Contact information\n\nFeel free to ask about any of these topics!");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300',
          'flex items-center justify-center',
          'bg-gradient-to-br from-teal to-teal-dark hover:shadow-teal',
          isOpen ? 'scale-90' : 'scale-100 hover:scale-105 animate-pulse-teal'
        )}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal/90 to-teal-dark/90">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">HireIQ Assistant</p>
              <p className="text-xs text-white/70">AI-powered recruitment help</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/70">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-72 overflow-y-auto p-4 space-y-3 bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'bot' ? 'bg-teal/20' : 'bg-amber/20'
                )}>
                  {msg.role === 'bot' ? (
                    <Bot className="w-3.5 h-3.5 text-teal" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber" />
                  )}
                </div>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  msg.role === 'bot'
                    ? 'bg-muted text-foreground rounded-tl-sm'
                    : 'bg-teal text-white rounded-tr-sm'
                )}>
                  <span
                    dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    className="leading-relaxed"
                  />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-teal" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="px-3 py-2 border-t border-border bg-muted/30 flex gap-1.5 overflow-x-auto">
            {QUICK_REPLIES.slice(0, 3).map((reply) => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full border border-teal/30 text-teal bg-teal/5 hover:bg-teal/15 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-border bg-card">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 text-sm h-9 bg-muted/50 border-border"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="h-9 w-9 bg-teal hover:bg-teal-dark text-white flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
