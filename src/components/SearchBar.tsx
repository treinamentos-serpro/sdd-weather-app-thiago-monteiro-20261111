import { Search } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { formatPostalCode, normalizePostalCode } from '../lib/postalCode';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
  mode?: 'city' | 'postalCode';
}

/** Barra de busca de cidade. Bloqueia submit com input vazio. */
export default function SearchBar({ onSearch, disabled, mode = 'city' }: SearchBarProps) {
  const inputId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (disabled || !trimmed) return;
    if (mode === 'postalCode') {
      const normalized = normalizePostalCode(trimmed);
      if (!normalized) {
        setError('Informe um CEP válido com oito dígitos.');
        return;
      }
      setValue(formatPostalCode(trimmed));
      setError('');
      onSearch(normalized);
      return;
    }
    onSearch(trimmed);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md focus-within:border-accent-500">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-white/60" />
        <label htmlFor={inputId} className="sr-only">
          {mode === 'postalCode' ? 'Buscar CEP' : 'Buscar cidade'}
        </label>
        <input
          id={inputId}
          type="search"
          inputMode={mode === 'postalCode' ? 'numeric' : undefined}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onBlur={() => {
            if (mode === 'postalCode') setValue(formatPostalCode(value));
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          placeholder={mode === 'postalCode' ? '01001-000' : 'Buscar cidade…'}
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-white placeholder-white/60 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="min-h-11 shrink-0 rounded-lg bg-accent-400 px-4 py-1.5 text-sm font-semibold text-night-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-white/80">
          {error}
        </p>
      )}
    </form>
  );
}
