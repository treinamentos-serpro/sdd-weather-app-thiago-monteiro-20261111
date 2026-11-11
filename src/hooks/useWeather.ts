import { useEffect, useRef, useState } from 'react';
import { lookupPostalCode } from '../services/cepService';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string, stateCode?: string) => Promise<void>;
  searchPostalCode: (value: string) => Promise<void>;
  reset: () => void;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type WeatherOperation =
  | { kind: 'search'; name: string; stateCode?: string }
  | { kind: 'postalCode'; value: string }
  | { kind: 'select'; city: City };
type WeatherState = Pick<UseWeatherResult, 'status' | 'data' | 'cities' | 'error' | 'query'>;

/**
 * Hook de orquestração: busca cidades, seleciona uma e carrega o clima.
 * Expõe uma máquina de estados simples (idle/loading/success/error/empty).
 */
export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const operationId = useRef(0);
  const lastOperation = useRef<WeatherOperation | null>(null);

  useEffect(
    () => () => {
      operationId.current += 1;
    },
    [],
  );

  async function execute(operation: WeatherOperation): Promise<void> {
    const requestId = ++operationId.current;
    lastOperation.current = operation;
    setState((previous) => ({
      status: 'loading',
      data: null,
      error: null,
      cities: operation.kind !== 'select' ? [] : previous.cities,
      query:
        operation.kind === 'search'
          ? operation.name
          : operation.kind === 'postalCode'
            ? operation.value
            : previous.query,
    }));
    try {
      let city: City;
      if (operation.kind !== 'select') {
        let results: City[];
        if (operation.kind === 'postalCode') {
          const location = await lookupPostalCode(operation.value);
          if (requestId !== operationId.current) return;
          if (!location.found) {
            setState((previous) => ({ ...previous, status: 'empty', cities: [] }));
            return;
          }
          results = (await searchCities(location.cityName)).filter(
            (candidate) =>
              candidate.stateCode === location.stateCode &&
              candidate.name.localeCompare(location.cityName, 'pt-BR', { sensitivity: 'base' }) ===
                0,
          );
        } else {
          results = await searchCities(operation.name);
          if (operation.stateCode)
            results = results.filter((candidate) => candidate.stateCode === operation.stateCode);
        }
        if (requestId !== operationId.current) return;
        if (results.length === 0) {
          setState((previous) => ({ ...previous, status: 'empty', cities: [] }));
          return;
        }
        setState((previous) => ({ ...previous, status: 'success', cities: results }));
        return;
      } else {
        city = operation.city;
      }
      lastOperation.current = { kind: 'select', city };
      const data = await getWeather(city);
      if (requestId !== operationId.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (error) {
      if (requestId !== operationId.current) return;
      setState((previous) => ({ ...previous, status: 'error', error: toMessage(error) }));
    }
  }

  async function search(name: string, stateCode?: string): Promise<void> {
    const trimmed = name.trim();
    if (trimmed) await execute({ kind: 'search', name: trimmed, stateCode });
  }

  async function searchPostalCode(value: string): Promise<void> {
    await execute({ kind: 'postalCode', value });
  }

  function reset() {
    operationId.current += 1;
    lastOperation.current = null;
    setState({ status: 'idle', data: null, cities: [], error: null, query: '' });
  }

  async function selectCity(city: City): Promise<void> {
    await execute({ kind: 'select', city });
  }

  async function retry(): Promise<void> {
    if (lastOperation.current) await execute(lastOperation.current);
  }

  return { ...state, search, searchPostalCode, selectCity, retry, reset };
}

function toMessage(err: unknown): string {
  if (err instanceof WeatherServiceError) return err.message;
  return 'Algo deu errado. Tente novamente.';
}
