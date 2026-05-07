"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/ui/AppShell";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";
import EndOfSessionSummary from "@/app/components/ui/EndOfSessionSummary";
import { useSessionSummary } from "@/lib/activity/useSessionSummary";

function FlashcardContent() {
  const router = useRouter();
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();

  useEffect(() => { initSession(); }, [initSession]);

  return (
    <AppShell title="字卡溫習" emoji="🃏" bg="sky" fillHeight onBack={() => requestExit(() => router.push('/'))}>
      <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-3 pt-2 pb-2">
        <FlashcardRevision />
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
