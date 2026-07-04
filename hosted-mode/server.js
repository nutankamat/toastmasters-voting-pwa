#!/usr/bin/env node
/* TM Club Vote — hosted mode server.
 * Zero npm dependencies on purpose: this needs to "just run" under Termux
 * on an Android phone with nothing more than `pkg install nodejs`.
 * Serves the client from ./public and a small JSON API backed by a
 * ./data/state.json file so a restart doesn't lose ballots.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const DEFAULT_STATE = {
  club: '', theme: '', meetingNo: '', date: '', tmod: '', pin: '',
  categories: [
    { id: 'cat-speaker',   name: 'Best Speaker',              nominees: [] },
    { id: 'cat-evaluator', name: 'Best Evaluator',            nominees: [] },
    { id: 'cat-tt',        name: 'Best Table Topics Speaker', nominees: [] },
    { id: 'cat-major',     name: 'Best Major Role Player',    nominees: [], source: 'major' },
    { id: 'cat-minor',     name: 'Best Minor Role Player',    nominees: [], source: 'minor' }
  ],
  ballots: [],   // [{ id, ts, picks: { catId: nomineeName } }]
  revealed: {}   // { catId: true }
};

let state = loadState();

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}
function saveState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Could not save state:', e.message);
  }
}

function cid() { return 'c' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8); }

function checkPin(req) {
  if (!state.pin) return true;
  return req.headers['x-pin'] === state.pin;
}

function publicConfig() {
  return {
    club: state.club, theme: state.theme, meetingNo: state.meetingNo,
    date: state.date, tmod: state.tmod, pinSet: !!state.pin,
    categories: state.categories.map(c => ({ id: c.id, name: c.name, nominees: c.nominees || [] })),
    ballotCount: state.ballots.length
  };
}

function tally(catId) {
  const counts = {};
  state.ballots.forEach(b => {
    const n = b.picks ? b.picks[catId] : undefined;
    if (n) counts[n] = (counts[n] || 0) + 1;
  });
  return Object.keys(counts)
    .map(n => ({ name: n, count: counts[n] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function send(res, status, body) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(data);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let tooBig = false;
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2e6) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => {
      if (tooBig) return reject(new Error('Body too large'));
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { send(res, 403, { error: 'forbidden' }); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { send(res, 404, { error: 'not found' }); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  let u;
  try { u = new URL(req.url, 'http://localhost'); }
  catch (e) { return send(res, 400, { error: 'bad request' }); }
  const pathname = u.pathname;

  try {
    // --- Voter-facing: no pin required ---
    if (pathname === '/api/ballot-info' && req.method === 'GET') {
      return send(res, 200, publicConfig());
    }

    if (pathname === '/api/vote' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const validIds = new Set(state.categories.map(c => c.id));
      const picks = {};
      Object.keys(body || {}).forEach(k => {
        if (validIds.has(k) && typeof body[k] === 'string' && body[k]) picks[k] = body[k];
      });
      const ballot = { id: cid(), ts: Date.now(), picks };
      state.ballots.push(ballot);
      state.revealed = {};
      saveState();
      return send(res, 200, { ok: true, ballotId: ballot.id, ballotCount: state.ballots.length });
    }

    // Lets a voter retract the ballot they *just* submitted (shown right after
    // the confirmation screen). Needs the exact ballotId token from the vote
    // response, so it can't be used to tamper with someone else's ballot.
    if (pathname === '/api/undo' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const id = body && body.ballotId;
      const idx = state.ballots.findIndex(b => b.id === id);
      if (idx === -1) return send(res, 404, { error: 'ballot not found (already tallied?)' });
      state.ballots.splice(idx, 1);
      state.revealed = {};
      saveState();
      return send(res, 200, { ok: true, ballotCount: state.ballots.length });
    }

    // --- Organizer-facing: pin required if one is set ---
    if (pathname === '/api/setup' && req.method === 'GET') {
      if (!checkPin(req)) return send(res, 401, { error: 'bad pin' });
      return send(res, 200, {
        club: state.club, theme: state.theme, meetingNo: state.meetingNo,
        date: state.date, tmod: state.tmod, pinSet: !!state.pin,
        categories: state.categories
      });
    }

    if (pathname === '/api/setup' && req.method === 'POST') {
      if (!checkPin(req)) return send(res, 401, { error: 'bad pin' });
      const body = await readJsonBody(req);
      ['club', 'theme', 'meetingNo', 'date', 'tmod'].forEach(k => {
        if (typeof body[k] === 'string') state[k] = body[k];
      });
      if (typeof body.pin === 'string' && body.pin.length) state.pin = body.pin;
      if (body.clearPin === true) state.pin = '';
      if (Array.isArray(body.categories)) {
        state.categories = body.categories.map(c => ({
          id: (typeof c.id === 'string' && c.id) ? c.id : cid(),
          name: String(c.name || ''),
          nominees: Array.isArray(c.nominees) ? c.nominees.map(String).filter(Boolean) : [],
          source: (c.source === 'major' || c.source === 'minor') ? c.source : undefined
        }));
      }
      saveState();
      return send(res, 200, { ok: true });
    }

    if (pathname === '/api/results' && req.method === 'GET') {
      if (!checkPin(req)) return send(res, 401, { error: 'bad pin' });
      const categories = state.categories.map(c => ({
        id: c.id, name: c.name, nominees: c.nominees || [],
        rows: tally(c.id), revealed: !!state.revealed[c.id]
      }));
      return send(res, 200, { ballotCount: state.ballots.length, categories });
    }

    if (pathname === '/api/reveal' && req.method === 'POST') {
      if (!checkPin(req)) return send(res, 401, { error: 'bad pin' });
      const body = await readJsonBody(req);
      if (body.all) {
        state.categories.forEach(c => { if (tally(c.id).length) state.revealed[c.id] = true; });
      } else if (typeof body.catId === 'string') {
        state.revealed[body.catId] = true;
      }
      saveState();
      return send(res, 200, { ok: true });
    }

    if (pathname === '/api/reset' && req.method === 'POST') {
      if (!checkPin(req)) return send(res, 401, { error: 'bad pin' });
      state.ballots = [];
      state.revealed = {};
      saveState();
      return send(res, 200, { ok: true });
    }

    if (pathname.startsWith('/api/')) return send(res, 404, { error: 'not found' });

    return serveStatic(req, res, pathname);
  } catch (e) {
    send(res, 500, { error: e.message || 'server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  TM Club Vote — hosted mode');
  console.log('  ------------------------------------------------------');
  console.log('  Server listening on port ' + PORT);
  console.log('  1. Turn on this phone\'s hotspot (no internet needed).');
  console.log('  2. Find this phone\'s hotspot IP address in Settings.');
  console.log('  3. Have voters join the hotspot and open, in a browser:');
  console.log('       http://<this-phone-ip>:' + PORT + '/');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
