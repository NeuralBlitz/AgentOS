import { MemoryResult } from "./lib/memory";

export type AgentStatus = "idle" | "working" | "done" | "error";
export type AppMode = 'agentos' | 'chat' | 'orchestrator' | 'explorer' | 'media' | 'live' | 'github';

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
}

export { MemoryResult };
