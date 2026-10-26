export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const targetIndex = i >= sizes.length ? sizes.length - 1 : i;
  const formattedValue = parseFloat(
    (bytes / Math.pow(k, targetIndex)).toFixed(dm),
  );
  return `${formattedValue} ${sizes[targetIndex]}`;
};
