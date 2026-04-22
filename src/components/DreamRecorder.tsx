import { useState, useRef } from "react";
import { Mic, Square, Loader2, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { transcribeAudio, analyzeDream, generateDreamImage } from "../services/gemini";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";

interface DreamRecorderProps {
  onDreamCreated: (id: string) => void;
}

export function DreamRecorder({ onDreamCreated }: DreamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'analyzing' | 'visualizing'>('idle');
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processDream(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('recording');
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Please allow microphone access to record your dream.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processDream = async (audioBlob: Blob) => {
    setStatus('processing');
    setProgress(20);

    try {
      // 1. Transcribe
      const transcription = await transcribeAudio(audioBlob);
      setProgress(40);

      // 2. Initial Doc Creation
      if (!auth.currentUser) return;
      const dreamDoc = await addDoc(collection(db, "dreams"), {
        userId: auth.currentUser.uid,
        transcription,
        createdAt: serverTimestamp(),
      });

      // 3. Analyze
      setStatus('analyzing');
      const analysis = await analyzeDream(transcription);
      setProgress(70);

      // 4. Update with Analysis
      await updateDoc(doc(db, "dreams", dreamDoc.id), {
        emotionalTheme: analysis.emotionalTheme,
        interpretation: {
          summary: analysis.summary,
          archetypes: analysis.archetypes,
          symbols: analysis.symbols
        }
      });

      // 5. Visualize
      setStatus('visualizing');
      const imageUrl = await generateDreamImage(analysis.emotionalTheme);
      setProgress(100);

      // 6. Update with Image
      await updateDoc(doc(db, "dreams", dreamDoc.id), {
        imageUrl
      });

      onDreamCreated(dreamDoc.id);
    } catch (err) {
      console.error("Error processing dream:", err);
      setStatus('idle');
      alert("Something went wrong while capturing your dream. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <button
              onClick={startRecording}
              className="group relative w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 hover:border-[#ff4e00]/50"
            >
              <div className="absolute inset-0 rounded-full bg-[#ff4e00]/5 scale-0 group-hover:scale-125 transition-transform duration-500 blur-xl" />
              <Mic className="w-10 h-10 text-white group-hover:text-[#ff4e00] transition-colors" />
            </button>
            <p className="mt-6 text-gray-500 font-light tracking-wide">Tap to record your dream</p>
          </motion.div>
        ) : status === 'recording' ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="relative mb-8">
               <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-[#ff4e00]/10 blur-2xl" 
              />
              <button
                onClick={stopRecording}
                className="relative w-32 h-32 rounded-full bg-[#ff4e00] flex items-center justify-center shadow-[0_0_40px_rgba(255,78,0,0.3)] transition-transform active:scale-95"
              >
                <Square className="w-10 h-10 text-white fill-white" />
              </button>
            </div>
            <p className="text-[#ff4e00] font-mono text-sm uppercase tracking-widest animate-pulse">Recording Subconscious...</p>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-sm"
          >
            <div className="relative w-24 h-24 mx-auto mb-8">
              <Loader2 className="w-full h-full text-[#ff4e00] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                {status === 'processing' && <Sparkles className="w-8 h-8 text-white/50" />}
                {status === 'analyzing' && <Wand2 className="w-8 h-8 text-white/50" />}
                {status === 'visualizing' && <Sparkles className="w-8 h-8 text-white/50" />}
              </div>
            </div>
            <h3 className="text-xl font-light mb-2">
              {status === 'processing' && "Decoding voice..."}
              {status === 'analyzing' && "Extracting archetypes..."}
              {status === 'visualizing' && "Visualizing shadows..."}
            </h3>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#ff4e00]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
