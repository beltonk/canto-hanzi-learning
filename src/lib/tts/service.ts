import type { TTSService, TTSProviderConfig } from "./types";
import type { AudioCategory } from "@/types/character";
import type { AudioAsset } from "@/types/character";
import { CUTalkProvider } from "./providers/cutalk";
import { getCachedAudio, cacheAudio } from "./cache";

/**
 * TTS Service Manager
 * 
 * Manages TTS providers with fallback support and caching.
 */
export class TTSServiceManager {
  private providers: TTSService[] = [];
  private primaryProvider: TTSService | null = null;

  /**
   * Initialize TTS service with providers
   * 
   * @param configs - Array of provider configurations
   */
  constructor(configs: TTSProviderConfig[] = []) {
    // Initialize providers from configs
    for (const config of configs) {
      let provider: TTSService;

      switch (config.name.toLowerCase()) {
        case "cutalk":
          provider = new CUTalkProvider(config);
          break;
        // Add other providers here (Aivoov, cantonese.ai, etc.)
        default:
          console.warn(`Unknown TTS provider: ${config.name}`);
          continue;
      }

      this.providers.push(provider);
      if (!this.primaryProvider) {
        this.primaryProvider = provider;
      }
    }

    // Default to CUTalk if no providers configured
    if (this.providers.length === 0) {
      this.primaryProvider = new CUTalkProvider();
      this.providers.push(this.primaryProvider);
    }
  }

  /**
   * Generate audio with caching and fallback
   * 
   * @param text - Cantonese text to convert
   * @param category - Audio category
   * @param options - TTS options
   * @returns Promise resolving to AudioAsset
   */
  async generateAudio(
    text: string,
    category: AudioCategory,
    options?: { voice?: string; [key: string]: unknown }
  ): Promise<AudioAsset> {
    const voice = (options?.voice as string) || "default";

    // Check cache first
    const cachedUrl = getCachedAudio(text, category, voice);
    if (cachedUrl) {
      return {
        textSource: text,
        category,
        voice,
        url: cachedUrl,
      };
    }

    // Try providers in order (primary first, then fallbacks)
    const providersToTry = this.primaryProvider
      ? [this.primaryProvider, ...this.providers.filter((p) => p !== this.primaryProvider)]
      : this.providers;

    let lastError: Error | null = null;

    for (const provider of providersToTry) {
      try {
        const url = await provider.generateAudio(text, category, options);

        // Cache the result
        cacheAudio(text, category, voice, url);

        return {
          textSource: text,
          category,
          voice,
          url,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`TTS provider failed, trying next:`, lastError.message);
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(
      `All TTS providers failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Generate multiple audio files in batch
   * 
   * @param requests - Array of text and category pairs
   * @param options - TTS options
   * @returns Promise resolving to array of AudioAssets
   */
  async generateBatch(
    requests: Array<{ text: string; category: AudioCategory }>,
    options?: { voice?: string; [key: string]: unknown }
  ): Promise<AudioAsset[]> {
    const voice = (options?.voice as string) || "default";
    const results: AudioAsset[] = [];

    // Check cache for all requests first
    const uncachedRequests: Array<{ text: string; category: AudioCategory; index: number }> = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const cachedUrl = getCachedAudio(request.text, request.category, voice);

      if (cachedUrl) {
        results[i] = {
          textSource: request.text,
          category: request.category,
          voice,
          url: cachedUrl,
        };
      } else {
        uncachedRequests.push({ ...request, index: i });
      }
    }

    // Generate audio for uncached requests
    if (uncachedRequests.length > 0 && this.primaryProvider) {
      const batchRequests = uncachedRequests.map((r) => ({
        text: r.text,
        category: r.category,
      }));

      try {
        const urls = await this.primaryProvider.generateBatch(batchRequests, options);

        for (let i = 0; i < uncachedRequests.length; i++) {
          const request = uncachedRequests[i];
          const url = urls[i];

          if (url) {
            cacheAudio(request.text, request.category, voice, url);
            results[request.index] = {
              textSource: request.text,
              category: request.category,
              voice,
              url,
            };
          }
        }
      } catch (error) {
        console.error("Batch generation failed:", error);
        // Fall back to individual requests
        for (const request of uncachedRequests) {
          try {
            const asset = await this.generateAudio(request.text, request.category, options);
            results[request.index] = asset;
          } catch (err) {
            console.error(`Failed to generate audio for "${request.text}":`, err);
          }
        }
      }
    }

    return results;
  }
}

/**
 * Default TTS service instance
 * Can be configured via environment variables or config file
 */
export function createTTSService(configs?: TTSProviderConfig[]): TTSServiceManager {
  // TODO: Load configs from environment variables or config file
  // For now, use default CUTalk provider
  return new TTSServiceManager(configs);
}
