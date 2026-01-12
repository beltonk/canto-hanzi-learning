import { NextRequest, NextResponse } from "next/server";
import { getAllCharactersWithData } from "@/lib/data/loader";
import type { GradeLevel } from "@/types/character";

/**
 * Exercise types
 */
type ExerciseType = "dictation" | "decomposition";

/**
 * Dictation exercise task
 */
interface DictationTask {
  type: "dictation";
  id: string;
  character: string;
  jyutping: string;
  audioUrl?: string;
  imageUrl?: string;
  correctAnswer: string;
  category: "audio" | "image";
}

/**
 * Decomposition exercise task
 */
interface DecompositionTask {
  type: "decomposition";
  id: string;
  character: string;
  components: string[];
  structureType: string;
  correctAnswer: string[];
}

type ExerciseTask = DictationTask | DecompositionTask;

/**
 * GET /api/exercises
 * 
 * Query parameters:
 * - type: Exercise type ("dictation" or "decomposition")
 * - grade: Grade level (P1, P2, or P3) - optional, defaults to all grades
 * - limit: Maximum number of exercises to return (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get("type");
    const gradeParam = searchParams.get("grade");
    const limitParam = searchParams.get("limit");

    // Validate type parameter
    if (!typeParam) {
      return NextResponse.json(
        { error: "Type parameter is required. Use 'dictation' or 'decomposition'." },
        { status: 400 }
      );
    }

    const exerciseType = typeParam.toLowerCase() as ExerciseType;
    if (exerciseType !== "dictation" && exerciseType !== "decomposition") {
      return NextResponse.json(
        { error: `Invalid type. Must be 'dictation' or 'decomposition'.` },
        { status: 400 }
      );
    }

    // Validate grade parameter
    let grade: GradeLevel | undefined;
    if (gradeParam) {
      const gradeUpper = gradeParam.toUpperCase() as GradeLevel;
      if (gradeUpper !== "P1" && gradeUpper !== "P2" && gradeUpper !== "P3") {
        return NextResponse.json(
          { error: `Invalid grade. Must be one of: P1, P2, P3` },
          { status: 400 }
        );
      }
      grade = gradeUpper;
    }

    // Get character data
    const characters = getAllCharactersWithData(grade);

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    if (limitParam && (isNaN(limit!) || limit! < 1)) {
      return NextResponse.json(
        { error: "Limit must be a positive integer." },
        { status: 400 }
      );
    }

    // Generate exercises based on type
    let exercises: ExerciseTask[] = [];

    if (exerciseType === "dictation") {
      exercises = generateDictationExercises(characters, limit);
    } else if (exerciseType === "decomposition") {
      exercises = generateDecompositionExercises(characters, limit);
    }

    return NextResponse.json({
      type: exerciseType,
      grade: grade || "all",
      count: exercises.length,
      exercises,
    });
  } catch (error) {
    console.error("Error in /api/exercises:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate dictation exercises from characters
 */
function generateDictationExercises(
  characters: Array<{
    character: { character: string; jyutping: string };
    examples: Array<{ audioRef?: string; imageRef?: string }>;
  }>,
  limit?: number
): DictationTask[] {
  const tasks: DictationTask[] = [];

  for (const item of characters) {
    const { character, examples } = item;

    // Create audio dictation task
    if (character.jyutping) {
      tasks.push({
        type: "dictation",
        id: `dictation-audio-${character.character}-${tasks.length}`,
        character: character.character,
        jyutping: character.jyutping,
        audioUrl: examples[0]?.audioRef, // Use first example's audio if available
        correctAnswer: character.character,
        category: "audio",
      });
    }

    // Create image dictation task if image available
    const exampleWithImage = examples.find((e) => e.imageRef);
    if (exampleWithImage?.imageRef) {
      tasks.push({
        type: "dictation",
        id: `dictation-image-${character.character}-${tasks.length}`,
        character: character.character,
        jyutping: character.jyutping,
        imageUrl: exampleWithImage.imageRef,
        audioUrl: exampleWithImage.audioRef,
        correctAnswer: character.character,
        category: "image",
      });
    }

    if (limit && tasks.length >= limit) {
      break;
    }
  }

  return limit ? tasks.slice(0, limit) : tasks;
}

/**
 * Generate decomposition exercises from characters
 */
function generateDecompositionExercises(
  characters: Array<{
    character: { character: string };
    decomposition?: { components: string[]; structureType: string };
  }>,
  limit?: number
): DecompositionTask[] {
  const tasks: DecompositionTask[] = [];

  for (const item of characters) {
    if (!item.decomposition || item.decomposition.components.length === 0) {
      continue;
    }

    tasks.push({
      type: "decomposition",
      id: `decomposition-${item.character.character}-${tasks.length}`,
      character: item.character.character,
      components: item.decomposition.components,
      structureType: item.decomposition.structureType,
      correctAnswer: item.decomposition.components,
    });

    if (limit && tasks.length >= limit) {
      break;
    }
  }

  return limit ? tasks.slice(0, limit) : tasks;
}
