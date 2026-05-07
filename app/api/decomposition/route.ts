import { NextRequest, NextResponse } from 'next/server';
import { loadDecompositionDict, getDecomposition } from '@/lib/data/decompositionLoader';

export async function GET(request: NextRequest) {
  const char = request.nextUrl.searchParams.get('char');
  if (char) {
    const entry = getDecomposition(char);
    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ character: char, ...entry });
  }
  const dict = loadDecompositionDict();
  return NextResponse.json({
    characters: Object.entries(dict).map(([character, entry]) => ({ character, ...entry })),
    count: Object.keys(dict).length,
  });
}
