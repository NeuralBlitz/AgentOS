import { motion } from "motion/react";
import { AgentStatus } from "../types";

export const StatusIndicator = ({
  label,
  status,
}: {
  label: string;
  status: AgentStatus;
}) => {
  return (
    <div className="flex items-center justify-between glass-panel border-white/5 p-3 rounded-2xl shadow-md">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[8px] text-gray-500 uppercase tracking-widest font-mono">{status}</span>
        <motion.div
          className={`w-2 h-2 rounded-full ${
            status === "idle"
              ? "bg-gray-600"
              : status === "working"
                ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                : status === "done"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          }`}
          initial={false}
          animate={
            status === "working"
              ? { 
                  scale: [1, 1.2, 1], 
                  opacity: [0.6, 1, 0.6], 
                  boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 8px rgba(59, 130, 246, 0.8)", "0px 0px 0px rgba(59, 130, 246, 0)"] 
                }
              : status === "done"
                ? { 
                    scale: [1, 1.5, 1], 
                    boxShadow: ["0px 0px 0px rgba(16, 185, 129, 0)", "0px 0px 12px rgba(16, 185, 129, 1)", "0px 0px 0px rgba(16, 185, 129, 0)"] 
                  }
                : { scale: 1, opacity: 1, boxShadow: "0px 0px 0px rgba(0,0,0,0)" }
          }
          transition={
            status === "working"
              ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              : status === "done"
                ? { duration: 0.5, ease: "easeOut" }
                : { duration: 0.2 }
          }
        />
      </div>
    </div>
  );
};
