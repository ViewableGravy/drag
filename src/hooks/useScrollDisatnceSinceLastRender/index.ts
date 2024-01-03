import { useEffect, useRef, useState } from "react";

export const useVerticalScrollDistanceSinceLastRender = ({
  debounceTime = 100
}: {
  debounceTime?: number,
} = {}) => {
  const [distance, setDistance] = useState(0);
  const lastRender = useRef(0);
  const debounce = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (debounce.current) return;
      debounce.current = window.setTimeout(() => {
        debounce.current = 0;
      }, debounceTime);

      setDistance(window.scrollY - lastRender.current);
      lastRender.current = window.scrollY;
    }

    window.addEventListener('scroll', handleScroll);

    return () => {
      setDistance(0);
      window.removeEventListener('scroll', handleScroll);
    }
  }, [debounceTime]);

  return { distance };
}