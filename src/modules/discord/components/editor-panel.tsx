"use client";

import { Users, MessageCircleMore, Settings2 } from "lucide-react";

const sections = [
  {
    title: "Accounts",
    description: "Create Discord identities with avatars and role colors.",
    icon: Users,
  },
  {
    title: "Messages",
    description: "Compose user and system messages with timestamp controls.",
    icon: MessageCircleMore,
  },
  {
    title: "Workspace",
    description: "Adjust Discord-specific settings and future module options.",
    icon: Settings2,
  },
];

export function DiscordEditorPanel() {
  return (
    <aside className="rounded-[24px] border border-white/10 bg-chrome-950/60 p-4">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
          Discord Editor
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Control panel</h2>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.title}
              className="rounded-[18px] border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-discord-accent/15 p-2 text-discord-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{section.title}</h3>
                  <p className="text-sm text-chrome-300">{section.description}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
