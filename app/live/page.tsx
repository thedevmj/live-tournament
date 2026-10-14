import type { Metadata } from "next";
import { getTournamentState } from "@/lib/store";
import LiveClient from "./LiveClient";

export const metadata: Metadata = {
  title: "Live",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const state = await getTournamentState();

  return <LiveClient initialState={state} />;
}