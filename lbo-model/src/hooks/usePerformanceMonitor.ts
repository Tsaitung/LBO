/**
 * Performance Monitoring Hook
 * Tracks component render times and re-renders
 * Following Linus principle: Measure, don't guess
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

/**
 * Hook to monitor component performance
 * @param componentName - Name of the component being monitored
 * @param logThreshold - Log warning if render time exceeds this threshold (ms)
 */
export const usePerformanceMonitor = (
  componentName: string,
  logThreshold: number = 16 // 16ms = 60fps
) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });

  const renderStartRef = useRef<number>(0);

  // Mark render start
  renderStartRef.current = performance.now();

  useEffect(() => {
    // Calculate render time
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartRef.current;

    // Update metrics
    const metrics = metricsRef.current;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    // Log performance warning if threshold exceeded
    if (renderTime > logThreshold) {
      console.warn(
        `⚠️ Slow render detected in ${componentName}:`,
        {
          renderTime: `${renderTime.toFixed(2)}ms`,
          threshold: `${logThreshold}ms`,
          renderCount: metrics.renderCount,
          averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
        }
      );
    }

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      // Log every 10th render to avoid console spam
      if (metrics.renderCount % 10 === 0) {
        console.log(
          `📊 Performance metrics for ${componentName}:`,
          {
            renderCount: metrics.renderCount,
            lastRenderTime: `${metrics.lastRenderTime.toFixed(2)}ms`,
            averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
            totalRenderTime: `${metrics.totalRenderTime.toFixed(2)}ms`,
          }
        );
      }
    }
  });

  // Return metrics for component use
  return metricsRef.current;
};

/**
 * Hook to track why a component re-rendered
 * Useful for debugging unnecessary re-renders
 */
export const useWhyDidYouUpdate = (
  componentName: string,
  props: Record<string, unknown>
) => {
  const previousProps = useRef<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, unknown> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(
          `🔄 ${componentName} re-rendered due to prop changes:`,
          changedProps
        );
      }
    }

    previousProps.current = props;
  });
};

/**
 * Hook to debounce expensive calculations
 * Prevents excessive recalculation during rapid state changes
 */
export const useDebouncedCalculation = <T>(
  calculation: () => T,
  dependencies: React.DependencyList,
  delay: number = 300
): T | undefined => {
  const [result, setResult] = useState<T>();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      const calculationResult = calculation();
      const endTime = performance.now();

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `⏱️ Calculation took ${(endTime - startTime).toFixed(2)}ms`
        );
      }

      setResult(calculationResult);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return result;
};