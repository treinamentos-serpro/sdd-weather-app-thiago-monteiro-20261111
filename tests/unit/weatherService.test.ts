import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { brazilStates, findBrazilState } from '../../src/data/brazilStates';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const CITY: City = {
  id: 1,
  name: 'São Paulo',
  countryCode: 'BR',
  stateCode: 'SP',
  stateName: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};

function forecastPayload() {
  return {
    current: {
      time: '2026-11-11T14:15',
      temperature_2m: 24,
      relative_humidity_2m: 68,
      wind_speed_10m: 14,
      surface_pressure: 1014,
      precipitation: 0.2,
      weather_code: 2,
    },
    hourly: {
      time: ['2026-11-10T14:00', '2026-11-11T14:00', '2026-11-11T15:00'],
      precipitation_probability: [90, 20, 25],
    },
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
      weather_code: [2, 0, 61, 3, 1],
      temperature_2m_max: [26, 28, 23, 22, 25],
      temperature_2m_min: [18, 19, 18, 17, 18],
      wind_speed_10m_max: [14, 12, 22, 18, 13],
      relative_humidity_2m_mean: [68, 62, 85, 78, 70],
      precipitation_probability_max: [20, 5, 80, 40, 10],
    },
  };
}

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('searchCities', () => {
    it.each([
      '',
      '   ',
      '\t\n',
    ])('retorna lista vazia para input %j sem chamar fetch', async (input) => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const result = await searchCities(input);
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('mapeia resultados de geocoding', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [
            {
              id: 1,
              name: 'São Paulo',
              country_code: 'BR',
              admin1: 'São Paulo',
              latitude: -23.55,
              longitude: -46.63,
            },
          ],
        }),
      );
      const result = await searchCities('São Paulo');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(CITY);
    });

    it('retorna vazio quando não há results', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}));
      expect(await searchCities('xyzxyz')).toEqual([]);
    });

    it('lança erro tipado em resposta não-ok', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('codifica o nome e restringe o país no request e na resposta', async () => {
      const fetchSpy = mockFetchOnce({
        results: [
          {
            id: 1,
            name: 'São Paulo',
            country_code: 'BR',
            admin1: 'Sao Paulo',
            latitude: -23.55,
            longitude: -46.63,
          },
          {
            id: 2,
            name: 'Seattle',
            country_code: 'US',
            admin1: 'Washington',
            latitude: 47.6,
            longitude: -122.33,
          },
          {
            id: 3,
            name: 'Cidade',
            country_code: 'BR',
            admin1: 'Inexistente',
            latitude: 1,
            longitude: 1,
          },
          { id: 4, name: 'Cidade', country_code: 'BR', admin1: 'SP', latitude: 91, longitude: 1 },
        ],
      });
      vi.stubGlobal('fetch', fetchSpy);
      expect(await searchCities(' São Paulo & região ')).toEqual([CITY]);
      expect(fetchSpy.mock.calls[0][0]).toContain(
        `name=${encodeURIComponent('São Paulo & região')}`,
      );
      expect(new URL(fetchSpy.mock.calls[0][0]).searchParams.get('countryCode')).toBe('BR');
    });

    it('mantém cidades homônimas com a UF de cada resultado', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [
            {
              id: 1,
              name: 'Santa Helena',
              country_code: 'BR',
              admin1: 'Paraná',
              latitude: -24.8,
              longitude: -54.3,
            },
            {
              id: 2,
              name: 'Santa Helena',
              country_code: 'BR',
              admin1: 'Santa Catarina',
              latitude: -26.9,
              longitude: -53.6,
            },
          ],
        }),
      );
      expect((await searchCities('Santa Helena')).map((city) => city.stateCode)).toEqual([
        'PR',
        'SC',
      ]);
    });

    it.each([
      null,
      [],
      { results: 'inválido' },
    ])('rejeita estrutura inválida de busca: %j', async (payload) => {
      vi.stubGlobal('fetch', mockFetchOnce(payload));
      await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
    });
  });

  describe('getWeather', () => {
    it('mapeia current e daily para WeatherData', async () => {
      vi.stubGlobal('fetch', mockFetchOnce(forecastPayload()));

      const data = await getWeather(CITY);
      expect(data.current).toEqual({
        time: '2026-11-11T14:15',
        temperatureC: 24,
        humidityPercent: 68,
        windSpeedKmh: 14,
        pressureHpa: 1014,
        precipitationMm: 0.2,
        precipitationProbabilityPercent: 20,
        weatherCode: 2,
      });
      expect(data.forecast).toEqual([
        {
          date: '2026-11-11',
          minTemperatureC: 18,
          maxTemperatureC: 26,
          weatherCode: 2,
          windSpeedKmh: 14,
          humidityPercent: 68,
          precipitationProbabilityPercent: 20,
        },
        {
          date: '2026-11-12',
          minTemperatureC: 19,
          maxTemperatureC: 28,
          weatherCode: 0,
          windSpeedKmh: 12,
          humidityPercent: 62,
          precipitationProbabilityPercent: 5,
        },
        {
          date: '2026-11-13',
          minTemperatureC: 18,
          maxTemperatureC: 23,
          weatherCode: 61,
          windSpeedKmh: 22,
          humidityPercent: 85,
          precipitationProbabilityPercent: 80,
        },
        {
          date: '2026-11-14',
          minTemperatureC: 17,
          maxTemperatureC: 22,
          weatherCode: 3,
          windSpeedKmh: 18,
          humidityPercent: 78,
          precipitationProbabilityPercent: 40,
        },
        {
          date: '2026-11-15',
          minTemperatureC: 18,
          maxTemperatureC: 25,
          weatherCode: 1,
          windSpeedKmh: 13,
          humidityPercent: 70,
          precipitationProbabilityPercent: 10,
        },
      ]);
    });

    it('converte probabilidade de precipitação null em zero', async () => {
      const payload = forecastPayload();
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...payload,
          daily: { ...payload.daily, precipitation_probability_max: [20, 5, 80, 40, null] },
        }),
      );
      const data = await getWeather(CITY);
      expect(data.forecast[4].precipitationProbabilityPercent).toBe(0);
    });

    it.each([
      ['current ausente', { daily: forecastPayload().daily }],
      ['daily ausente', { current: forecastPayload().current }],
      ['ambos ausentes', {}],
      ['ambos null', { current: null, daily: null }],
    ])('lança WeatherServiceError quando há %s', async (_description, payload) => {
      vi.stubGlobal('fetch', mockFetchOnce(payload));
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('envia variáveis/fuso/unidades e mapeia quatro métricas sem expor JSON à UI', async () => {
      const fetchSpy = mockFetchOnce(forecastPayload());
      vi.stubGlobal('fetch', fetchSpy);
      const data = await getWeather(CITY);
      const params = new URL(fetchSpy.mock.calls[0][0]).searchParams;
      expect(params.get('latitude')).toBe(String(CITY.latitude));
      expect(params.get('longitude')).toBe(String(CITY.longitude));
      expect(params.get('forecast_days')).toBe('5');
      expect(params.get('timezone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
      expect(params.get('temperature_unit')).toBe('celsius');
      expect(params.get('wind_speed_unit')).toBe('kmh');
      expect(params.get('hourly')).toBe('precipitation_probability');
      expect(params.get('daily')).toContain('relative_humidity_2m_mean');
      expect(params.get('daily')).toContain('wind_speed_10m_max');
      expect(data.region).toEqual({ kind: 'city', city: CITY });
      expect(data.isStateAggregate).toBe(false);
      expect(data.current).toMatchObject({
        temperatureC: 24,
        humidityPercent: 68,
        windSpeedKmh: 14,
        precipitationProbabilityPercent: 20,
      });
      expect(data.forecast[0]).toEqual({
        date: '2026-11-11',
        minTemperatureC: 18,
        maxTemperatureC: 26,
        weatherCode: 2,
        windSpeedKmh: 14,
        humidityPercent: 68,
        precipitationProbabilityPercent: 20,
      });
    });

    it('envia o fuso do dispositivo diferente da cidade e preserva as datas retornadas', async () => {
      const options = new Intl.DateTimeFormat().resolvedOptions();
      vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
        ...options,
        timeZone: 'Asia/Tokyo',
      });
      const payload = forecastPayload();
      const dates = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16'];
      const fetchSpy = mockFetchOnce({
        ...payload,
        timezone: 'Asia/Tokyo',
        current: { ...payload.current, time: '2026-11-12T08:30' },
        hourly: { time: ['2026-11-12T08:00'], precipitation_probability: [35] },
        daily: { ...payload.daily, time: dates },
      });
      vi.stubGlobal('fetch', fetchSpy);
      const data = await getWeather(CITY);
      expect(new URL(fetchSpy.mock.calls[0][0]).searchParams.get('timezone')).toBe('Asia/Tokyo');
      expect(data.timeZone).toBe('Asia/Tokyo');
      expect(data.forecast.map((day) => day.date)).toEqual(dates);
      expect(data.current).toMatchObject({
        time: '2026-11-12T08:30',
        precipitationProbabilityPercent: 35,
      });
    });

    it('não usa chance de chuva de outra data nem inventa campos ausentes', async () => {
      const payload = forecastPayload();
      payload.hourly.time = ['2026-11-10T14:00'];
      payload.hourly.precipitation_probability = [90];
      payload.daily.relative_humidity_2m_mean = [];
      payload.daily.wind_speed_10m_max = [];
      payload.daily.precipitation_probability_max = [101];
      vi.stubGlobal('fetch', mockFetchOnce(payload));
      const data = await getWeather(CITY);
      expect(data.current?.precipitationProbabilityPercent).toBeNull();
      expect(data.forecast[0]).toMatchObject({
        humidityPercent: null,
        windSpeedKmh: null,
        precipitationProbabilityPercent: null,
      });
      expect(data.forecast[1].precipitationProbabilityPercent).toBeNull();
    });

    it('mantém o alinhamento de séries parciais sem deslocar valores entre dias', async () => {
      const payload = forecastPayload();
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...payload,
          current: {
            time: payload.current.time,
            relative_humidity_2m: 68,
            wind_speed_10m: 14,
            weather_code: 2,
          },
          daily: {
            ...payload.daily,
            temperature_2m_min: [18, null, 20],
            temperature_2m_max: [26, 28],
            relative_humidity_2m_mean: [68],
            precipitation_probability_max: [20, null],
          },
        }),
      );

      const data = await getWeather(CITY);
      expect(data.current).toMatchObject({
        temperatureC: null,
        humidityPercent: 68,
        windSpeedKmh: 14,
      });
      expect(data.forecast.map((day) => day.date)).toEqual(payload.daily.time);
      expect(data.forecast.map((day) => day.minTemperatureC)).toEqual([18, null, 20, null, null]);
      expect(data.forecast.map((day) => day.maxTemperatureC)).toEqual([26, 28, null, null, null]);
      expect(data.forecast.map((day) => day.humidityPercent)).toEqual([68, null, null, null, null]);
      expect(data.forecast.map((day) => day.windSpeedKmh)).toEqual([14, 12, 22, 18, 13]);
      expect(data.forecast.map((day) => day.precipitationProbabilityPercent)).toEqual([
        20,
        0,
        null,
        null,
        null,
      ]);
    });

    it.each([
      Number.NaN,
      Number.POSITIVE_INFINITY,
      '24',
      null,
    ])('representa temperatura inválida %j como indisponível sem coerção', async (value) => {
      const payload = forecastPayload();
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...payload,
          current: { ...payload.current, temperature_2m: value },
          daily: {
            ...payload.daily,
            temperature_2m_min: [value, 19, 18, 17, 18],
            temperature_2m_max: [value, 28, 23, 22, 25],
          },
        }),
      );
      const data = await getWeather(CITY);
      expect(data.current?.temperatureC).toBeNull();
      expect(data.forecast[0].minTemperatureC).toBeNull();
      expect(data.forecast[0].maxTemperatureC).toBeNull();
      expect(data.forecast[1]).toMatchObject({ minTemperatureC: 19, maxTemperatureC: 28 });
    });

    it.each([
      undefined,
      null,
      {},
    ])('preserva chance atual indisponível sem bloco horário válido: %j', async (hourly) => {
      const payload = forecastPayload();
      vi.stubGlobal('fetch', mockFetchOnce({ ...payload, hourly }));
      const data = await getWeather(CITY);
      expect(data.current?.precipitationProbabilityPercent).toBeNull();
      expect(data.forecast[0].precipitationProbabilityPercent).toBe(20);
    });

    it.each([
      null,
      '2026/11/11',
      123,
    ])('rejeita data diária malformada %j com erro tipado', async (date) => {
      const payload = forecastPayload();
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...payload,
          daily: { ...payload.daily, time: [date, ...payload.daily.time.slice(1)] },
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it.each([
      { current: null, daily: {} },
      { current: {}, daily: null },
      { current: { time: '2026-11-11T14:00' }, daily: { time: ['2026-11-11'] } },
    ])('rejeita blocos ausentes ou menos de cinco datas: %j', async (payload) => {
      vi.stubGlobal('fetch', mockFetchOnce(payload));
      await expect(getWeather(CITY)).rejects.toThrow('Resposta de clima incompleta.');
    });

    it('limita séries extras aos cinco dias solicitados e preserva zeros válidos', async () => {
      const payload = forecastPayload();
      payload.daily.time.push('2026-11-16');
      payload.daily.precipitation_probability_max[0] = 0;
      payload.current.temperature_2m = 0;
      vi.stubGlobal('fetch', mockFetchOnce(payload));
      const data = await getWeather(CITY);
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[0].precipitationProbabilityPercent).toBe(0);
      expect(data.current?.temperatureC).toBe(0);
    });
  });

  describe('timeout e falhas', () => {
    it.each([
      ['geocoding', () => searchCities('São Paulo')],
      ['forecast', () => getWeather(CITY)],
    ])('trata queda de conexão durante a leitura do corpo em %s como falha de rede', async (_label, operation) => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new TypeError('Connection terminated');
          },
        }),
      );
      await expect(operation()).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Falha de rede.',
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
      ['geocoding', () => searchCities('São Paulo')],
      ['forecast', () => getWeather(CITY)],
    ])('normaliza falhas HTTP, JSON e rede em %s', async (_label, operation) => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(operation()).rejects.toBeInstanceOf(WeatherServiceError);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new SyntaxError('JSON inválido');
          },
        }),
      );
      await expect(operation()).rejects.toThrow('Resposta inválida da API.');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
      await expect(operation()).rejects.toThrow('Falha de rede.');
    });

    it('aborta após 10 segundos e limpa o timer no finally', async () => {
      vi.useFakeTimers();
      let capturedSignal: AbortSignal | null | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(async (_input, options) => {
          capturedSignal = options?.signal;
          return new Promise((_resolve, reject) => {
            capturedSignal?.addEventListener('abort', () => reject({ name: 'AbortError' }), {
              once: true,
            });
          });
        }),
      );
      const rejection = expect(searchCities('São Paulo')).rejects.toThrow(
        'A requisição demorou demais.',
      );
      await vi.advanceTimersByTimeAsync(9999);
      expect(capturedSignal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await rejection;
      expect(capturedSignal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('mantém o timeout ativo durante a leitura do JSON', async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(
          async (_input, options) =>
            ({
              ok: true,
              json: () =>
                new Promise((_resolve, reject) => {
                  options?.signal?.addEventListener(
                    'abort',
                    () => reject(new DOMException('Aborted', 'AbortError')),
                    { once: true },
                  );
                }),
            }) as Response,
        ),
      );
      const rejection = expect(getWeather(CITY)).rejects.toThrow('A requisição demorou demais.');
      await vi.advanceTimersByTimeAsync(10_000);
      await rejection;
      expect(vi.getTimerCount()).toBe(0);
    });

    it('limpa o timer também em sucesso e erro HTTP', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', mockFetchOnce({}));
      await searchCities('São Paulo');
      expect(vi.getTimerCount()).toBe(0);
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('catálogo de UFs usado pelo geocoding', () => {
    it('contém 27 UFs únicas e normaliza sigla, caixa e acentos', () => {
      expect(brazilStates).toHaveLength(27);
      expect(new Set(brazilStates.map((state) => state.code)).size).toBe(27);
      expect(findBrazilState(' sao paulo ')).toEqual(findBrazilState('sp'));
      expect(findBrazilState('Desconhecido')).toBeUndefined();
    });
  });
});
