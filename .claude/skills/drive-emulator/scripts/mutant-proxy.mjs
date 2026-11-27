#!/usr/bin/env node
// Serves Metro through another port with one source string replaced in every bundle, so a flow can be
// shown failing against a deliberate break without editing the source (ADR 0011's red).
//
//   node mutant-proxy.mjs <from> <to>    METRO_PORT (8082) is Metro's, PROXY_PORT (8083) its own
//
// The manifest's links to Metro are pointed at the proxy, so the app loads the mutant; Metro's sockets
// pass through untouched. Each bundle's line in the log says how often <from> was replaced: a red is
// licensed only by a mutant that was applied, so read that it was, once.
import { Buffer } from 'node:buffer';
import http from 'node:http';
import net from 'node:net';

const [from, to] = process.argv.slice(2);
if (from === undefined || to === undefined) {
  console.error('usage: mutant-proxy.mjs <from> <to>');
  process.exit(2);
}
const UP = Number(process.env.METRO_PORT ?? 8082);
const PORT = Number(process.env.PROXY_PORT ?? 8083);
let hits = 0;

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: `127.0.0.1:${UP}`, 'accept-encoding': 'identity' };
  const up = http.request({ port: UP, path: req.url, method: req.method, headers }, (upRes) => {
    const isBundle = req.url.includes('.bundle');
    const isManifest = (upRes.headers['content-type'] ?? '').includes('json') || req.url === '/';
    if (!isBundle && !isManifest) {
      res.writeHead(upRes.statusCode, upRes.headers);
      upRes.pipe(res);
      return;
    }
    const chunks = [];
    upRes.on('data', (c) => chunks.push(c));
    upRes.on('end', () => {
      let body = Buffer.concat(chunks).toString('utf8');
      if (isBundle) {
        const count = body.split(from).length - 1;
        hits += count;
        body = body.split(from).join(to);
        console.log(`${req.url.slice(0, 80)} replaced ${count}, total ${hits}`);
      } else {
        body = body.replaceAll(`:${UP}/`, `:${PORT}/`);
      }
      const out = { ...upRes.headers };
      delete out['content-length'];
      delete out['transfer-encoding'];
      delete out['content-encoding'];
      res.writeHead(upRes.statusCode, out);
      res.end(body);
    });
  });
  req.pipe(up);
});

server.on('upgrade', (req, socket, head) => {
  const up = net.connect(UP, '127.0.0.1', () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    }
    up.write(lines.join('\r\n') + '\r\n\r\n');
    up.write(head);
    up.pipe(socket);
    socket.pipe(up);
  });
  up.on('error', () => socket.destroy());
  socket.on('error', () => up.destroy());
});

server.listen(PORT, () =>
  console.log(`mutant proxy on ${PORT}: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`),
);
