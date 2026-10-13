import type { Metadata } from "next";
import { TopBar, Footer } from "@/components/chrome";
import { AdminPanel } from "@/components/admin-panel";
import { getTournamentState } from "@/lib/store";
import { countLiveMatches } from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Admin — OVERTIME",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const state = await getTournamentState();

  return (
    <>
      <TopBar active="" liveCount={countLiveMatches(state)} />
      <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-12">
        <AdminPanel />
      </main>
      <Footer />
    </>
  );
}
