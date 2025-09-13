/**
 * 格式化工具函數
 * Linus 原則：純函數，無副作用
 */

/**
 * 格式化貨幣
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化倍數
 */
export function formatMultiple(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}x`;
}

/**
 * 解析數字輸入
 */
export function parseNumberInput(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}