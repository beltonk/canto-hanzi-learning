import { NextRequest, NextResponse } from "next/server";
import {
  queryCharacters,
  queryIndexEntries,
  loadCharacterByChar,
  loadSummary,
  getAllRadicals,
  getAllStrokeCounts,
  getWordsByStage,
  loadLexicalListsHKIndex,
  type CharacterFilter,
} from "@/lib/data/indexLoader";
import type { WordStage } from "@/types/fullCharacter";

/**
 * GET /api/characters
 * 
 * Query characters with filtering, sorting, and pagination.
 * Uses index-based lookups for fast performance.
 * 
 * IMPORTANT: Stage (學習階段) applies to WORDS, not characters.
 * Characters are filtered by stroke count, radical, lexical list membership, etc.
 * 
 * Query parameters:
 * - char: Single character to look up (returns full data for that character)
 * - minStrokes: Minimum stroke count (inclusive)
 * - maxStrokes: Maximum stroke count (inclusive)
 * - radical: Filter by radical character
 * - jyutping: Search by jyutping (partial match)
 * - inLexicalListsHK: Filter by lexical list inclusion ("true" or "false")
 * - shuffle: Randomize order ("true")
 * - limit: Max results (default: no limit)
 * - offset: Skip first N results (default: 0)
 * - indexOnly: Return index entries only, not full data ("true")
 * 
 * Special queries:
 * - ?meta=summary: Return summary statistics
 * - ?meta=radicals: Return all unique radicals
 * - ?meta=strokeCounts: Return all stroke count values
 * - ?meta=words&stage=1: Return words by learning stage (1 or 2)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Handle meta queries
    const meta = searchParams.get("meta");
    if (meta) {
      return handleMetaQuery(meta, searchParams);
    }
    
    // Handle single character lookup
    const charParam = searchParams.get("char");
    if (charParam) {
      const data = loadCharacterByChar(charParam);
      if (!data) {
        return NextResponse.json(
          { error: `Character "${charParam}" not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ character: data });
    }
    
    // Build filter from query params
    const filter: CharacterFilter = {};
    
    const minStrokesParam = searchParams.get("minStrokes");
    if (minStrokesParam) {
      const minStrokes = parseInt(minStrokesParam, 10);
      if (isNaN(minStrokes) || minStrokes < 1) {
        return NextResponse.json(
          { error: "minStrokes must be a positive integer" },
          { status: 400 }
        );
      }
      filter.minStrokes = minStrokes;
    }
    
    const maxStrokesParam = searchParams.get("maxStrokes");
    if (maxStrokesParam) {
      const maxStrokes = parseInt(maxStrokesParam, 10);
      if (isNaN(maxStrokes) || maxStrokes < 1) {
        return NextResponse.json(
          { error: "maxStrokes must be a positive integer" },
          { status: 400 }
        );
      }
      filter.maxStrokes = maxStrokes;
    }
    
    const radicalParam = searchParams.get("radical");
    if (radicalParam) {
      filter.radical = radicalParam;
    }
    
    const jyutpingParam = searchParams.get("jyutping");
    if (jyutpingParam) {
      filter.jyutping = jyutpingParam;
    }
    
    const lexicalParam = searchParams.get("inLexicalListsHK");
    if (lexicalParam === "true") {
      filter.inLexicalListsHK = true;
    } else if (lexicalParam === "false") {
      filter.inLexicalListsHK = false;
    }
    
    // Query options
    const shuffle = searchParams.get("shuffle") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
    
    // Check if index-only response is requested
    const indexOnly = searchParams.get("indexOnly") === "true";
    
    if (indexOnly) {
      // Return lightweight index entries
      let entries = queryIndexEntries(filter);
      
      if (shuffle) {
        entries = shuffleArray(entries);
      }
      if (offset !== undefined) {
        entries = entries.slice(offset);
      }
      if (limit !== undefined) {
        entries = entries.slice(0, limit);
      }
      
      return NextResponse.json({
        count: entries.length,
        entries,
      });
    }
    
    // Return full character data
    const characters = queryCharacters(filter, { limit, offset, shuffle });
    
    return NextResponse.json({
      count: characters.length,
      characters,
    });
  } catch (error) {
    console.error("Error in /api/characters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle meta queries (summary, radicals, strokeCounts, words)
 */
function handleMetaQuery(meta: string, searchParams: URLSearchParams): NextResponse {
  switch (meta) {
    case "summary": {
      const summary = loadSummary();
      if (!summary) {
        return NextResponse.json(
          { error: "Summary data not available" },
          { status: 500 }
        );
      }
      return NextResponse.json(summary);
    }
    
    case "radicals": {
      const radicals = getAllRadicals();
      return NextResponse.json({ radicals, count: radicals.length });
    }
    
    case "strokeCounts": {
      const strokeCounts = getAllStrokeCounts();
      return NextResponse.json({ strokeCounts, count: strokeCounts.length });
    }
    
    case "lexicalListsHK": {
      const index = loadLexicalListsHKIndex();
      if (!index) {
        return NextResponse.json(
          { error: "Lexical lists index not available" },
          { status: 500 }
        );
      }
      return NextResponse.json({ 
        count: index.entries.length, 
        entries: index.entries 
      });
    }
    
    case "words": {
      // Get words by learning stage
      const stageParam = searchParams.get("stage");
      if (!stageParam || !["1", "2"].includes(stageParam)) {
        return NextResponse.json(
          { error: "stage parameter required for words query. Use '1' or '2'." },
          { status: 400 }
        );
      }
      
      const words = getWordsByStage(stageParam as WordStage);
      
      // Support pagination for words
      const limitParam = searchParams.get("limit");
      const offsetParam = searchParams.get("offset");
      const shuffle = searchParams.get("shuffle") === "true";
      
      let result = shuffle ? shuffleArray(words) : words;
      
      if (offsetParam) {
        result = result.slice(parseInt(offsetParam, 10));
      }
      if (limitParam) {
        result = result.slice(0, parseInt(limitParam, 10));
      }
      
      return NextResponse.json({
        stage: stageParam,
        count: result.length,
        totalCount: words.length,
        words: result,
      });
    }
    
    default:
      return NextResponse.json(
        { error: `Unknown meta query: ${meta}. Use 'summary', 'radicals', 'strokeCounts', 'lexicalListsHK', or 'words'.` },
        { status: 400 }
      );
  }
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
