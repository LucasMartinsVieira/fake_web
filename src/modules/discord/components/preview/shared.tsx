import { useAppContext } from "@/state/app-context";
import type {
  DiscordMessage,
  DiscordUserStatus,
} from "@/modules/discord/state/discord-types";
import { getAvatarColor } from "@/modules/discord/utils/get-avatar-color";

function UserStatusIcon({
  status,
  className = "",
}: {
  status: DiscordUserStatus;
  className?: string;
}) {
  switch (status) {
    case "online":
      return <div className={`h-full w-full rounded-full bg-[#23a55a] ${className}`} />;
    case "idle":
      return (
        <div
          className={`relative h-full w-full rounded-full bg-[#f0b232] ${className}`}
        >
          <div
            className="absolute -left-1.5 -top-1.5 h-4 w-4 rounded-full"
            style={{ backgroundColor: "inherit", filter: "brightness(0.5)" }}
          />
        </div>
      );
    case "dnd":
      return (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-[#da3e44] ${className}`}
        >
          <div className="h-[2.5px] w-[8px] rounded-full bg-black" />
        </div>
      );
    case "invisible":
      return (
        <div
          className={`h-full w-full rounded-full border-2 border-[#84858d] bg-transparent ${className}`}
        />
      );
    default:
      return null;
  }
}

export function MessageAvatar({
  avatarUrl,
  authorName,
  status,
  statusBg,
}: {
  avatarUrl: string | null;
  authorName: string;
  status?: DiscordUserStatus;
  statusBg?: string;
}) {
  const avatar = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={authorName}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full font-semibold ${
        getAvatarColor(authorName) === "#fee75c" ? "text-black/70" : "text-white"
      }`}
      style={{ backgroundColor: getAvatarColor(authorName) }}
    >
      {authorName.slice(0, 1)}
    </div>
  );

  return (
    <div className="relative mt-0.5 h-10 w-10 shrink-0">
      {avatar}
      {status ? (
        <div
          className="absolute -bottom-[2px] -right-[2px] h-[18px] w-[18px] rounded-full p-[3px]"
          style={{ backgroundColor: statusBg }}
        >
          <UserStatusIcon status={status} />
        </div>
      ) : null}
    </div>
  );
}

export function MessageAttachments({ message }: { message: DiscordMessage }) {
  const { assetUrls } = useAppContext();

  if (!message.attachments.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {message.attachments.map((attachment) => (
        <figure
          key={attachment.id}
          className="max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-black/10"
        >
          {attachment.assetId && assetUrls[attachment.assetId] ? (
            <img
              src={assetUrls[attachment.assetId]}
              alt={attachment.name}
              className="block max-h-[360px] w-full object-cover"
            />
          ) : null}
          <figcaption className="border-t border-white/5 px-3 py-2 text-xs text-discord-muted">
            {attachment.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
