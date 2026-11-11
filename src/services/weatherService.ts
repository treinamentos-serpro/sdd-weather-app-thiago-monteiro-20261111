import { findBrazilState } from '../data/brazilStates';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

/** Erro tipado da camada de dados, com mensagem amigável ao usuário. */
export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

/** Faz um fetch com timeout via AbortController. */
export async function fetchWithTimeout(url: string, failureMessage: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new WeatherServiceError(failureMessage);
    try {
      return await response.json();
    } catch (error) {
      if (isAbortError(error) || error instanceof TypeError) throw error;
      throw new WeatherServiceError('Resposta inválida da API. Tente novamente.');
    }
  } catch (err) {
    if (err instanceof WeatherServiceError) throw err;
    if (isAbortError(err)) throw new WeatherServiceError('A requisição demorou demais.');
    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function percentage(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && number >= 0 && number <= 100 ? number : null;
}

function seriesValue(data: Record<string, unknown>, key: string, index: number): unknown {
  const series = data[key];
  return Array.isArray(series) ? series[index] : undefined;
}

/**
 * Busca cidades por nome (geocoding). Retorna lista vazia quando não há
 * resultados — o estado "vazio" é tratado pela camada de UI.
 */
export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&countryCode=BR&format=json`;
  const data = await fetchWithTimeout(url, 'Não foi possível buscar a cidade. Tente novamente.');
  if (!isRecord(data)) throw new WeatherServiceError('Resposta de busca inválida.');
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) throw new WeatherServiceError('Resposta de busca inválida.');

  return data.results.flatMap((result): City[] => {
    if (!isRecord(result) || result.country_code !== 'BR' || typeof result.admin1 !== 'string')
      return [];
    const state = findBrazilState(result.admin1);
    const id = finiteNumber(result.id);
    const latitude = finiteNumber(result.latitude);
    const longitude = finiteNumber(result.longitude);
    if (
      !state ||
      id === null ||
      typeof result.name !== 'string' ||
      !result.name.trim() ||
      latitude === null ||
      longitude === null ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      return [];
    return [
      {
        id,
        name: result.name,
        stateCode: state.code,
        stateName: state.name,
        countryCode: 'BR',
        latitude,
        longitude,
      },
    ];
  });
}

function mapCurrent(current: Record<string, unknown>, hourly: unknown): CurrentWeather {
  const time = typeof current.time === 'string' ? current.time : '';
  const hourIndex =
    isRecord(hourly) && Array.isArray(hourly.time)
      ? hourly.time.findIndex(
          (hour) => typeof hour === 'string' && hour.slice(0, 13) === time.slice(0, 13),
        )
      : -1;
  return {
    time,
    temperatureC: finiteNumber(current.temperature_2m),
    humidityPercent: percentage(current.relative_humidity_2m),
    windSpeedKmh: finiteNumber(current.wind_speed_10m),
    pressureHpa: finiteNumber(current.surface_pressure),
    precipitationMm: finiteNumber(current.precipitation),
    precipitationProbabilityPercent:
      isRecord(hourly) && hourIndex >= 0
        ? percentage(seriesValue(hourly, 'precipitation_probability', hourIndex))
        : null,
    weatherCode: finiteNumber(current.weather_code),
  };
}

function mapForecast(daily: Record<string, unknown>): ForecastDay[] {
  if (!Array.isArray(daily.time) || daily.time.length < 5)
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  return daily.time.slice(0, 5).map((date, index) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new WeatherServiceError('Resposta de clima inválida.');
    const precipitationProbability = seriesValue(daily, 'precipitation_probability_max', index);
    return {
      date,
      weatherCode: finiteNumber(seriesValue(daily, 'weather_code', index)),
      maxTemperatureC: finiteNumber(seriesValue(daily, 'temperature_2m_max', index)),
      minTemperatureC: finiteNumber(seriesValue(daily, 'temperature_2m_min', index)),
      windSpeedKmh: finiteNumber(seriesValue(daily, 'wind_speed_10m_max', index)),
      humidityPercent: percentage(seriesValue(daily, 'relative_humidity_2m_mean', index)),
      precipitationProbabilityPercent: percentage(
        precipitationProbability === null ? 0 : precipitationProbability,
      ),
    };
  });
}

/**
 * Busca o clima atual e a previsão de 5 dias para uma cidade.
 * Temperaturas retornam em Celsius (conversão fica na UI).
 */
export async function getWeather(city: City): Promise<WeatherData> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    hourly: 'precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean',
    forecast_days: '5',
    timezone: timeZone,
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  });

  const data = await fetchWithTimeout(
    `${FORECAST_URL}?${params.toString()}`,
    'Não foi possível carregar o clima. Tente novamente.',
  );
  if (
    !isRecord(data) ||
    !isRecord(data.current) ||
    !isRecord(data.daily) ||
    typeof data.current.time !== 'string' ||
    !data.current.time
  ) {
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  }

  return {
    region: { kind: 'city', city },
    current: mapCurrent(data.current, data.hourly),
    forecast: mapForecast(data.daily),
    timeZone,
    isStateAggregate: false,
  };
}
