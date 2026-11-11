import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherInfo, getWeatherLabel } from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    [0, 'Céu limpo', '☀️'],
    [2, 'Parcialmente nublado', '⛅'],
    [61, 'Chuva fraca', '🌦️'],
    [71, 'Neve fraca', '🌨️'],
    [95, 'Trovoadas', '⛈️'],
  ] as const)('mapeia o código %s para %s', (code, label, icon) => {
    expect(getWeatherInfo(code)).toEqual({ label, icon });
    expect(getWeatherLabel(code)).toBe(label);
    expect(getWeatherIcon(code)).toBe(icon);
  });

  it.each([-1, 123456])('usa fallback para o código desconhecido %s', (code) => {
    expect(getWeatherInfo(code)).toEqual({
      label: 'Condição desconhecida',
      icon: '🌡️',
    });
    expect(getWeatherLabel(code)).toBe('Condição desconhecida');
    expect(getWeatherIcon(code)).toBe('🌡️');
  });
});
