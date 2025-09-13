/**
 * CommonValidators - 通用驗證器
 * Linus 原則：純函數，無副作用
 * 
 * "Bad programmers worry about the code. 
 * Good programmers worry about data structures." - Linus Torvalds
 */

import { Validator, ArrayValidator } from '../../../types/validation';

/**
 * 基礎驗證器
 * 所有驗證器都是純函數，無副作用
 */
export const CommonValidators = {
  /**
   * 必填驗證
   */
  required: (value: unknown): boolean => {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  },

  /**
   * 最小值驗證
   */
  min: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  /**
   * 最大值驗證
   */
  max: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  /**
   * 範圍驗證
   */
  range: (min: number, max: number) => (value: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * 正數驗證
   */
  positive: (value: number): boolean => {
    return value > 0;
  },

  /**
   * 非負數驗證
   */
  nonNegative: (value: number): boolean => {
    return value >= 0;
  },

  /**
   * 百分比驗證 (0-100)
   */
  percentage: (value: number): boolean => {
    return value >= 0 && value <= 100;
  },

  /**
   * 整數驗證
   */
  integer: (value: number): boolean => {
    return Number.isInteger(value);
  },

  /**
   * Email 驗證
   */
  email: (value: string): boolean => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
  },

  /**
   * 字串長度驗證
   */
  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },

  /**
   * 正規表達式驗證
   */
  pattern: (pattern: RegExp) => (value: string): boolean => {
    return pattern.test(value);
  },

  /**
   * 陣列長度驗證
   */
  arrayMinLength: <T = unknown>(min: number): ArrayValidator<T> => (value: T[]): boolean => {
    return Array.isArray(value) && value.length >= min;
  },

  arrayMaxLength: <T = unknown>(max: number): ArrayValidator<T> => (value: T[]): boolean => {
    return Array.isArray(value) && value.length <= max;
  },

  /**
   * 唯一性驗證
   */
  unique: <T = unknown>(value: T[], key?: keyof T): boolean => {
    if (!Array.isArray(value)) return false;
    
    if (key) {
      const values = value.map(item => item[key]);
      return new Set(values).size === values.length;
    }
    
    return new Set(value).size === value.length;
  },

  /**
   * 日期驗證
   */
  date: (value: unknown): boolean => {
    return value instanceof Date && !isNaN(value.getTime());
  },

  /**
   * 未來日期驗證
   */
  futureDate: (value: Date): boolean => {
    return value instanceof Date && value > new Date();
  },

  /**
   * 過去日期驗證
   */
  pastDate: (value: Date): boolean => {
    return value instanceof Date && value < new Date();
  },

  /**
   * 條件驗證
   * 根據條件決定是否執行驗證
   */
  when: <T = unknown>(condition: boolean, validator: Validator<T>): Validator<T> => 
    (value: T): boolean => {
      return !condition || validator(value);
    },

  /**
   * 組合驗證器 (AND)
   * 所有驗證器都必須通過
   */
  and: <T = unknown>(...validators: Array<Validator<T>>): Validator<T> => 
    (value: T): boolean => {
      return validators.every(validator => validator(value));
    },

  /**
   * 組合驗證器 (OR)
   * 至少一個驗證器通過
   */
  or: <T = unknown>(...validators: Array<Validator<T>>): Validator<T> => 
    (value: T): boolean => {
      return validators.some(validator => validator(value));
    },

  /**
   * 反向驗證器
   */
  not: <T = unknown>(validator: Validator<T>): Validator<T> => 
    (value: T): boolean => {
      return !validator(value);
    },

  /**
   * 自定義驗證器
   */
  custom: <T = unknown, C = unknown>(fn: (value: T, context?: C) => boolean): Validator<T> => fn as Validator<T>,
};

/**
 * 驗證器工廠
 * 創建可重用的驗證器組合
 */
export class ValidatorFactory {
  /**
   * 創建數字驗證器
   */
  static number(config: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  }) {
    const validators: Array<Validator<number>> = [];

    if (config.min !== undefined) {
      validators.push(CommonValidators.min(config.min));
    }
    if (config.max !== undefined) {
      validators.push(CommonValidators.max(config.max));
    }
    if (config.integer) {
      validators.push(CommonValidators.integer);
    }
    if (config.positive) {
      validators.push(CommonValidators.positive);
    }

    return CommonValidators.and(...validators);
  }

  /**
   * 創建字串驗證器
   */
  static string(config: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  }) {
    const validators: Array<Validator<string>> = [];

    if (config.required) {
      validators.push(CommonValidators.required);
    }
    if (config.minLength !== undefined) {
      validators.push(CommonValidators.minLength(config.minLength));
    }
    if (config.maxLength !== undefined) {
      validators.push(CommonValidators.maxLength(config.maxLength));
    }
    if (config.pattern) {
      validators.push(CommonValidators.pattern(config.pattern));
    }

    return CommonValidators.and(...validators);
  }
}