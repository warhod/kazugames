import { describe, expect, test } from 'bun:test';
import { formatImportSummary } from '@/lib/collection-import-copy';

describe('formatImportSummary', () => {
  test('combines imported, skipped, and failed', () => {
    const { headline, detail } = formatImportSummary({
      imported: 2,
      skipped: 3,
      failed: 1,
    });
    expect(headline).toContain('2 new titles added');
    expect(headline).toContain('3 skipped because they were already');
    expect(headline).toContain('1 could not be imported');
    expect(detail).toContain('Skipped rows');
  });

  test('uses singular forms', () => {
    const { headline } = formatImportSummary({
      imported: 1,
      skipped: 1,
      failed: 1,
    });
    expect(headline).toContain('1 new title added');
    expect(headline).toContain('it was already');
    expect(headline).toContain('1 could not be imported');
  });

  test('only skipped explains re-import clearly', () => {
    const { headline, detail } = formatImportSummary({
      imported: 0,
      skipped: 5,
      failed: 0,
    });
    expect(headline).toContain('5 skipped');
    expect(detail).toBeDefined();
  });

  test('empty counts', () => {
    const { headline, detail } = formatImportSummary({
      imported: 0,
      skipped: 0,
      failed: 0,
    });
    expect(headline).toBe('Nothing new to add from that collection.');
    expect(detail).toBeUndefined();
  });
});
