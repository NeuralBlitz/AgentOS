import { motion } from "motion/react";
import { Terminal, MessageSquare, Network, Globe, ImageIcon, Video, Box, ChevronLeft, Database, Settings, Cpu, Save, Brain, ShieldCheck, Activity, Zap } from "lucide-react";
import { AppMode, AgentStatus, MemoryResult } from "../types"; // Assuming I'll create this types file

interface SidebarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  leftSidebarCollapsed: boolean;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  activeMemories: MemoryResult[];
  currentDir: string;
  sandboxConfig: { image: string; network: string; volumes: string };
  setSandboxConfig: (config: any) => void;
  saveState: () => void;
  plannerStatus: AgentStatus;
  executorStatus: AgentStatus;
  reviewerStatus: AgentStatus;
  sandboxStatus: AgentStatus;
}

export const Sidebar = ({
  mode,
  setMode,
  leftSidebarCollapsed,
  setLeftSidebarCollapsed,
  activeMemories,
  currentDir,
  sandboxConfig,
  setSandboxConfig,
  saveState,
  plannerStatus,
  executorStatus,
  reviewerStatus,
  sandboxStatus,
}: SidebarProps) => {
  return (
    <motion.div 
      animate={{ width: leftSidebarCollapsed ? 0 : 256, opacity: leftSidebarCollapsed ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-[#111] border-r border-[#222] flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar glass-panel !bg-black/20 relative"
    >
      <div className="p-4 h-full flex flex-col min-w-[256px]">
        {/* Sidebar content here */}
      </div>
    </motion.div>
  );
};
