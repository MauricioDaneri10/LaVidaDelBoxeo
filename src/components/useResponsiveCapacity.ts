import { useEffect, useState } from "react";

/** Conservative capacity switch for card views with known readable minimums. */
export function useResponsiveCapacity(query = "(min-width: 1440px) and (min-height: 850px)") {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
