/**
 * Contratos de domínio compartilhados do Weather App.
 *
 * Decisão de arquitetura: as temperaturas são sempre armazenadas em Celsius
 * internamente e convertidas apenas na camada de apresentação. Assim, a troca
 * de unidade (C/F) nunca dispara um novo request.
 */

export type Unit = 'celsius' | 'fahrenheit';

export type PostalCodeLookup =
  | { found: false }
  | { found: true; cityName: string; stateCode: string; stateName: string };

/** Resultado da API de geocoding (uma cidade). */
export interface City {
  id: number;
  name: string;
  stateCode: string;
  stateName: string;
  countryCode: 'BR';
  latitude: number;
  longitude: number;
}

export type RegionSelection =
  | { kind: 'city'; city: City }
  | { kind: 'state'; stateCode: string; stateName: string };

/** Condições atuais. Temperatura sempre em °C. */
export interface CurrentWeather {
  time: string;
  temperatureC: number | null;
  windSpeedKmh: number | null;
  humidityPercent: number | null;
  precipitationProbabilityPercent: number | null;
  weatherCode: number | null;
  precipitationMm?: number | null;
  pressureHpa?: number | null;
}

/** Um dia da previsão. Temperaturas sempre em °C. */
export interface ForecastDay {
  date: string;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  windSpeedKmh: number | null;
  humidityPercent: number | null;
  precipitationProbabilityPercent: number | null;
  weatherCode: number | null;
}

/** Agregado entregue à UI: cidade + clima atual + 5 dias de previsão. */
export interface WeatherData {
  region: RegionSelection;
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  timeZone: string;
  isStateAggregate: boolean;
  sampleCount?: number;
}
