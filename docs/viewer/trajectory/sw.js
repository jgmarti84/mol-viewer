'use strict';

// ── Store ─────────────────────────────────────────────────────────────────────
// Holds parsed DCD data after the main page sends the file.
var store = null; // { buf, nset, natom, offsets: [{x,y,z}] }

// ── Lifecycle ─────────────────────────────────────────────────────────────────
self.addEventListener('install',  function ()  { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

// ── Messages from main page ───────────────────────────────────────────────────
self.addEventListener('message', function (e) {
  if (!e.data) return;

  if (e.data.type === 'DCD_LOAD') {
    try {
      store = parseDCD(e.data.buffer); // buffer was transferred, SW owns it
      e.source.postMessage({ type: 'DCD_READY', nset: store.nset, natom: store.natom });
    } catch (err) {
      e.source.postMessage({ type: 'DCD_ERROR', message: err.message });
    }
  }

  if (e.data.type === 'DCD_CLEAR') {
    store = null;
  }
});

// ── Fetch interception ────────────────────────────────────────────────────────
self.addEventListener('fetch', function (e) {
  var url = e.request.url;

  // GET .../traj/numframes/<path>
  if (e.request.method === 'GET' && /\/traj\/numframes\//.test(url)) {
    e.respondWith(serveCount());
    return;
  }

  // POST .../traj/frame/<N>/<path>
  var m = /\/traj\/frame\/(\d+)\//.exec(url);
  if (e.request.method === 'POST' && m) {
    e.respondWith(serveFrame(e.request, parseInt(m[1], 10)));
    return;
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function serveCount() {
  var body = store ? String(store.nset) : '0';
  return Promise.resolve(new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  }));
}

function serveFrame(request, idx) {
  return request.text().then(function (body) {
    if (!store || idx >= store.nset) {
      return new Response(null, { status: 404 });
    }

    // Parse atomIndices from POST body: "atomIndices=0;N" (semicolon-separated range pairs)
    var params = new URLSearchParams(body);
    var raw    = params.get('atomIndices') || ('0;' + store.natom);
    // Split on ; or , to handle both flat pairs [0,N] and nested [[0,N]]
    var nums   = raw.split(/[;,]/).map(Number).filter(function (n) { return !isNaN(n); });

    // Count total atoms requested across all [start, end) ranges
    var total = 0;
    for (var i = 0; i < nums.length - 1; i += 2) {
      total += nums[i + 1] - nums[i];
    }

    // Binary response layout (matches MDSrv protocol exactly):
    //   bytes  0-3  : int32  LE  — total frame count
    //   bytes  4-7  : int32  LE  — padding (0)
    //   bytes  8-43 : float32×9  — box matrix (zeros = non-periodic)
    //   bytes 44+   : float32×(total*3) — interleaved XYZ per atom
    var buf    = new ArrayBuffer(44 + total * 12);
    var dv     = new DataView(buf);
    var floats = new Float32Array(buf, 44);

    dv.setInt32(0, store.nset, true);
    // bytes 4-43 are already zero (new ArrayBuffer is zero-initialized)

    // Fast typed-array views into the DCD buffer (little-endian only, validated in parseDCD)
    var f  = store.offsets[idx];
    var bx = new Float32Array(store.buf, f.x, store.natom);
    var by = new Float32Array(store.buf, f.y, store.natom);
    var bz = new Float32Array(store.buf, f.z, store.natom);

    var fi = 0;
    for (var i = 0; i < nums.length - 1; i += 2) {
      for (var j = nums[i]; j < nums[i + 1]; j++) {
        floats[fi++] = bx[j];
        floats[fi++] = by[j];
        floats[fi++] = bz[j];
      }
    }

    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  });
}

// ── DCD parser ────────────────────────────────────────────────────────────────
// Parses the CHARMM/NAMD DCD binary format. Stores byte offsets into the
// original buffer rather than copying coordinate data, so memory usage is minimal.

function parseDCD(buffer) {
  var dv  = new DataView(buffer);
  var pos = 0;

  // Auto-detect endianness: first Fortran record marker must equal 84
  var le = (dv.getInt32(0, true) === 84);
  if (!le && dv.getInt32(0, false) !== 84) {
    throw new Error('DCD: first record marker is not 84 — not a valid DCD file');
  }
  if (!le) {
    throw new Error('Big-endian DCD files are not yet supported. Re-save the trajectory with a modern CHARMM/NAMD (little-endian).');
  }

  function i32()   { var v = dv.getInt32(pos, true); pos += 4; return v; }
  function skip(n) { pos += n; }

  function rec() {
    var len   = i32();
    var start = pos;
    skip(len);
    var end = i32();
    if (len !== end) {
      throw new Error('DCD Fortran record mismatch at byte ' + (pos - 4) + ': ' + len + ' vs ' + end);
    }
    return { start: start, len: len };
  }

  // Block 1: 84-byte header
  var hdr  = rec();
  var h    = hdr.start;
  var cord = String.fromCharCode(dv.getUint8(h), dv.getUint8(h+1), dv.getUint8(h+2), dv.getUint8(h+3));
  if (cord !== 'CORD') {
    throw new Error('DCD: expected "CORD" magic bytes, got "' + cord + '"');
  }

  var nset     = dv.getInt32(h + 4,  true); // number of frames
  var charmm   = dv.getInt32(h + 80, true); // CHARMM version (0 = not CHARMM/NAMD)
  // ICNTRL[14] at h+60 is the has_extra_block (unit cell) flag.
  // h+48 is DELTA (float64 timestep) — a common off-by-one mistake.
  var hasExtra = (charmm !== 0) && (dv.getInt32(h + 60, true) !== 0);

  rec(); // Block 2: title (skip)

  // Block 3: atom count
  var aRec  = rec();
  var natom = dv.getInt32(aRec.start, true);

  if (natom <= 0) throw new Error('DCD: atom count is ' + natom);
  if (nset  <= 0) throw new Error('DCD: frame count is ' + nset + ' — file may be empty');

  // Scan all frame blocks, recording coordinate byte offsets
  var offsets = [];
  for (var f = 0; f < nset; f++) {
    if (hasExtra) rec(); // unit-cell block (PBC box)

    var xr = rec();
    var yr = rec();
    var zr = rec();

    var expected = natom * 4;
    if (xr.len !== expected || yr.len !== expected || zr.len !== expected) {
      throw new Error(
        'DCD frame ' + f + ': expected ' + expected + '-byte coordinate blocks, ' +
        'got ' + xr.len + '/' + yr.len + '/' + zr.len
      );
    }

    offsets.push({ x: xr.start, y: yr.start, z: zr.start });
  }

  return { buf: buffer, nset: nset, natom: natom, offsets: offsets };
}
