import { useUnFocus } from "@/hooks/useUnFocus";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { useRef } from "react";

interface EmojiProps {
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  showPicker: boolean;
  setShowPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Emoji({
  setMessage,
  showPicker,
  setShowPicker,
}: EmojiProps) {
  const onEmojiClick = (emojiData: EmojiClickData): void => {
    setMessage((prev) => prev + emojiData.emoji);
  };
  const emojiRef = useRef<HTMLDivElement>(null);
  useUnFocus("na", setShowPicker, emojiRef);

  return (
    showPicker && (
      <div ref={emojiRef} className="absolute bottom-0 left-5">
        <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} />
      </div>
    )
  );
}
