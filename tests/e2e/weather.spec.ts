import { expect, type Page, test } from '@playwright/test';

function forecastResponse() {
  return {
    current: {
      time: '2026-11-11T14:00',
      temperature_2m: 0,
      relative_humidity_2m: 68,
      wind_speed_10m: 14,
      surface_pressure: 1014,
      precipitation: 0.2,
      weather_code: 2,
    },
    hourly: { time: ['2026-11-11T14:00'], precipitation_probability: [20] },
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
      weather_code: [2, 0, 61, 3, 1],
      temperature_2m_max: [26, 28, 23, 22, 25],
      temperature_2m_min: [18, 19, 18, 17, 18],
      precipitation_probability_max: [20, 5, 80, 40, 10],
      wind_speed_10m_max: [14, 12, 22, 18, 13],
      relative_humidity_2m_mean: [68, 62, 85, 78, 70],
    },
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    const name = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({
      json: {
        results:
          name === 'São Paulo' || name === 'sao paulo'
            ? [
                {
                  id: 1,
                  name: 'São Paulo',
                  country_code: 'BR',
                  admin1: 'São Paulo',
                  latitude: -23.55,
                  longitude: -46.63,
                },
              ]
            : [],
      },
    });
  });
  await page.route('**/api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecastResponse() }),
  );
});

async function searchCity(page: Page) {
  await page.getByRole('searchbox', { name: /buscar cidade/i }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('combobox', { name: 'Cidade encontrada' }).selectOption('1');
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
}

for (const value of ['', '   ']) {
  test(`busca vazia ${JSON.stringify(value)} não consulta API`, async ({ page }) => {
    let requests = 0;
    await page.route('**/*open-meteo.com/**', (route) => {
      requests += 1;
      return route.abort();
    });
    await page.goto('/');
    const input = page.getByRole('searchbox', { name: /buscar cidade/i });
    await input.fill(value);
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeDisabled();
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText(/busque uma cidade/i);
    expect(requests).toBe(0);
  });
}

test('preserva caracteres especiais na busca', async ({ page }) => {
  const term = 'São Paulo & região +/?';
  let receivedName: string | null = null;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    receivedName = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({ json: {} });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: /buscar cidade/i }).fill(term);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  expect(receivedName).toBe(term);
});

for (const field of ['current', 'daily']) {
  test(`forecast sem ${field} apresenta erro seguro`, async ({ page }) => {
    const payload: Record<string, unknown> = forecastResponse();
    delete payload[field];
    await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: payload }));
    await page.goto('/');
    await page.getByRole('searchbox', { name: /buscar cidade/i }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('combobox', { name: 'Cidade encontrada' }).selectOption('1');
    await expect(page.getByRole('alert')).toContainText('Resposta de clima incompleta');
    await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible();
  });
}

test('busca por clique exibe cidade, previsão e temperatura convertida sem request extra', async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('open-meteo.com')) apiRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText(/busque uma cidade/i);
  expect(apiRequests).toHaveLength(0);
  await searchCity(page);
  await expect(page.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
  expect(apiRequests).toHaveLength(2);
  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(current.getByText('0°', { exact: true })).toBeVisible();
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  for (const label of ['Umidade', 'Vento', 'Chance de chuva', 'Precipitação', 'Pressão']) {
    await expect(current.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: '°F' }).click();
  await expect(current.getByText('32°', { exact: true })).toBeVisible();
  await expect(forecast.getByText('79°', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°C' }).click();
  await expect(current.getByText('0°', { exact: true })).toBeVisible();
  expect(apiRequests).toHaveLength(2);
});

test('geocoding sem results mostra Nenhuma cidade encontrada', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => route.fulfill({ json: {} }));
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecastResponse() });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: /buscar cidade/i }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  expect(forecastRequests).toBe(0);
});

