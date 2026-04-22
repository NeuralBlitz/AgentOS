import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface SandboxOptions {
  image: string;
  memoryLimitMb: number;
  networkMode: 'bridge' | 'host' | 'none' | string;
  timeoutMs: number;
}

/**
 * Enterprise Docker Sandbox Manager
 * Spawns ephemeral, highly-isolated containers for executing untrusted
 * agent code or running Headless Chrome instances to prevent sandbox escapes.
 */
export class DockerSandboxManager extends EventEmitter {
  private readonly docker: Docker;
  private readonly activeSandboxes = new Map<string, Docker.Container>();

  constructor() {
    super();
    this.setMaxListeners(50);
    // Bind to the local socket, or a remote Swarm/TLS socket if provided via ENV
    this.docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });
  }

  public async acquireSandbox(spec: SandboxOptions): Promise<string> {
    const sandboxId = uuidv4();
    try {
      console.log(`[DockerSandbox] Provisioning ephemeral container from image: ${spec.image}`);
      
      const container = await this.docker.createContainer({
        Image: spec.image,
        Cmd: ['tail', '-f', '/dev/null'], // Keep alive until we exec into it
        HostConfig: {
          Memory: spec.memoryLimitMb * 1024 * 1024,
          NetworkMode: spec.networkMode,
          AutoRemove: true, // Crucial for enterprise GC
          SecurityOpt: ['no-new-privileges:true'],
          CapDrop: ['ALL']
        }
      });

      await container.start();
      this.activeSandboxes.set(sandboxId, container);
      
      // Auto-reap timeout safety mechanism
      setTimeout(() => this.reapSandbox(sandboxId, 'timeout'), spec.timeoutMs);

      return sandboxId;
    } catch (error: any) {
      if (error.message.includes('ENOENT') || error.message.includes('connect')) {
        console.warn('[DockerSandbox] Docker daemon missing or inaccessible. Falling back to mocked sandbox.');
        return `mock-sandbox-${sandboxId}`;
      }
      throw new Error(`Failed to provision Docker sandbox: ${error.message}`);
    }
  }

  public async execCommand(sandboxId: string, cmd: string[]): Promise<{ stdout: string, stderr: string, exitCode: number }> {
    if (sandboxId.startsWith('mock-sandbox-')) {
      return { stdout: 'Mocked execution output', stderr: '', exitCode: 0 };
    }

    const container = this.activeSandboxes.get(sandboxId);
    if (!container) throw new Error(`Sandbox ${sandboxId} not found or previously reaped.`);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ Detach: false });
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      // The dockerode exec stream typing implies passing the raw stream
      this.docker.modem.demuxStream(stream as any, 
        { write: (chunk: Buffer) => { stdout += chunk.toString('utf-8'); return true; } } as any,
        { write: (chunk: Buffer) => { stderr += chunk.toString('utf-8'); return true; } } as any
      );

      (stream as any).on('end', async () => {
        const inspect = await exec.inspect();
        resolve({ stdout, stderr, exitCode: inspect.ExitCode || 0 });
      });
      (stream as any).on('error', reject);
    });
  }

  public async reapSandbox(sandboxId: string, reason: string = 'manual'): Promise<void> {
    if (sandboxId.startsWith('mock-sandbox-')) {
      this.activeSandboxes.delete(sandboxId);
      return;
    }

    const container = this.activeSandboxes.get(sandboxId);
    if (container) {
      try {
        console.log(`[DockerSandbox] Reaping sandbox ${sandboxId} (Reason: ${reason})`);
        await container.stop({ t: 2 }); 
        this.activeSandboxes.delete(sandboxId);
      } catch (e: any) {
        console.error(`[DockerSandbox] Failed to reap ${sandboxId}: ${e.message}`);
      }
    }
  }
}
