import { getDayLabel, getShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

/** Card de um dia da previsão. */
export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <p className="font-semibold">{getDayLabel(day.date, index)}</p>
      <time dateTime={day.date} className="text-xs text-white/70">
        {getShortDate(day.date)}
      </time>
      <span role="img" aria-label={getWeatherLabel(day.weatherCode ?? -1)} className="text-3xl">
        {getWeatherIcon(day.weatherCode ?? -1)}
      </span>
      <p className="text-sm">
        <span className="sr-only">Máxima </span>
        <span className="font-semibold">{formatTemperature(day.maxTemperatureC, unit)}</span>{' '}
        <span className="sr-only">Mínima </span>
        <span className="text-white/70">{formatTemperature(day.minTemperatureC, unit)}</span>{' '}
        <span className="text-xs text-white/70">{unit === 'celsius' ? 'C' : 'F'}</span>
      </p>
      <dl className="mt-2 w-full space-y-2 border-t border-white/10 pt-3 text-xs">
        <div><dt className="text-white/70">Chance de chuva</dt><dd className="text-accent-400">{day.precipitationProbabilityPercent === null ? 'Indisponível' : `${day.precipitationProbabilityPercent}%`}</dd></div>
        <div><dt className="text-white/70">Umidade</dt><dd>{day.humidityPercent === null ? 'Indisponível' : `${day.humidityPercent}%`}</dd></div>
        <div><dt className="text-white/70">Vento</dt><dd>{day.windSpeedKmh === null ? 'Indisponível' : `${day.windSpeedKmh} km/h`}</dd></div>
      </dl>
    </li>
  );
}