test('viewport mobile 375x812 renderiza o clima após a busca', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await searchCity(page);

  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(current).toBeVisible();
  await expect(current.getByText('0°', { exact: true })).toBeVisible();
  await expect(current.getByText('Parcialmente nublado', { exact: true })).toBeVisible();
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: '°F', exact: true }).click();
  await expect(current.getByText('32°', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('busca por teclado apresenta vazio e permite buscar novamente', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/buscar cidade/i).fill('xyzxyz');
  await page.getByLabel(/buscar cidade/i).press('Enter');
  await expect(page.getByText(/nenhuma cidade encontrada/i)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await page.getByLabel(/buscar cidade/i).fill('sao paulo');
  await page.getByLabel(/buscar cidade/i).press('Enter');
  await page.getByRole('combobox', { name: 'Cidade encontrada' }).selectOption('1');
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
});

for (const { width, columns } of [
  { width: 320, columns: 2 },
  { width: 412, columns: 2 },
  { width: 768, columns: 3 },
  { width: 1440, columns: 5 },
]) {
  test(`layout em ${width}px mantém ${columns} colunas sem overflow`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 915 });
    await page.goto('/');
    await searchCity(page);
    const grid = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('list');
    const actualColumns = await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(actualColumns).toBe(columns);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
    for (const label of ['Buscar', '°C', '°F']) {
      const bounds = await page.getByRole('button', { name: label, exact: true }).boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath(`weather-${width}.png`), fullPage: true });
  });
}

test('mensagem de busca longa não causa overflow em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await page.getByRole('searchbox').fill('Cidade'.repeat(40));
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('status')).toContainText(/nenhuma cidade encontrada/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('erro de forecast permite retry sem refazer geocoding', async ({ page }) => {
  let geocodingRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('geocoding-api.open-meteo.com')) geocodingRequests += 1;
  });
  await page.route(
    '**/api.open-meteo.com/**',
    (route) => route.fulfill({ status: 503, json: { error: true } }),
    { times: 1 },
  );
  await page.goto('/');
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('combobox', { name: 'Cidade encontrada' }).selectOption('1');
  await expect(page.getByRole('alert')).toContainText(/não foi possível carregar/i);
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(geocodingRequests).toBe(1);
});

test('CEP inválido não consulta e CEP válido exige confirmação da cidade', async ({ page }) => {
  let postalRequests = 0;
  let forecastRequests = 0;
  await page.route('**/viacep.com.br/ws/**', (route) => {
    postalRequests += 1;
    expect(route.request().url()).toContain('/01001000/json/');
    return route.fulfill({ json: { localidade: 'São Paulo', uf: 'SP' } });
  });
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'api.open-meteo.com') forecastRequests += 1;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'CEP', exact: true }).click();
  const input = page.getByRole('searchbox', { name: 'Buscar CEP' });
  await input.fill('123');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('oito dígitos');
  expect(postalRequests).toBe(0);
  await input.fill('01001000');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(input).toHaveValue('01001-000');
  await expect(page.getByRole('combobox', { name: 'Cidade encontrada' })).toBeVisible();
  expect(forecastRequests).toBe(0);
  await page.getByRole('combobox', { name: 'Cidade encontrada' }).selectOption('1');
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(postalRequests).toBe(1);
  expect(forecastRequests).toBe(1);
});

test('UF pesquisável filtra homônimos e não consulta cidade antes da escolha', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 1,
            name: 'Santa Helena',
            country_code: 'BR',
            admin1: 'Santa Catarina',
            latitude: -26.9,
            longitude: -53.6,
          },
          {
            id: 2,
            name: 'Santa Helena',
            country_code: 'BR',
            admin1: 'Paraná',
            latitude: -24.8,
            longitude: -54.3,
          },
        ],
      },
    }),
  );
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'api.open-meteo.com') forecastRequests += 1;
  });
  await page.goto('/');
  await expect(
    page.getByRole('combobox', { name: 'UF', exact: true }).getByRole('option'),
  ).toHaveCount(28);
  await page.getByRole('textbox', { name: 'Localizar UF' }).fill('parana');
  await page.getByRole('combobox', { name: 'UF', exact: true }).selectOption('PR');
  await page.getByRole('searchbox').fill('Santa Helena');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const results = page.getByRole('combobox', { name: 'Cidade encontrada' });
  await expect(results.getByRole('option')).toHaveCount(2);
  await expect(results).toContainText('Santa Helena — PR');
  expect(forecastRequests).toBe(0);
  await results.selectOption('2');
  await expect(page.getByRole('heading', { name: 'Santa Helena' })).toBeVisible();
  expect(forecastRequests).toBe(1);
});
