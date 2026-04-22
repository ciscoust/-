import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  History, 
  Sparkles,
  LogOut
} from "lucide-react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { DreamRecorder } from "./components/DreamRecorder";
import { DreamHistory } from "./components/DreamHistory";
import { DreamDetail } from "./components/DreamDetail";
import { AuthScreen } from "./components/AuthScreen";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'history' | 'record' | 'detail'>('history');
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDreamCreated = (id: string) => {
    setSelectedDreamId(id);
    setView('detail');
  };

  const handleSelectDream = (id: string) => {
    setSelectedDreamId(id);
    setView('detail');
  };

  const handleBackToHistory = () => {
    setSelectedDreamId(null);
    setView('history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-[#ff4e00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff4e00]/30 selection:text-white">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 atmosphere opacity-10 pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/40 backdrop-blur-2xl px-6 py-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={handleBackToHistory}>
            <div className="w-8 h-8 rounded-full bg-[#ff4e00] flex items-center justify-center shadow-[0_0_20px_rgba(255,78,0,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic pt-1 group">
              Oneiric
              <span className="block h-px w-0 group-hover:w-full bg-[#ff4e00] transition-all duration-500" />
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'record' ? (
            <motion.div
              key="record"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center py-20"
            >
              <DreamRecorder onDreamCreated={handleDreamCreated} />
            </motion.div>
          ) : view === 'detail' && selectedDreamId ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DreamDetail 
                dreamId={selectedDreamId} 
                onBack={handleBackToHistory} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-4xl font-bold uppercase tracking-tighter italic mb-2">The Archive</h2>
                  <p className="text-gray-500 font-light tracking-wide max-w-md italic">
                    Records of your journey through the collective unconscious.
                  </p>
                </div>
              </div>
              <DreamHistory onSelectDream={handleSelectDream} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#111]/80 border border-white/5 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl backdrop-blur-xl">
        <button 
          onClick={() => { setView('history'); setSelectedDreamId(null); }} 
          className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${view === 'history' ? 'bg-white text-black font-bold' : 'text-gray-500 hover:text-white'}`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-widest pt-0.5">Archive</span>
        </button>
        
        <div className="w-px h-6 bg-white/10" />

        <button 
          onClick={() => setView('record')} 
          className={`group flex items-center gap-3 px-6 py-3 rounded-full transition-all ${view === 'record' ? 'bg-[#ff4e00] text-white font-bold' : 'text-gray-500 hover:text-white'}`}
        >
          <div className="relative">
            <Plus className={`w-4 h-4 transition-transform duration-500 ${view === 'record' ? 'rotate-90' : ''}`} />
            {view !== 'record' && (
              <div className="absolute inset-0 bg-[#ff4e00] blur-md opacity-20 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest pt-0.5">Record</span>
        </button>
      </nav>
    </div>
  );
}
