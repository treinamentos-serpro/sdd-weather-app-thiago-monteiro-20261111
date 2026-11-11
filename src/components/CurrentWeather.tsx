import { CloudRain, Droplets, Gauge, type LucideIcon, Wind } from 'lucide-react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherType, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherType;
  unit: Unit;
}

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="min-w-0 py-3">
      <dt className="flex items-center gap-2 text-xs text-white/70">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-400" />
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

/** Seção "hero" com as condições atuais da cidade selecionada. */
export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const location = `${city.stateName} · ${city.stateCode}, Brasil`;
  const metric = (value: number | null | undefined, suffix: string) =>
    value == null ? 'Indisponível' : `${Math.round(value)}${suffix}`;

  return (
    <section
      aria-label="Clima atual"
      className="border-y border-white/10 bg-white/5 px-4 py-8 backdrop-blur-md sm:px-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="break-words text-2xl font-bold [overflow-wrap:anywhere] md:text-3xl">
            {city.name}
          </h2>
          {location && <p className="text-white/60">{location}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="text-5xl sm:text-6xl">
              {getWeatherIcon(current.weatherCode ?? -1)}
            </span>
            <span
              className={
                current.temperatureC === null ? 'text-xl' : 'text-6xl font-light md:text-7xl'
              }
            >
              {formatTemperature(current.temperatureC, unit)}
            </span>
            {current.temperatureC !== null && (
              <span className="self-end pb-2 text-xl text-white/70">
                {unit === 'celsius' ? 'C' : 'F'}
              </span>
            )}
          </div>
          <p className="mt-2 text-white/70">{getWeatherLabel(current.weatherCode ?? -1)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 md:min-w-72">
          <Metric icon={Droplets} label="Umidade" value={metric(current.humidityPercent, '%')} />
          <Metric icon={Wind} label="Vento" value={metric(current.windSpeedKmh, ' km/h')} />
          <Metric
            icon={CloudRain}
            label="Chance de chuva"
            value={metric(current.precipitationProbabilityPercent, '%')}
          />
          <Metric
            icon={CloudRain}
            label="Precipitação"
            value={
              current.precipitationMm == null ? 'Indisponível' : `${current.precipitationMm} mm`
            }
          />
          <Metric icon={Gauge} label="Pressão" value={metric(current.pressureHpa, ' hPa')} />
        </dl>
      </div>
    </section>
  );
}
