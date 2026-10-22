export const scrollToSection = (
  id: string,
  containerRef: React.RefObject<HTMLElement | null>,
) => {
  const container = containerRef.current;
  const element = document.getElementById(id);

  if (!container || !element) return false;

  const start = container.scrollTop;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const target = start + (elementRect.top - containerRect.top);

  const distance = target - start;
  const duration = 1000;

  let startTime: number | null = null;

  const easeInOut = (t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  const animate = (currentTime: number) => {
    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    container.scrollTop = start + distance * easeInOut(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
  return true;
};
