import type { AudioCategory } from "@/types/character";

/**
 * TTS Service Interface
 * 
 * Abstraction for Cantonese text-to-speech providers
 */
export interface TTSService {
  /**
   * Generate audio from Cantonese text
   * 
   * @param text - Cantonese text to convert to speech
   * @param category - Category of text (character, word, sentence)
   * @param options - Additional options (voice, speed, etc.)
   * @returns Promise resolving to audio URL or file path
   */
  generateAudio(
    text: string,
    category: AudioCategory,
    options?: TTSOptions
  ): Promise<string>;

  /**
   * Generate multiple audio files in batch
   * 
   * @param requests - Array of text and category pairs
   * @param options - Additional options
   * @returns Promise resolving to array of audio URLs/paths
   */
  generateBatch(
    requests: Array<{ text: string; category: AudioCategory }>,
    options?: TTSOptions
  ): Promise<string[]>;
}

/**
 * TTS Options
 */
export interface TTSOptions {
  /** Voice identifier */
  voice?: string;
  /** Speech speed (0.5 to 2.0) */
  speed?: number;
  /** Additional provider-specific options */
  [key: string]: unknown;
}

/**
 * TTS Provider Configuration
 */
export interface TTSProviderConfig {
  /** Provider name */
  name: string;
  /** API endpoint or service URL */
  endpoint?: string;
  /** API key or authentication token */
  apiKey?: string;
  /** Default voice identifier */
  defaultVoice?: string;
  /** Additional provider-specific configuration */
  [key: string]: unknown;
}
