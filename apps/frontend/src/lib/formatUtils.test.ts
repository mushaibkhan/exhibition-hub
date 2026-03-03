import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatUtils';

describe('formatCurrency', () => {
  it('formats positive integers correctly', () => {
    expect(formatCurrency(100)).toBe('₹100');
    expect(formatCurrency(5000)).toBe('₹5,000');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-100)).toBe('₹-100');
    expect(formatCurrency(-5000)).toBe('₹-5,000');
  });

  it('formats large numbers using Indian numbering system', () => {
    // 1 lakh
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    // 1 crore
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000');
    // 10 crore
    expect(formatCurrency(100000000)).toBe('₹10,00,00,000');
  });

  it('handles decimal numbers by rounding to nearest integer', () => {
    expect(formatCurrency(100.1)).toBe('₹100');
    expect(formatCurrency(100.49)).toBe('₹100');
    expect(formatCurrency(100.5)).toBe('₹101');
    expect(formatCurrency(100.99)).toBe('₹101');
  });
});
