import "server-only";
import type { GranolaMeeting } from "./types";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_MEETINGS: GranolaMeeting[] = [
  {
    id: "demo-mtg-jessica-kung",
    title: "TCW — investment talent strategy review (Jessica Kung)",
    occurred_at: daysAgo(6),
    duration_minutes: 50,
    attendees: [
      { email: "jessica.kung@tcw.com", name: "Jessica Kung" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "Jessica walked through TCW's plan to rebuild investment-team comp benchmarking against the boutique peer set. She's frustrated with the lag in the current consultant deliverables and wants a tighter loop: refreshed data, opinionated recommendations, faster turnaround. Michael owes a one-pager on what a quarterly cadence would look like by next Friday.",
    transcript:
      "Jessica: The board wants a number by the next meeting and the consultants are still calibrating. We can't run an investment org on quarterly lag...",
  },
  {
    id: "demo-mtg-penny-alexander",
    title: "Franklin Templeton — global workforce planning + RTO (Penny Alexander)",
    occurred_at: daysAgo(13),
    duration_minutes: 35,
    attendees: [
      { email: "penny.alexander@franklintempleton.com", name: "Penny Alexander" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "Penny is balancing a global RTO mandate with a hybrid-or-leave problem in the New York investment teams. She's looking for benchmarks on how peer asset managers are framing the policy without bleeding senior talent. Asked for an exec brief comparing 5 named peers; pilot study scope to be defined.",
    transcript:
      "Penny: We can't be the firm where the policy lands and the ten people we cannot afford to lose hand in their notice. Tell me what the others are actually doing, not what they're saying...",
  },
  {
    id: "demo-mtg-nicole-zimmerman",
    title: "GMO — DEI program redesign at boutique scale (Nicole Zimmerman)",
    occurred_at: daysAgo(24),
    duration_minutes: 45,
    attendees: [
      { email: "nicole.zimmerman@gmo.com", name: "Nicole Zimmerman" },
      { email: "michael@beaconap.com", name: "Michael Sands" },
    ],
    summary:
      "Nicole is stripping GMO's DEI program back to first principles after an internal audit found that volume of programs ≠ outcomes. She wants Michael's read on what 3 things actually move the needle at a sub-1000-person firm. Follow-up: Michael to share a memo of pattern matches across his book.",
    transcript:
      "Nicole: I have eleven initiatives and I think two of them are doing real work. I'd rather kill nine and double down than keep performing them...",
  },
];

export function isGranolaDemoMode(): boolean {
  if (process.env.GRANOLA_DEMO_MODE === "true") return true;
  if (!process.env.GRANOLA_API_KEY) return true;
  return false;
}
