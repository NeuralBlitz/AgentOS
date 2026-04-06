import { useState, useEffect } from "react";
import { History, RotateCcw, Save } from "lucide-react";
import { Snapshot, createSnapshot, getSnapshots } from "../services/SnapshotService";
import { Task } from "../types";

interface VersionControlPanelProps {
  tasks: Task[];
  onRevert: (tasks: Task[]) => void;
}

export const VersionControlPanel = ({ tasks, onRevert }: VersionControlPanelProps) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = async () => {
    const data = await getSnapshots();
    setSnapshots(data);
  };

  const handleSave = async () => {
    if (!description) return;
    await createSnapshot(tasks, description);
    setDescription("");
    loadSnapshots();
  };

  return (
    <div className="glass-panel border-white/10 rounded-2xl p-4">
      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2">
        <History className="w-4 h-4" /> Version Control
      </h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Snapshot description..."
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none"
        />
        <button onClick={handleSave} className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/20">
          <Save className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {snapshots.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-xs">
            <span className="text-gray-400">{s.description}</span>
            <button onClick={() => onRevert(s.tasks)} className="text-purple-400 hover:text-purple-300">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
