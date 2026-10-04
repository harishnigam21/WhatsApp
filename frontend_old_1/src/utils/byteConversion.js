export const convertToByte = (input) => {
  const normalized = input.replace(/\s+/g, "").toUpperCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)(KB|MB|GB|TB)$/);
  if (!match) {
    throw new Error("Invalid format. Use '1KB','1MB', '1GB', or '1TB'.");
  }
  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers = {
    KB: Math.pow(1024, 1), //1024 bytes
    MB: Math.pow(1024, 2), // 1,048,576 bytes
    GB: Math.pow(1024, 3), // 1,073,741,824 bytes
    TB: Math.pow(1024, 4), // 1,099,511,627,776 bytes
  };
  const bytes = value * multipliers[unit];
  return bytes;
};
export const convertFromBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
