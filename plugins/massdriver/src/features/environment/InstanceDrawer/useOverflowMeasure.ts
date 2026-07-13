import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Measures rendered tab widths against the container and returns how many tabs
 * fit before overflowing into a "more" menu. Ported from the web app's
 * `features/environments/components/InstanceTabs/useOverflowMeasure.js`.
 */
export const useOverflowMeasure = ({
  itemCount,
  minVisible,
  moreButtonWidth,
}: {
  itemCount: number;
  minVisible: number;
  moreButtonWidth: number;
}) => {
  const [visibleCount, setVisibleCount] = useState(itemCount);
  const [measured, setMeasured] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabWidthsRef = useRef<number[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (tabWidthsRef.current.length === 0) {
      const tabElements = container.querySelectorAll('[role="tab"]');
      if (tabElements.length === 0) return;
      tabWidthsRef.current = Array.from(tabElements).map(
        element => element.getBoundingClientRect().width,
      );
      setMeasured(true);
    }

    const widths = tabWidthsRef.current;
    const containerWidth = container.getBoundingClientRect().width;
    let usedWidth = 0;
    let count = 0;

    for (let index = 0; index < widths.length; index++) {
      const remaining = widths.length - count;
      const needsMore = remaining > 1;
      const budget = needsMore
        ? containerWidth - moreButtonWidth
        : containerWidth;

      if (usedWidth + widths[index] <= budget) {
        usedWidth += widths[index];
        count++;
      } else {
        break;
      }
    }

    const minFitWidth = widths
      .slice(0, minVisible)
      .reduce((sum, width) => sum + width, 0);
    const minFitsWithMore = containerWidth - moreButtonWidth >= minFitWidth;
    const floor = minFitsWithMore ? minVisible : count;

    setVisibleCount(Math.max(floor, count));
  }, [minVisible, moreButtonWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    requestAnimationFrame(measure);

    return () => observer.disconnect();
  }, [measure]);

  return { containerRef, visibleCount, measured };
};

export default useOverflowMeasure;
