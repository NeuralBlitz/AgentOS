import { Box } from "lucide-react";

export const GitHubSidebar = () => {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2 metallic-text">
          <Box className="w-4 h-4" /> Repository
        </h2>
        <div className="glass-panel border-white/5 rounded-2xl p-4 text-[10px] space-y-4 shadow-lg">
          <div className="text-gray-300 font-bold">google/ai-studio-build</div>
          <div className="text-gray-500">Branch: main</div>
        </div>
      </div>
    </>
  );
};
