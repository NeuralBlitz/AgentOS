import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Task } from "../types";

interface TaskDependencyGraphProps {
  tasks: Task[];
}

export const TaskDependencyGraph = ({ tasks }: TaskDependencyGraphProps) => {
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tasks.length === 0) return;

    // Generate Mermaid graph definition
    let graphDef = "graph TD\n";
    tasks.forEach(task => {
      graphDef += `  ${task.id}["${task.text.substring(0, 20)}..."]\n`;
      task.dependencies.forEach(depId => {
        graphDef += `  ${depId} --> ${task.id}\n`;
      });
    });

    // Render graph
    if (graphRef.current) {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      mermaid.render('dependency-graph', graphDef).then(({ svg }) => {
        if (graphRef.current) {
          graphRef.current.innerHTML = svg;
        }
      });
    }
  }, [tasks]);

  return (
    <div className="glass-panel border-white/10 rounded-2xl p-4 overflow-x-auto">
      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-4">Dependency Graph</h3>
      <div ref={graphRef} className="flex justify-center" />
    </div>
  );
};
