import React from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface TerminalButtonProps {
  onClick: () => void;
}

export function TerminalButton({ onClick }: TerminalButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative group overflow-hidden rounded-2xl p-1",
        "bg-gradient-to-b from-gray-700 via-gray-900 to-black",
        "border-2 border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)]",
        "transition-all duration-300"
      )}
    >
      {/* Edge lighting / Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-400/30 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/20 to-amber-500/0 opacity-50 group-hover:opacity-0 transition-opacity duration-500 blur-md" />

      {/* Scanning Light */}
      <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[scan_3s_ease-in-out_infinite]" />

      {/* Holographic Ripple on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:animate-pulse bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay transition-opacity duration-500" />

      {/* Inner Button Content */}
      <div className="relative flex items-center justify-center gap-4 px-8 py-4 bg-black/60 backdrop-blur-xl rounded-xl border border-white/5">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 group-hover:border-blue-400 group-hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.8)]">
          <Terminal className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/70 group-hover:text-cyan-400 transition-colors">
            Premium Access
          </span>
          <span className="text-lg font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Launch Viksit Andhra Command Center
          </span>
        </div>
      </div>
    </motion.button>
  );
}
