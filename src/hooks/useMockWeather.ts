import { useEffect, useState } from 'react';
import { findMockWeather } from '../data/mockWeather';
import type { WeatherData } from '../types/weather';

type MockWeatherState =
  | { status: 'idle' }
  | { status: 'loading' | 'empty'; query: string }
  | { status: 'success'; query: string; data: WeatherData }
  | { status: 'error'; query: string; message: string };

export function useMockWeather() {
  const [state, setState] = useState<MockWeatherState>({ status: 'idle' });

  useEffect(() => {
    if (state.status !== 'loading') return;
    const timer = setTimeout(() => {
      try {
        const data = findMockWeather(state.query);
        setState(
          data
            ? { status: 'success', query: state.query, data }
            : { status: 'empty', query: state.query },
        );
      } catch {
        setState({
          status: 'error',
          query: state.query,
          message: 'Não foi possível carregar o clima. Tente novamente.',
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  function search(query: string) {
    const trimmed = query.trim();
    if (trimmed) setState({ status: 'loading', query: trimmed });
  }

  function retry() {
    if (state.status === 'error') search(state.query);
  }

  return { state, search, retry };
}
