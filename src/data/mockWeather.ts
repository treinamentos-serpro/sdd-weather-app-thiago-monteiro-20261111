import type { City, WeatherData } from '../types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  stateCode: 'SP',
  stateName: 'São Paulo',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
};

export function createMockWeather(referenceDate = new Date()): WeatherData {
  const dateFor = (offset: number) => {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() + offset,
      12,
    );
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return {
    region: { kind: 'city', city: { ...city } },
    current: {
      time: `${dateFor(0)}T14:00`,
      temperatureC: 24,
      weatherCode: 2,
      humidityPercent: 68,
      windSpeedKmh: 14,
      precipitationProbabilityPercent: 20,
      precipitationMm: 0.2,
      pressureHpa: 1014,
    },
    forecast: [
      {
        minTemperatureC: 18,
        maxTemperatureC: 26,
        weatherCode: 2,
        precipitationProbabilityPercent: 20,
        humidityPercent: 68,
        windSpeedKmh: 14,
      },
      {
        minTemperatureC: 19,
        maxTemperatureC: 28,
        weatherCode: 0,
        precipitationProbabilityPercent: 5,
        humidityPercent: 62,
        windSpeedKmh: 12,
      },
      {
        minTemperatureC: 18,
        maxTemperatureC: 23,
        weatherCode: 61,
        precipitationProbabilityPercent: 80,
        humidityPercent: 85,
        windSpeedKmh: 22,
      },
      {
        minTemperatureC: 17,
        maxTemperatureC: 22,
        weatherCode: 3,
        precipitationProbabilityPercent: 40,
        humidityPercent: null,
        windSpeedKmh: 18,
      },
      {
        minTemperatureC: 18,
        maxTemperatureC: 25,
        weatherCode: 1,
        precipitationProbabilityPercent: 10,
        humidityPercent: 70,
        windSpeedKmh: 13,
      },
    ].map((day, index) => ({ ...day, date: dateFor(index) })),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isStateAggregate: false,
  };
}

export const mockWeather: WeatherData = createMockWeather();

export function findMockWeather(query: string): WeatherData | undefined {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR');

  if (normalize(city.name) !== normalize(query)) return undefined;
  return createMockWeather();
}
