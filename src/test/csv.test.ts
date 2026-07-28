import { describe, it, expect, vi } from 'vitest';
import { sanitizeCSVCell, exportCustomersToCSV } from '@/utils/csvExport';
import type { Customer, Transaction } from '@/types/domain';

describe('CSV Export Formula Injection Defenses', () => {
  it('escapes dangerous spreadsheet formula characters (=, +, -, @, tab, return)', () => {
    expect(sanitizeCSVCell('=1+2')).toBe('"\'=1+2"');
    expect(sanitizeCSVCell('+100')).toBe('"\'+100"');
    expect(sanitizeCSVCell('-200')).toBe('"\'-200"');
    expect(sanitizeCSVCell('@SUM(A1:A10)')).toBe('"\'@SUM(A1:A10)"');
    expect(sanitizeCSVCell('\tTAB')).toBe('"\'\tTAB"');
  });

  it('preserves normal safe string values', () => {
    expect(sanitizeCSVCell('रमेश पाटील')).toBe('"रमेश पाटील"');
    expect(sanitizeCSVCell(500)).toBe('"500"');
  });

  it('generates customer summary CSV cleanly', () => {
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const mockCustomers: Customer[] = [
      {
        id: 'c1',
        name: 'रमेश',
        mobile: '9876543210',
        alternateName: null,
        address: null,
        openingBalance: 100,
        notes: null,
        isActive: true,
        createdBy: 'u1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        syncStatus: 'synced',
      },
    ];

    const mockTxns: Transaction[] = [];
    expect(() => exportCustomersToCSV(mockCustomers, mockTxns)).not.toThrow();
  });
});
