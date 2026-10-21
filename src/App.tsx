import React, { useState, useRef } from 'react';
import { Upload, Video, X, ShieldAlert, FileText, Activity, Search, AlertTriangle, CheckCircle2, ChevronRight, Play, Download, MessageSquare, Camera, Monitor, Eye, Zap, BrainCircuit, Mic, MicOff, UserPlus, FileCheck, Volume2, UserCircle, Home as HomeIcon, User, Shield, ArrowRight, ArrowLeft, LogOut, IdCard, Loader2, Users, UsersRound, Sparkles, Mail, Gift, PartyPopper, Linkedin, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeVideo, analyzeLiveFrame, processComplaintTurn, generateSpeech, extractIdDetails, analyzeCrowd, askEvidenceQuestion } from './services/geminiService';
import { InvestigationReport, EmotionalAnalysis, ComplaintData } from './types';
import { cn } from './lib/utils';
import { TerminalButton } from './components/TerminalButton';
import { CommandTerminal } from './components/CommandTerminal';
import { MovingBackground } from './components/MovingBackground';
export default function App() {
  const [showVisuals, setShowVisuals] = useState(true);
  const [role, setRole] = useState<'user' | 'officer' | null>(null);
  const [mode, setMode] = useState<'upload' | 'live' | 'complaint' | 'crowd' | 'home' | 'terminal'>('home');
  const [expandedAwareness, setExpandedAwareness] = useState<number | null>(null);
  const [unwrappingBox, setUnwrappingBox] = useState<'upload' | 'live' | 'crowd' | null>(null);

  const handleOpenGiftBox = (targetMode: 'upload' | 'live' | 'crowd') => {
    if (unwrappingBox) return;
    setUnwrappingBox(targetMode);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.45);
        });
      }
    } catch (_) {}

    setTimeout(() => {
      setMode(targetMode);
      reset();
      setUnwrappingBox(null);
    }, 1400);
  };
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evidenceQuestion, setEvidenceQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [customQA, setCustomQA] = useState<{question: string, answer: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Monitor States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<EmotionalAnalysis | null>(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Complaint Registration States
  const [complaintData, setComplaintData] = useState<ComplaintData>({
    basicInfo: {},
    incidentDetails: {},
    accusedDetails: {},
    witnessDetails: {},
    propertyDetails: {},
  });
  const [complaintHistory, setComplaintHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingComplaint, setIsProcessingComplaint] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<'Male' | 'Female' | 'Child'>('Female');
  const [language, setLanguage] = useState<string>('English');
  const [finalComplaint, setFinalComplaint] = useState<string | null>(null);
  const [isExtractingId, setIsExtractingId] = useState(false);
  const [idExtracted, setIdExtracted] = useState(false);
  const [crowdAnalysis, setCrowdAnalysis] = useState<any>(null);
  const [isCrowdAnalyzing, setIsCrowdAnalyzing] = useState(false);
  const [crowdMediaUrl, setCrowdMediaUrl] = useState<string | null>(null);
  const [crowdMediaType, setCrowdMediaType] = useState<'video' | 'image' | null>(null);
  const [crowdMediaBase64, setCrowdMediaBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startComplaint = async () => {
    setIsProcessingComplaint(true);
    try {
      const result = await processComplaintTurn([], complaintData, language);
      setComplaintHistory([{ role: 'model', text: result.nextQuestion }]);
      playAIResponse(result.nextQuestion);
    } catch (err) {
      setError("Failed to start complaint registration.");
    } finally {
      setIsProcessingComplaint(false);
    }
  };

  const handleCrowdAnalysis = async (imageBase64: string) => {
    setIsCrowdAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeCrowd(imageBase64);
      setCrowdAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(`Crowd analysis failed: ${err.message}`);
    } finally {
      setIsCrowdAnalyzing(false);
    }
  };

  const handleCrowdMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      stopLiveMonitor();
      const url = URL.createObjectURL(file);
      setCrowdMediaUrl(url);
      setCrowdMediaType('image');
      setIsLiveActive(true);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setCrowdMediaBase64(base64);
        handleCrowdAnalysis(base64);
      };
    } else if (file.type.startsWith('video/')) {
      stopLiveMonitor();
      setCrowdMediaType('video');
      const url = URL.createObjectURL(file);
      setCrowdMediaUrl(url);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.loop = true;
        videoRef.current.play();
        setIsLiveActive(true);
      }
    }
  };

  const handleTriggerCrowdAnalysis = () => {
    if (crowdMediaType === 'image' && crowdMediaBase64) {
      handleCrowdAnalysis(crowdMediaBase64);
      return;
    }

    const frame = captureFrame();
    if (frame) {
      handleCrowdAnalysis(frame);
    } else {
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 640;
      dummyCanvas.height = 480;
      const ctx = dummyCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#00e1ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Crowd Intelligence Live Scan', 150, 240);
        const sampleBase64 = dummyCanvas.toDataURL('image/jpeg').split(',')[1];
        handleCrowdAnalysis(sampleBase64);
      }
    }
  };

  const playAIResponse = async (text: string) => {
    try {
      const audioBase64 = await generateSpeech(text, voiceChoice);
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await handleUserVoiceInput(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingId(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractIdDetails(base64, file.type);
        
        setComplaintData(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            fullName: extracted.fullName || prev.basicInfo.fullName,
            address: extracted.address || prev.basicInfo.address,
            idProof: extracted.idProof || prev.basicInfo.idProof,
          }
        }));
        setIdExtracted(true);
      };
    } catch (err) {
      setError("Failed to extract details from ID. Please enter manually.");
    } finally {
      setIsExtractingId(false);
    }
  };

  const handleUserVoiceInput = async (audioBase64: string) => {
    setIsProcessingComplaint(true);
    try {
      const result = await processComplaintTurn(complaintHistory, complaintData, language, audioBase64);
      
      // Update data
      setComplaintData(prev => ({
        ...prev,
        ...result.extractedData
      }));

      // Update history
      const newHistory = [
        ...complaintHistory,
        { role: 'user' as const, text: "[Voice Input]" },
        { role: 'model' as const, text: result.nextQuestion }
      ];
      setComplaintHistory(newHistory);

      if (result.isComplete && result.formalComplaint) {
        setFinalComplaint(result.formalComplaint);
      } else {
        playAIResponse(result.nextQuestion);
      }
    } catch (err: any) {
      setError(`Failed to process voice input: ${err.message}`);
    } finally {
      setIsProcessingComplaint(false);
    }
  };

  const startLiveMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        if (videoRef.current.src) {
          URL.revokeObjectURL(videoRef.current.src);
          videoRef.current.src = '';
        }
        videoRef.current.srcObject = stream;
        videoRef.current.loop = false;
        setIsLiveActive(true);
        startAnalysisLoop();
      }
    } catch (err: any) {
      setError(`Camera access denied or failed: ${err.message}`);
    }
  };

  const stopLiveMonitor = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (videoRef.current?.src) {
      URL.revokeObjectURL(videoRef.current.src);
      videoRef.current.src = '';
    }
    setIsLiveActive(false);
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    setLiveAnalysis(null);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        stopLiveMonitor();
        const url = URL.createObjectURL(file);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.loop = true;
          videoRef.current.play();
          setIsLiveActive(true);
          if (mode === 'live') {
            startAnalysisLoop();
          }
        }
      } else {
        setError("Please upload a valid video file.");
      }
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }
    }
    return null;
  };

  const startAnalysisLoop = () => {
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    
    analysisIntervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (frame && !isLiveAnalyzing) {
        setIsLiveAnalyzing(true);
        try {
          const result = await analyzeLiveFrame(frame);
          setLiveAnalysis(result);
        } catch (err) {
          console.error("Live analysis error:", err);
        } finally {
          setIsLiveAnalyzing(false);
        }
      }
    }, 5000); // Analyze every 5 seconds
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3.8 * 1024 * 1024) {
        setError(`File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Vercel serverless has a 4.5MB payload limit. Please upload a short clip under 3.5MB.`);
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setReport(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const startAnalysis = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64 = await fileToBase64(videoFile);
      const result = await analyzeVideo(base64, videoFile.type);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!evidenceQuestion.trim() || !report) return;
    const q = evidenceQuestion.trim();
    setEvidenceQuestion("");
    setIsAskingQuestion(true);
    try {
      const answer = await askEvidenceQuestion(report, q) || "";
      setCustomQA(prev => [...prev, { question: q, answer }]);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to answer question: ${err.message}`);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const reset = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setReport(null);
    setError(null);
    setCrowdAnalysis(null);
    setLiveAnalysis(null);
    setCustomQA([]);
    setEvidenceQuestion("");
    setCrowdMediaUrl(null);
    setCrowdMediaType(null);
    setCrowdMediaBase64(null);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-gold/30 relative z-0">
      {/* Dynamic Visual Moving Background or Minimal Dark Theme */}
      {showVisuals ? (
        <MovingBackground />
      ) : (
        <div className="fixed inset-0 w-full h-full bg-[#03050c] z-[-1]" />
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[4.5rem] sm:h-24 md:h-28 py-2 sm:py-0 flex items-center justify-between relative gap-2">
          <div className="w-16 sm:w-24 hidden lg:block" />

          <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-4 md:gap-5 select-none lg:absolute lg:left-1/2 lg:-translate-x-1/2 min-w-0">
            <div className="relative w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-red-600 shadow-[0_0_25px_rgba(244,63,94,0.5)] shrink-0 overflow-hidden hover:scale-105 transition-transform duration-300">
              <img 
                src="/top_logo_transparent.png" 
                alt="VIKSIT ANDHRA Logo" 
                className="w-full h-full object-contain p-0.5 sm:p-1 rounded-full bg-black/50"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-[0.08em] sm:tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(255,0,60,0.6)] font-display leading-none truncate">
                VIKSIT <span className="text-white drop-shadow-[0_0_20px_rgba(0,200,255,0.85)]">ANDHRA</span>
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-3 mt-1 sm:mt-1.5 flex-wrap">
                <a
                  href="https://www.linkedin.com/in/hasini-yarla-9ab705357/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View Hasini Yarla on LinkedIn"
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.35em] text-cyan-300 hover:text-cyan-100 font-mono font-bold drop-shadow-[0_0_8px_rgba(0,200,255,0.4)] transition-all hover:underline decoration-cyan-400 underline-offset-4 group cursor-pointer"
                >
                  <span>-Hasini Yarla</span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-cyan-300" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowVisuals(!showVisuals)}
                  title="Toggle Background Visual Effects ON/OFF"
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center gap-1",
                    showVisuals ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,200,255,0.3)] hover:bg-cyan-500/30" : "bg-white/10 text-white/40 hover:bg-white/20"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", showVisuals ? "bg-cyan-400 animate-pulse" : "bg-white/40")} />
                  <span>FX {showVisuals ? "ON" : "OFF"}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {role && (
              <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium text-white/60">
                {mode !== 'home' && (
                  <button 
                    onClick={() => { setMode('home'); reset(); stopLiveMonitor(); }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/10 hover:border-cyan-400/40 text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <HomeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                    <span>Home</span>
                  </button>
                )}
                <button 
                  onClick={() => { setRole(null); stopLiveMonitor(); reset(); }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-royal/20 border border-royal/40 rounded-full hover:bg-royal/30 transition-all text-gold text-[10px] sm:text-xs uppercase tracking-wider font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Exit
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        {!role ? (
          <div className="min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center space-y-8 sm:space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3 sm:space-y-4 px-2"
            >
              <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight sm:tracking-wider leading-none font-display">
                <span className="text-cyan-400 block text-sm sm:text-2xl md:text-3xl font-mono tracking-[0.3em] sm:tracking-[0.6em] mb-2 sm:mb-4 drop-shadow-[0_0_15px_rgba(0,200,255,0.8)]">
                  WELCOME TO
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-rose-400 drop-shadow-[0_0_40px_rgba(255,0,60,0.9)] tracking-tight">
                  VIKSIT
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 drop-shadow-[0_0_40px_rgba(0,180,255,0.9)] tracking-tight italic ml-2 sm:ml-3">
                  ANDHRA
                </span>
              </h2>
              <p className="text-white/70 text-sm sm:text-lg md:text-xl max-w-3xl mx-auto font-light tracking-wide leading-relaxed italic px-2">
                “Technology is meaningless without motive; true AI begins when intelligence integrates with the human mind.”
              </p>
            </motion.div>

            <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-md mx-auto">
              {/* Start Project Portal */}
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setRole('officer'); setMode('home'); }}
                className="group cursor-pointer flex flex-col items-center text-center select-none"
              >
                <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-300 to-cyan-400 shadow-[0_0_40px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_60px_rgba(0,225,255,0.8)] group-hover:scale-105 transition-all duration-300 mb-6 sm:mb-8">
                  <img 
                    src="/project_logo.png" 
                    alt="Viksit Andhra Emblem" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 via-rose-500 to-cyan-500 rounded-full text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/30 group-hover:shadow-[0_0_25px_rgba(0,225,255,0.6)] group-hover:scale-105 transition-all">
                  <span>Start Project</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>

            <div className="pt-8 sm:pt-12 text-center px-2">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.4em] text-white/20 font-bold">
                Authorized Personnel Only • Secure 256-bit Encryption
              </p>
            </div>
          </div>
        ) : (
          <>
            {mode === 'terminal' ? (
              <CommandTerminal onBack={() => setMode('home')} />
            ) : mode === 'home' ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 w-full">
                {/* Embedded UI Hero Banner integrating the Awareness Graphic */}
                {/* Comic Awareness Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 mb-2 mt-6 max-w-4xl mx-auto">
                  {/* Public Safety Pill */}
                  <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-red-600 text-white px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full font-black uppercase text-[10px] sm:text-xs tracking-widest border-2 border-black shadow-[3px_3px_0px_#000] rotate-[-2deg] hover:rotate-0 transition-transform">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                    <span>Public Safety Initiative</span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-[3px_3px_0px_#000] leading-tight pt-1 px-2">
                    <span>Be Responsible in Society</span>
                  </h2>

                  {/* SIMPLE TRENDY COMIC SLOGAN STRIP */}
                  <div className="py-1 px-2">
                    <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 text-black border-2 border-black shadow-[4px_4px_0px_#000] font-black uppercase tracking-wide text-[10px] sm:text-sm md:text-base rotate-[-1deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-200 cursor-default select-none text-center flex-wrap">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black shrink-0" />
                      <span>Add Your Skills to Solve Social Problems and Be Unique</span>
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black shrink-0 text-black" />
                    </div>
                  </div>

                  {/* Jai Hind */}
                  <div>
                    <span className="text-base sm:text-xl font-black tracking-widest text-red-500 drop-shadow-[2px_2px_0px_#000] uppercase font-sans">
                      Jai Hind
                    </span>
                  </div>
                  {/* Trendy Cyber-Glass Awareness Pill */}
                  <div className="relative max-w-2xl mx-auto mt-4 sm:mt-6 mb-6 sm:mb-10 px-2 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                    <div className="relative px-3 sm:px-6 py-2.5 sm:py-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-center">
                      <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                      </span>
                      <p className="text-white text-[10px] sm:text-sm md:text-base font-black uppercase tracking-[0.1em] sm:tracking-[0.22em] font-mono leading-relaxed">
                        Stand Strong Against{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                          Crime, Drugs, and Hazards
                        </span>
                      </p>
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 animate-pulse hidden sm:block" />
                    </div>
                  </div>

                  {/* Magic Mystery Gift Boxes Vault */}
                  <div className="w-full py-4 sm:py-6 relative z-20">
                    <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 text-center px-2">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-cyan-500/25 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest backdrop-blur-xl shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse mb-2">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                        <span>✦ Magic Mystery Gift Boxes ✦</span>
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                      </div>
                      <p className="text-white/80 text-[11px] sm:text-sm font-semibold tracking-wider font-mono px-2">
                        Tap any <span className="text-amber-300 font-black uppercase underline decoration-amber-400/50 underline-offset-4">Gift Box</span> to unwrap & launch hidden Public Safety AI technology!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto w-full px-2">
                      {[
                        {
                          id: 'upload' as const,
                          num: '01',
                          boxName: 'Gift Box #1',
                          mysteryHint: 'Evidence Forensics AI',
                          title: 'Upload Analysis',
                          subtitle: 'AI Forensics Engine',
                          icon: Upload,
                          glowColor: 'rgba(6, 182, 212, 0.6)',
                          ribbonGradient: 'from-cyan-400 via-sky-200 to-blue-500',
                          boxGradient: 'from-[#050b18]/95 via-[#07193c]/90 to-[#030814]/95',
                          textColor: 'text-cyan-300',
                          beamColor: 'from-cyan-400/60 to-transparent',
                        },
                        {
                          id: 'live' as const,
                          num: '02',
                          boxName: 'Gift Box #2',
                          mysteryHint: 'CCTV Behavioral Vision',
                          title: 'Live Monitor',
                          subtitle: 'CCTV Behavioral Radar',
                          icon: Monitor,
                          glowColor: 'rgba(244, 63, 94, 0.6)',
                          ribbonGradient: 'from-rose-500 via-amber-200 to-red-500',
                          boxGradient: 'from-[#140608]/95 via-[#2f0812]/90 to-[#0e0305]/95',
                          textColor: 'text-rose-300',
                          beamColor: 'from-rose-400/60 to-transparent',
                        },
                        {
                          id: 'crowd' as const,
                          num: '03',
                          boxName: 'Gift Box #3',
                          mysteryHint: 'Stampede & Surge AI',
                          title: 'Crowd Management',
                          subtitle: 'Density & Stampede AI',
                          icon: UsersRound,
                          glowColor: 'rgba(16, 185, 129, 0.6)',
                          ribbonGradient: 'from-emerald-400 via-teal-100 to-emerald-500',
                          boxGradient: 'from-[#04130f]/95 via-[#082d22]/90 to-[#020b08]/95',
                          textColor: 'text-emerald-300',
                          beamColor: 'from-emerald-400/60 to-transparent',
                        },
                      ].map((box) => {
                        const isUnwrapping = unwrappingBox === box.id;
                        const isOtherUnwrapping = unwrappingBox !== null && !isUnwrapping;
                        const BoxIcon = box.icon;

                        return (
                          <motion.div
                            key={box.id}
                            animate={
                              isUnwrapping
                                ? {
                                    scale: [1, 1.08, 0.98, 1.05],
                                    rotate: [0, -5, 5, -3, 3, 0],
                                  }
                                : isOtherUnwrapping
                                ? { opacity: 0.35, scale: 0.95 }
                                : {
                                    y: [0, -6, 0],
                                    opacity: 1,
                                    scale: 1,
                                  }
                            }
                            transition={
                              isUnwrapping
                                ? { duration: 0.6, times: [0, 0.25, 0.5, 1] }
                                : {
                                    y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                                    duration: 0.3,
                                  }
                            }
                            whileHover={!unwrappingBox ? { scale: 1.05, y: -10 } : {}}
                            whileTap={!unwrappingBox ? { scale: 0.96 } : {}}
                            onClick={() => {
                              if (isUnwrapping) {
                                setMode(box.id);
                                reset();
                                setUnwrappingBox(null);
                              } else if (!unwrappingBox) {
                                handleOpenGiftBox(box.id);
                              }
                            }}
                            className={`relative h-64 md:h-72 rounded-3xl p-[2px] cursor-pointer overflow-hidden transition-all duration-300 select-none group shadow-2xl ${
                              isUnwrapping ? 'z-30' : 'z-10'
                            }`}
                            style={{
                              boxShadow: isUnwrapping
                                ? `0 0 60px ${box.glowColor}`
                                : `0 15px 35px -5px ${box.glowColor}`,
                            }}
                          >
                            {/* Outer Border Glowing Ribbon Gradient */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-b ${box.ribbonGradient} opacity-60 group-hover:opacity-100 transition-opacity rounded-3xl`}
                            />

                            {/* Inner Gift Box Container */}
                            <div
                              className={`relative w-full h-full rounded-[22px] bg-gradient-to-b ${box.boxGradient} backdrop-blur-2xl border border-white/20 p-5 flex flex-col items-center justify-between overflow-hidden`}
                            >
                              {/* CROSS RIBBONS (The Gift Wrap Bands) */}
                              <div
                                className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-b ${box.ribbonGradient} opacity-80 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500 ${
                                  isUnwrapping ? 'opacity-20 scale-y-125' : ''
                                }`}
                              />
                              <div
                                className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r ${box.ribbonGradient} opacity-80 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500 ${
                                  isUnwrapping ? 'opacity-20 scale-x-125' : ''
                                }`}
                              />

                              {/* Ambient Shimmer / Sheen */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                              {/* IF UNWRAPPING / REVEALED */}
                              <AnimatePresence>
                                {isUnwrapping ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.6, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    className="relative z-30 w-full h-full flex flex-col items-center justify-center text-center p-2"
                                  >
                                    {/* Upward Energy Beam */}
                                    <div
                                      className={`absolute inset-0 bg-gradient-to-t ${box.beamColor} blur-xl animate-pulse pointer-events-none`}
                                    />

                                    {/* Confetti / Sparkle burst elements */}
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: [0, 1.4, 1] }}
                                      className="absolute -top-3 w-full flex justify-center gap-6 pointer-events-none"
                                    >
                                      <PartyPopper className="w-8 h-8 text-amber-300 animate-bounce" />
                                      <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
                                      <PartyPopper className="w-8 h-8 text-rose-400 animate-bounce" />
                                    </motion.div>

                                    {/* Revealed Project Icon */}
                                    <motion.div
                                      animate={{ rotate: [0, -10, 10, 0], scale: [0.8, 1.2, 1] }}
                                      transition={{ duration: 0.5 }}
                                      className={`p-4 rounded-2xl bg-white/15 border-2 border-white/40 ${box.textColor} shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-3 relative`}
                                    >
                                      <BoxIcon className="w-10 h-10 md:w-12 md:h-12" />
                                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                      </span>
                                    </motion.div>

                                    {/* Revealed Project Badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_#f59e0b] mb-2 animate-bounce">
                                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                                      <span>Project Unlocked!</span>
                                    </div>

                                    {/* Revealed Title & Subtitle */}
                                    <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                                      {box.title}
                                    </h4>
                                    <p className={`text-xs md:text-sm font-black font-mono tracking-wider uppercase mt-1 ${box.textColor}`}>
                                      {box.subtitle}
                                    </p>

                                    {/* Launching Progress Bar */}
                                    <div className="w-full max-w-[200px] mt-4">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-white/80 mb-1">
                                        <span className="flex items-center gap-1">
                                          <Zap className="w-3 h-3 text-amber-400 animate-pulse" /> Launching...
                                        </span>
                                        <span className="font-bold text-amber-300">Ready</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
                                        <motion.div
                                          initial={{ width: '0%' }}
                                          animate={{ width: '100%' }}
                                          transition={{ duration: 1.3, ease: 'linear' }}
                                          className={`h-full bg-gradient-to-r ${box.ribbonGradient}`}
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  /* CLOSED MAGIC GIFT BOX STATE */
                                  <div className="relative z-20 w-full h-full flex flex-col items-center justify-between">
                                    {/* Top Mystery Tag + Bow */}
                                    <div className="w-full flex items-center justify-between relative z-30">
                                      <span className="text-[10px] font-black uppercase tracking-widest font-mono px-2.5 py-1 rounded-lg bg-black/70 border border-white/15 text-white/90 shadow-md">
                                        BOX {box.num}
                                      </span>

                                      {/* Cute Gift Bow on Top */}
                                      <div className="relative flex items-center justify-center">
                                        <div className="flex items-center gap-0.5">
                                          <div
                                            className={`w-4 h-3 rounded-full border-2 border-white/60 bg-gradient-to-r ${box.ribbonGradient} -rotate-45 shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                                          />
                                          <div className="w-3.5 h-3.5 rounded-full bg-amber-300 border-2 border-white shadow-[0_0_8px_#fde047] z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                          </div>
                                          <div
                                            className={`w-4 h-3 rounded-full border-2 border-white/60 bg-gradient-to-r ${box.ribbonGradient} rotate-45 shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                                          />
                                        </div>
                                      </div>

                                      <span className="text-[10px] font-black uppercase tracking-wider font-mono text-amber-300 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                                        Secret
                                      </span>
                                    </div>

                                    {/* Center Gift Box 3D Emblem */}
                                    <div className="relative my-auto flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                      {/* Glowing circular seal */}
                                      <div className="relative w-20 h-20 rounded-2xl bg-black/70 border-2 border-white/30 backdrop-blur-xl flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.25)] group-hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] group-hover:border-amber-300/80 transition-all">
                                        <Gift className="w-10 h-10 text-white group-hover:text-amber-300 transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

                                        {/* Floating golden sparkle */}
                                        <Sparkles className="w-4 h-4 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
                                      </div>

                                      <div className="mt-2.5 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-white/70 tracking-wider">
                                        ✦ Mystery Public Safety AI ✦
                                      </div>
                                    </div>

                                    {/* Bottom Action Prompt */}
                                    <div className="w-full text-center relative z-30 pt-1">
                                      <div className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white text-black font-black uppercase text-xs tracking-wider shadow-[0_4px_15px_rgba(0,0,0,0.5)] group-hover:bg-amber-300 group-hover:scale-105 transition-all">
                                        <Gift className="w-4 h-4 fill-black" />
                                        <span>Tap to Unwrap</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>


                </motion.div>

                {/* Comic Panel Gallery - Women Can Lead & They Are Brave: Tribute to All Women */}
                <div className="flex flex-col items-center justify-center text-center mt-8 sm:mt-12 mb-6 px-4 max-w-4xl mx-auto space-y-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-rose-400/60" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-rose-300 font-mono">
                      ✦ Nari Shakti • The Eternal Torchbearers ✦
                    </span>
                    <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-rose-400/60" />
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-cyan-200 leading-tight">
                    Women Can Lead & They Are Brave — Embracing Every Milestone for Family & Nation
                  </h3>

                  <p className="text-xs sm:text-sm md:text-base text-rose-100/90 font-serif italic max-w-3xl leading-relaxed drop-shadow-sm">
                    “A heartfelt, soulful tribute to every woman who fearlessly carves her own identity with unyielding courage and silent sacrifices — forever upholding her family’s honor and our Nation’s pride as her supreme, sacred priority.”
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 w-full max-w-5xl pb-8 sm:pb-12 mt-3 sm:mt-4 px-1">
                  {[
                    { 
                      img: '/comic_women_defense.jpg', 
                      title: 'Tigress of the Skies', 
                      desc: 'Guarding our borders, commanding supersonic jets & securing the motherland!', 
                      color: 'bg-rose-500', 
                      textColor: 'text-rose-500',
                      rules: [
                        "Avani Chaturvedi, Bhawana Kanth & Mohana Singh: India's first female combat fighter pilots, with Avani flying solo supersonic MiG-21 Bisons in combat air defense.",
                        "Captain Shiva Chouhan: First woman army officer to be operationally deployed at Siachen Glacier (Kumar Post at 15,632 ft), the world's highest battlefield.",
                        "Commander Prerna Deosthalee & INSV Tarini: First woman officer to command an Indian Navy warship (INS Trinkat), alongside the all-women naval crew circumnavigating the globe."
                      ]
                    },
                    { 
                      img: '/comic_women_space.jpg', 
                      title: 'Chandrayaan & Beyond', 
                      desc: 'Rocket women of ISRO leading lunar, solar, and interplanetary deep-space voyages!', 
                      color: 'bg-cyan-500', 
                      textColor: 'text-cyan-400',
                      rules: [
                        "Dr. Ritu Karidhal & Dr. Kalpana K.: Renowned 'Rocket Women of ISRO' who spearheaded the Mars Orbiter Mission (Mangalyaan) and the historic Moon landing of Chandrayaan-3.",
                        "Nigar Shaji: ISRO Project Director who successfully led India's Aditya-L1 solar observatory mission, positioning India at Lagrange Point L1.",
                        "Dr. Tessy Thomas ('Missile Woman of India'): First woman scientist to head an Indian missile program, directing the strategic Agni-IV and Agni-V ICBM defense systems."
                      ]
                    },
                    { 
                      img: '/comic_women_justice.jpg', 
                      title: 'Guardians of Justice', 
                      desc: 'Elite IPS officers and judiciary upholding the Constitution and delivering swift justice!', 
                      color: 'bg-amber-500', 
                      textColor: 'text-amber-500',
                      rules: [
                        "Kiran Bedi: India's 1st woman IPS officer (1972), pioneer of sweeping prison reforms at Tihar, Ramon Magsaysay laureate, and iconic leader of community policing.",
                        "Justice Fathima Beevi & Justice B.V. Nagarathna: From India's 1st woman Supreme Court Judge to the trailblazing judge poised to become the 1st female Chief Justice of India (CJI).",
                        "Anna Rajam Malhotra & C.B. Muthamma: 1st female IAS officer who built Nhava Sheva port, and 1st female diplomat who fought and won constitutional gender equality in service rules."
                      ]
                    },
                    { 
                      img: '/comic_women_sports.jpg', 
                      title: 'Champions of Gold', 
                      desc: 'Smashing world records, conquering Olympic podiums & hoisting the Tiranga high!', 
                      color: 'bg-emerald-500', 
                      textColor: 'text-emerald-500',
                      rules: [
                        "Karnam Malleswari & Mirabai Chanu: Andhra Pradesh's own Karnam Malleswari was India's 1st woman Olympic medalist (Sydney 2000), paving the way for Mirabai's Tokyo Olympic Silver.",
                        "P.V. Sindhu & MC Mary Kom: Sindhu is India's 1st dual-individual Olympic medalist (Silver & Bronze) & World Champion; Mary Kom is a legendary 6-time World Amateur Boxing Champion.",
                        "Mithali Raj & Harmanpreet Kaur: Record-setting legends who elevated Indian women's cricket into global World Cup contenders and inspired millions of girls nationwide."
                      ]
                    },
                    { 
                      img: '/comic_women_healthcare.jpg', 
                      title: 'Warriors of Healing', 
                      desc: 'Frontline doctors, surgeons & medical pioneers saving lives and conquering healthcare frontiers!', 
                      color: 'bg-purple-500', 
                      textColor: 'text-purple-400',
                      rules: [
                        "Dr. Anandibai Joshi & Dr. Muthulakshmi Reddi: Dr. Joshi was India's 1st woman doctor of western medicine (1886); Dr. Reddi was India's 1st female surgeon and founder of the renowned Adyar Cancer Institute.",
                        "Dr. Soumya Swaminathan & Dr. Gagandeep Kang: Global medical science pioneers—Dr. Swaminathan served as WHO Chief Scientist navigating global health crises, and Dr. Kang is India's 1st woman FRS in medical research.",
                        "ASHA Community Health Champions: Over 1 million women healthcare warriors recognized globally with WHO's Global Health Leaders Award for grassroots pandemic defense and rural medical lifelines."
                      ]
                    },
                    { 
                      img: '/comic_women_tech.jpg', 
                      title: 'Architects of Tomorrow', 
                      desc: 'Pioneering AI breakthroughs, deep tech innovations & securing national cyber infrastructure!', 
                      color: 'bg-blue-600', 
                      textColor: 'text-blue-400',
                      rules: [
                        "Debjani Ghosh & Roshni Nadar Malhotra: Debjani Ghosh led India's tech and AI agenda as 1st woman NASSCOM President; Roshni Nadar chairs HCLTech as 1st woman to lead an Indian listed tech giant.",
                        "Dr. Geetha Manjunath & Deep Tech Innovators: Founder & CEO of NIRAMAI, creating proprietary AI and thermal analytics for non-invasive early-stage breast cancer screening across India.",
                        "Sudha Murty & Kiran Mazumdar-Shaw: Trailblazing engineer who broke gender barriers at TELCO and empowered millions through philanthropy, alongside Biocon founder Kiran Mazumdar-Shaw who built India's biotech powerhouse."
                      ]
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col w-full group">
                      {/* Clickable Header Panel */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setExpandedAwareness(expandedAwareness === i ? null : i)}
                        className="relative rounded-2xl overflow-hidden border-2 sm:border-4 border-white bg-black aspect-video hover:-translate-y-2 hover:rotate-1 transition-all duration-300 shadow-[6px_6px_0px_#fff] sm:shadow-[8px_8px_0px_#fff] cursor-pointer z-10"
                      >
                        <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        
                        {/* Comic Halftone Overlay Effect */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                        
                        {/* Interactive Hint Indicator */}
                        <div className={`absolute top-2 sm:top-4 right-2 sm:right-4 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center bg-white z-20 group-hover:scale-110 transition-transform ${expandedAwareness === i ? 'rotate-90' : ''}`}>
                           <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-black font-black" />
                        </div>

                        {/* Text Box styled like a Comic Book panel */}
                        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-white text-black p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 sm:border-4 border-black shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000] rotate-[-1deg] group-hover:rotate-0 transition-transform">
                          <div className={`absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${item.color}`}>
                            <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white fill-white" />
                          </div>
                          <h4 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight">{item.title}</h4>
                          <p className="text-[11px] sm:text-xs md:text-sm font-bold leading-tight mt-0.5 sm:mt-1">{item.desc}</p>
                        </div>
                      </motion.div>
                      
                      {/* Expanded Rules Section */}
                      <AnimatePresence>
                        {expandedAwareness === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-[#ffffe8] border-2 sm:border-4 border-black rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative shadow-[6px_6px_0px_#000] sm:shadow-[8px_8px_0px_#000] z-20 mt-3 sm:mt-4 overflow-visible">
                              {/* Comic Speech Bubble Tail pointing UP towards the comic panel */}
                              <div className="absolute -top-[16px] sm:-top-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] sm:border-l-[20px] border-l-transparent border-r-[16px] sm:border-r-[20px] border-r-transparent border-b-[16px] sm:border-b-[20px] border-b-black" />
                              <div className="absolute -top-[12px] sm:-top-[14px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] sm:border-l-[16px] border-l-transparent border-r-[12px] sm:border-r-[16px] border-r-transparent border-b-[12px] sm:border-b-[16px] border-b-[#ffffe8]" />
                              
                              {/* Overlay Halftone Dots */}
                              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply pointer-events-none rounded-2xl sm:rounded-3xl" />
                              
                              <h5 className="inline-flex items-center gap-1.5 sm:gap-2 font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] md:text-xs bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-white shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000] rounded-xl transform -rotate-1 sm:-rotate-2 mb-4 sm:mb-6 relative z-10 transition-transform hover:rotate-0 cursor-default">
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> Historic Real-Life Role Models & Achievements
                              </h5>
                              <ul className="space-y-3 sm:space-y-4 relative z-10">
                                {item.rules.map((rule, idx) => {
                                  const [heroName, ...details] = rule.includes(': ') ? rule.split(': ') : ['', rule];
                                  return (
                                    <li key={idx} className="flex items-start gap-2.5 sm:gap-4 bg-white border-2 sm:border-4 border-black p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000] hover:bg-yellow-50 transition-all duration-200 cursor-default group/rule">
                                      <div className={`mt-0.5 p-1 rounded-full border sm:border-2 border-black shadow-[2px_2px_0px_#000] group-hover/rule:scale-110 transition-transform shrink-0 ${item.color}`}>
                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
                                      </div>
                                      <div className="w-full text-xs md:text-sm leading-snug tracking-tight font-sans">
                                        {heroName ? (
                                          <>
                                            <span className="font-black text-black uppercase tracking-wide block mb-1 text-[11px] sm:text-xs md:text-sm">
                                              ✦ {heroName}
                                            </span>
                                            <span className="text-neutral-700 font-semibold text-[11px] sm:text-xs md:text-sm leading-relaxed block">
                                              {details.join(': ')}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-black font-black uppercase text-[11px] sm:text-xs md:text-sm leading-snug tracking-tighter w-full pt-1">{rule}</span>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

              </div>
            ) : mode === 'complaint' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Voice Chat Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-8 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl min-h-[420px] sm:min-h-[500px] flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
                
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold">Voice Registration</h3>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white/5 rounded-full border border-white/10">
                      {(['Male', 'Female', 'Child'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setVoiceChoice(v)}
                          className={cn(
                            "px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all",
                            voiceChoice === v ? "bg-gold text-navy" : "text-white/40 hover:text-white"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {complaintHistory.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6 sm:py-10 space-y-6 sm:space-y-8"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                          <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 px-2">
                          <p className="text-xl sm:text-2xl font-serif font-bold">Ready to assist you</p>
                          <p className="text-xs sm:text-sm text-white/40 max-w-xs mx-auto">Please select your preferred language to begin the official voice-based complaint registration process.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto px-2">
                          {['English', 'Telugu', 'Hindi', 'English + Telugu', 'Telugu + Hindi', 'English + Hindi'].map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setLanguage(lang)}
                              className={cn(
                                "px-2.5 sm:px-4 py-2 rounded-xl border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all",
                                language === lang 
                                    ? "bg-gold text-navy border-gold shadow-lg shadow-gold/20" 
                                    : "bg-navy/40 border-white/10 text-white/40 hover:border-gold/30"
                              )}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>

                        {/* ID Upload Section */}
                        <div className="max-w-md mx-auto w-full p-4 sm:p-6 bg-gold/5 border border-gold/10 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IdCard className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Govt ID Submission</span>
                            </div>
                            {idExtracted && (
                              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Extracted
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-white/40 text-left">Upload your Aadhar, PAN, or DL to automatically pre-fill your basic information.</p>
                          
                          <label className="block">
                            <div className={cn(
                              "w-full py-3.5 sm:py-4 border-2 border-dashed rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                              isExtractingId ? "border-gold/50 bg-gold/10" : "border-white/10 hover:border-gold/30 bg-white/5"
                            )}>
                              {isExtractingId ? (
                                <>
                                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-gold animate-spin" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Extracting Details...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white/20" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Choose ID Image</span>
                                </>
                              )}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleIdUpload}
                              disabled={isExtractingId}
                            />
                          </label>
                        </div>

                        <button 
                          onClick={startComplaint}
                          className="px-8 sm:px-12 py-3.5 sm:py-4 bg-gold text-navy font-bold rounded-xl sm:rounded-2xl hover:bg-gold/90 transition-all shadow-xl shadow-gold/20 flex items-center gap-2 sm:gap-3 mx-auto group text-xs sm:text-sm uppercase tracking-wider"
                        >
                          <span>Start Registration</span>
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 sm:space-y-6"
                      >
                        {complaintHistory.slice(-2).map((msg, i) => (
                          <div key={i} className={cn(
                            "p-3.5 sm:p-6 rounded-xl sm:rounded-2xl max-w-[90%] sm:max-w-[80%]",
                            msg.role === 'model' ? "bg-royal/20 border border-royal/40 mr-auto" : "bg-gold/10 border border-gold/20 ml-auto text-right"
                          )}>
                            <p className="text-[10px] sm:text-sm font-bold text-white/40 uppercase tracking-widest mb-1.5 sm:mb-2">
                              {msg.role === 'model' ? 'Bureau Assistant' : 'You'}
                            </p>
                            <p className="text-sm sm:text-lg leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6 sm:pt-8 flex flex-col items-center gap-4 sm:gap-6">
                  {isProcessingComplaint ? (
                    <div className="flex items-center gap-2 sm:gap-3 text-gold">
                      <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">AI is thinking...</span>
                    </div>
                  ) : complaintHistory.length > 0 && !finalComplaint && (
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={cn(
                          "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-2xl",
                          isRecording ? "bg-red-500 animate-pulse scale-110" : "bg-gold hover:scale-105"
                        )}
                      >
                        {isRecording ? <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-navy" />}
                      </button>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {isRecording ? "Listening... Release to send" : "Hold to Speak"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress/Summary Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6 backdrop-blur-2xl shadow-2xl shadow-black/40">
                <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Registration Progress
                </h4>
                
                <div className="space-y-4">
                  {[
                    { label: 'Basic Information', data: complaintData.basicInfo, icon: UserCircle },
                    { label: 'Incident Details', data: complaintData.incidentDetails, icon: AlertTriangle },
                    { label: 'Accused Details', data: complaintData.accusedDetails, icon: Search },
                    { label: 'Witness Details', data: complaintData.witnessDetails, icon: Eye },
                    { label: 'Property Details', data: complaintData.propertyDetails, icon: Activity }
                  ].map((section, i) => {
                      const filledCount = Object.values(section.data).filter(v => v).length;
                      const totalCount = 4; // Assuming 4 main fields per section
                      const progress = (filledCount / totalCount) * 100;

                      return (
                        <div key={i} className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-white/60">
                              <section.icon className="w-3 h-3" />
                              <span className="font-bold uppercase tracking-widest">{section.label}</span>
                            </div>
                            <span className="font-mono text-gold">{filledCount}/{totalCount}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full bg-gold"
                            />
                          </div>
                          {filledCount > 0 && (
                            <div className="space-y-1">
                              {Object.entries(section.data).map(([key, value], idx) => value && (
                                <div key={idx} className="flex items-center gap-2 text-[10px]">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-white/80 truncate max-w-[150px]">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {finalComplaint && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-royal/10 border border-royal/20 rounded-3xl space-y-4"
                >
                  <div className="flex items-center gap-2 text-gold">
                    <FileCheck className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Bureau Complaint Generated</h4>
                  </div>
                  <div className="p-4 bg-navy/40 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto">
                    <pre className="text-[10px] leading-relaxed text-white/70 whitespace-pre-wrap font-mono">
                      {finalComplaint}
                    </pre>
                  </div>
                  <button className="w-full py-3 bg-gold text-navy font-bold rounded-xl hover:bg-gold/80 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Official PDF
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        ) : mode === 'crowd' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2">
              <button 
                onClick={() => { setMode('home'); reset(); stopLiveMonitor(); }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                <UsersRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Crowd Management Application</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column: Camera Feed Simulation or Upload */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="relative aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl group flex items-center justify-center">
                {crowdMediaType === 'image' && crowdMediaUrl ? (
                  <img 
                    src={crowdMediaUrl} 
                    alt="Crowd Media Feed" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute top-3 sm:top-6 left-3 sm:left-6 flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 z-10">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/80">Bureau Live Feed • Zone 04</span>
                </div>

                {!isLiveActive && !crowdMediaUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy/80 backdrop-blur-md space-y-4 sm:space-y-6 p-4 z-20">
                    <button 
                      onClick={() => {
                        startLiveMonitor();
                        setCrowdMediaType('video');
                      }}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gold text-navy font-bold rounded-full hover:bg-gold/90 transition-all flex items-center gap-2 sm:gap-3 shadow-2xl shadow-gold/20 hover:scale-105 text-xs sm:text-sm"
                    >
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" /> Initialize Camera Feed
                    </button>
                    
                    <div className="flex items-center gap-3 sm:gap-4 w-48 sm:w-64">
                      <div className="h-px bg-white/10 flex-grow" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-white/10 flex-grow" />
                    </div>

                    <label className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center gap-2 sm:gap-3 cursor-pointer group hover:scale-105 text-xs sm:text-sm">
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gold group-hover:scale-110 transition-transform" />
                      <span>Upload Crowd Image or Video</span>
                      <input 
                        type="file" 
                        accept="video/*,image/*" 
                        className="hidden" 
                        onChange={handleCrowdMediaUpload}
                      />
                    </label>
                  </div>
                )}

                {/* Real-time AI HUD Optical Bounding Box Overlay */}
                {crowdAnalysis?.detection?.boundingBoxes && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    <div className="absolute top-3 sm:top-6 right-3 sm:right-6 flex items-center gap-1.5 sm:gap-2 bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/40 text-[9px] sm:text-[10px] font-mono text-cyan-300">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-pulse" />
                      <span>OPTICAL TARGET TRACKING ACTIVE</span>
                    </div>

                    <div className="absolute bottom-2 sm:bottom-6 left-2 sm:left-6 right-2 sm:right-6 flex items-center justify-between bg-black/75 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 text-[10px] sm:text-xs font-mono flex-wrap gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-white/40">TARGET COUNT:</span>
                        <span className="text-gold font-black text-sm sm:text-lg">{crowdAnalysis.detection.count}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-white/40">DENSITY:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded font-black text-[9px] sm:text-[10px] uppercase",
                          crowdAnalysis.detection.density === 'Critical' ? "bg-red-500 text-white animate-pulse" :
                          crowdAnalysis.detection.density === 'High' ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {crowdAnalysis.detection.density}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/60">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[180px]">{crowdAnalysis.detection.movement}</span>
                      </div>
                    </div>

                    {crowdAnalysis.detection.boundingBoxes.map((box: any, idx: number) => (
                      <div 
                        key={idx}
                        className="absolute border-2 border-cyan-400/80 bg-cyan-500/10 rounded-lg transition-all duration-500 shadow-[0_0_12px_rgba(0,225,255,0.4)]"
                        style={{
                          top: `${box.ymin / 10}%`,
                          left: `${box.xmin / 10}%`,
                          width: `${Math.max(12, (box.xmax - box.xmin) / 10)}%`,
                          height: `${Math.max(15, (box.ymax - box.ymin) / 10)}%`,
                        }}
                      >
                        {/* Target Reticle Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300" />
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300" />
                        
                        <div className="absolute -top-5 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap">
                          {box.label || `Subject ${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isCrowdAnalyzing && (
                  <div className="absolute inset-0 bg-navy/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 sm:space-y-4 z-30 p-4 text-center">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-gold animate-spin" />
                    <p className="text-gold font-bold uppercase tracking-widest text-[10px] sm:text-xs">Analyzing Crowd Dynamics & Density...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={handleTriggerCrowdAnalysis}
                  disabled={isCrowdAnalyzing}
                  className="p-4 sm:p-6 bg-royal/20 border border-royal/40 rounded-2xl sm:rounded-3xl hover:bg-royal/30 transition-all flex flex-col items-center gap-2 sm:gap-3 group disabled:opacity-50"
                >
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Capture & Analyze</span>
                </button>

                <label className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl hover:bg-white/10 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-gold mb-1 transition-colors" />
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">Upload Crowd Feed</p>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Select image or video file</p>
                  <input 
                    type="file" 
                    accept="video/*,image/*" 
                    className="hidden" 
                    onChange={handleCrowdMediaUpload}
                  />
                </label>
              </div>
            </div>

            {/* Right Column: Crowd Analysis Results */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <AnimatePresence mode="wait">
                {!crowdAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[300px] sm:min-h-[400px] border border-white/5 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-3 sm:space-y-4"
                  >
                    <UsersRound className="w-10 h-10 sm:w-12 sm:h-12 text-white/10" />
                    <div>
                      <p className="text-base sm:text-lg font-medium text-white/40">Crowd Intelligence</p>
                      <p className="text-xs sm:text-sm text-white/20">Capture a frame to analyze density and movement</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 sm:space-y-6 overflow-y-auto max-h-[80vh] pr-1 sm:pr-2 custom-scrollbar"
                  >
                    {/* 1. Crowd Detection Card */}
                    <div className="p-4 sm:p-6 bg-royal/10 border border-royal/20 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                          <Search className="w-4 h-4" /> Crowd Detection
                        </h4>
                        <div className={cn(
                          "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                          crowdAnalysis.detection.density === 'Critical' ? "bg-red-500 text-white animate-pulse" : 
                          crowdAnalysis.detection.density === 'High' ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {crowdAnalysis.detection.density} Density
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-navy/40 rounded-xl sm:rounded-2xl border border-white/5">
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 mb-1">People Count</p>
                          <p className="text-2xl sm:text-3xl font-serif font-bold text-white">{crowdAnalysis.detection.count}</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-navy/40 rounded-xl sm:rounded-2xl border border-white/5">
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 mb-1">Tracking Status</p>
                          <p className="text-[9px] sm:text-[10px] font-medium leading-tight text-white/80">{crowdAnalysis.detection.trackingStatus}</p>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Movement & Flow</p>
                        <p className="text-xs text-white/80 leading-relaxed">{crowdAnalysis.detection.movement}</p>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">High Density Zones</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {crowdAnalysis.detection.heatmapAreas.map((area: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 sm:py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 2. Crowd Behavior Analysis */}
                    <div className="p-4 sm:p-6 bg-navy/40 border border-white/10 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4" /> Behavior Analysis
                        </h4>
                        <div className={cn(
                          "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                          crowdAnalysis.behavior.status === 'Abnormal' ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        )}>
                          {crowdAnalysis.behavior.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">Dominant Emotion</p>
                          <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2">
                            <Activity className="w-3 h-3 text-gold" /> {crowdAnalysis.behavior.emotion}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">Panic Detection</p>
                          <p className={cn(
                            "text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                            crowdAnalysis.behavior.panicDetected ? "text-red-500" : "text-emerald-500"
                          )}>
                            {crowdAnalysis.behavior.panicDetected ? "PANIC DETECTED" : "No Panic"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Group Formations</p>
                        <p className="text-xs text-white/80 leading-relaxed">{crowdAnalysis.behavior.groupFormations}</p>
                      </div>

                      {crowdAnalysis.behavior.anomalyDetails.length > 0 && (
                        <div className="space-y-1 sm:space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-white/40">Detected Anomalies</p>
                          <ul className="space-y-1">
                            {crowdAnalysis.behavior.anomalyDetails.map((anomaly: string, i: number) => (
                              <li key={i} className="text-[10px] text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 shrink-0" /> {anomaly}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 3. Crowd Management Strategies */}
                    <div className="p-4 sm:p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Management Strategies
                      </h4>

                      {crowdAnalysis.management.alertNeeded && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-red-400 uppercase">Immediate Alert Triggered</p>
                            <p className="text-[9px] text-red-300/70">{crowdAnalysis.management.alertReason}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Flow Control & Smooth Lines</p>
                          <p className="text-xs text-white/80 italic">"{crowdAnalysis.management.flowControl}"</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Crowd Clearing Strategy</p>
                          <p className="text-xs text-white/80 italic">"{crowdAnalysis.management.crowdClearing}"</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Actionable Plan</p>
                          <ul className="list-decimal pl-4 space-y-1">
                            {crowdAnalysis.management.actionablePlan?.map((step: string, idx: number) => (
                              <li key={idx} className="text-xs text-white/80 italic">"{step}"</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Resource Allocation</p>
                          <p className="text-xs text-white/80 italic">"{crowdAnalysis.management.resourceDeployment}"</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Emergency Handling</p>
                          <p className="text-xs text-white/80 italic">"{crowdAnalysis.management.emergencyPlan}"</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        ) : mode === 'live' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <button 
                onClick={() => { setMode('home'); reset(); stopLiveMonitor(); }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </button>
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-xs">
                <Monitor className="w-4 h-4 shrink-0" />
                <span>Live Monitor Application</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Live Feed Column */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <div className="relative aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!isLiveActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy/60 backdrop-blur-sm p-4 space-y-4 sm:space-y-6">
                    <Camera className="w-10 h-10 sm:w-16 sm:h-16 text-white/20" />
                    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-xs">
                      <button 
                        onClick={startLiveMonitor}
                        className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gold text-navy font-bold rounded-full hover:bg-gold/80 transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        <Camera className="w-4 h-4" /> Initialize Live Feed
                      </button>
                      
                      <div className="flex items-center gap-4 w-40 sm:w-48">
                        <div className="h-px bg-white/10 flex-grow" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">OR</span>
                        <div className="h-px bg-white/10 flex-grow" />
                      </div>

                      <label className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer group text-xs sm:text-sm">
                        <Upload className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                        <span>Upload Video</span>
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          onChange={handleVideoUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {isLiveActive && (
                  <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Bureau Monitor Active</span>
                  </div>
                )}

                {isLiveAnalyzing && (
                  <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gold/20 border border-gold/40 backdrop-blur-md rounded-full">
                    <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold animate-spin" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gold">Processing Intent...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-royal/10 border border-royal/20 rounded-2xl sm:rounded-3xl gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-xl flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">Real-time Emotional Analysis</p>
                    <p className="text-xs text-white/40">Detecting intent and behavior patterns</p>
                  </div>
                </div>
                <button 
                  onClick={stopLiveMonitor}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-xs sm:text-sm font-medium text-center"
                >
                  Stop Monitor
                </button>
              </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              <AnimatePresence mode="wait">
                {!liveAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[260px] sm:min-h-[400px] border border-white/5 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-4"
                  >
                    <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white/10 animate-pulse" />
                    <p className="text-xs sm:text-sm text-white/30">Scanning for entities and emotional triggers...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    {/* Risk Score */}
                    <div className={cn(
                      "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-500",
                      liveAnalysis.riskScore === 'HIGH' ? "bg-red-500/10 border-red-500/20" : 
                      liveAnalysis.riskScore === 'MEDIUM' ? "bg-orange-500/10 border-orange-500/20" : 
                      "bg-gold/10 border-gold/20"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Risk Assessment</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          liveAnalysis.riskScore === 'HIGH' ? "bg-red-500 text-white" : 
                          liveAnalysis.riskScore === 'MEDIUM' ? "bg-orange-500 text-white" : 
                          "bg-gold text-navy"
                        )}>
                          {liveAnalysis.riskScore}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="space-y-1">
                          <p className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{liveAnalysis.emotion}</p>
                          <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest">Primary Emotion</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-mono font-bold text-gold">{(liveAnalysis.confidence * 100).toFixed(0)}%</p>
                          <p className="text-[9px] sm:text-[10px] text-white/20 uppercase tracking-widest">Confidence</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="p-4 sm:p-5 bg-royal/10 border border-royal/20 rounded-xl sm:rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-white/40 mb-1">
                          <Activity className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Body Language</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">{liveAnalysis.bodyLanguage}</p>
                      </div>

                      <div className="p-4 sm:p-5 bg-royal/10 border border-royal/20 rounded-xl sm:rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-white/40 mb-1">
                          <BrainCircuit className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Behavior Pattern</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">{liveAnalysis.behaviorPattern}</p>
                      </div>

                      <div className="p-4 sm:p-5 bg-royal/10 border border-royal/20 rounded-xl sm:rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-white/40 mb-1">
                          <Search className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Intent Inference</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gold/80 leading-relaxed font-medium">"{liveAnalysis.intentInference}"</p>
                      </div>
                    </div>

                    {/* Alert Banner */}
                    {liveAnalysis.riskScore === 'HIGH' && (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-red-500 text-white rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xl shadow-red-500/20"
                      >
                        <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 animate-bounce" />
                        <div>
                          <p className="font-bold text-xs sm:text-sm">CRITICAL ALERT</p>
                          <p className="text-[11px] sm:text-xs opacity-80">Suspicious intent detected. Immediate intervention recommended.</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <button 
                onClick={() => { setMode('home'); reset(); stopLiveMonitor(); }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </button>
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-xs">
                <Upload className="w-4 h-4 shrink-0" />
                <span>Upload Analysis Application</span>
              </div>
            </div>
            {!videoFile ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center space-y-6 sm:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight leading-tight">
                National Forensic <br />
                <span className="text-gold italic">Investigation Bureau</span>
              </h2>
              <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-md mx-auto">
                Official platform for automated incident detection, entity tracking, and forensic reporting.
              </p>
            </div>

            {/* Serverless Upload Notice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left max-w-xl mx-auto shadow-lg shadow-amber-500/5 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-amber-300 uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-2">
                    <span>Evidence Video Upload Notice</span>
                    <span className="px-2 py-0.5 text-[9px] bg-amber-400/20 text-amber-200 rounded-full font-mono font-bold">Max ~3.5 MB</span>
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    Please upload video clips <strong className="text-amber-200 font-bold">under 3.5 MB</strong> (recommended: short 5–15 second clips in 480p or 720p). This ensures instant processing within serverless limits and rapid forensic reporting.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl flex items-center gap-3 text-red-300 max-w-xl mx-auto text-left shadow-lg">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <p className="text-xs sm:text-sm">{error}</p>
              </div>
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative border-2 border-dashed border-gold/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 transition-all hover:border-gold/50 hover:bg-gold/5 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                </div>
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-medium text-white">Submit Evidence for Analysis</p>
                  <p className="text-xs sm:text-sm text-amber-300 font-semibold">Recommended: Short clip under 3.5 MB</p>
                  <p className="text-[11px] text-white/40">MP4, WebM, MOV or AVI formats</p>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-8">
              {[
                { icon: Search, label: "Object Detection" },
                { icon: Activity, label: "Action Recognition" },
                { icon: FileText, label: "Auto Reporting" }
              ].map((item, i) => (
                <div key={i} className="p-3 sm:p-4 bg-royal/10 border border-royal/20 rounded-xl sm:rounded-2xl space-y-2">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto" />
                  <p className="text-xs font-medium text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column: Video & Controls */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              >
                {videoUrl && (
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 space-y-4 sm:space-y-6">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 border-4 border-gold/20 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 border-t-4 border-gold rounded-full animate-spin" />
                    </div>
                    <div className="text-center space-y-1 sm:space-y-2">
                      <p className="text-lg sm:text-xl font-serif font-bold tracking-tight">Analyzing Evidence...</p>
                      <p className="text-xs sm:text-sm text-white/40 animate-pulse">Running National Forensic Protocols</p>
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[180px] sm:max-w-[200px] text-sm sm:text-base">{videoFile.name}</p>
                    <p className="text-xs text-white/40">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  <button 
                    onClick={reset}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 sm:flex-none px-5 sm:px-8 py-2.5 bg-gold text-navy font-bold rounded-full hover:bg-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    {isAnalyzing ? "Processing..." : "Start Bureau Investigation"}
                    {!isAnalyzing && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-xs sm:text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Right Column: Analysis Results */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <AnimatePresence mode="wait">
                {!report ? (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full min-h-[260px] sm:min-h-[400px] border border-white/5 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-4"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-medium text-white/40">Awaiting Analysis</p>
                      <p className="text-xs sm:text-sm text-white/20">Start the investigation to generate the report</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="report"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    {/* Status Card */}
                    <div className="p-4 sm:p-6 bg-royal/10 border border-royal/20 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-gold shrink-0" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gold">Investigation Complete</span>
                        </div>
                        <div className={cn(
                          "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                          report.scores.riskLevel === 'HIGH' ? "bg-red-500 text-white" : "bg-gold text-navy"
                        )}>
                          {report.scores.riskLevel} RISK
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-serif font-bold">{report.caseType}</h3>
                        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{report.summary}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-4 sm:p-6 bg-navy/40 border border-white/10 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Activity className="w-4 h-4 shrink-0" /> Bureau Timeline
                      </h4>
                      <div className="space-y-4 sm:space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                        {report.timeline.map((event, i) => (
                          <div key={i} className="relative pl-7 sm:pl-8 group">
                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-navy border-2 border-white/20 rounded-full flex items-center justify-center group-hover:border-gold transition-colors">
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full group-hover:bg-gold" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gold font-bold">{event.time}</span>
                                <span className="text-[10px] text-white/20 font-mono">Conf: {(event.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <p className="text-xs sm:text-sm text-white/80">{event.event}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entities */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Suspects</p>
                        <ul className="space-y-1">
                          {report.entities.suspects.map((s, i) => (
                            <li key={i} className="text-xs text-white/60">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Victims</p>
                        <ul className="space-y-1">
                          {report.entities.victims.map((v, i) => (
                            <li key={i} className="text-xs text-white/60">• {v}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Dynamic Q&A */}
                    <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 shrink-0" /> Professional Intelligence Q&A
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        {report.dynamicQA.map((qa, i) => (
                          <div key={i} className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                            <p className="text-xs font-bold text-emerald-500 italic">Q: {qa.question}</p>
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-serif">A: {qa.answer}</p>
                          </div>
                        ))}
                        {customQA.map((qa, i) => (
                          <div key={`custom-${i}`} className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-royal/10 rounded-xl sm:rounded-2xl border border-royal/20">
                            <p className="text-xs font-bold text-gold italic">Officer: {qa.question}</p>
                            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-serif">Viksit Andhra: {qa.answer}</p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Ask bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                        <input 
                          type="text"
                          value={evidenceQuestion}
                          onChange={(e) => setEvidenceQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                          placeholder="Ask a specific professional question about this evidence..."
                          className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-gold transition-colors text-white placeholder-white/30"
                        />
                        <button 
                          onClick={handleAskQuestion}
                          disabled={isAskingQuestion || !evidenceQuestion.trim()}
                          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gold text-navy font-bold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          {isAskingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Incident Narrative (Fact Story) */}
                    <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <FileText className="w-4 h-4 shrink-0" /> Incident Narrative
                      </h4>
                      <div className="p-3 sm:p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl sm:rounded-2xl">
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-serif italic">
                          {report.factStory}
                        </p>
                      </div>
                    </div>

                    {/* Conclusion & Export */}
                    <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Final Conclusion</p>
                        <p className="text-xs sm:text-sm text-white/80 italic leading-relaxed">"{report.conclusion}"</p>
                      </div>
                      <button className="w-full py-2.5 sm:py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm">
                        <Download className="w-4 h-4" /> Download Full Report (PDF)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    )}
  </>
)}
  </main>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-8 sm:py-12 bg-navy/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
          <div className="flex items-center gap-2 opacity-40">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gold shrink-0" />
            <span className="text-[10px] sm:text-xs font-serif font-bold tracking-widest uppercase text-gold">Case Study</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-5 w-full sm:w-auto justify-center">
            {/* Clickable Profile Photo Logo */}
            <a
              href="https://www.linkedin.com/in/hasini-yarla-9ab705357/"
              target="_blank"
              rel="noopener noreferrer"
              title="Hasini Yarla | LinkedIn Profile"
              className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-rose-500 to-amber-400 shadow-[0_0_20px_rgba(0,200,255,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] shrink-0 overflow-hidden hover:scale-110 transition-all duration-300 group cursor-pointer block"
            >
              <img 
                src="/hasini_photo.png" 
                alt="Hasini Yarla" 
                className="w-full h-full object-cover object-top rounded-full bg-slate-900 group-hover:scale-105 transition-transform duration-300 select-none"
              />
            </a>

            {/* Email Contact Button */}
            <a 
              href="mailto:hasiniyarla6@gmail.com" 
              className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 md:px-6 md:py-3 rounded-full bg-white/5 border border-rose-500/30 hover:border-rose-500/70 hover:bg-rose-500/10 text-white/90 hover:text-white text-xs sm:text-sm md:text-base font-mono font-medium tracking-wide transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105 max-w-full truncate"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">hasiniyarla6@gmail.com</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
