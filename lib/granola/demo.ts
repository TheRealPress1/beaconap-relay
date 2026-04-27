import "server-only";
import type { GranolaMeeting } from "./types";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_MEETINGS: GranolaMeeting[] = [
  {
    id: "demo-mtg-sarah",
    title: "BlackRock — AI tooling roadmap (Sarah Chen)",
    occurred_at: daysAgo(8),
    duration_minutes: 45,
    attendees: [
      { email: "sarah.chen@blackrock.com", name: "Sarah Chen" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "Sarah walked through BlackRock's evaluation framework for LLM vendors. Two priorities: explainability for portfolio managers, and on-prem inference for any data touching client positions. She asked for case studies from comparable funds; Michael owes a write-up by next Friday.",
    transcript:
      "Sarah: We've shortlisted three vendors but the partners pushed back hard on opaque models...",
  },
  {
    id: "demo-mtg-david",
    title: "Apollo Global — private credit AI screen (David Park)",
    occurred_at: daysAgo(15),
    duration_minutes: 30,
    attendees: [
      { email: "david.park@apollo.com", name: "David Park" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "David is rebuilding the deal-screening pipeline and wants an LLM-assisted memo step before partner review. Concern: false positives wasting analyst time. He wants a 30-day pilot with one originator.",
    transcript:
      "David: The bottleneck right now isn't deal flow, it's the time it takes to disqualify the bottom half...",
  },
  {
    id: "demo-mtg-marcus",
    title: "Citadel Securities — execution co-pilot prototype (Marcus Wei)",
    occurred_at: daysAgo(22),
    duration_minutes: 50,
    attendees: [
      { email: "marcus.wei@citadel.com", name: "Marcus Wei" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "Marcus showed a Bloomberg-side prototype that surfaces unusual order-book patterns alongside historical analogues. He wants to know how the agent layer would explain a recommendation to a desk head in <2 seconds. Latency budget is the hard constraint.",
    transcript:
      "Marcus: Latency is non-negotiable; if it costs us thirty milliseconds we won't ship it...",
  },
];

export function isGranolaDemoMode(): boolean {
  if (process.env.GRANOLA_DEMO_MODE === "true") return true;
  if (!process.env.GRANOLA_API_KEY) return true;
  return false;
}
