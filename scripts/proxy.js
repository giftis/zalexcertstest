/**
 * scripts/proxy.js
 *
 * Lightweight CORS proxy for local development only.
 * Forwards all requests to https://zalexinc.azure-api.net and adds
 * Access-Control-Allow-Origin headers so the Expo Web dev server
 * (running on localhost:8081) can call the Azure API from the browser.
 *
 * Usage: node scripts/proxy.js   (or via "npm run dev")
 */

'use strict';

const http = require('http');
const https = require('https');

const PROXY_PORT = 3001;
const TARGET_HOST = 'zalexinc.azure-api.net';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,          // includes path + query string as-is
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,    // must override host header for virtual hosting
    },
  };

  // Remove headers that break the upstream request
  delete options.headers['origin'];
  delete options.headers['referer'];
  // Disable compression — the proxy forwards raw bytes so gzip would corrupt JSON
  delete options.headers['accept-encoding'];
  options.headers['accept-encoding'] = 'identity';

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'content-type': proxyRes.headers['content-type'] || 'application/json',
      ...CORS_HEADERS,
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message);
    res.writeHead(502, { 'content-type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log('[proxy] Zalex API proxy running on http://localhost:' + PROXY_PORT);
  console.log('[proxy] Forwarding to https://' + TARGET_HOST);
});
