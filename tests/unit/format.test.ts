import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('format', () => {
  describe('getDayLabel', () => {
    it('rotula o índice 0 como Hoje', () => {
      expect(getDayLabel('2026-06-16', 0)).toBe('Hoje');
    });

    it('rotula o índice 1 como Amanhã', () => {
      expect(getDayLabel('2026-06-17', 1)).toBe('Amanhã');
    });

    it.each([
      ['2026-11-08', 2, 'Dom'],
      ['2026-11-09', 3, 'Seg'],
      ['2026-11-10', 4, 'Ter'],
      ['2026-11-11', 5, 'Qua'],
      ['2026-11-12', 6, 'Qui'],
      ['2026-11-13', 7, 'Sex'],
      ['2026-11-14', 8, 'Sáb'],
    ] as const)('rotula %s no índice %s como %s', (date, index, expected) => {
      expect(getDayLabel(date, index)).toBe(expected);
    });
  });

  describe('getShortDate', () => {
    it.each([
      ['2026-01-01', '1 Jan'],
      ['2024-02-29', '29 Fev'],
      ['2026-06-16', '16 Jun'],
      ['2026-11-11', '11 Nov'],
      ['2026-12-31', '31 Dez'],
      ['2027-01-01', '1 Jan'],
    ])('formata %s como %s', (date, expected) => {
      expect(getShortDate(date)).toBe(expected);
    });
  });
});
