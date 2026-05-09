import type { DiscordAccount } from "@/modules/discord/state/discord-types";
import { MessageAvatar } from "./shared";

export function MemberList({
  accounts,
  assetUrls,
  statusBg,
  isFullWidth = false,
}: {
  accounts: DiscordAccount[];
  assetUrls: Record<string, string>;
  statusBg: string;
  isFullWidth?: boolean;
}) {
  const onlineAccounts = accounts.filter((account) => account.status !== "invisible");
  const offlineAccounts = accounts.filter((account) => account.status === "invisible");

  return (
    <div
      className={`${isFullWidth ? "w-full" : "w-60 shrink-0"} overflow-y-auto px-2 py-4`}
    >
      <div className="mb-6">
        <h3 className="mb-2 px-2 text-sm font-semibold tracking-wider text-discord-muted">
          Online — {onlineAccounts.length}
        </h3>
        <div className="space-y-0.5">
          {onlineAccounts.map((account) => (
            <div
              key={account.id}
              className="group flex items-center gap-3 rounded px-2 py-1.5 transition hover:bg-white/5"
            >
              <MessageAvatar
                avatarUrl={account.avatarAssetId ? (assetUrls[account.avatarAssetId] ?? null) : null}
                authorName={account.username}
                status={account.status}
                statusBg={statusBg}
              />
              <span
                className="truncate font-medium opacity-90 group-hover:opacity-100"
                style={{ color: account.roleColor }}
              >
                {account.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {offlineAccounts.length > 0 ? (
        <div>
          <h3 className="mb-2 px-2 text-sm font-semibold tracking-wider text-discord-muted">
            Offline — {offlineAccounts.length}
          </h3>
          <div className="space-y-0.5">
            {offlineAccounts.map((account) => (
              <div
                key={account.id}
                className="group flex items-center gap-3 rounded px-2 py-1.5 opacity-35 grayscale-[0.5] transition hover:bg-white/5"
              >
                <MessageAvatar
                  avatarUrl={account.avatarAssetId ? (assetUrls[account.avatarAssetId] ?? null) : null}
                  authorName={account.username}
                />
                <span className="truncate font-medium text-discord-muted">
                  {account.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
