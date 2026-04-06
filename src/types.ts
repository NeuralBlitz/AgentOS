import { MemoryResult } from "./lib/memory";

export type AgentStatus = "idle" | "working" | "done" | "error";
export type AppMode = 'agentos' | 'chat' | 'orchestrator' | 'explorer' | 'media' | 'live' | 'github';

export interface Task {
  id: string;
  text: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedAgent?: 'agentos' | 'chat' | 'orchestrator' | 'explorer' | 'media' | 'live' | 'github';
  dependencies: string[];
  dueDate: string | null;
}

export type { MemoryResult };
