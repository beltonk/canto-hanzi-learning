import { NextRequest, NextResponse } from "next/server";
import { getCharactersByGrade, getCharactersByList, getAllCharactersWithData } from "@/lib/data/loader";
import type { LearningStage } from "@/types/character";

/**
 * GET /api/characters
 * 
 * Query parameters:
 * - grade: Learning stage (KS1 or KS2)
 *   - KS1: 第一學習階段 (小一至小三)
 *   - KS2: 第二學習階段 (小四至小六)
 * - chars: Comma-separated list of characters (e.g., "人,水,火") - returns specific characters
 * 
 * If neither parameter is provided, returns all characters.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gradeParam = searchParams.get("grade");
    const charsParam = searchParams.get("chars");

    // Validate grade parameter (learning stage)
    if (gradeParam) {
      const grade = gradeParam.toUpperCase() as LearningStage;
      if (grade !== "KS1" && grade !== "KS2") {
        return NextResponse.json(
          { error: `Invalid grade. Must be one of: KS1 (第一學習階段), KS2 (第二學習階段)` },
          { status: 400 }
        );
      }

      const characters = getAllCharactersWithData(grade);
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

      const characters = getAllCharactersWithData().filter((item) =>
        charList.includes(item.character.character)
      );

      return NextResponse.json({
        requested: charList,
        found: characters.length,
        characters,
      });
    }

    // No parameters - return all characters
    const characters = getAllCharactersWithData();
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
