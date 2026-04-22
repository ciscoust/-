import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn, Sparkles } from "lucide-react";

export function AuthScreen() {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error("Login Error:", error);
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 atmosphere opacity-20 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-6"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(255,78,0,0.1)]">
            <Sparkles className="w-10 h-10 text-[#ff4e00]" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-10px] border border-dashed border-[#ff4e00]/20 rounded-full"
            />
          </div>
        </div>

        <h1 className="text-5xl font-bold italic uppercase tracking-tighter mb-4">
          Oneiric
        </h1>
        <p className="text-gray-500 font-light tracking-wide mb-12 max-w-sm mx-auto">
          Decode the architecture of your subconscious with AI-powered dream analysis and visualization.
        </p>

        <button
          onClick={handleLogin}
          className="group relative px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <LogIn className="w-4 h-4" />
          Enter the Subconscious
          <div className="absolute inset-0 rounded-full bg-white blur-sm opacity-0 group-hover:opacity-30 transition-opacity" />
        </button>
      </motion.div>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button 
      onClick={() => signOut(auth)}
      className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
    >
      Sign Out
    </button>
  );
}
