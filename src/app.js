const express = require('express');
const { XMLParser } = require('fast-xml-parser');

const app = express();
const parser = new XMLParser();

const XML_BASE_URL =
  'https://raw.githubusercontent.com/MiddlewareNewZealand/evaluation-instructions/main/xml-api';

app.get('/v1/companies/:id', async (req, res) => {
  const { id } = req.params;

  let response;
  try {
    response = await fetch(`${XML_BASE_URL}/${id}.xml`);
  } catch {
    return res.status(502).json({
      error: 'Bad Gateway',
      error_description: 'Failed to reach upstream XML service',
    });
  }

  if (response.status === 404) {
    return res.status(404).json({
      error: 'Not Found',
      error_description: `Company with id ${id} not found`,
    });
  }

  if (!response.ok) {
    return res.status(502).json({
      error: 'Bad Gateway',
      error_description: `Upstream XML service returned ${response.status}`,
    });
  }

  let data;
  try {
    const xml = await response.text();
    const parsed = parser.parse(xml);
    data = parsed.Data;
  } catch {
    return res.status(502).json({
      error: 'Bad Gateway',
      error_description: 'Failed to parse XML from upstream service',
    });
  }

  if (!data) {
    return res.status(404).json({
      error: 'Not Found',
      error_description: `Company with id ${id} not found`,
    });
  }

  return res.json({
    id: data.id,
    name: data.name,
    description: data.description,
  });
});

module.exports = app;
