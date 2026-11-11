import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWeather } from '../../src/data/mockWeather';
import { useWeather } from '../../src/hooks/useWeather';
import { lookupPostalCode } from '../../src/services/cepService';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getWeather: vi.fn() };
});

vi.mock('../../src/services/cepService', () => ({ lookupPostalCode: vi.fn() }));

const report = createMockWeather();
if (report.region.kind !== 'city') throw new Error('Fixture inválida');
const city = report.region.city;
const otherCity: City = { ...city, id: 2, name: 'Curitiba', stateCode: 'PR', stateName: 'Paraná' };

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Value>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.mocked(lookupPostalCode).mockReset().mockResolvedValue({
      found: true,
      cityName: city.name,
      stateCode: city.stateCode,
      stateName: city.stateName,
    });
    vi.mocked(searchCities).mockReset().mockResolvedValue([city, otherCity]);
    vi.mocked(getWeather)
      .mockReset()
      .mockImplementation(async (selected) => ({
        ...report,
        region: { kind: 'city', city: selected },
      }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('inicia em idle e ignora busca vazia sem serviços', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('   '));
    expect(result.current.status).toBe('idle');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('aguarda seleção explícita e carrega somente a alternativa escolhida', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(' São Paulo '));
    expect(searchCities).toHaveBeenCalledWith('São Paulo');
    expect(getWeather).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'success',
      cities: [city, otherCity],
      query: 'São Paulo',
      error: null,
      data: null,
    });
    await act(() => result.current.selectCity(otherCity));
    expect(result.current.data?.region).toEqual({ kind: 'city', city: otherCity });
  });

  it('exige confirmação mesmo quando há um único candidato', async () => {
    vi.mocked(searchCities).mockResolvedValue([city]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({ status: 'success', cities: [city], data: null });
    expect(getWeather).not.toHaveBeenCalled();
    await act(() => result.current.selectCity(city));
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
  });

  it('filtra a busca pela UF escolhida sem consultar clima automaticamente', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Curitiba', 'PR'));
    expect(result.current.cities).toEqual([otherCity]);
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('resolve CEP e restringe município/UF antes da confirmação', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.searchPostalCode('01001-000'));
    expect(lookupPostalCode).toHaveBeenCalledWith('01001-000');
    expect(result.current.cities).toEqual([city]);
    expect(getWeather).not.toHaveBeenCalled();
    await act(() => result.current.selectCity(city));
    expect(result.current.data?.region).toEqual({ kind: 'city', city });
  });

  it('CEP não encontrado retorna vazio sem geocoding', async () => {
    vi.mocked(lookupPostalCode).mockResolvedValue({ found: false });
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.searchPostalCode('99999999'));
    expect(result.current.status).toBe('empty');
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('reset invalida consultas em andamento e limpa o retry anterior', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.search('São Paulo');
    });
    act(() => result.current.reset());
    await act(async () => {
      pending.resolve([city]);
      await operation;
      await result.current.retry();
    });
    expect(result.current).toMatchObject({ status: 'idle', data: null, cities: [], query: '' });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('retorna empty sem consultar forecast para uma busca sem resultados', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Desconhecida'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [] });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('retry de geocoding não reaproveita a cidade de uma busca anterior', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    await act(() => result.current.selectCity(city));
    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(() => result.current.search('Curitiba'));
    expect(result.current).toMatchObject({ status: 'error', data: null, error: 'Falha de rede.' });
    vi.mocked(searchCities).mockResolvedValueOnce([otherCity]);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenLastCalledWith('Curitiba');
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(() => result.current.selectCity(otherCity));
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
  });

  it('retry de forecast repete somente a última consulta meteorológica', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('A requisição demorou demais.'),
    );
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    await act(() => result.current.selectCity(city));
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
  });

  it('ignora respostas de forecast antigas e oculta o relatório anterior', async () => {
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let first!: Promise<void>;
    act(() => {
      first = result.current.selectCity(city);
    });
    expect(result.current).toMatchObject({ status: 'loading', data: null });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      pending.resolve(report);
      await first;
    });
    expect(result.current.data?.region).toEqual({ kind: 'city', city: otherCity });
  });

  it('ignora erros de uma busca anterior e não inicia seu forecast', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let first!: Promise<void>;
    act(() => {
      first = result.current.search('Antiga');
    });
    await act(() => result.current.search('Nova'));
    await act(async () => {
      pending.reject(new Error('Erro antigo'));
      await first;
    });
    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('Nova');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('não inicia forecast depois de desmontar o hook', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.search('São Paulo');
    });
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await operation;
    });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('mantém o erro da seleção atual mesmo se o forecast antigo terminar depois', async () => {
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather)
      .mockReturnValueOnce(pending.promise)
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    let first!: Promise<void>;
    act(() => {
      first = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      pending.resolve(report);
      await first;
    });
    expect(result.current).toMatchObject({ status: 'error', data: null, error: 'Falha de rede.' });
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current.data?.region).toEqual({ kind: 'city', city: otherCity });
  });

  it('não carrega a primeira cidade de uma busca obsoleta que termina com sucesso', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let first!: Promise<void>;
    act(() => {
      first = result.current.search('Antiga');
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      pending.resolve([city]);
      await first;
    });
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(otherCity);
    expect(result.current.data?.region).toEqual({ kind: 'city', city: otherCity });
  });

  it('mantém busca, resultado e erro isolados entre duas instâncias', async () => {
    const first = renderHook(() => useWeather());
    const second = renderHook(() => useWeather());
    await act(() => first.result.current.search('São Paulo'));
    await act(() => first.result.current.selectCity(city));
    expect(second.result.current).toMatchObject({
      status: 'idle',
      data: null,
      query: '',
      error: null,
    });
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(() => second.result.current.selectCity(otherCity));
    expect(second.result.current).toMatchObject({
      status: 'error',
      data: null,
      error: 'Falha de rede.',
    });
    expect(first.result.current).toMatchObject({
      status: 'success',
      query: 'São Paulo',
      error: null,
    });
    expect(first.result.current.data?.region).toEqual({ kind: 'city', city });
    await act(() => second.result.current.retry());
    expect(second.result.current.data?.region).toEqual({ kind: 'city', city: otherCity });
    expect(first.result.current.data?.region).toEqual({ kind: 'city', city });
  });
});
