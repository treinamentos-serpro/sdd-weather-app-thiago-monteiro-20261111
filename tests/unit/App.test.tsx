import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import CurrentWeather from '../../src/components/CurrentWeather';
import ForecastCard from '../../src/components/ForecastCard';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';
import * as fixtures from '../../src/data/mockWeather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getWeather: vi.fn() };
});

const report = fixtures.createMockWeather();
if (report.region.kind !== 'city') throw new Error('Fixture inválida');
const city = report.region.city;

async function confirmCity() {
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Cidade encontrada' }),
    String(city.id),
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(searchCities).mockReset().mockResolvedValue([city]);
    vi.mocked(getWeather).mockReset().mockResolvedValue(report);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('inicia em idle sem escolher uma cidade automaticamente', () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent(/busque uma cidade para começar/i);
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('integra serviços, cinco dias e unidade sem repetir requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    let resolveWeather!: (data: WeatherData) => void;
    vi.mocked(getWeather).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWeather = resolve;
      }),
    );
    render(<App />);
    expect(screen.getByText('WeatherView')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar cidade/i }), 'São Paulo');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(getWeather).not.toHaveBeenCalled();
    await confirmCity();
    expect(screen.getByRole('status')).toHaveTextContent(/carregando/i);
    expect(screen.getByRole('searchbox')).toBeDisabled();
    await act(async () => {
      resolveWeather(report);
    });
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    const forecast = screen.getByRole('region', { name: /previsão de 5 dias/i });
    expect(within(forecast).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '°F' }));
    expect(
      within(screen.getByRole('region', { name: 'Clima atual' })).getByText('75°'),
    ).toBeInTheDocument();
    expect(within(forecast).getByText('79°')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('apresenta busca vazia sem mostrar clima de outra cidade e permite nova busca', async () => {
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    render(<App />);
    const input = screen.getByRole('searchbox', { name: /buscar cidade/i });
    await userEvent.type(input, 'Cidade inexistente');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText(/nenhuma cidade encontrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'sao paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
  });

  it('informa falha de geocoding sem consultar clima e permite repetir a busca', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), 'São Paulo');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(getWeather).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    await confirmCity();
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
  });

  it.each([
    'geocoding',
    'forecast',
  ])('recupera conexão offline em %s pelo botão de retry usando serviços reais', async (stage) => {
    if (!report.current) throw new Error('Fixture inválida');
    const services = await vi.importActual<typeof import('../../src/services/weatherService')>(
      '../../src/services/weatherService',
    );
    vi.mocked(searchCities).mockImplementation(services.searchCities);
    vi.mocked(getWeather).mockImplementation(services.getWeather);
    const geocoding = Response.json({
      results: [
        {
          id: city.id,
          name: city.name,
          country_code: city.countryCode,
          admin1: city.stateName,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      ],
    });
    const forecast = Response.json({
      current: {
        time: report.current.time,
        temperature_2m: report.current.temperatureC,
        relative_humidity_2m: report.current.humidityPercent,
        wind_speed_10m: report.current.windSpeedKmh,
        weather_code: report.current.weatherCode,
      },
      daily: {
        time: report.forecast.map((day) => day.date),
        temperature_2m_min: report.forecast.map((day) => day.minTemperatureC),
        temperature_2m_max: report.forecast.map((day) => day.maxTemperatureC),
        weather_code: report.forecast.map((day) => day.weatherCode),
      },
    });
    const fetchSpy = vi.fn<typeof fetch>();
    if (stage === 'geocoding') {
      fetchSpy
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(geocoding)
        .mockResolvedValueOnce(forecast);
    } else {
      fetchSpy
        .mockResolvedValueOnce(geocoding)
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(forecast);
    }
    vi.stubGlobal('fetch', fetchSpy);
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), city.name);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    if (stage === 'forecast') await confirmCity();
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    if (stage === 'geocoding') await confirmCity();
    expect(await screen.findByRole('heading', { name: city.name })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(searchCities).toHaveBeenCalledTimes(stage === 'geocoding' ? 2 : 1);
    expect(getWeather).toHaveBeenCalledTimes(stage === 'forecast' ? 2 : 1);
  });

  it.each([
    'Não foi possível carregar o clima.',
    'Falha de rede.',
    'A requisição demorou demais.',
    'Resposta de clima incompleta. Tente novamente.',
    'Resposta inválida da API. Tente novamente.',
  ])('apresenta a falha %j e recupera o forecast com retry', async (message) => {
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError(message));
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), 'São Paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(getWeather).toHaveBeenNthCalledWith(2, city);
    expect(searchCities).toHaveBeenCalledTimes(1);
  });

  it('converte todos os mínimos e máximos repetidamente sem acumular conversões ou requests', async () => {
    if (!report.current) throw new Error('Fixture inválida');
    const cases = [
      {
        min: -1,
        max: 0,
        celsiusMin: '-1°',
        celsiusMax: '0°',
        fahrenheitMin: '30°',
        fahrenheitMax: '32°',
      },
      {
        min: 99,
        max: 100,
        celsiusMin: '99°',
        celsiusMax: '100°',
        fahrenheitMin: '210°',
        fahrenheitMax: '212°',
      },
      {
        min: -41,
        max: -40,
        celsiusMin: '-41°',
        celsiusMax: '-40°',
        fahrenheitMin: '-42°',
        fahrenheitMax: '-40°',
      },
      {
        min: 19,
        max: 20.25,
        celsiusMin: '19°',
        celsiusMax: '20°',
        fahrenheitMin: '66°',
        fahrenheitMax: '68°',
      },
      {
        min: -11.6,
        max: -10.6,
        celsiusMin: '-12°',
        celsiusMax: '-11°',
        fahrenheitMin: '11°',
        fahrenheitMax: '13°',
      },
    ];
    const data: WeatherData = {
      ...report,
      current: { ...report.current, temperatureC: 0 },
      forecast: report.forecast.map((day, index) => ({
        ...day,
        minTemperatureC: cases[index].min,
        maxTemperatureC: cases[index].max,
      })),
    };
    const original = structuredClone(data);
    vi.mocked(getWeather).mockResolvedValue(data);
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), 'São Paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    await screen.findByRole('heading', { name: 'São Paulo' });
    const current = screen.getByRole('region', { name: 'Clima atual' });
    const forecast = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    const cards = within(forecast).getAllByRole('listitem');
    expect(cards).toHaveLength(5);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await userEvent.click(screen.getByRole('button', { name: '°F' }));
      expect(within(current).getByText('32°')).toBeInTheDocument();
      for (const [index, expected] of cases.entries()) {
        expect(within(cards[index]).getByText(expected.fahrenheitMin)).toBeInTheDocument();
        expect(within(cards[index]).getByText(expected.fahrenheitMax)).toBeInTheDocument();
      }
      await userEvent.click(screen.getByRole('button', { name: '°C' }));
      expect(within(current).getByText('0°')).toBeInTheDocument();
      for (const [index, expected] of cases.entries()) {
        expect(within(cards[index]).getByText(expected.celsiusMin)).toBeInTheDocument();
        expect(within(cards[index]).getByText(expected.celsiusMax)).toBeInTheDocument();
      }
    }
    expect(data).toEqual(original);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('mantém temperaturas e métricas parciais indisponíveis após mudar a unidade', async () => {
    if (!report.current) throw new Error('Fixture inválida');
    vi.mocked(getWeather).mockResolvedValue({
      ...report,
      current: { ...report.current, temperatureC: null },
      forecast: report.forecast.map((day) => ({
        ...day,
        minTemperatureC: null,
        maxTemperatureC: null,
        humidityPercent: null,
        windSpeedKmh: null,
        precipitationProbabilityPercent: null,
      })),
    });
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), 'São Paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    await screen.findByRole('heading', { name: 'São Paulo' });
    const current = screen.getByRole('region', { name: 'Clima atual' });
    const forecast = screen.getByRole('region', { name: 'Previsão de 5 dias' });

    for (const unit of ['°C', '°F']) {
      await userEvent.click(screen.getByRole('button', { name: unit }));
      expect(within(current).getByText('Indisponível')).toBeInTheDocument();
      expect(within(current).queryByText('0°')).not.toBeInTheDocument();
      expect(within(current).queryByText('32°')).not.toBeInTheDocument();
      const cards = within(forecast).getAllByRole('listitem');
      expect(cards).toHaveLength(5);
      for (const card of cards) {
        expect(within(card).getAllByText('Indisponível')).toHaveLength(5);
        expect(within(card).queryByText('0%')).not.toBeInTheDocument();
        expect(within(card).queryByText('32°')).not.toBeInTheDocument();
      }
    }
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('oculta o resultado antigo ao iniciar outra busca', async () => {
    render(<App />);
    const input = screen.getByRole('searchbox');
    await userEvent.type(input, 'São Paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    await screen.findByRole('heading', { name: 'São Paulo' });
    let resolveSearch!: (cities: City[]) => void;
    vi.mocked(searchCities).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    await userEvent.clear(input);
    await userEvent.type(input, 'Outra cidade');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent(/carregando/i);
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await act(async () => {
      resolveSearch([]);
    });
    await screen.findByText(/nenhuma cidade encontrada/i);
  });

  it('permite trocar para outra cidade retornada sem repetir geocoding', async () => {
    const alternative: City = {
      ...city,
      id: 2,
      name: 'Campinas',
      latitude: -22.9,
      longitude: -47.06,
    };
    vi.mocked(searchCities).mockResolvedValue([city, alternative]);
    vi.mocked(getWeather).mockImplementation(async (selected) => ({
      ...report,
      region: { kind: 'city', city: selected },
    }));
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), 'São Paulo');
    await userEvent.keyboard('{Enter}');
    await confirmCity();
    await screen.findByRole('heading', { name: 'São Paulo' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cidade encontrada' }), '2');
    expect(await screen.findByRole('heading', { name: 'Campinas' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(alternative);
  });

  it('mostra a barra de busca e o alternador de unidade', () => {
    render(<App />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
  });
});

describe('Fixture e painéis', () => {
  it('gera cinco datas locais consecutivas na virada do mês', () => {
    const data = fixtures.createMockWeather(new Date(2026, 10, 30));
    expect(data.forecast.map((day) => day.date)).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
    ]);
    expect(data.current?.time).toBe('2026-11-30T14:00');
    expect(data.region.kind).toBe('city');
    expect(data.isStateAggregate).toBe(false);
  });

  it('não transforma métricas ausentes em zero', () => {
    const data = fixtures.createMockWeather();
    if (data.region.kind !== 'city' || !data.current) throw new Error('Fixture inválida');
    render(
      <CurrentWeather
        city={data.region.city}
        unit="fahrenheit"
        current={{
          ...data.current,
          temperatureC: null,
          humidityPercent: null,
          windSpeedKmh: null,
          precipitationProbabilityPercent: null,
          precipitationMm: null,
          pressureHpa: null,
          weatherCode: null,
        }}
      />,
    );
    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.queryByText('32°')).not.toBeInTheDocument();
    expect(screen.getByText('Condição desconhecida')).toBeInTheDocument();
  });

  it('cada card tem vento, umidade e chance de chuva acessíveis', () => {
    const day = fixtures.createMockWeather().forecast[3];
    render(<ForecastCard day={day} index={3} unit="celsius" />);
    expect(screen.getByText('Vento')).toBeInTheDocument();
    expect(screen.getByText('18 km/h')).toBeInTheDocument();
    expect(screen.getByText('Umidade')).toBeInTheDocument();
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.getByText('Chance de chuva')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Nublado' })).toBeInTheDocument();
  });
});

describe('Estados da interface', () => {
  it('anuncia o carregamento', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent(/carregando o clima/i);
  });

  it('anuncia o erro e permite tentar novamente', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível carregar o clima." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível/i);
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('exibe mensagem e contexto para um resultado vazio', () => {
    render(<EmptyState title="Nenhuma cidade encontrada" hint="Verifique a grafia." />);
    expect(screen.getByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    expect(screen.getByText('Verifique a grafia.')).toBeInTheDocument();
  });
});
