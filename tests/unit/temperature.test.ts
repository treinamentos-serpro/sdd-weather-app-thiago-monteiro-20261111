import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';

describe('temperature', () => {
  describe('toFahrenheit', () => {
    it.each([
      [0, 32],
      [100, 212],
      [-40, -40],
    ])('converte %s°C para %s°F', (celsius, expected) => {
      expect(toFahrenheit(celsius)).toBe(expected);
    });
  });

  describe('convertTemperature', () => {
    it.each([
      [0, 'celsius', 0],
      [20.25, 'celsius', 20.25],
      [-40, 'celsius', -40],
      [0, 'fahrenheit', 32],
      [100, 'fahrenheit', 212],
      [-40, 'fahrenheit', -40],
      [20.25, 'fahrenheit', 68.45],
    ] as const)('converte %s°C para %s sem arredondar: %s', (celsius, unit, expected) => {
      expect(convertTemperature(celsius, unit)).toBeCloseTo(expected, 10);
    });
  });

  describe('formatTemperature', () => {
    it.each([
      [20.4, 'celsius', '20°'],
      [20.5, 'celsius', '21°'],
      [-10.6, 'celsius', '-11°'],
      [20.4, 'fahrenheit', '69°'],
      [0, 'fahrenheit', '32°'],
      [-40, 'fahrenheit', '-40°'],
    ] as const)('formata %s°C em %s como %s', (celsius, unit, expected) => {
      expect(formatTemperature(celsius, unit)).toBe(expected);
    });

    it.each([
      [null, 'celsius'],
      [null, 'fahrenheit'],
      [Number.NaN, 'celsius'],
      [Number.NaN, 'fahrenheit'],
      [Number.POSITIVE_INFINITY, 'celsius'],
      [Number.NEGATIVE_INFINITY, 'fahrenheit'],
    ] as const)('apresenta %s em %s como indisponível', (celsius, unit) => {
      expect(formatTemperature(celsius, unit)).toBe('Indisponível');
    });
  });

  describe('unitLabel', () => {
    it.each([
      ['celsius', '°C'],
      ['fahrenheit', '°F'],
    ] as const)('retorna o rótulo de %s como %s', (unit, expected) => {
      expect(unitLabel(unit)).toBe(expected);
    });
  });
});
