import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it.each(['', '   '])('não dispara onSearch com entrada vazia %j', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: /buscar cidade/i });
    if (value) await user.type(input, value);
    const submit = screen.getByRole('button', { name: /buscar/i });
    expect(submit).toBeDisabled();
    await user.click(submit);
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it.each([
    ['São Paulo', 'São Paulo'],
    ['   Recife   ', 'Recife'],
  ])('envia o termo %j como %j', async (value, expected) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByLabelText(/buscar cidade/i), value);
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('envia o termo usando Enter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox', { name: /buscar cidade/i }), 'Curitiba');
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Curitiba');
  });

  it('desabilita entrada e envio durante o carregamento', () => {
    render(<SearchBar onSearch={vi.fn()} disabled />);
    expect(screen.getByRole('searchbox', { name: /buscar cidade/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  it('formata CEP somente após blur e envia oito dígitos', async () => {
    const onSearch = vi.fn();
    render(<SearchBar mode="postalCode" onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Buscar CEP' });
    await userEvent.type(input, '01001');
    expect(input).toHaveValue('01001');
    await userEvent.type(input, '000');
    expect(input).toHaveValue('01001000');
    await userEvent.tab();
    expect(input).toHaveValue('01001-000');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('01001000');
  });

  it('anuncia CEP inválido sem enviar busca', async () => {
    const onSearch = vi.fn();
    render(<SearchBar mode="postalCode" onSearch={onSearch} />);
    await userEvent.type(screen.getByRole('searchbox'), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('oito dígitos');
    expect(onSearch).not.toHaveBeenCalled();
  });
});
