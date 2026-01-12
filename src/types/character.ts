/**
 * Character Entity
 * Represents a Traditional Chinese character with learning metadata
 * Based on 香港小學學習字詞表 (Hong Kong Primary School Learning Word List)
 * 
 * Learning Stages (學習階段):
 * - KS1 (第一學習階段): 小一至小三, 2,169 字
 * - KS2 (第二學習階段): 小四至小六, 1,002 字
 */
export type LearningStage = "KS1" | "KS2";

export interface Character {
  /** Traditional Chinese character (single character string) */
  character: string;
  /** Learning stage: KS1 (第一學習階段) or KS2 (第二學習階段) */
  grade: LearningStage;
  /** Radical (部首) */
  radical: string;
  /** Stroke count */
  strokeCount: number;
  /** Decomposition reference (character ID or link) */
  decompositionRef?: string;
  /** Jyutping pronunciation (romanization) */
  jyutping: string;
  /** Brief meanings (array of strings) */
  meanings: string[];
  /** Topical tags (e.g., "family", "school", "food") */
  tags: string[];
}

/**
 * Example Entity
 * Represents an example sentence or usage for a character
 */
export interface Example {
  /** Target character this example is for */
  character: string;
  /** Short sentence in Standard Written Chinese (書面語) */
  sentence: string;
  /** Jyutping for the sentence */
  jyutping: string;
  /** Optional English gloss */
  englishGloss?: string;
  /** Image reference (URL or file path for 聯想圖片) */
  imageRef?: string;
  /** Audio reference (URL to Cantonese audio) */
  audioRef?: string;
}

/**
 * Decomposition Entity
 * Represents how a character is decomposed into components
 */
export type StructureType = 
  | "left-right" 
  | "top-bottom" 
  | "surround" 
  | "single" 
  | "other"
  // Chinese structure types
  | "獨體"
  | "左右"
  | "上下"
  | "包圍"
  | "半包圍"
  | "品字";

export interface Decomposition {
  /** Target character (Traditional character) */
  character: string;
  /** List of component symbols (array of character strings) */
  components: string[];
  /** Structure type */
  structureType: StructureType;
}

/**
 * Audio Asset Entity
 * Represents a generated Cantonese audio file
 */
export type AudioCategory = "character" | "word" | "sentence";

export interface AudioAsset {
  /** Text source (the Cantonese text that was converted to speech) */
  textSource: string;
  /** Category: character, word, or sentence */
  category: AudioCategory;
  /** Chosen voice identifier */
  voice: string;
  /** URL of the generated Cantonese audio clip */
  url: string;
}
