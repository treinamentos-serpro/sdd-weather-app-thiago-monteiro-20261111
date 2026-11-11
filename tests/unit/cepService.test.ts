import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatPostalCode, normalizePostalCode } from '../../src/lib/postalCode';
import { lookupPostalCode } from '../../src/services/cepService';
import { WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => vi.unstubAllGlobals());

describe('CEP', () => {
  it.each(['01001000', '01001-000'])('normaliza e formata %s', (value) => {
    expect(normalizePostalCode(value)).toBe('01001000');
    expect(formatPostalCode(value)).toBe('01001-000');
  });
  it.each([
    '',
    '01001',
    '123456789',
    'abcdefgh',
    '0100-1000',
  ])('rejeita %j sem rede e preserva entrada parcial', async (value) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(normalizePostalCode(value)).toBeNull();
    expect(formatPostalCode(value)).toBe(value);
    await expect(lookupPostalCode(value)).rejects.toBeInstanceOf(WeatherServiceError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('mapeia município e UF sem expor endereço completo', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        Response.json({ localidade: 'São Paulo', uf: 'SP', logradouro: 'Endereço' }),
      );
    vi.stubGlobal('fetch', fetchSpy);
    expect(await lookupPostalCode('01001-000')).toEqual({
      found: true,
      cityName: 'São Paulo',
      stateCode: 'SP',
      stateName: 'São Paulo',
    });
    expect(fetchSpy.mock.calls[0][0]).toBe('https://viacep.com.br/ws/01001000/json/');
  });
  it('distingue CEP não encontrado de erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ erro: true })));
    expect(await lookupPostalCode('99999999')).toEqual({ found: false });
  });
  it.each([
    null,
    {},
    { localidade: 'São Paulo', uf: 'XX' },
  ])('rejeita resposta inválida %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(lookupPostalCode('01001000')).rejects.toBeInstanceOf(WeatherServiceError);
  });
  it('apresenta falha de rede consistente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));
    await expect(lookupPostalCode('01001000')).rejects.toThrow('Falha de rede.');
  });
});
