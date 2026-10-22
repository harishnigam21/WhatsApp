"use client";
import { setScreenSize } from "@/redux/slices/LayoutSlice";
import { useAppDispatch } from "@/redux/Store";
import { useEffect } from "react";

export default function ScreenSize() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handleResize = () => {
      dispatch(
        setScreenSize({ width: window.innerWidth, height: window.innerHeight }),
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);
  return null;
}
