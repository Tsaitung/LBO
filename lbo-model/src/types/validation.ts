/**
 * Validation Types
 * Centralized type definitions for validation system
 * Following Linus principle: Strong types, clear contracts
 */

// Base validator type
export type Validator<T = unknown> = (value: T, context?: unknown) => boolean;

// Array validator type
export type ArrayValidator<T = unknown> = (value: T[]) => boolean;

// Validation context
export interface ValidationContext {
  [key: string]: unknown;
}

// Validation rule
export interface ValidationRule<T = unknown> {
  field: string;
  validator: Validator<T>;
  message: string | ((value: T) => string);
  severity?: 'error' | 'warning';
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  field?: string;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  severity: 'error' | 'warning';
}

// Chainable validator builder
export interface ValidatorBuilder<T> {
  required(): ValidatorBuilder<T>;
  min(value: number): ValidatorBuilder<T>;
  max(value: number): ValidatorBuilder<T>;
  pattern(regex: RegExp): ValidatorBuilder<T>;
  custom(fn: Validator<T>): ValidatorBuilder<T>;
  build(): Validator<T>;
}

// Field validator map
export type FieldValidators<T> = {
  [K in keyof T]?: Validator<T[K]> | ValidationRule<T[K]>[];
};

// Domain validation schema
export interface ValidationSchema<T> {
  domain: string;
  fields: FieldValidators<T>;
  crossFieldValidations?: Array<{
    fields: (keyof T)[];
    validator: (data: T) => boolean;
    message: string;
  }>;
}