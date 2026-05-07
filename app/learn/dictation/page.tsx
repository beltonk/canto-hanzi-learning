"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/ui/AppShell";
import DictationExercise from "@/app/components/learning/DictationExercise";
import EndOfSessionSummary from "@/app/components/ui/EndOfSessionSummary";
import { useSessionSummary } from "@/lib/activity/useSessionSummary";

function DictationContent() {
  const router = useRouter();
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();

  useEffect(() => { initSession(); }, [initSession]);

  return (
    <AppShell title="默書練習" emoji="✏️" bg="amber" onBack={() => requestExit(() => router.push('/'))}>
      <div className="w-full h-full p-0">
        <DictationExercise />
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
    <AppShell title="默書練習" emoji="✏️" bg="amber">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">✏️</div>
          <div className="text-lg text-slate-500">載入中...</div>
        </div>
      </div>
    </AppShell>
  );
}

export default function DictationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DictationContent />
    </Suspense>
  );
}
