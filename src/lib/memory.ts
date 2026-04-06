import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MemoryResult {
  id: string;
  type: 'path' | 'preference';
  key?: string;
  content: string;
  confidence: number;
}

interface MemoryItem {
  id: string;
  type: 'path' | 'preference';
  key?: string;
  content: string;
  textToEmbed: string;
  embedding?: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class LocalMemoryCore {
  private items: MemoryItem[] = [
    { id: 'p1', type: 'path', key: 'python scripts', content: '/Users/admin/projects/python_scripts', textToEmbed: 'Path to python scripts: /Users/admin/projects/python_scripts' },
    { id: 'p2', type: 'path', key: 'downloads', content: '/Users/admin/Downloads', textToEmbed: 'Path to downloads folder: /Users/admin/Downloads' },
    { id: 'p3', type: 'path', key: 'documents', content: '/Users/admin/Documents', textToEmbed: 'Path to documents folder: /Users/admin/Documents' },
    { id: 'p4', type: 'path', key: 'project alpha', content: '/Users/admin/projects/alpha', textToEmbed: 'Path to project alpha: /Users/admin/projects/alpha' },
    { id: 'p5', type: 'path', key: 'ssh keys', content: '/Users/admin/.ssh', textToEmbed: 'Path to ssh keys: /Users/admin/.ssh' },
    { id: 'p6', type: 'path', key: 'system logs', content: '/var/log', textToEmbed: 'Path to system logs: /var/log' },
    { id: 'pref1', type: 'preference', content: 'Always use absolute paths when moving files.', textToEmbed: 'Preference: Always use absolute paths when moving files.' },
    { id: 'pref2', type: 'preference', content: 'Prefer non-destructive commands like cp over mv when unsure.', textToEmbed: 'Preference: Prefer non-destructive commands like cp over mv when unsure.' },
    { id: 'pref3', type: 'preference', content: 'Python environment is usually in .venv or venv folders.', textToEmbed: 'Preference: Python environment is usually in .venv or venv folders.' },
    { id: 'pref4', type: 'preference', content: 'Never delete files without user confirmation.', textToEmbed: 'Preference: Never delete files without user confirmation.' }
  ];

  private embeddingsLoaded = false;

  private async ensureEmbeddings() {
    if (this.embeddingsLoaded) return;
    try {
      const contentsToEmbed = this.items.map(i => i.textToEmbed);
      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: contentsToEmbed,
      });
      
      if (result.embeddings && result.embeddings.length === this.items.length) {
        result.embeddings.forEach((emb, idx) => {
          this.items[idx].embedding = emb.values;
        });
        this.embeddingsLoaded = true;
      }
    } catch (e) {
      console.error("Failed to initialize memory embeddings:", e);
    }
  }

  public async retrieveContext(query: string): Promise<MemoryResult[]> {
    await this.ensureEmbeddings();

    let queryEmbedding: number[] | null = null;
    try {
      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: query,
      });
      if (result.embeddings && result.embeddings.length > 0) {
        queryEmbedding = result.embeddings[0].values;
      }
    } catch (e) {
      console.error("Query embedding failed", e);
    }

    const results: MemoryResult[] = [];
    for (const item of this.items) {
      let semanticScore = 0;
      if (queryEmbedding && item.embedding) {
        semanticScore = cosineSimilarity(queryEmbedding, item.embedding);
      }
      
      const keywordScore = this.calculateKeywordBoost(query, item.textToEmbed);
      
      // Hybrid scoring: 70% semantic, 30% keyword
      // If embedding failed, rely 100% on keyword
      const finalScore = queryEmbedding ? (semanticScore * 0.7) + (keywordScore * 0.3) : keywordScore;

      if (finalScore > 0.4) {
        results.push({
          id: item.id,
          type: item.type,
          key: item.key,
          content: item.content,
          confidence: finalScore
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  }

  private calculateKeywordBoost(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const textWords = text.toLowerCase().split(/\s+/);
    if (queryWords.length === 0) return 0;
    const overlap = queryWords.filter(qw => textWords.some(tw => tw.includes(qw) || qw.includes(tw))).length;
    return Math.min(1, overlap / queryWords.length);
  }
}

export const memoryCore = new LocalMemoryCore();
