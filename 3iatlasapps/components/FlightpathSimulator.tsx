"use client";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import type React from "react";
import { useMemo } from "react";

type Props = { seed?: string; width?: number; height?: number; className?: string };

// Type helper for motion.div with className
const MotionDiv = motion.div as React.FC<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
export default function FlightpathSimulator({ seed = "default", width = 560, height = 220, className = "" }: Props) {
  const prefersReduced = useReducedMotion();
  const { d, end } = useMemo(() => {
    const s = hash(seed);
    const x0 = 20, y0 = height - 30;
    const x1 = width - 30, y1 = 30;
    const cx = Math.round(width * (0.3 + (s % 40) / 200));
    const cy = Math.round(height * (0.2 + (s % 30) / 200));
    return { d: `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`, end: { x: x1, y: y1 } };
  }, [seed, width, height]);
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/20 ${className}`}>
      <svg className="block h-[220px] w-full" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <motion.path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2}
          initial={{ pathLength: prefersReduced ? 1 : 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: prefersReduced ? 0.2 : 1.2, ease: "easeInOut" }} />
      </svg>
      {prefersReduced ? (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white" />
      ) : (
        <>
          <MotionDiv 
            className="absolute h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            initial={{ offsetDistance: "0%" }} 
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
            style={{ offsetPath: `path('${d}')`, WebkitOffsetPath: `path('${d}')` } as React.CSSProperties} 
          />
          {Array.from({ length: 10 }).map((_, i) => (
            <MotionDiv key={i} className="absolute h-1.5 w-1.5 rounded-full bg-white/40"
              initial={{ offsetDistance: "0%", opacity: 0 }} animate={{ offsetDistance: "100%", opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, delay: i * 0.05 }}
              style={{ offsetPath: `path('${d}')`, WebkitOffsetPath: `path('${d}')` } as React.CSSProperties} />
          ))}
          <MotionDiv className="absolute rounded-full bg-white/40"
            style={{ transform: `translate(${end.x - 2}px, ${end.y - 2}px)` }}
            initial={{ width: 6, height: 6, opacity: 0.4, scale: 0.8 }}
            animate={{ width: 18, height: 18, opacity: [0.4, 0.8, 0.4], scale: [0.8, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }} />
        </>
      )}
    </div>
  );
}
function hash(s: string) { let h = 2166136261 >>> 0; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
