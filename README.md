# Transformer

A lightweight HTTP service that fetches company data from an XML upstream and returns it as JSON.

---

## User Guide

### Base URL

```
https://xml-adapter-example.vercel.app
```

### Get a company

```
GET /v1/companies/{id}
```

**Path parameter**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `id`      | number | The company ID     |

**Authentication**

The service accepts an `Authorization` header and forwards it to the upstream data source. No validation is performed at this time.

```
Authorization: Bearer <token>
```

**Success response — 200**

```json
{
  "id": 1,
  "name": "MWNZ",
  "description": "..is awesome"
}
```

**Error responses**

| Status | Meaning                                      |
|--------|----------------------------------------------|
| `404`  | No company found with the given ID           |
| `502`  | Upstream XML service unreachable or invalid  |

```json
{
  "error": "Not Found",
  "error_description": "Company with id 99 not found"
}
```

**Examples**

```bash
# Fetch company 1
curl https://xml-adapter-example.vercel.app/v1/companies/1

# With an auth token
curl -H "Authorization: Bearer mytoken" \
  https://xml-adapter-example.vercel.app/v1/companies/1
```

---

## Developer Guide

### Prerequisites

- Node.js 20+
- npm
- Docker (optional, for container builds)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm start
```

The server listens on port `3000` by default. Override with `PORT`:

```bash
PORT=8080 npm start
```

Test it:

```bash
curl http://localhost:3000/v1/companies/1
```

### Run tests

```bash
npm test
```

Tests use Jest and supertest. `global.fetch` is mocked so the suite runs offline and deterministically.

### Run in Docker

```bash
docker build -t adapter .
docker run -p 3000:3000 adapter
```

### Deploy to Vercel

The project deploys as a container on Vercel. Vercel detects the `Dockerfile` automatically.

```bash
npm install -g vercel
vercel deploy
```

For production:

```bash
vercel --prod
```

### Project structure

```
src/
  app.js       Express app — route handler, XML fetch, transform, errors
  server.js    Entry point — binds the port
tests/
  app.test.js  Jest + supertest test suite
Dockerfile     Container image (node:20-alpine, production deps only)
vercel.json    Vercel deployment config
```

### Architecture

```
Client
  │  GET /v1/companies/{id}
  ▼
Express (src/app.js)
  │  GET upstream/{id}.xml
  │  Authorization header forwarded if present
  ▼
GitHub static XML
  │  XML response
  ▼
fast-xml-parser
  │  JSON { id, name, description }
  ▼
Client
```

**Error handling** distinguishes three failure modes:

- Network error (fetch throws) → `502`
- Upstream HTTP error — `404` maps to `404`, anything else maps to `502`
- XML parse failure → `502`

### Adding authentication

The `Authorization` header passthrough is already wired at both ends (`src/app.js`). To enforce auth inbound, add middleware before the route. To swap in a service credential outbound, replace the forwarded header with your credential in the `upstreamHeaders` object.
