import EmojiPicker, { Theme } from "emoji-picker-react";
export default function Emoji({ setMessage, showPicker, setShowPicker }) {
  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };
  return (
    showPicker && (
      <div
        className="absolute left-2 bottom-0"
        onMouseLeave={() => setShowPicker(false)}
      >
        <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} />
      </div>
    )
  );
}
