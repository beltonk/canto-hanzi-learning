"use client";

import { useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/app/components/ui/AppShell";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";
import EndOfSessionSummary from "@/app/components/ui/EndOfSessionSummary";
import { useSessionSummary } from "@/lib/activity/useSessionSummary";

function FlashcardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();

  useEffect(() => { initSession(); }, [initSession]);

  // Parse ?chars=A,B,C and the legacy ?char=X param so other pages
  // (e.g. 今日要複習, 學習狀態) can deep-link into a focused revision list.
  const initialCharList = useMemo<string[] | undefined>(() => {
    const charsParam = searchParams.get("chars");
    const charParam = searchParams.get("char");
    const raw = (charsParam || charParam || "").trim();
    if (!raw) return undefined;
    const list = Array.from(
      new Set(
        raw
          .split(/[,\s]+/)
          .map(s => s.trim())
          .filter(s => s.length === 1 && /[\u4e00-\u9fff]/.test(s)),
      ),
    );
    return list.length > 0 ? list : undefined;
  }, [searchParams]);

  const initialTitle = searchParams.get("title") ?? undefined;

  return (
    <AppShell title="字卡溫習" emoji="🃏" bg="sky" fillHeight onBack={() => requestExit(() => router.push('/'))}>
      <div className="flex-1 flex flex-col min-h-0">
        <FlashcardRevision initialCharList={initialCharList} initialTitle={initialTitle} />
      </div>
      {summary && (
        <EndOfSessionSummary
          xpEarned={summary.xpEarned}
          charsCount={summary.charsCount}
          streak={summary.streak}
          onClose={dismissSummary}
        />
      )}
    </AppShell>
  );
}

function LoadingFallback() {
  return (
    <AppShell title="字卡溫習" emoji="🃏" bg="sky">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🃏</div>
          <div className="text-lg text-slate-500">載入中...</div>
        </div>
      </div>
    </AppShell>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlashcardContent />
    </Suspense>
  );
}
