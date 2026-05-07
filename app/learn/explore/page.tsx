"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/ui/AppShell";
import CharacterExploration from "@/app/components/learning/CharacterExploration";
import EndOfSessionSummary from "@/app/components/ui/EndOfSessionSummary";
import { useSessionSummary } from "@/lib/activity/useSessionSummary";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || undefined;
  const initialQuery = searchParams.get("q") || undefined;
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();

  useEffect(() => { initSession(); }, [initSession]);

  return (
    <AppShell title="查字 · 認字" emoji="🔍" bg="rose" onBack={() => requestExit(() => router.push('/'))}>
      <div className="w-full h-full p-0">
        <CharacterExploration
          character={char}
          initialQuery={initialQuery}
          onCharacterChange={(newChar) => {
            const params = new URLSearchParams();
            params.set("char", newChar);
            router.push(`/learn/explore?${params.toString()}`);
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
    <AppShell title="查字 · 認字" emoji="🔍" bg="rose">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">📖</div>
          <div className="text-lg text-slate-500">載入中...</div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExploreContent />
    </Suspense>
  );
}
