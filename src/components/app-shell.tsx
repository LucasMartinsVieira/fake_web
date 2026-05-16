"use client";

import { useAppContext } from "@/state/app-context";
import { ModuleSwitcher } from "@/components/module-switcher";
import { GlobalToolbar } from "@/components/global-toolbar";
import { DiscordWorkspace } from "@/modules/discord/components/discord-workspace";
import { TwitterWorkspace } from "@/modules/twitter/components/twitter-workspace";

export function AppShell() {
  const { activeModule, discordState, twitterState } = useAppContext();

  const activeSummary =
    activeModule === "discord"
      ? `${discordState.accounts.length} accounts · ${discordState.messages.length} messages`
      : activeModule === "twitter"
        ? `${twitterState.replyChain.length + 1} posts in current setup`
        : "Placeholder module";

  return (
    <main className="min-h-screen px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col gap-5 rounded-[32px] border border-white/10 bg-chrome-900/75 p-4 shadow-panel backdrop-blur-xl md:p-6">
        <header className="overflow-hidden rounded-[28px] border border-white/10 bg-chrome-950/75">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,101,242,0.22),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.16),transparent_24%)]" />
            <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
              <div className="max-w-2xl">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.28em] text-chrome-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-chrome-300">
                    Fake Web
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
                    Active module ready
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
              Fake Web
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Modular mockup generator
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-chrome-300 md:text-[15px]">
                  Cleaner editing flow, faster imports, sharper exports. Canvas stays faithful while rest of studio feels easier to use.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-chrome-200 sm:grid-cols-2 lg:min-w-[360px] lg:max-w-[420px]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-chrome-500">
                    Current scope
                  </p>
                  <p className="mt-2 font-medium text-white">{activeSummary}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-chrome-500">
                    Workflow
                  </p>
                  <p className="mt-2 font-medium text-white">
                    Edit left, review right, export when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <GlobalToolbar />

        <ModuleSwitcher />

        <section className="grid flex-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          {activeModule === "discord" ? (
            <DiscordWorkspace />
          ) : activeModule === "twitter" ? (
            <TwitterWorkspace />
          ) : (
            <div className="col-span-full rounded-[28px] border border-dashed border-white/10 bg-chrome-950/40 p-10 text-center text-chrome-300">
              This module is intentionally a placeholder in Phase 1.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
