import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, Upload, UsersRound, BrainCircuit, 
  ShieldAlert, ScanFace, Users, Settings, 
  ArrowLeft, Activity, Database, Radio 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveMonitorTerminal } from './LiveMonitorTerminal';


interface CommandTerminalProps {
  onBack: () => void;
}

const BOOT_MESSAGES = [
  "Initializing Viksit Andhra...",
  "Loading AI Vision Engine...",
  "Connecting Surveillance Network...",
  "Behavioral Intelligence Ready...",
  "Crowd Analytics Online...",
  "Crisis Response Active...",
];

export function CommandTerminal({ onBack }: CommandTerminalProps) {
  const [bootPhase, setBootPhase] = useState<'boot' | 'ready'>('boot');
  const [bootMessages, setBootMessages] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>('Live Monitor');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < BOOT_MESSAGES.length) {
        setBootMessages(prev => [...prev, BOOT_MESSAGES[msgIndex]]);
        msgIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootPhase('ready'), 1000);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const handleModuleClick = (moduleName: string) => {
    if (activeModule === moduleName) return;
    setConnecting(true);
    setActiveModule(null);
    setTimeout(() => {
      setActiveModule(moduleName);
      setConnecting(false);
    }, 800);
  };

  const leftButtons = [
    { name: 'Live Monitor', icon: Monitor },
    { name: 'Upload Analysis', icon: Upload },
    { name: 'Crowd Management', icon: UsersRound },
    { name: 'Behavioral Intelligence', icon: BrainCircuit },
  ];

  const rightButtons = [
    { name: 'Crisis Management', icon: ShieldAlert },
    { name: 'Face Verification', icon: ScanFace },
    { name: 'Queue Intelligence', icon: Users },
    { name: 'Administration', icon: Settings },
  ];

  if (bootPhase === 'boot') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-cyan-500 overflow-hidden p-4 sm:p-8">
        <div className="w-full max-w-2xl text-left space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 mb-4 sm:mb-8">
            <Radio className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse text-amber-500 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white">SYSTEM BOOT</h1>
          </div>
          <AnimatePresence>
            {bootMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs sm:text-base md:text-lg flex items-center gap-2 sm:gap-4"
              >
                <span className="text-white/40 shrink-0">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span>
                <span className="truncate">{msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="mt-4 sm:mt-8">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: `${(bootMessages.length / BOOT_MESSAGES.length) * 100}%` }}
                className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#050505] z-[100] flex flex-col overflow-y-auto lg:overflow-hidden font-sans selection:bg-cyan-500/30"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050505] to-[#050505]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-30" />
        {/* Radar Line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[2px] bg-cyan-500/20 blur-sm animate-[radar-spin_4s_linear_infinite]" style={{ transformOrigin: 'center' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 min-h-14 sm:h-16 py-2 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse shrink-0" />
          <span className="text-white font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs">Viksit Andhra Terminal Active</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] uppercase font-bold text-white/40 tracking-widest">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Network: SECURE</span>
          <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Core: ONLINE</span>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 lg:p-8 gap-3 sm:gap-6 lg:gap-8 overflow-y-auto">
        
        {/* Left ATM Buttons */}
        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-4 lg:gap-6 w-full lg:w-64 shrink-0">
          {leftButtons.map((btn, i) => (
            <AtmButton 
              key={i} 
              icon={btn.icon} 
              label={btn.name} 
              active={activeModule === btn.name}
              onClick={() => handleModuleClick(btn.name)}
              align="left"
            />
          ))}
        </div>

        {/* Center 16:9 Display */}
        <div className="w-full flex-1 max-w-5xl aspect-video min-h-[220px] sm:min-h-[320px] bg-black rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col group shrink-0 lg:shrink">
          {/* Edge Glow */}
          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(6,182,212,0.1)] pointer-events-none" />
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_10px_#06b6d4] animate-[scan-vertical_3s_ease-in-out_infinite]" />
          
          <AnimatePresence mode="wait">
            {connecting ? (
              <motion.div 
                key="connecting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 p-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-cyan-500/20 rounded-full animate-spin border-t-cyan-500" />
                  <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-amber-500/20 rounded-full animate-spin-reverse border-b-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-cyan-400 font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase text-xs sm:text-sm animate-pulse text-center">
                  Establishing Secure Connection...
                </div>
              </motion.div>
            ) : activeModule === 'Live Monitor' ? (
              <motion.div 
                key="live-monitor"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 z-[150] bg-[#050913] flex flex-col"
              >
                <LiveMonitorTerminal onClose={() => setActiveModule(null)} />
              </motion.div>
            ) : activeModule ? (

              <motion.div 
                key="module"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-8 lg:p-12 text-center"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30 mb-3 sm:mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                  {React.createElement(
                    [...leftButtons, ...rightButtons].find(b => b.name === activeModule)?.icon || Activity, 
                    { className: "w-7 h-7 sm:w-10 sm:h-10 text-cyan-400" }
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2 sm:mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  {activeModule}
                </h2>
                <p className="text-cyan-100/60 max-w-lg font-mono text-xs sm:text-sm leading-relaxed px-2">
                  Module successfully connected to Viksit Andhra Core. Systems are optimal. Real-time data stream established and awaiting input.
                </p>
                {/* Holographic Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none mix-blend-screen" />
              </motion.div>
            ) : null}

          </AnimatePresence>
        </div>

        {/* Right ATM Buttons */}
        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-4 lg:gap-6 w-full lg:w-64 shrink-0">
          {rightButtons.map((btn, i) => (
            <AtmButton 
              key={i} 
              icon={btn.icon} 
              label={btn.name} 
              active={activeModule === btn.name}
              onClick={() => handleModuleClick(btn.name)}
              align="right"
            />
          ))}
        </div>
      </main>

      {/* Footer Back Button */}
      <footer className="relative z-10 h-16 sm:h-24 flex items-center justify-center shrink-0 px-4">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full transition-all text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Back to Homepage</span>
        </button>
      </footer>
    </motion.div>
  );
}

function AtmButton({ icon: Icon, label, active, onClick, align }: { icon: any, label: string, active: boolean, onClick: () => void, align: 'left' | 'right' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl transition-all duration-300 w-full",
        "bg-gradient-to-br from-gray-800 to-gray-900 border sm:border-2 shadow-[4px_4px_15px_rgba(0,0,0,0.8),inset_-2px_-2px_10px_rgba(255,255,255,0.05)]",
        active 
          ? "border-cyan-500 bg-cyan-900/30 scale-[1.02] sm:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]" 
          : "border-gray-700 hover:border-gray-500 hover:scale-[1.02] sm:hover:scale-105",
        align === 'right' ? "flex-row-reverse text-right lg:flex-row-reverse" : "flex-row text-left"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black border shrink-0",
        active ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "border-gray-700"
      )}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", active ? "text-cyan-400" : "text-gray-400")} />
      </div>
      <span className={cn(
        "font-bold uppercase tracking-wider text-[9px] sm:text-[11px] truncate flex-1",
        active ? "text-cyan-400" : "text-gray-400"
      )}>
        {label}
      </span>
      {/* Connector Line Animation */}
      {active && (
        <div className={cn(
          "hidden lg:block absolute top-1/2 -translate-y-1/2 w-8 h-[2px] bg-cyan-500 shadow-[0_0_10px_#06b6d4]",
          align === 'left' ? "-right-8" : "-left-8"
        )}>
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-full bg-white animate-pulse" />
        </div>
      )}
    </button>
  );
}
