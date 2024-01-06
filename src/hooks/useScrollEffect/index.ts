import { useEffect, useRef } from "react";

type TUseScroll = (callback: (e: Event & { 
  offset: { x: number, y: number } 
}) => void, dependencies: unknown[]) => void;

/**
 * hook that fires a callback when the user scrolls. Using the dependency array
 * you can control when the initialScroll is reset, meaning that the callback also
 * has access to the offset of the scroll in addition to the event information.
 */
export const useScrollOffsetEffect: TUseScroll = (onScroll, dependencies) => {
  const initialScroll = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const { x, y } = initialScroll.current;
      const { scrollX, scrollY } = window;

      onScroll(Object.assign(event, {
        offset: {
          x: scrollX - x,
          y: scrollY - y,
        }
      }))
    }

    initialScroll.current = {
      x: window.scrollX,
      y: window.scrollY,
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll);
  }, [...dependencies])
};