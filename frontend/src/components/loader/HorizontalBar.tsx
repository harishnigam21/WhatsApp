interface compoProps {
  position?: string;
}
export default function HorizontalBar({ position }: compoProps) {
  return (
    <div
      className={`absolute ${position ? position : "top-0 left-0"} w-1/4 h-0.5 z-50 bg-pri animate-[HorizontalBarAnimation_1s_linear_infinite] transition-colors`}
    ></div>
  );
}