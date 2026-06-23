import Link from "next/link";
import { ConsoleCard } from "~/ui/card";
import type {
  getModerationPageData,
  ProductionReport,
} from "~/server/loaders/moderation";

type ModerationData = Awaited<ReturnType<typeof getModerationPageData>>;

function ReportListItem({
  report,
  clientNames,
}: {
  report: ProductionReport;
  clientNames: Record<string, string>;
}) {
  return (
    <li>
      <Link
        href={`/console/moderation/${report.id}`}
        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm text-white/80">
            {report.contentTypeLabel ? `${report.contentTypeLabel}: ` : ""}
            {report.contentId}
          </span>
          <span className="text-xs text-mauve-400">
            {clientNames[report.clientId] ?? report.clientId} ·{" "}
            {report.reasonTitle ?? "Unknown reason"} ·{" "}
            {new Date(report.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {report.corroborationCount > 0 && (
            <span className="rounded-sm bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
              +{report.corroborationCount} corroboration
              {report.corroborationCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-mauve-400">→</span>
        </div>
      </Link>
    </li>
  );
}

export default function ModerationContent({
  pendingReports,
  resolvedReports,
  clientNames,
}: Pick<ModerationData, "pendingReports" | "resolvedReports" | "clientNames">) {
  return (
    <>
      <ConsoleCard.Root>
        <ConsoleCard.Header title="Pending Reports" />
        <ConsoleCard.Content>
          <div>
            {pendingReports.length === 0 ? (
              <p className="text-sm text-mauve-400">No pending reports.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pendingReports.map((report) => (
                  <ReportListItem
                    key={report.id}
                    report={report}
                    clientNames={clientNames}
                  />
                ))}
              </ul>
            )}
          </div>
        </ConsoleCard.Content>
      </ConsoleCard.Root>

      {resolvedReports.length > 0 && (
        <ConsoleCard.Root>
          <ConsoleCard.Header title="Recent Resolved" />
          <ConsoleCard.Content>
            <div>
              <ul className="flex flex-col gap-2">
                {resolvedReports.slice(0, 20).map((report) => (
                  <li key={report.id}>
                    <Link
                      href={`/console/moderation/${report.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-mauve-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      <span className="font-mono">
                        {report.contentTypeLabel ? `${report.contentTypeLabel}: ` : ""}
                        {report.contentId}
                      </span>
                      <span className="text-mauve-400 capitalize">
                        {report.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ConsoleCard.Content>
        </ConsoleCard.Root>
      )}
    </>
  );
}
