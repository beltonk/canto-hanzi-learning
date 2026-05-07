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
    <AppShell title="字卡溫習" emoji="🃏" bg="sky" onBack={() => requestExit(() => router.push('/'))}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
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
