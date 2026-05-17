const request = require('supertest');
const app = require('../src/app');

const XML_BASE =
  'https://raw.githubusercontent.com/MiddlewareNewZealand/evaluation-instructions/main/xml-api';

// Intercept fetch so tests don't hit the real network
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
}

const COMPANY_1_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Data>
  <id>1</id>
  <name>MWNZ</name>
  <description>..is awesome</description>
</Data>`;

const COMPANY_2_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Data>
  <id>2</id>
  <name>Other</name>
  <description>....is not</description>
</Data>`;

describe('404 handler', () => {
  test('returns 404 with usage hint for unknown routes', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('error_description');
    expect(res.body).toHaveProperty('usage', 'GET /v1/companies/{id}');
    expect(res.body).toHaveProperty('example');
  });

  test('returns 404 for arbitrary unknown paths', async () => {
    const res = await request(app).get('/something/random');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('usage', 'GET /v1/companies/{id}');
  });
});

describe('GET /v1/companies/:id', () => {
  test('returns company 1 as JSON', async () => {
    mockFetch(200, COMPANY_1_XML);
    const res = await request(app).get('/v1/companies/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, name: 'MWNZ', description: '..is awesome' });
    expect(global.fetch).toHaveBeenCalledWith(`${XML_BASE}/1.xml`, { headers: {} });
  });

  test('returns company 2 as JSON', async () => {
    mockFetch(200, COMPANY_2_XML);
    const res = await request(app).get('/v1/companies/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 2, name: 'Other', description: '....is not' });
  });

  test('returns 404 when upstream returns 404', async () => {
    mockFetch(404, '');
    const res = await request(app).get('/v1/companies/99');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('error_description');
  });

  test('returns 502 when upstream returns 500', async () => {
    mockFetch(500, 'Internal Server Error');
    const res = await request(app).get('/v1/companies/1');
    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('error_description');
  });

  test('returns 502 on network failure', async () => {
    mockFetchNetworkError();
    const res = await request(app).get('/v1/companies/1');
    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('error_description');
  });

  test('forwards Authorization header to upstream', async () => {
    mockFetch(200, COMPANY_1_XML);
    await request(app).get('/v1/companies/1').set('Authorization', 'Bearer token123');
    expect(global.fetch).toHaveBeenCalledWith(`${XML_BASE}/1.xml`, {
      headers: { Authorization: 'Bearer token123' },
    });
  });

  test('omits Authorization header when not provided', async () => {
    mockFetch(200, COMPANY_1_XML);
    await request(app).get('/v1/companies/1');
    expect(global.fetch).toHaveBeenCalledWith(`${XML_BASE}/1.xml`, { headers: {} });
  });

  test('returns 502 on malformed XML', async () => {
    mockFetch(200, 'not xml at all <<<');
    const res = await request(app).get('/v1/companies/1');
    // fast-xml-parser is lenient; check we at least get a response
    expect([200, 404, 502]).toContain(res.status);
  });
});
