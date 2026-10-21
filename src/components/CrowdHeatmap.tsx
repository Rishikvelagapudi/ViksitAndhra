import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Flame, ShieldAlert, AlertTriangle, Layers, Info, RefreshCw, Zap, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';

export function getOccupancyColor(val: number) {
  const percentage = Math.min(100, Math.max(0, Math.round(val)));
  if (percentage <= 25) {
    return {
      bracket: '0–25%',
      colorName: 'Green',
      status: 'Low Density (Normal)',
      hex: '#22c55e',
      bg: 'bg-emerald-500',
      bgSubtle: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.35)]',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      isDarkRed: false,
    };
  } else if (percentage <= 50) {
    return {
      bracket: '26–50%',
      colorName: 'Light Yellow',
      status: 'Moderate Density',
      hex: '#fef08a',
      bg: 'bg-yellow-200',
      bgSubtle: 'bg-yellow-950/30',
      text: 'text-yellow-200',
      border: 'border-yellow-300/40',
      glow: 'shadow-[0_0_20px_rgba(254,240,138,0.35)]',
      badgeBg: 'bg-yellow-200/20 text-yellow-200 border-yellow-200/40',
      isDarkRed: false,
    };
  } else if (percentage <= 75) {
    return {
      bracket: '51–75%',
      colorName: 'Yellow',
      status: 'Substantial Density',
      hex: '#eab308',
      bg: 'bg-yellow-500',
      bgSubtle: 'bg-amber-950/40',
      text: 'text-yellow-400',
      border: 'border-yellow-500/50',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.35)]',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      isDarkRed: false,
    };
  } else if (percentage <= 90) {
    return {
      bracket: '76–90%',
      colorName: 'Red',
      status: 'High Density Warning',
      hex: '#ef4444',
      bg: 'bg-red-500',
      bgSubtle: 'bg-red-950/40',
      text: 'text-red-400',
      border: 'border-red-500/60',
      glow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50',
      isDarkRed: false,
    };
  } else {
    // 91 - 100% (Crosses 90%) -> Dark Red
    return {
      bracket: '91–100%',
      colorName: 'Dark Red',
      status: 'CRITICAL OVERCROWDING (>90%)',
      hex: '#7f1d1d',
      bg: 'bg-red-950',
      bgSubtle: 'bg-red-950/90',
      text: 'text-red-300',
      border: 'border-red-600',
      glow: 'shadow-[0_0_35px_rgba(127,29,29,0.85)] animate-pulse',
      badgeBg: 'bg-red-900/90 text-red-200 border-red-500 animate-pulse',
      isDarkRed: true,
    };
  }
}

interface ZoneData {
  id: string;
  name: string;
  occupancy: number;
}

interface CrowdHeatmapProps {
  occupancyPercent?: number;
  isLiveFeedActive?: boolean;
  onOccupancyChange?: (newVal: number) => void;
}

