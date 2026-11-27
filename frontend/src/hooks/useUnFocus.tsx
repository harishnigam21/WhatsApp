import { RefObject, useEffect } from "react";

export function useUnFocus(
  id: string | string[],
  setShow: React.Dispatch<React.SetStateAction<boolean>>,
  sectionRef: RefObject<HTMLDivElement | HTMLOListElement | null>,
) {
  const ids = Array.isArray(id) ? id : [id];
  const idResults = (target: HTMLElement) => {
    const result = ids.map((item) => {
      return target.id !== item && !target.closest(`#${item}`);
    });
    return result.every(Boolean);
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node) &&
        idResults(target)
      ) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
}
