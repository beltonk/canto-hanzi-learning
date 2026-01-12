import type { TTSService, TTSOptions } from "../types";
import type { AudioCategory } from "@/types/character";

/**
 * Base TTS Provider
 * 
 * Abstract base class for TTS provider implementations.
 * Provides common functionality and error handling.
 */
export abstract class BaseTTSProvider implements TTSService {
  protected config: Record<string, unknown>;

  constructor(config: Record<string, unknown> = {}) {
    this.config = config;
  }

  /**
   * Generate audio from Cantonese text
   * Must be implemented by subclasses
   */
  abstract generateAudio(
    text: string,
    category: AudioCategory,
    options?: TTSOptions
  ): Promise<string>;

  /**
   * Generate multiple audio files in batch
   * Default implementation calls generateAudio sequentially.
   * Subclasses can override for more efficient batch processing.
   */
  async generateBatch(
    requests: Array<{ text: string; category: AudioCategory }>,
    options?: TTSOptions
  ): Promise<string[]> {
    const results: string[] = [];

    for (const request of requests) {
      try {
        const url = await this.generateAudio(request.text, request.category, options);
        results.push(url);
      } catch (error) {
        console.error(`Failed to generate audio for "${request.text}":`, error);
        // Continue with next request even if one fails
        results.push("");
      }
    }

    return results;
  }

  /**
   * Validate text input
   */
  protected validateText(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }
  }

  /**
   * Get voice identifier from options or config
   */
  protected getVoice(options?: TTSOptions): string {
    return (options?.voice as string) || (this.config.defaultVoice as string) || "default";
  }
}
