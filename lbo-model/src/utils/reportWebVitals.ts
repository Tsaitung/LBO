/**
 * Web Vitals 性能監控
 * Linus 原則：測量真實用戶體驗
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * 性能閾值定義
 * 基於 Google 的建議標準
 */
const THRESHOLDS = {
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, needs_improvement: 0.25 },   // Cumulative Layout Shift
  TTFB: { good: 800, needs_improvement: 1800 },  // Time to First Byte
  INP: { good: 200, needs_improvement: 500 },    // Interaction to Next Paint
};

/**
 * 評估性能指標
 */
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needs_improvement) return 'needs-improvement';
  return 'poor';
}

/**
 * 報告處理器
 * 可以發送到分析服務或控制台
 */
const reportHandler = (metric: Metric) => {
  const rating = rateMetric(metric.name, metric.value);
  
  // 開發環境：輸出到控制台
  if (process.env.NODE_ENV === 'development') {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms [${rating}]`);
  }

  // 生產環境：發送到分析服務
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
    });
  }

  // 也可以發送到自定義後端
  // fetch('/api/metrics', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     name: metric.name,
  //     value: metric.value,
  //     rating,
  //     timestamp: Date.now(),
  //   }),
  // });
};

/**
 * 初始化 Web Vitals 監控
 */
export function initWebVitals(): void {
  onFCP(reportHandler);  // First Contentful Paint
  onLCP(reportHandler);  // Largest Contentful Paint
  onCLS(reportHandler);  // Cumulative Layout Shift
  onTTFB(reportHandler); // Time to First Byte
  onINP(reportHandler);  // Interaction to Next Paint
}

/**
 * 手動報告自定義指標
 */
export function reportCustomMetric(name: string, value: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Custom Metric - ${name}: ${value}`);
  }

  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', 'custom_metric', {
      metric_name: name,
      value: Math.round(value),
    });
  }
}

// TypeScript 擴展
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}