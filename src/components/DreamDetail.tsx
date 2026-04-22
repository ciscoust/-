import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";
import { ChevronLeft, Info, Brain, Ghost, Send, Loader2 } from "lucide-react";
import { chatAboutDream } from "../services/gemini";

interface DreamDetailProps {
  dreamId: string;
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: any;
}

export function DreamDetail({ dreamId, onBack }: DreamDetailProps) {
  const [dream, setDream] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubDream = onSnapshot(doc(db, "dreams", dreamId), (doc) => {
      setDream({ id: doc.id, ...doc.data() });
    });

    const q = query(
      collection(db, "dreams", dreamId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    });

    return () => {
      unsubDream();
      unsubMessages();
    };
  }, [dreamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !dream) return;

    const userMessage = newMessage;
    setNewMessage("");
    setIsSending(true);

    try {
      // 1. Save user message
      await addDoc(collection(db, "dreams", dreamId, "messages"), {
        role: 'user',
        content: userMessage,
        createdAt: serverTimestamp()
      });

      // 2. Get AI response
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const context = `Dream: ${dream.transcription}. Theme: ${dream.emotionalTheme}. Interpretation: ${dream.interpretation?.summary}`;
      const aiResponse = await chatAboutDream(context, history, userMessage);

      // 3. Save AI message
      await addDoc(collection(db, "dreams", dreamId, "messages"), {
        role: 'model',
        content: aiResponse,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("AI Chat Error:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!dream) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-[#ff4e00]" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ff4e00] hover:translate-x-[-4px] transition-transform"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Archive
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Col: Visualization & Transcription */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-square rounded-[3rem] overflow-hidden border border-white/10"
          >
            {dream.imageUrl ? (
              <img 
                src={dream.imageUrl} 
                alt="Dream visualization" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-[#ff4e00] mb-4" />
                 <p className="text-xs uppercase tracking-[0.3em] opacity-30">Generating Vision</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
              <h1 className="text-4xl font-bold uppercase italic tracking-tighter text-[#ff4e00]">
                {dream.emotionalTheme || "The Unseen"}
              </h1>
            </div>
          </motion.div>

          <div className="p-8 bg-[#151515] rounded-[2rem] border border-white/5">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Info className="w-3 h-3" />
              The Recorded Memory
            </h3>
            <p className="text-lg font-light leading-relaxed text-gray-300 italic">
              "{dream.transcription}"
            </p>
          </div>
        </div>

        {/* Right Col: Analysis & Chat */}
        <div className="space-y-8">
          {dream.interpretation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Summary */}
              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
                <h3 className="text-[10px] uppercase tracking-widest text-[#ff4e00] mb-6 flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  Psychological Decoding
                </h3>
                <p className="text-gray-300 leading-relaxed font-light mb-8">
                  {dream.interpretation.summary}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {dream.interpretation.archetypes?.map((a: string) => (
                    <span key={a} className="px-3 py-1 bg-[#ff4e00]/10 text-[#ff4e00] text-[10px] uppercase font-mono tracking-widest rounded-full border border-[#ff4e00]/20">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Symbols */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dream.interpretation.symbols?.map((s: any) => (
                  <div key={s.name} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#ff4e00]/20 transition-colors">
                    <h4 className="text-[#ff4e00] uppercase text-xs font-bold mb-2 tracking-wide">{s.name}</h4>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">{s.meaning}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat Interface */}
          <div className="flex flex-col h-[500px] bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <Ghost className="w-5 h-5 text-[#ff4e00]" />
              <h3 className="text-xs uppercase tracking-widest font-bold">Dream Guide Chat</h3>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
            >
              {messages.length === 0 && (
                <p className="text-center text-gray-600 text-xs py-20 font-light italic">
                  Ask questions about specific symbols or feelings from your dream.
                </p>
              )}
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-[#ff4e00] text-white' 
                    : 'bg-white/10 text-gray-200'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-2 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 flex gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about a symbol..."
                className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#ff4e00] transition-colors"
              />
              <button 
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#ff4e00] flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
