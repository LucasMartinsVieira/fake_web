"use client";

import type { CSSProperties } from "react";
import { useAppContext } from "@/state/app-context";
import { formatDiscordTimestamp } from "@/modules/discord/utils/format-discord-timestamp";

export function DiscordPreview() {
  const { canvasScale, discordState } = useAppContext();
  const zoomStyle = { zoom: canvasScale } as CSSProperties;

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-chrome-950/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
            Preview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Discord Web mockup
          </h2>
        </div>
        <p className="text-sm text-chrome-300">
          {discordState.channelName} · {discordState.serverName}
        </p>
      </div>

      <div className="overflow-auto rounded-[20px] bg-discord-panel p-6">
        <div className="mx-auto transition-[zoom]" style={zoomStyle}>
          <div className="w-[880px] max-w-full rounded-[16px] bg-discord-bg p-6 text-discord-text">
            <div className="mb-6 border-b border-white/5 pb-4">
              <p className="text-lg font-semibold">
                #{discordState.channelName}
              </p>
              <p className="text-sm text-discord-muted">
                Mock conversation preview scaffold
              </p>
            </div>

            <div>
              {discordState.messages.map((message, index) => {
                const isGrouped =
                  index > 0 &&
                  discordState.messages[index - 1]?.authorId ===
                    message.authorId;

                return (
                  <article
                    key={message.id}
                    className={`grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 rounded-xl px-4 text-[15px] leading-[1.375rem] transition ho"ver:bg-white/5 ${
                      isGrouped ? "py-[1px]" : "mt-4 pb-0.5 pt-1 first:mt-0"
                    }`}
                  >
                    {!isGrouped ? (
                      <>
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-discord-accent font-semibold text-white">
                          {message.authorName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span
                              className="font-medium"
                              style={{ color: message.roleColor }}
                            >
                              {message.authorName}
                            </span>
                            <span className="text-xs text-discord-muted">
                              {formatDiscordTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="mt-0.5">{message.content}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div aria-hidden="true" />
                        <p>{message.content}</p>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
