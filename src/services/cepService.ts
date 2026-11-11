import { findBrazilState } from '../data/brazilStates';
import { normalizePostalCode } from '../lib/postalCode';
import type { PostalCodeLookup } from '../types/weather';
import { fetchWithTimeout, WeatherServiceError } from './weatherService';

export async function lookupPostalCode(value: string): Promise<PostalCodeLookup> {
  const normalized = normalizePostalCode(value);
  if (!normalized) throw new WeatherServiceError('Informe um CEP válido com oito dígitos.');
  const data = await fetchWithTimeout(
    `https://viacep.com.br/ws/${normalized}/json/`,
    'Não foi possível consultar o CEP. Tente novamente.',
  );
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    throw new WeatherServiceError('Resposta de CEP inválida.');
  if ('erro' in data && data.erro === true) return { found: false };
  if (
    !('localidade' in data) ||
    typeof data.localidade !== 'string' ||
    !data.localidade.trim() ||
    !('uf' in data) ||
    typeof data.uf !== 'string'
  )
    throw new WeatherServiceError('Resposta de CEP incompleta.');
  const state = findBrazilState(data.uf);
  if (!state) throw new WeatherServiceError('UF do CEP não reconhecida.');
  return {
    found: true,
    cityName: data.localidade.trim(),
    stateCode: state.code,
    stateName: state.name,
  };
}
