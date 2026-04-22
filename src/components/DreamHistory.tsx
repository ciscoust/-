import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { motion } from "motion/react";
import { Calendar, Image as ImageIcon, MessageSquare } from "lucide-react";

interface DreamHistoryProps {
  onSelectDream: (id: string) => void;
}

interface DreamEntry {
  id: string;
  transcription: string;
  imageUrl?: string;
  emotionalTheme?: string;
  createdAt: any;
}

export function DreamHistory({ onSelectDream }: DreamHistoryProps) {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "dreams"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DreamEntry[];
      setDreams(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-light italic">Your dream archive is empty. Start by recording a new dream.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {dreams.map((dream, index) => (
        <motion.button
          key={dream.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectDream(dream.id)}
          className="group relative flex flex-col items-start bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-[#ff4e00]/30 transition-all text-left"
        >
          {dream.imageUrl ? (
            <div className="relative w-full aspect-square overflow-hidden bg-black/40">
              <img 
                src={dream.imageUrl} 
                alt="Dream visualization" 
                className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-60" />
            </div>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-white/5 text-gray-700">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}

          <div className="p-6 w-full">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#ff4e00] font-mono mb-3">
              <Calendar className="w-3 h-3" />
              {dream.createdAt?.toDate().toLocaleDateString() || 'Recently'}
            </div>
            
            <h3 className="text-lg font-medium mb-2 line-clamp-1 group-hover:text-[#ff4e00] transition-colors uppercase italic">
              {dream.emotionalTheme || "Untitled Revelation"}
            </h3>
            
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {dream.transcription}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Detail
              </span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
