export default function BarSpinner({
  size = 4,
  speed = 4,
  color = null,
  density = 3,
}: {
  size?: number;
  speed?: number;
  color?: string | null;
  density?: number;
}) {
  const rotations = [0, 45, 90, 135];

  return (
    <div
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        animationDuration: `${speed}s`,
      }}
      className="relative flex items-center justify-center animate-spin"
    >
      {rotations.map((rotation) => (
        <hr
          key={rotation}
          style={{
            borderTopWidth: `${density}px`,
            transform: `rotate(${rotation}deg)`,
          }}
          className={`absolute w-full ${color ? `border-${color}` : "border-pri"}`}
        />
      ))}
    </div>
  );
}
