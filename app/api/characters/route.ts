import { NextRequest, NextResponse } from "next/server";
import { getCharactersByGrade, getCharactersByList, getAllCharactersWithData } from "@/lib/data/loader";
import type { LearningStage } from "@/types/character";

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * GET /api/characters
 * 
 * Query parameters:
 * - grade: Learning stage (KS1 or KS2)
 *   - KS1: 第一學習階段 (小一至小三)
 *   - KS2: 第二學習階段 (小四至小六)
 * - chars: Comma-separated list of characters (e.g., "人,水,火") - returns specific characters
 * - minStrokes: Minimum stroke count (inclusive)
 * - maxStrokes: Maximum stroke count (inclusive)
 * - shuffle: Set to "true" to randomize the order
 * 
 * If neither parameter is provided, returns all characters.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gradeParam = searchParams.get("grade");
    const charsParam = searchParams.get("chars");
    const minStrokesParam = searchParams.get("minStrokes");
    const maxStrokesParam = searchParams.get("maxStrokes");
    const shuffleParam = searchParams.get("shuffle");

    // Parse stroke count filters
    const minStrokes = minStrokesParam ? parseInt(minStrokesParam, 10) : undefined;
    const maxStrokes = maxStrokesParam ? parseInt(maxStrokesParam, 10) : undefined;
    const shouldShuffle = shuffleParam === "true";

    // Validate stroke parameters
    if (minStrokesParam && (isNaN(minStrokes!) || minStrokes! < 1)) {
      return NextResponse.json(
        { error: "minStrokes must be a positive integer" },
        { status: 400 }
      );
    }
    if (maxStrokesParam && (isNaN(maxStrokes!) || maxStrokes! < 1)) {
      return NextResponse.json(
        { error: "maxStrokes must be a positive integer" },
        { status: 400 }
      );
    }

    // Helper function to apply stroke count filtering
    const applyStrokeFilter = <T extends { character: { strokeCount: number } }>(items: T[]): T[] => {
      return items.filter((item) => {
        const strokes = item.character.strokeCount;
        if (minStrokes !== undefined && strokes < minStrokes) return false;
        if (maxStrokes !== undefined && strokes > maxStrokes) return false;
        return true;
      });
    };

    // Validate grade parameter (learning stage)
    if (gradeParam) {
      const grade = gradeParam.toUpperCase() as LearningStage;
      if (grade !== "KS1" && grade !== "KS2") {
        return NextResponse.json(
          { error: `Invalid grade. Must be one of: KS1 (第一學習階段), KS2 (第二學習階段)` },
          { status: 400 }
        );
      }

      let characters = getAllCharactersWithData(grade);
      characters = applyStrokeFilter(characters);
      if (shouldShuffle) {
        characters = shuffleArray(characters);
      }

      return NextResponse.json({
        grade,
        stageName: grade === "KS1" ? "第一學習階段（小一至小三）" : "第二學習階段（小四至小六）",
        count: characters.length,
        characters,
      });
    }

    // Handle character list parameter
    if (charsParam) {
      const charList = charsParam
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (charList.length === 0) {
        return NextResponse.json(
          { error: "Invalid chars parameter. Provide comma-separated characters." },
          { status: 400 }
        );
      }

      let characters = getAllCharactersWithData().filter((item) =>
        charList.includes(item.character.character)
      );
      characters = applyStrokeFilter(characters);
      if (shouldShuffle) {
        characters = shuffleArray(characters);
      }

      return NextResponse.json({
        requested: charList,
        found: characters.length,
        characters,
      });
    }

    // No parameters - return all characters (with optional filters)
    let characters = getAllCharactersWithData();
    characters = applyStrokeFilter(characters);
    if (shouldShuffle) {
      characters = shuffleArray(characters);
    }

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
