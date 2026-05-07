import { loadRoot, saveRoot } from '../storage';
import type { RootSchema } from '../storage/types';

export function exportProgress(): void {
  if (typeof window === 'undefined') return;
  const root = loadRoot();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const json = JSON.stringify(root, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProgress(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as RootSchema;
  if (typeof data.schemaVersion !== 'number') throw new Error('Invalid progress file');
  saveRoot(data);
}
