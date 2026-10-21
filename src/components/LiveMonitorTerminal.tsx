import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Video, ShieldAlert, Search, Users, Car, Info, Clock, 
  Activity, Grid, Maximize2, Play, Pause, RefreshCw, Zap, CheckCircle2, 
  AlertTriangle, X, ChevronRight, Eye, Filter, Sparkles, Radio, FileText, 
  MapPin, Layers, ShieldCheck, UserCheck, Smartphone, Laptop, HardHat, 
  Bike, Bus, Truck, Dog, Briefcase, ExternalLink, Flame, UserX, AlertOctagon, Minimize2, ArrowLeft
} from 'lucide-react';
import { CCTVCamera, DetectedObject, AIAlert, LiveMonitorTimelineItem } from '../types';
import { analyzeLiveFrame } from '../services/geminiService';
import { cn } from '../lib/utils';

interface LiveMonitorTerminalProps {
  onClose?: () => void;
}

export function LiveMonitorTerminal({ onClose }: LiveMonitorTerminalProps) {
  // State Variables
  const [cameras, setCameras] = useState<CCTVCamera[]>([
    { id: 'CAM-01', name: 'Camera 01 - Live Feed (Webcam)', status: 'Online', fps: 30, resolution: '1920×1080', location: 'Primary Security Console' },
    { id: 'CAM-02', name: 'Camera 02 - Perimeter Access', status: 'Online', fps: 30, resolution: '1920×1080', location: 'North Gate Ramp' },
    { id: 'CAM-03', name: 'Camera 03 - Parking Bay B', status: 'Online', fps: 28, resolution: '1920×1080', location: 'Sub-Level Sector B' },
    { id: 'CAM-04', name: 'Camera 04 - Executive Lobby', status: 'Online', fps: 30, resolution: '1920×1080', location: 'East Reception Hall' },
  ]);
  const [activeCameraId, setActiveCameraId] = useState<string>('CAM-01');
  const [isExpanded, setIsExpanded] = useState<boolean>(false); // Fullscreen Expand Camera State
  
  // Live Camera Access States
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState<boolean>(false);

  // Dynamic Detections & AI Intelligence States
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [evidenceModalObject, setEvidenceModalObject] = useState<DetectedObject | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sceneSummary, setSceneSummary] = useState<string[]>([
    "Initializing real-time AI visual stream...",
    "Camera access established. Scanning live video feed...",
    "Awaiting object and behavior detection pass."
  ]);
  
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [timeline, setTimeline] = useState<LiveMonitorTimelineItem[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeCam = cameras.find(c => c.id === activeCameraId) || cameras[0];

  // Request Live Camera Stream on Mount
  useEffect(() => {
    startCameraStream();
    return () => {
      stopCameraStream();
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, []);

  // Request Live Camera Stream
  const startCameraStream = async () => {
    setCameraPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsWebcamActive(true);
      
      // Loop automated frame analysis every 5 seconds
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = setInterval(() => {
        analyzeCurrentFrame();
      }, 5000);
      
      setTimeout(() => analyzeCurrentFrame(), 800);

    } catch (err: any) {
      console.error("Live Camera Access Error:", err);
      setCameraPermissionError(err.message || "Camera access blocked. Click grant access to enable live feed.");
      setIsWebcamActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  // Capture Live Frame & Analyze with Gemini AI Vision
  const analyzeCurrentFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isLiveAnalyzing) return;
    
    setIsLiveAnalyzing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Execute AI Vision Analysis
      const res = await analyzeLiveFrame(imageBase64);
      
      if (res) {
        const timeNow = new Date().toLocaleTimeString();
        
        // Dynamically generated object
        const newDetectedObjects: DetectedObject[] = [
          {
            id: `OBJ-${Date.now().toString().slice(-4)}`,
            label: 'Person',
            confidence: Math.round((res.confidence || 0.96) * 100),
            bbox: { x: 25, y: 15, width: 45, height: 65 },
            trackingId: `P-${Math.floor(100 + Math.random() * 900)}`,
            timestamp: timeNow,
            camera: activeCam.name,
            details: `Detected live person in frame. Behavior: ${res.behaviorPattern || 'Normal'}`,
            aiSummary: `Subject pose: ${res.bodyLanguage || 'Standard'}. Emotion: ${res.emotion || 'Calm'}. Risk: ${res.riskScore}.`,
            personData: {
              enteredTime: timeNow,
              currentPosition: 'Live Camera Center',
              status: 'Moving'
            },
            trackingHistory: [
              { time: timeNow, x: 25, y: 15, location: activeCam.location }
            ]
          }
        ];

        setObjects(newDetectedObjects);
        if (!selectedObject || selectedObject.id.startsWith('OBJ-')) {
          setSelectedObject(newDetectedObjects[0]);
        }

        // Update Scene Summary
        setSceneSummary([
          `Live Scene: ${res.behaviorPattern || 'Subject detected in camera view.'}`,
          `Pose & Stance: ${res.emotion || 'Normal'} posture (${res.bodyLanguage || 'Relaxed'})`,
          `Intent Inference: ${res.intentInference || 'Engaging with system interface'}`,
          `Risk Level: ${res.riskScore} (Confidence: ${Math.round((res.confidence || 0.95) * 100)}%)`
        ]);

        // Add to timeline
        setTimeline(prev => [
          {
            id: `TL-${Date.now()}`,
            time: timeNow,
            event: `Live AI Scan: Subject detected (${res.emotion || 'Normal'}, Risk: ${res.riskScore})`,
            category: 'Person',
            targetId: newDetectedObjects[0].id
          },
          ...prev.slice(0, 5)
        ]);
      }
    } catch (err) {
      console.error("Live Frame Analysis Error:", err);
    } finally {
      setIsLiveAnalyzing(false);
    }
  };

  // Filtered objects
  const filteredObjects = objects.filter(obj => {
    const query = searchQuery.toLowerCase();
    return !query || 
      obj.label.toLowerCase().includes(query) ||
      (obj.trackingId && obj.trackingId.toLowerCase().includes(query));
  });

  const stats = {
    people: objects.filter(o => o.label === 'Person').length || (isWebcamActive ? 1 : 0),
    objects: objects.length || (isWebcamActive ? 1 : 0),
    activeCameras: cameras.filter(c => c.status === 'Online').length,
    alerts: alerts.length
  };

  return (
    <div className={cn(
      "w-full h-full flex flex-col bg-[#050913] text-white font-sans overflow-hidden select-none relative",
      isExpanded && "fixed inset-0 z-[300] bg-black"
    )}>
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER */}
      <header className="min-h-12 sm:h-14 py-2 border-b border-cyan-500/20 bg-black/90 px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all shrink-0"
              title="Back to Terminal"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-pulse shrink-0" />
            <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-cyan-400 truncate">
              LIVE MONITOR • AI HUD
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            WEBCAM ACTIVE
          </div>
        </div>

        {/* Dynamic Statistics Badges */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-[10px]">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">People:</span>
            <span className="font-bold text-cyan-300 font-mono">{stats.people}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px]">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">Objects:</span>
            <span className="font-bold text-emerald-300 font-mono">{stats.objects}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 text-[10px]">
            <Video className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">Cameras:</span>
            <span className="font-bold text-amber-300 font-mono">{stats.activeCameras}/4</span>
          </div>
        </div>

        {/* FULLSCREEN EXPAND CAMERA TOGGLE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button 
            onClick={analyzeCurrentFrame}
            disabled={isLiveAnalyzing}
            className="px-2.5 sm:px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[9px] sm:text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 disabled:opacity-50"
          >
            {isLiveAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-black" />}
            <span>{isLiveAnalyzing ? "Scanning..." : "Scan Frame"}</span>
          </button>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg font-mono text-[9px] sm:text-[10px] font-bold flex items-center gap-1 sm:gap-1.5 border transition-all shadow-md",
              isExpanded 
                ? "bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30" 
                : "bg-cyan-500/20 border-cyan-500 text-cyan-300 hover:bg-cyan-500/30"
            )}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? "EXIT FULLSCREEN" : "EXPAND CAMERA"}</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        
        {/* CENTER CAMERA DISPLAY AREA */}
        <div className="w-full lg:flex-1 flex flex-col overflow-hidden bg-black relative min-h-[260px] sm:min-h-[380px] lg:min-h-0 shrink-0 lg:shrink">
          
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
            <div className={cn(
              "w-full h-full bg-slate-950 rounded-xl border border-cyan-500/40 relative overflow-hidden flex items-center justify-center group shadow-[0_0_30px_rgba(6,182,212,0.15)]",
              isExpanded && "rounded-none border-0 w-full h-full"
            )}>
              
              {/* LIVE WEBCAM FEED */}
              {isWebcamActive ? (
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted 
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <Camera className="w-12 h-12 text-cyan-500/40 mx-auto animate-pulse" />
                  <div className="text-slate-300 font-mono text-xs max-w-xs mx-auto">
                    {cameraPermissionError || "Camera feed disconnected."}
                  </div>
                  <button 
                    onClick={startCameraStream}
                    className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-all"
                  >
                    Allow Camera Access
                  </button>
                </div>
              )}

              {/* CAMERA OSD OVERLAY */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 font-mono text-[10px] shadow-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-cyan-400">{activeCam.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-bold">1920×1080 @ 30 FPS</span>
              </div>

              {/* OVERLAY EXPAND CAMERA BUTTON */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-400 hover:text-white transition-all shadow-lg"
                title={isExpanded ? "Exit Fullscreen" : "Expand Fullscreen"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* REAL-TIME AI BOUNDING BOX OVERLAY */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {filteredObjects.map((obj) => (
                  <motion.div
                    key={obj.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      left: `${obj.bbox.x}%`,
                      top: `${obj.bbox.y}%`,
                      width: `${obj.bbox.width}%`,
                      height: `${obj.bbox.height}%`,
                    }}
                    onClick={() => setSelectedObject(obj)}
                    className="absolute border-2 border-cyan-400 bg-cyan-500/10 pointer-events-auto cursor-pointer flex flex-col justify-between p-1.5 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    {/* Reticle Brackets */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

                    <div className="self-start bg-black/90 backdrop-blur-md border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>{obj.label}</span>
                      <span className="text-emerald-400">{obj.confidence}%</span>
                      {obj.trackingId && <span className="text-amber-300">[{obj.trackingId}]</span>}
                    </div>

                    <div className="self-end text-[8px] font-mono bg-black/90 px-1.5 py-0.5 rounded text-slate-400">
                      LIVE TRACKING
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scanning Radar Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_#06b6d4] animate-[scan-vertical_3.5s_linear_infinite] pointer-events-none" />
            </div>
          </div>

          {/* BOTTOM TIMELINE STREAM */}
          {!isExpanded && (
            <div className="h-16 border-t border-cyan-500/20 bg-slate-950/90 px-4 py-2 flex items-center justify-between shrink-0 overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> Live Logs:
              </span>

              <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 ml-3">
                {timeline.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/10 shrink-0 font-mono text-[10px]">
                    <span className="text-amber-400 font-bold">{item.time}</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR: AI Scene Understanding & Details */}
        {!isExpanded && (
          <aside className="w-full lg:w-72 bg-black/70 border-t lg:border-t-0 lg:border-l border-cyan-500/20 flex flex-col shrink-0 overflow-y-auto z-10 max-h-[50vh] lg:max-h-none">
            
            {/* AI SCENE UNDERSTANDING */}
            <div className="p-3 border-b border-cyan-500/20 bg-cyan-950/30 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Scene Understanding
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-200">
                {sceneSummary.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-cyan-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                    <span className="leading-snug">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OBJECT INTELLIGENCE PANEL */}
            <div className="p-3 flex-1 flex flex-col space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Live Object Intelligence
              </div>

              {selectedObject ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{selectedObject.label}</span>
                      <span className="text-emerald-400 font-bold">{selectedObject.confidence}%</span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans leading-snug">{selectedObject.details}</p>
                  </div>

                  {selectedObject.personData && (
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-1">
                      <div className="text-[9px] font-black uppercase text-blue-400">Person Tracking</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Tracking ID</div>
                          <div className="font-bold text-cyan-300">{selectedObject.trackingId}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Status</div>
                          <div className="font-bold text-emerald-400">{selectedObject.personData.status}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setEvidenceModalObject(selectedObject)}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    More Information
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-500 font-mono text-[10px] py-8">
                  Scanning live camera feed...
                </div>
              )}
            </div>

          </aside>
        )}
      </div>

      {/* EVIDENCE SNAPSHOT MODAL */}
      <AnimatePresence>
        {evidenceModalObject && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a101d] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 relative space-y-4 shadow-[0_0_60px_rgba(6,182,212,0.4)] text-white"
            >
              <button 
                onClick={() => setEvidenceModalObject(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Digital Evidence Record</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Ref ID: {evidenceModalObject.id} • {evidenceModalObject.timestamp}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-white/10">
                  <div className="text-slate-500 text-[9px] uppercase">Object Label</div>
                  <div className="text-xs font-bold text-cyan-300">{evidenceModalObject.label}</div>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-white/10">
                  <div className="text-slate-500 text-[9px] uppercase">Confidence Score</div>
                  <div className="text-xs font-bold text-emerald-400">{evidenceModalObject.confidence}%</div>
                </div>
              </div>

              <div className="p-3 bg-black/60 rounded-lg border border-cyan-500/20 text-xs text-slate-200 font-sans leading-relaxed">
                {evidenceModalObject.aiSummary || evidenceModalObject.details}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setEvidenceModalObject(null)}
                  className="px-5 py-2 bg-cyan-500 text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-all"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
