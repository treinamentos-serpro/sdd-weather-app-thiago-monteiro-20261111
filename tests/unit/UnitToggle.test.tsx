import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import type { City, CurrentWeather as CurrentWeatherType, Unit } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  countryCode: 'BR',
  stateName: 'São Paulo',
  stateCode: 'SP',
  latitude: -23.55,
  longitude: -46.63,
};

const current: CurrentWeatherType = {
  time: '2026-06-16T12:00',
  temperatureC: 0,
  humidityPercent: 80,
  windSpeedKmh: 10,
  precipitationProbabilityPercent: 20,
  pressureHpa: 1015,
  precipitationMm: 0,
  weatherCode: 3,
};

function Harness() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={city} current={current} unit={unit} />
    </>
  );
}

describe('UnitToggle + CurrentWeather', () => {
  it('exibe 32° ao clicar em °F partindo de 0°C', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const panel = screen.getByRole('region', { name: 'Clima atual' });
    const celsiusButton = screen.getByRole('button', { name: '°C' });
    const fahrenheitButton = screen.getByRole('button', { name: '°F' });
    expect(panel).toHaveTextContent('0°');
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(fahrenheitButton);

    expect(panel).toHaveTextContent('32°');
    expect(panel).not.toHaveTextContent('0°');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('expõe os botões com estado pressionado acessível', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('permite alternar usando Tab e Enter', async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('32°')).toBeInTheDocument();
  });
});
