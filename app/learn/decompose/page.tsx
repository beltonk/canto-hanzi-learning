"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/ui/AppShell";
import DecompositionPlay from "@/app/components/learning/DecompositionPlay";
import EndOfSessionSummary from "@/app/components/ui/EndOfSessionSummary";
import { useSessionSummary } from "@/lib/activity/useSessionSummary";

function DecomposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || undefined;
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();

  useEffect(() => { initSession(); }, [initSession]);

  return (
    <AppShell title="拆字" emoji="🧩" bg="emerald" onBack={() => requestExit(() => router.push('/'))}>
      <div className="w-full h-full p-0">
        <DecompositionPlay
          character={char}
          onCharacterChange={(newChar) => {
            router.replace(`/learn/decompose?char=${encodeURIComponent(newChar)}`, { scroll: false });
          }}
        />
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
    <AppShell title="拆字遊戲" emoji="🧩" bg="emerald">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🧩</div>
          <div className="text-lg text-slate-500">載入中...</div>
        </div>
      </div>
    </AppShell>
  );
}

export default function DecomposePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DecomposeContent />
    </Suspense>
  );
}
