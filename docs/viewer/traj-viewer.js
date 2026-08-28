(function () {

  document.addEventListener("DOMContentLoaded", function () {

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent =
    "* { box-sizing: border-box; margin: 0; padding: 0; }\n" +
    "body { background: #1a1a2e; color: #e0e0e0; font-family: sans-serif; display: flex; height: 100vh; overflow: hidden; }\n" +
    "#viewport { flex: 1; position: relative; }\n" +
    "#empty-state {\n" +
    "  position: absolute; inset: 0; display: flex; flex-direction: column;\n" +
    "  align-items: center; justify-content: center; gap: 10px;\n" +
    "  pointer-events: none;\n" +
    "}\n" +
    "#empty-state .es-icon { font-size: 48px; opacity: 0.12; }\n" +
    "#empty-state .es-text { font-size: 13px; color: #444; }\n" +
    "#panel {\n" +
    "  width: 232px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);\n" +
    "  padding: 12px 10px; display: flex; flex-direction: column; gap: 8px;\n" +
    "  border-left: 1px solid rgba(255,255,255,0.08); z-index: 10; overflow-y: auto;\n" +
    "}\n" +
    "#back-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: #aaa; text-decoration: none; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; transition: color 0.15s, border-color 0.15s; align-self: flex-start; }\n" +
    "#back-btn:hover { color: #fff; border-color: rgba(255,255,255,0.4); }\n" +
    "#sys-title { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0.5px; padding: 2px 2px 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }\n" +
    ".section-card { background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }\n" +
    ".section-header { display: flex; align-items: center; gap: 7px; padding: 8px 11px; cursor: pointer; font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1.5px; user-select: none; transition: color 0.15s, background 0.15s; }\n" +
    ".section-header:hover { background: rgba(255,255,255,0.05); color: #ddd; }\n" +
    ".section-arrow { font-size: 9px; transition: transform 0.2s; display: inline-block; }\n" +
    ".section-card.collapsed .section-arrow { transform: rotate(-90deg); }\n" +
    ".section-card.collapsed .section-body { display: none; }\n" +
    ".section-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(255,255,255,0.06); }\n" +
    ".file-row { display: flex; flex-direction: column; gap: 4px; }\n" +
    ".file-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }\n" +
    ".file-pick { display: flex; align-items: center; gap: 6px; }\n" +
    ".file-btn { font-size: 11px; padding: 4px 8px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #ccc; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s; }\n" +
    ".file-btn:hover { background: rgba(255,255,255,0.13); color: #fff; }\n" +
    ".file-name { font-size: 11px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }\n" +
    ".file-name.ready { color: #4caf50; }\n" +
    "#load-btn { width: 100%; padding: 7px; background: #7b8fff; border: none; border-radius: 5px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }\n" +
    "#load-btn:hover:not(:disabled) { background: #6070ee; }\n" +
    "#load-btn:disabled { background: rgba(255,255,255,0.08); color: #444; cursor: default; }\n" +
    "#play-btn { width: 100%; padding: 7px; background: rgba(123,143,255,0.12); border: 1px solid rgba(123,143,255,0.3); border-radius: 5px; color: #7b8fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s; }\n" +
    "#play-btn:hover { background: rgba(123,143,255,0.22); border-color: rgba(123,143,255,0.55); }\n" +
    ".layer { display: flex; align-items: center; gap: 9px; font-size: 13px; }\n" +
    "input[type=checkbox] { cursor: pointer; accent-color: #7b8fff; }\n" +
    "label { cursor: pointer; user-select: none; font-size: 13px; }\n" +
    ".val-badge { margin-left: auto; font-size: 11px; font-weight: 700; color: #7b8fff; flex-shrink: 0; }\n" +
    ".sub-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }\n" +
    ".sub-label { font-size: 10px; color: #666; }\n" +
    "input[type=range] { width: 100%; display: block; cursor: pointer; accent-color: #7b8fff; height: 3px; }\n" +
    "#frame-counter { font-size: 11px; color: #555; text-align: center; font-variant-numeric: tabular-nums; }\n" +
    "#status { font-size: 11px; color: #f5a623; min-height: 14px; text-align: center; }\n" +
    ".hidden { display: none !important; }\n";
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  document.body.innerHTML =
    '<div id="viewport">' +
    '  <div id="empty-state">' +
    '    <div class="es-icon">&#11835;</div>' +
    '    <div class="es-text">Upload a PDB and DCD file to begin</div>' +
    '  </div>' +
    '</div>' +
    '<div id="panel">' +
    '  <a id="back-btn" href="../">&#8592; All systems</a>' +
    '  <div id="sys-title">MD Trajectory</div>' +

    '  <div class="section-card">' +
    '    <div class="section-header"><span class="section-arrow">&#9662;</span>Load Files</div>' +
    '    <div class="section-body">' +
    '      <div class="file-row">' +
    '        <span class="file-label">Structure (PDB)</span>' +
    '        <div class="file-pick">' +
    '          <button class="file-btn" id="pdb-btn">Browse</button>' +
    '          <span class="file-name" id="pdb-name">none</span>' +
    '          <input type="file" id="pdb-input" accept=".pdb,.ent" style="display:none">' +
    '        </div>' +
    '      </div>' +
    '      <div class="file-row">' +
    '        <span class="file-label">Trajectory (DCD)</span>' +
    '        <div class="file-pick">' +
    '          <button class="file-btn" id="dcd-btn">Browse</button>' +
    '          <span class="file-name" id="dcd-name">none</span>' +
    '          <input type="file" id="dcd-input" accept=".dcd" style="display:none">' +
    '        </div>' +
    '      </div>' +
    '      <div id="status"></div>' +
    '      <button id="load-btn" disabled>Load</button>' +
    '    </div>' +
    '  </div>' +

    '  <div class="section-card hidden" id="card-playback">' +
    '    <div class="section-header"><span class="section-arrow">&#9662;</span>Playback</div>' +
    '    <div class="section-body">' +
    '      <button id="play-btn">&#9654;&#xFE0E; Play</button>' +
    '      <div id="frame-counter">Frame 1 / —</div>' +
    '      <div>' +
    '        <div class="sub-row"><span class="sub-label">Frame</span></div>' +
    '        <input type="range" id="sl-frame" min="0" max="0" step="1" value="0">' +
    '      </div>' +
    '      <div>' +
    '        <div class="sub-row"><span class="sub-label">Speed</span><span class="val-badge" id="sv-speed">50 ms</span></div>' +
    '        <input type="range" id="sl-speed" min="20" max="500" step="10" value="50">' +
    '      </div>' +
    '      <div class="layer">' +
    '        <input type="checkbox" id="cb-superpose" checked>' +
    '        <label for="cb-superpose">Center frames (Ca)</label>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +

    '  <div class="section-card hidden" id="card-repr">' +
    '    <div class="section-header"><span class="section-arrow">&#9662;</span>Representation</div>' +
    '    <div class="section-body">' +
    '      <div class="layer"><input type="checkbox" id="cb-cartoon" checked><label for="cb-cartoon">Cartoon</label></div>' +
    '      <div class="layer"><input type="checkbox" id="cb-backbone"><label for="cb-backbone">Backbone</label></div>' +
    '      <div class="layer"><input type="checkbox" id="cb-surface"><label for="cb-surface">Surface</label></div>' +
    '    </div>' +
    '  </div>' +

    '</div>';

  // ── Section collapse ──────────────────────────────────────────────────────
  document.querySelectorAll(".section-header").forEach(function (hdr) {
    hdr.addEventListener("click", function () {
      hdr.closest(".section-card").classList.toggle("collapsed");
    });
  });

  // ── NGL Stage ─────────────────────────────────────────────────────────────
  var stage = new NGL.Stage("viewport", { backgroundColor: "#1a1a2e" });
  window.addEventListener("resize", function () { stage.handleResize(); });

  // ── State ─────────────────────────────────────────────────────────────────
  var pdbFile     = null;
  var dcdFile     = null;
  var activeComp  = null;
  var frames      = [];   // [{x: Float32Array, y: Float32Array, z: Float32Array}]
  var caIndices   = [];   // indices of Cα atoms in structure
  var refCentroid = null; // {x, y, z} centroid of Cα in frame 0
  var nframes     = 0;
  var curFrame    = 0;
  var animTimer   = null;
  var playing     = false;

  var reprCartoon  = null;
  var reprBackbone = null;
  var reprSurface  = null;

  // ── File pickers ──────────────────────────────────────────────────────────
  document.getElementById("pdb-btn").addEventListener("click", function () {
    document.getElementById("pdb-input").click();
  });
  document.getElementById("dcd-btn").addEventListener("click", function () {
    document.getElementById("dcd-input").click();
  });

  document.getElementById("pdb-input").addEventListener("change", function (e) {
    pdbFile = e.target.files[0] || null;
    var el = document.getElementById("pdb-name");
    el.textContent = pdbFile ? pdbFile.name : "none";
    el.className = "file-name" + (pdbFile ? " ready" : "");
    syncLoadBtn();
  });

  document.getElementById("dcd-input").addEventListener("change", function (e) {
    dcdFile = e.target.files[0] || null;
    var el = document.getElementById("dcd-name");
    el.textContent = dcdFile ? dcdFile.name : "none";
    el.className = "file-name" + (dcdFile ? " ready" : "");
    syncLoadBtn();
  });

  function syncLoadBtn() {
    document.getElementById("load-btn").disabled = !(pdbFile && dcdFile);
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  document.getElementById("load-btn").addEventListener("click", function () {
    if (!pdbFile || !dcdFile) return;
    doLoad();
  });

  function doLoad() {
    setStatus("Loading structure...");
    teardown();

    var loadedComp;

    stage.loadFile(pdbFile, { ext: "pdb", defaultRepresentation: false })
      .then(function (comp) {
        loadedComp = comp;
        activeComp = comp;

        reprCartoon  = comp.addRepresentation("cartoon",  { color: "chainindex", smoothSheet: true });
        reprBackbone = comp.addRepresentation("backbone", { color: "#7b8fff", visible: false });
        reprSurface  = comp.addRepresentation("surface",  { color: "chainindex", opacity: 0.35, visible: false });

        syncReprCheckboxes();
        comp.autoView();
        setStatus("Parsing DCD...");

        return readFileAsArrayBuffer(dcdFile);
      })
      .then(function (buffer) {
        var traj = parseDCD(buffer);
        var natom = loadedComp.structure.atomCount;

        if (traj.natom !== natom) {
          throw new Error(
            "Atom count mismatch: PDB has " + natom + " atoms, DCD has " + traj.natom
          );
        }

        frames  = traj.frames;
        nframes = traj.nset;

        // Cache Cα indices and reference centroid from frame 0
        caIndices   = getCaIndices(loadedComp.structure);
        refCentroid = computeCentroid(frames[0], caIndices);

        var slFrame = document.getElementById("sl-frame");
        slFrame.max   = nframes - 1;
        slFrame.value = 0;

        renderFrame(0);
        updateCounter(0);

        document.getElementById("empty-state").style.display = "none";
        setStatus("Ready — " + nframes + " frames");
        showPostLoad();
      })
      .catch(function (err) {
        setStatus("Error: " + err.message);
        console.error(err);
      });
  }

  // ── Frame rendering ───────────────────────────────────────────────────────
  function renderFrame(idx) {
    if (!activeComp || !frames[idx]) return;
    curFrame = idx;

    var frame   = frames[idx];
    var store   = activeComp.structure.atomStore;
    var superpose = document.getElementById("cb-superpose").checked;

    if (superpose && caIndices.length > 0 && refCentroid) {
      var cur = computeCentroid(frame, caIndices);
      var dx = refCentroid.x - cur.x;
      var dy = refCentroid.y - cur.y;
      var dz = refCentroid.z - cur.z;
      var n = frame.x.length;
      var tx = new Float32Array(n);
      var ty = new Float32Array(n);
      var tz = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        tx[i] = frame.x[i] + dx;
        ty[i] = frame.y[i] + dy;
        tz[i] = frame.z[i] + dz;
      }
      store.x.set(tx);
      store.y.set(ty);
      store.z.set(tz);
    } else {
      store.x.set(frame.x);
      store.y.set(frame.y);
      store.z.set(frame.z);
    }

    activeComp.updateRepresentations({ position: true });
    stage.viewer.requestRender();

    document.getElementById("sl-frame").value = idx;
    updateCounter(idx);
  }

  // ── Playback controls ─────────────────────────────────────────────────────
  document.getElementById("play-btn").addEventListener("click", function () {
    if (!nframes) return;
    if (playing) {
      stopAnim();
    } else {
      startAnim();
    }
  });

  document.getElementById("sl-frame").addEventListener("input", function () {
    stopAnim();
    renderFrame(parseInt(this.value, 10));
  });

  document.getElementById("sl-speed").addEventListener("input", function () {
    var v = parseInt(this.value, 10);
    document.getElementById("sv-speed").textContent = v + " ms";
    if (playing) { stopAnim(); startAnim(); }
  });

  document.getElementById("cb-superpose").addEventListener("change", function () {
    if (nframes) renderFrame(curFrame);
  });

  function startAnim() {
    var speed = parseInt(document.getElementById("sl-speed").value, 10);
    animTimer = setInterval(function () {
      renderFrame((curFrame + 1) % nframes);
    }, speed);
    playing = true;
    document.getElementById("play-btn").innerHTML = "&#9646;&#9646; Pause";
  }

  function stopAnim() {
    if (animTimer) { clearInterval(animTimer); animTimer = null; }
    playing = false;
    document.getElementById("play-btn").innerHTML = "&#9654;&#xFE0E; Play";
  }

  // ── Representation toggles ────────────────────────────────────────────────
  document.getElementById("cb-cartoon").addEventListener("change", function () {
    if (reprCartoon)  reprCartoon.setVisibility(this.checked);
  });
  document.getElementById("cb-backbone").addEventListener("change", function () {
    if (reprBackbone) reprBackbone.setVisibility(this.checked);
  });
  document.getElementById("cb-surface").addEventListener("change", function () {
    if (reprSurface)  reprSurface.setVisibility(this.checked);
  });

  // ── DCD parser ────────────────────────────────────────────────────────────
  function parseDCD(buffer) {
    var dv  = new DataView(buffer);
    var pos = 0;

    // Detect endianness: first Fortran record marker must be 84
    var le = true;
    if (dv.getInt32(0, true) !== 84) {
      if (dv.getInt32(0, false) !== 84) {
        throw new Error("DCD: bad file — first block marker is not 84");
      }
      le = false;
    }

    function i32()  { var v = dv.getInt32(pos, le);   pos += 4; return v; }
    function skip(n){ pos += n; }

    function record() {
      var len   = i32();
      var start = pos;
      skip(len);
      var end = i32();
      if (len !== end) throw new Error("DCD: Fortran record mismatch (" + len + " vs " + end + ")");
      return { start: start, len: len };
    }

    // Block 1: header (84 bytes)
    var hdr  = record();
    var h    = hdr.start;
    var cord = String.fromCharCode(dv.getUint8(h), dv.getUint8(h+1), dv.getUint8(h+2), dv.getUint8(h+3));
    if (cord !== "CORD") throw new Error('DCD: expected "CORD", got "' + cord + '"');

    var nset     = dv.getInt32(h + 4,  le);
    var charmm   = dv.getInt32(h + 80, le);
    var hasExtra = charmm !== 0 && (dv.getInt32(h + 48, le) & 0x1) !== 0; // unit cell per frame

    // Block 2: title (skip)
    record();

    // Block 3: atom count
    var atomRec = record();
    var natom   = dv.getInt32(atomRec.start, le);

    // Read coordinate frames
    var frameList = [];
    for (var f = 0; f < nset; f++) {
      if (hasExtra) record(); // unit cell block

      var xr = record();
      var yr = record();
      var zr = record();

      var x = readFloats(dv, xr.start, natom, le);
      var y = readFloats(dv, yr.start, natom, le);
      var z = readFloats(dv, zr.start, natom, le);

      frameList.push({ x: x, y: y, z: z });
    }

    return { nset: nset, natom: natom, frames: frameList };
  }

  function readFloats(dv, offset, count, le) {
    // Fast path: if little-endian (common), reuse buffer memory directly
    if (le) {
      return new Float32Array(dv.buffer.slice(offset, offset + count * 4));
    }
    var out = new Float32Array(count);
    for (var i = 0; i < count; i++) out[i] = dv.getFloat32(offset + i * 4, false);
    return out;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getCaIndices(structure) {
    var idx = [];
    structure.eachAtom(function (ap) {
      if (ap.atomname === "CA") idx.push(ap.index);
    });
    return idx;
  }

  function computeCentroid(frame, indices) {
    var sx = 0, sy = 0, sz = 0, n = indices.length;
    for (var i = 0; i < n; i++) {
      var k = indices[i];
      sx += frame.x[k]; sy += frame.y[k]; sz += frame.z[k];
    }
    return { x: sx / n, y: sy / n, z: sz / n };
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload  = function (e) { resolve(e.target.result); };
      reader.onerror = function ()  { reject(new Error("Failed to read file")); };
      reader.readAsArrayBuffer(file);
    });
  }

  function teardown() {
    stopAnim();
    stage.removeAllComponents();
    activeComp = null; frames = []; caIndices = []; refCentroid = null; nframes = 0; curFrame = 0;
    reprCartoon = null; reprBackbone = null; reprSurface = null;
    document.getElementById("empty-state").style.display = "";
    hidePostLoad();
  }

  function showPostLoad() {
    document.getElementById("card-playback").classList.remove("hidden");
    document.getElementById("card-repr").classList.remove("hidden");
  }

  function hidePostLoad() {
    document.getElementById("card-playback").classList.add("hidden");
    document.getElementById("card-repr").classList.add("hidden");
  }

  function setStatus(msg) { document.getElementById("status").textContent = msg; }

  function updateCounter(i) {
    document.getElementById("frame-counter").textContent = "Frame " + (i + 1) + " / " + nframes;
  }

  function syncReprCheckboxes() {
    document.getElementById("cb-cartoon").checked  = true;
    document.getElementById("cb-backbone").checked = false;
    document.getElementById("cb-surface").checked  = false;
  }

  });
})();
