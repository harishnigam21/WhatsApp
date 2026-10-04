import { useState, useCallback, useRef, useEffect } from "react";

export function useElementHeight() {
  const [height, setHeight] = useState(0);
  const observerRef = useRef(null);

  // This function is passed to the "ref" attribute of your element
  const ref = useCallback((node) => {
    if (node !== null) {
      // 1. Initial measurement
      setHeight(node.getBoundingClientRect().height);

      // 2. Set up ResizeObserver to watch for future changes
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setHeight(entries[0].contentRect.height);
        }
      });

      resizeObserver.observe(node);
      observerRef.current = resizeObserver;
    }
  }, []);

  // Cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [ref, height];
}
