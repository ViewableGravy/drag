import { useEffect, useRef } from "react";

export function useDelay(callback: () => void, delay: number, disabled: boolean = false) {
  // Save callback and timeout id to refs so they're the same for every render
  const callbackRef = useRef(callback);
  const timeoutIdRef = useRef<null | number>(null);
  callbackRef.current = callback;

  useEffect(() => {
    timeoutIdRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    }; // Clear timeout if the components unmounts
  }, [delay]); // Recreate timeout if delay changes

  const clear = () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
  }

  const initiate = () => {
      if (disabled) return;
      clear();
      timeoutIdRef.current = setTimeout(() => {
          callbackRef.current();
      }, delay);
  }

  return { initiate, clear };
}