import { CloudSun } from 'lucide-react';
import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import StateSelector from './components/StateSelector';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

/**
 * WeatherView — aplicação completa de previsão do tempo.
 *
 * Construída ao longo do treinamento de Spec-Driven Development com GitHub
 * Copilot, do briefing à entrega.
 */
export default function App() {
  const { status, data, cities, error, query, search, searchPostalCode, selectCity, retry, reset } =
    useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const [mode, setMode] = useState<'city' | 'postalCode'>('city');
  const [stateCode, setStateCode] = useState('');

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CloudSun aria-hidden="true" className="h-7 w-7 text-sun" />
            <h1 className="text-lg font-bold">WeatherView</h1>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
            <SearchBar
              key={mode}
              mode={mode}
              onSearch={
                mode === 'postalCode'
                  ? searchPostalCode
                  : (name) => search(name, stateCode || undefined)
              }
              disabled={status === 'loading'}
            />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div
          role="group"
          aria-label="Modo de busca"
          className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
        >
          {(['city', 'postalCode'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => {
                setMode(option);
                reset();
              }}
              className={`min-h-11 rounded-md px-4 text-sm font-semibold ${mode === option ? 'bg-accent-400 text-night-900' : 'text-white/80 hover:bg-white/10'}`}
            >
              {option === 'city' ? 'Cidade' : 'CEP'}
            </button>
          ))}
        </div>
        {mode === 'city' && (
          <StateSelector
            value={stateCode}
            onChange={(value) => {
              setStateCode(value);
              reset();
            }}
          />
        )}
        {cities.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="city-results" className="block text-sm text-white/80">
              Cidade encontrada
            </label>
            <select
              id="city-results"
              disabled={status === 'loading'}
              value={data?.region.kind === 'city' ? data.region.city.id : ''}
              onChange={(event) => {
                const city = cities.find(
                  (candidate) => candidate.id === Number(event.target.value),
                );
                if (city) void selectCity(city);
              }}
              className="min-h-11 w-full rounded-lg border border-white/10 bg-night-800 px-3 text-white"
            >
              <option value="" disabled>
                Selecione uma cidade
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} — {city.stateCode} ({city.latitude.toFixed(2)},{' '}
                  {city.longitude.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
        {status === 'idle' && (
          <EmptyState
            title={
              mode === 'postalCode'
                ? 'Busque um CEP para começar'
                : 'Busque uma cidade para começar'
            }
            hint={mode === 'postalCode' ? 'Ex.: 01001-000.' : 'Ex.: São Paulo, Recife ou Curitiba.'}
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'error' && error && <ErrorState message={error} onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState
            title={`Nenhuma cidade encontrada para "${query}"`}
            hint="Verifique a grafia ou tente outra cidade brasileira."
          />
        )}

        {status === 'success' && data?.region.kind === 'city' && (
          <>
            {data.current ? (
              <CurrentWeather city={data.region.city} current={data.current} unit={unit} />
            ) : (
              <EmptyState title="Clima atual indisponível" />
            )}
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>

      <footer className="px-4 py-8 text-center text-sm text-white/60">
        Dados meteorológicos por{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-accent-400 hover:underline"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  );
}
