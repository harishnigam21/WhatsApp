import { RefObject, useEffect } from "react";

export function useUnFocus(
  id: string,
  setShow: React.Dispatch<React.SetStateAction<boolean>>,
  sectionRef: RefObject<HTMLDivElement | HTMLOListElement | null>,
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node) &&
        target.id !== id &&
        !target.closest(`#${id}`)
      ) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
}
