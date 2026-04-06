import { Database, Settings, Cpu } from "lucide-react";
import { AgentStatus, MemoryResult } from "../types";
import { StatusIndicator } from "./StatusIndicator"; // Need to create this

interface AgentOSSidebarProps {
  activeMemories: MemoryResult[];
  currentDir: string;
  sandboxConfig: { image: string; network: string; volumes: string };
  setSandboxConfig: (config: any) => void;
  plannerStatus: AgentStatus;
  executorStatus: AgentStatus;
  reviewerStatus: AgentStatus;
  sandboxStatus: AgentStatus;
}

export const AgentOSSidebar = ({
  activeMemories,
  currentDir,
  sandboxConfig,
  setSandboxConfig,
  plannerStatus,
  executorStatus,
  reviewerStatus,
  sandboxStatus,
}: AgentOSSidebarProps) => {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2 metallic-text">
          <Database className="w-4 h-4" /> Memory Core
        </h2>
        <div className="glass-panel border-white/5 rounded-2xl p-4 text-[10px] text-gray-400 space-y-4 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Vectors:</span>
            <span className="text-blue-400 font-mono">1,024</span>
          </div>
          {activeMemories.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] mb-3">Active Context:</p>
              <div className="space-y-2">
                {activeMemories.map(mem => (
                  <div key={mem.id} className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-emerald-400 text-[8px] font-bold uppercase tracking-widest">{mem.type}</span>
                      <span className="text-blue-400 text-[8px] font-mono">{(mem.confidence * 100).toFixed(0)}% Match</span>
                    </div>
                    <p className="text-gray-300 truncate text-[9px] leading-relaxed" title={mem.content}>{mem.key ? `${mem.key}: ` : ''}{mem.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-white/5">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[8px] block mb-2">CWD:</span>
            <span className="truncate block text-emerald-500 font-mono bg-black/40 p-2 rounded-lg border border-white/5">{currentDir}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2 metallic-text">
          <Settings className="w-4 h-4" /> Sandbox Config
        </h2>
        <div className="glass-panel border-white/5 rounded-2xl p-4 flex flex-col gap-4 text-[10px] shadow-lg">
          <div>
            <label className="block text-gray-500 font-bold uppercase tracking-widest text-[8px] mb-2">Image Override</label>
            <input type="text" value={sandboxConfig.image} onChange={e => setSandboxConfig({...sandboxConfig, image: e.target.value})} placeholder="e.g., ubuntu:latest" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label className="block text-gray-500 font-bold uppercase tracking-widest text-[8px] mb-2">Network</label>
            <select value={sandboxConfig.network} onChange={e => setSandboxConfig({...sandboxConfig, network: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors">
              <option value="auto">Auto</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-5 bg-gray-800 rounded-full relative transition-colors group-hover:bg-gray-700">
                <div className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full transition-transform" />
              </div>
              <span className="text-gray-500 font-medium">Auto-Cleanup</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2 metallic-text">
          <Cpu className="w-4 h-4" /> System Status
        </h2>
        <div className="space-y-3">
          <StatusIndicator label="Planner" status={plannerStatus} />
          <StatusIndicator label="Executor" status={executorStatus} />
          <StatusIndicator label="Reviewer" status={reviewerStatus} />
          <StatusIndicator label="Sandbox" status={sandboxStatus} />
        </div>
      </div>
    </>
  );
};
