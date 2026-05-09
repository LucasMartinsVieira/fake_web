import { Gift, Plus } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-0.5">
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
    </div>
  );
}

function ChatInputAction({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[#b5bac1] transition hover:text-[#dbdee1] ${className}`}
    >
      {children}
    </button>
  );
}

export function ChatInputPreview({
  channelName,
  inputTargetUsername,
  typingUsername,
  value,
  onChange,
}: {
  channelName: string;
  inputTargetUsername: string | null;
  typingUsername: string | null;
  value: string;
  onChange: (value: string) => void;
}) {
  const placeholder = inputTargetUsername
    ? `Message @${inputTargetUsername}`
    : `Message #${channelName}`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <div className="mt-4 px-4 pb-1">
      <div className="mb-1.5 ml-2 min-h-6 text-[12px] leading-4 text-[#949ba4]">
        {typingUsername ? (
          <div className="flex items-center gap-4">
            <TypingDots />
            <span>
              <span className="font-bold text-[#ffffff]">{typingUsername}</span>{" "}
              is typing...
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-[44px] items-start gap-2 rounded-lg bg-[#383a40] pl-3 pr-2 text-[#dbdee1] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <ChatInputAction className="mt-[6px] h-6 w-6 self-start text-[#b5bac1] hover:text-[#dbdee1]">
          <Plus className="h-[22px] w-[22px] fill-current stroke-[1.75]" />
        </ChatInputAction>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={1}
          placeholder={placeholder}
          className="min-h-[22px] flex-1 resize-none overflow-hidden bg-transparent py-[11px] text-[15px] leading-[22px] text-[#dbdee1] outline-none placeholder:text-[#949ba4]"
        />

        <div className="mt-[6px] flex shrink-0 items-center gap-0.5 self-start">
          <ChatInputAction>
            <Gift className="h-5 w-5 stroke-[1.85]" />
          </ChatInputAction>
          <ChatInputAction className="text-[12px] font-semibold tracking-[0.02em]">
            GIF
          </ChatInputAction>
          <ChatInputAction>
            <span className="relative block h-[18px] w-[18px] rounded-[4px] border-2 border-current">
              <span className="absolute right-[-2px] top-[-2px] h-[7px] w-[7px] rounded-sm border-b-2 border-l-2 border-current bg-[#383a40]" />
            </span>
          </ChatInputAction>
          <ChatInputAction className="text-[18px] leading-none">☺</ChatInputAction>
        </div>
      </div>
    </div>
  );
}
