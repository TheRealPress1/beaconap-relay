import { PageHeader } from "@/components/app/PageHeader";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

type Row = {
  label: string;
  envKey: string;
  configured: boolean;
  demoMode?: boolean;
  phase: string;
};

function getRows(): Row[] {
  return [
    {
      label: "Session secret",
      envKey: "BEACONAP_SESSION_SECRET",
      configured: (process.env.BEACONAP_SESSION_SECRET?.length ?? 0) >= 32,
      phase: "Phase 1 (required)",
    },
    {
      label: "Login passphrase",
      envKey: "BEACONAP_PASSPHRASE",
      configured: Boolean(process.env.BEACONAP_PASSPHRASE),
      phase: "Phase 1 (required)",
    },
    {
      label: "Supabase",
      envKey: "NEXT_PUBLIC_SUPABASE_URL",
      configured:
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      phase: "Phase 1 (required)",
    },
    {
      label: "Anthropic",
      envKey: "ANTHROPIC_API_KEY",
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      demoMode: process.env.ANTHROPIC_DEMO_MODE === "true",
      phase: "Phase 1 (CEO key)",
    },
    {
      label: "Tavily / Exa",
      envKey:
        process.env.SEARCH_PROVIDER === "exa" ? "EXA_API_KEY" : "TAVILY_API_KEY",
      configured: Boolean(process.env.TAVILY_API_KEY || process.env.EXA_API_KEY),
      demoMode: process.env.RESEARCH_DEMO_MODE === "true",
      phase: "Phase 3",
    },
    {
      label: "Granola",
      envKey: "GRANOLA_API_KEY",
      configured: Boolean(process.env.GRANOLA_API_KEY),
      demoMode: process.env.GRANOLA_DEMO_MODE === "true",
      phase: "Phase 5",
    },
    {
      label: "Apollo.io",
      envKey: "APOLLO_API_KEY",
      configured: Boolean(process.env.APOLLO_API_KEY),
      demoMode: process.env.APOLLO_DEMO_MODE === "true",
      phase: "Phase 5",
    },
    {
      label: "Gmail OAuth",
      envKey: "GOOGLE_OAUTH_CLIENT_ID",
      configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
      demoMode: process.env.EMAIL_DEMO_MODE === "true",
      phase: "Phase 6",
    },
    {
      label: "Outlook OAuth",
      envKey: "MICROSOFT_OAUTH_CLIENT_ID",
      configured: Boolean(process.env.MICROSOFT_OAUTH_CLIENT_ID),
      demoMode: process.env.EMAIL_DEMO_MODE === "true",
      phase: "Phase 6",
    },
  ];
}

export default function SettingsPage() {
  const rows = getRows();
  return (
    <>
      <PageHeader
        title="API Settings"
        subtitle="Status of every paid integration. CEO drops in keys at handoff."
      />
      <div className="px-8 py-7">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Env variable</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Phase</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = row.configured
                  ? row.demoMode
                    ? {
                        Icon: AlertCircle,
                        color: "text-status-warm",
                        text: "Configured · demo on",
                      }
                    : {
                        Icon: CheckCircle2,
                        color: "text-status-success",
                        text: "Live",
                      }
                  : {
                      Icon: Circle,
                      color: "text-text-tertiary",
                      text: "Awaiting key",
                    };
                const Icon = status.Icon;
                return (
                  <tr key={row.envKey} className="border-b border-border/30 last:border-0">
                    <td className="px-5 py-3.5 text-sm font-medium text-text-primary">
                      {row.label}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">
                      {row.envKey}
                    </td>
                    <td className={`px-5 py-3.5 ${status.color}`}>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Icon className="h-3.5 w-3.5" />
                        {status.text}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-tertiary">{row.phase}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