export function CrowdHeatmap({ occupancyPercent = 35, isLiveFeedActive = false, onOccupancyChange }: CrowdHeatmapProps) {
  const [currentOccupancy, setCurrentOccupancy] = useState<number>(occupancyPercent);
  const [manualOverride, setManualOverride] = useState<boolean>(false);

  // Sync prop changes if not manually overridden
  useEffect(() => {
    if (!manualOverride) {
      setCurrentOccupancy(occupancyPercent);
    }
  }, [occupancyPercent, manualOverride]);

  // Simulate real-time micro-fluctuations when live feed is active
  useEffect(() => {
    if (!isLiveFeedActive || manualOverride) return;

    const interval = setInterval(() => {
      // Small variation of +/- 3% around base
      const delta = (Math.random() - 0.5) * 6;
      setCurrentOccupancy(prev => {
        const next = Math.min(100, Math.max(5, prev + delta));
        if (onOccupancyChange) onOccupancyChange(Math.round(next));
        return Math.round(next);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, manualOverride, onOccupancyChange]);

  const styleInfo = getOccupancyColor(currentOccupancy);

  // Spatial Sector Heatmap Grid (4x4 matrix representing physical zones)
  const gridSectors: ZoneData[] = [
    { id: 'SEC-A1', name: 'Main Entrance Gate', occupancy: Math.min(100, Math.max(5, currentOccupancy + 15)) },
    { id: 'SEC-A2', name: 'North Lobby Concourse', occupancy: Math.min(100, Math.max(5, currentOccupancy - 5)) },
    { id: 'SEC-A3', name: 'Executive Ramp A', occupancy: Math.min(100, Math.max(5, currentOccupancy - 12)) },
    { id: 'SEC-A4', name: 'Security Checkpoints', occupancy: Math.min(100, Math.max(5, currentOccupancy + 22)) },
    
    { id: 'SEC-B1', name: 'Central Atrium Quad', occupancy: Math.min(100, Math.max(5, currentOccupancy + 8)) },
    { id: 'SEC-B2', name: 'Escalator Corridor B', occupancy: Math.min(100, Math.max(5, currentOccupancy + 2)) },
    { id: 'SEC-B3', name: 'Food Plaza Entrance', occupancy: Math.min(100, Math.max(5, currentOccupancy + 18)) },
    { id: 'SEC-B4', name: 'Emergency Exit Corridor', occupancy: Math.min(100, Math.max(5, currentOccupancy - 20)) },

    { id: 'SEC-C1', name: 'East Promenade', occupancy: Math.min(100, Math.max(5, currentOccupancy - 10)) },
    { id: 'SEC-C2', name: 'West Platform Stairs', occupancy: Math.min(100, Math.max(5, currentOccupancy + 5)) },
    { id: 'SEC-C3', name: 'Main Stage Front', occupancy: Math.min(100, Math.max(5, currentOccupancy + 25)) },
    { id: 'SEC-C4', name: 'VIP Overflow Queue', occupancy: Math.min(100, Math.max(5, currentOccupancy - 8)) },
  ];

  return (
    <div className={cn(
      "w-full bg-[#070d19]/90 border rounded-3xl p-5 space-y-5 transition-all duration-500 backdrop-blur-xl relative overflow-hidden shadow-2xl",
      styleInfo.border,
      styleInfo.glow
    )}>
      {/* Background Decorative Glow */}
      <div 
        className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-20 pointer-events-none blur-3xl transition-colors duration-700"
        style={{ backgroundColor: styleInfo.hex }}
      />

      {/* TOP TITLE & TELEMETRY HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-2xl border flex items-center justify-center transition-colors duration-500", styleInfo.badgeBg)}>
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black uppercase tracking-wider text-white">Live Camera Heat Map</h3>
              {isLiveFeedActive && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] font-bold uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE CAM SYNCED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time crowd occupancy spatial grid connected to camera feed
            </p>
          </div>
        </div>

        {/* Dynamic Occupancy Score Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className={cn("text-3xl font-black tracking-tight transition-colors duration-500", styleInfo.text)}>
                {currentOccupancy}%
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase">Occupancy</span>
            </div>
            <div className={cn("inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all duration-500", styleInfo.badgeBg)}>
              {styleInfo.status}
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL OVERCROWDING ALERT BANNER (>90% DARK RED) */}
      {styleInfo.isDarkRed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-red-950 border-2 border-red-600 shadow-[0_0_30px_rgba(127,29,29,0.9)] flex items-center gap-4 text-white animate-pulse"
        >
          <AlertTriangle className="w-8 h-8 text-red-400 shrink-0 animate-bounce" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-widest text-red-300 text-xs bg-red-900/80 px-2 py-0.5 rounded border border-red-500">
                CRITICAL WARNING: {currentOccupancy}% OCCUPANCY
              </span>
              <span className="text-[10px] font-mono text-red-200 uppercase font-bold">CROSSES 90% THRESHOLD</span>
            </div>
            <p className="text-xs text-red-100/90 font-medium mt-1">
              Dark Red alert active. Immediate crowd dispersion protocols & emergency access gate opening required!
            </p>
          </div>
        </motion.div>
      )}

      {/* GLOBAL OCCUPANCY GAUGE BAR */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Overall Capacity Meter:
          </span>
          <span className={cn("font-bold", styleInfo.text)}>
            {styleInfo.colorName} Bracket ({styleInfo.bracket})
          </span>
        </div>

        <div className="h-4 bg-slate-950 rounded-full p-0.5 border border-white/10 relative overflow-hidden flex items-center">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentOccupancy}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full transition-all duration-500 shadow-md", styleInfo.bg)}
            style={{ backgroundColor: styleInfo.hex }}
          />

          {/* Threshold Marker Lines */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
            <div className="w-[1px] h-full bg-white/20 left-[25%] absolute" title="25% Green Threshold" />
            <div className="w-[1px] h-full bg-white/20 left-[50%] absolute" title="50% Light Yellow Threshold" />
            <div className="w-[1px] h-full bg-white/20 left-[75%] absolute" title="75% Yellow Threshold" />
            <div className="w-[2px] h-full bg-red-500/60 left-[90%] absolute" title="90% Dark Red Threshold" />
          </div>
        </div>

        {/* Legend bar showing thresholds */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 pt-1 text-[9px] font-mono text-center">
          <div className={cn("p-1 rounded border transition-all", currentOccupancy <= 25 ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400")}>
            0-25%: Green
          </div>
          <div className={cn("p-1 rounded border transition-all", currentOccupancy > 25 && currentOccupancy <= 50 ? "bg-yellow-200/30 border-yellow-200 text-yellow-200 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400")}>
            26-50%: Light Yellow
          </div>
          <div className={cn("p-1 rounded border transition-all", currentOccupancy > 50 && currentOccupancy <= 75 ? "bg-yellow-500/30 border-yellow-400 text-yellow-300 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400")}>
            51-75%: Yellow
          </div>
          <div className={cn("p-1 rounded border transition-all", currentOccupancy > 75 && currentOccupancy <= 90 ? "bg-red-500/30 border-red-400 text-red-300 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400")}>
            76-90%: Red
          </div>
          <div className={cn("col-span-2 sm:col-span-1 p-1 rounded border transition-all", currentOccupancy > 90 ? "bg-red-950 border-red-600 text-red-200 font-bold animate-pulse" : "bg-slate-900/60 border-white/5 text-slate-400")}>
            91-100%: Dark Red (&gt;90%)
          </div>
        </div>
      </div>

      {/* 2D SPATIAL HEATMAP GRID BELOW THE CAMERA FEED */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-1">
          <span className="text-slate-300 uppercase font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Sector Heat Map (Physical Camera Field):
          </span>
          <span className="text-slate-400 text-[10px]">12 Monitored Zones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {gridSectors.map((sector) => {
            const secColor = getOccupancyColor(sector.occupancy);
            return (
              <motion.div
                key={sector.id}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-2 relative overflow-hidden",
                  secColor.bgSubtle,
                  secColor.border
                )}
              >
                <div 
                  className="absolute top-0 left-0 bottom-0 opacity-15 pointer-events-none transition-all duration-500"
                  style={{ width: `${sector.occupancy}%`, backgroundColor: secColor.hex }}
                />

                <div className="flex items-center justify-between text-[10px] font-mono z-10">
                  <span className="text-slate-400 font-semibold">{sector.id}</span>
                  <span 
                    className="px-1.5 py-0.5 rounded font-bold text-[9px] uppercase"
                    style={{ backgroundColor: `${secColor.hex}33`, color: secColor.hex, border: `1px solid ${secColor.hex}66` }}
                  >
                    {secColor.colorName}
                  </span>
                </div>

                <div className="z-10">
                  <h4 className="text-[11px] font-bold text-white leading-tight truncate">{sector.name}</h4>
                  <div className="flex items-baseline justify-between mt-1 font-mono">
                    <span className="text-[10px] text-slate-400">Occupancy:</span>
                    <span className="text-sm font-black" style={{ color: secColor.hex }}>
                      {sector.occupancy}%
                    </span>
                  </div>
                </div>

                {/* Micro Bar */}
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden z-10 border border-white/10">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sector.occupancy}%`, backgroundColor: secColor.hex }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* OPERATOR LIVE TEST SLIDER CONTROL */}
      <div className="p-3 bg-black/60 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase text-[10px]">Test Occupancy Level:</span>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            type="range"
            min="0"
            max="100"
            value={currentOccupancy}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setManualOverride(true);
              setCurrentOccupancy(val);
              if (onOccupancyChange) onOccupancyChange(val);
            }}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <span className={cn("font-bold text-sm min-w-[45px] text-right", styleInfo.text)}>
            {currentOccupancy}%
          </span>
        </div>

        {manualOverride && (
          <button
            onClick={() => setManualOverride(false)}
            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Reset to Live Feed
          </button>
        )}
      </div>
    </div>
  );
}
