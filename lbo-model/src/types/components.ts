/**
 * Component Types
 * Common type definitions for React components
 * Following Linus principle: Eliminate special cases
 */

import { CSSProperties, ReactNode } from 'react';

// Common wrapper props for testing
export interface TestWrapperProps {
  children: ReactNode;
}

// Virtualized table row props
export interface VirtualizedRowProps<T> {
  index: number;
  style: CSSProperties;
  data: T;
}

// Table column definition
export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: T[keyof T]) => string;
  sortable?: boolean;
}

// Field update handler
export type FieldUpdateHandler<T> = (field: keyof T, value: T[keyof T]) => void;

// Generic form field props
export interface FormFieldProps<T> {
  name: keyof T;
  value: T[keyof T];
  onChange: FieldUpdateHandler<T>;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

// Panel props base
export interface PanelProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

// Tab panel props
export interface TabPanelProps extends PanelProps {
  value: number | string;
  index: number | string;
}

// Scenario data structure
export interface ScenarioData {
  scenarios?: {
    base: Record<string, unknown>;
    upside: Record<string, unknown>;
    downside: Record<string, unknown>;
    upper?: Record<string, unknown>;
    lower?: Record<string, unknown>;
  };
  base?: Record<string, unknown>;
  upside?: Record<string, unknown>;
  downside?: Record<string, unknown>;
  upper?: Record<string, unknown>;
  lower?: Record<string, unknown>;
}