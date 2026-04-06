export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type Logger = (type: string, message: string, status?: "success" | "warning" | "error") => void;

export const runToolWithFailsafe = async (
  toolName: string,
  toolFn: () => Promise<any>,
  logger: Logger,
  retries = 3
): Promise<ToolResult> => {
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      logger("system", `Executing tool: ${toolName} (Attempt ${attempts + 1})`);
      const result = await toolFn();
      logger("system", `Tool ${toolName} executed successfully.`, "success");
      return { success: true, data: result };
    } catch (error) {
      attempts++;
      logger("system", `Tool ${toolName} failed: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      if (attempts >= retries) {
        return { success: false, error: `Tool ${toolName} failed after ${retries} attempts.` };
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  return { success: false, error: 'Unknown error' };
};
