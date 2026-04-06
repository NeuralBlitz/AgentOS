import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class LiveVideoChat {
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private videoInterval: number | null = null;
  private isConnected = false;
  private isScreenSharing = false;

  constructor(
    private videoElement: HTMLVideoElement,
    private canvasElement: HTMLCanvasElement,
    private onStatusChange: (status: string) => void,
    private onTranscript: (text: string, role: 'user' | 'model') => void,
    private onToolCall?: (name: string, args: any) => Promise<any>
  ) {}

  async start() {
    if (this.isConnected) return;
    this.onStatusChange("Connecting...");

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }, 
        audio: true 
      });
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      // Use the default sample rate for the context to avoid issues with some browsers
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // We need to resample to 16kHz for the model
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.onStatusChange("Connected");
            this.startVideoStreaming();

            processor.onaudioprocess = (e) => {
              if (!this.isConnected) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple downsampling/resampling if needed, but for now we'll just send it
              // The model is quite flexible, but 16kHz is preferred.
              // If the context is e.g. 48kHz, we should ideally resample.
              // For simplicity in this environment, we'll convert to Int16.
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
              
              this.sessionPromise?.then((session) =>
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: `audio/pcm;rate=${this.audioContext?.sampleRate || 16000}` }
                })
              );
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              this.playAudio(base64Audio);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopAudio();
            }

            // Handle Transcriptions
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              this.onTranscript(message.serverContent.modelTurn.parts[0].text, 'model');
            }

            // Handle Input Transcription
            const inputTranscription = (message as any).serverContent?.inputAudioTranscription?.text;
            if (inputTranscription) {
              this.onTranscript(inputTranscription, 'user');
            }

            // Handle Tool Calls
            const toolCall = (message as any).toolCall;
            if (toolCall && this.onToolCall) {
              for (const call of toolCall.functionCalls) {
                const result = await this.onToolCall(call.name, call.args);
                this.sessionPromise?.then(session => 
                  session.sendToolResponse({
                    functionResponses: [{
                      name: call.name,
                      response: result,
                      id: call.id
                    }]
                  })
                );
              }
            }
          },
          onclose: () => {
            this.stop();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            this.onStatusChange("Error: " + (error as any).message);
            this.stop();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are the Live Intelligence Core of AgentOS. 
You can see and hear the user in real-time. 
You have access to the application's state and can interact with other agents (Explorer, Orchestrator).
Be concise, proactive, and helpful. If you see something interesting in the video feed, mention it.
If the user asks for research, you can suggest tasks for the Explorer.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                {
                  name: "addTask",
                  description: "Add a new task to the Task Orchestrator",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING, description: "The task description" },
                      priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Task priority" },
                      agent: { type: Type.STRING, description: "The agent to assign (agentos, chat, explorer, media, live)" }
                    },
                    required: ["text"]
                  }
                },
                {
                  name: "startExploration",
                  description: "Start a research task with the Explorer sub-agent",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "The research query" }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "getAppState",
                  description: "Get the current state of the application, including tasks and logs",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                }
              ]
            }
          ]
        },
      });

    } catch (error) {
      console.error("Failed to start live chat:", error);
      this.onStatusChange("Error: Camera/Mic access denied");
      this.stop();
    }
  }

  private audioQueue: AudioBufferSourceNode[] = [];

  private stopAudio() {
    this.audioQueue.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    this.audioQueue = [];
  }

  async toggleScreenShare() {
    if (!this.isConnected) return;
    
    if (this.isScreenSharing) {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }
      this.videoElement.srcObject = this.mediaStream;
      this.isScreenSharing = false;
    } else {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.videoElement.srcObject = this.screenStream;
        this.isScreenSharing = true;
        
        this.screenStream.getVideoTracks()[0].onended = () => {
          this.toggleScreenShare();
        };
      } catch (e) {
        console.error("Screen share failed:", e);
      }
    }
  }

  private startVideoStreaming() {
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    this.videoInterval = window.setInterval(() => {
      if (!this.isConnected) return;
      
      // Resize canvas to a reasonable size for the model
      const targetWidth = 320;
      const targetHeight = (this.videoElement.videoHeight / this.videoElement.videoWidth) * targetWidth;
      
      this.canvasElement.width = targetWidth;
      this.canvasElement.height = targetHeight;
      ctx.drawImage(this.videoElement, 0, 0, targetWidth, targetHeight);
      
      const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.6);
      const base64Data = dataUrl.split(',')[1];

      this.sessionPromise?.then((session) =>
        session.sendRealtimeInput({
          video: { data: base64Data, mimeType: 'image/jpeg' }
        })
      );
    }, 500); // 2 FPS for better responsiveness
  }

  private async playAudio(base64Audio: string) {
    if (!this.audioContext) return;
    
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // The API returns raw PCM 16-bit 24kHz audio
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = this.audioContext.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 0x7fff;
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  stop() {
    this.isConnected = false;
    this.onStatusChange("Offline");
    
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close());
      this.sessionPromise = null;
    }
  }
}
