import { useId, useState } from 'react';
import { brazilStates } from '../data/brazilStates';

interface StateSelectorProps {
  value: string;
  onChange: (stateCode: string) => void;
}

export default function StateSelector({ value, onChange }: StateSelectorProps) {
  const inputId = useId();
  const selectId = useId();
  const [query, setQuery] = useState('');
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  const options = brazilStates.filter(
    (state) =>
      state.code === value || normalize(`${state.code} ${state.name}`).includes(normalize(query)),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={inputId} className="mb-1 block text-sm text-white/80">
          Localizar UF
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sigla ou nome"
          className="min-h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        />
      </div>
      <div>
        <label htmlFor={selectId} className="mb-1 block text-sm text-white/80">
          UF
        </label>
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-white/10 bg-night-800 px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          <option value="">Todas as UFs</option>
          {options.map((state) => (
            <option key={state.code} value={state.code}>
              {state.code} — {state.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
