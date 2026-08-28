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
    ".no-layers-msg { font-size: 11px; color: #555; }\n" +
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
    '        <div class="sub-row"><span class="sub-label">Speed</span><span class="val-badge" id="sv-speed">10 fps</span></div>' +
    '        <input type="range" id="sl-speed" min="1" max="25" step="1" value="10">' +
    '      </div>' +
    '      <div class="layer">' +
    '        <input type="checkbox" id="cb-superpose" checked>' +
    '        <label for="cb-superpose">Superpose frames</label>' +
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

    '  <div class="section-card hidden" id="card-layers">' +
    '    <div class="section-header"><span class="section-arrow">&#9662;</span>Layers</div>' +
    '    <div class="section-body">' +
    '      <div class="layer" id="row-water" style="display:none">' +
    '        <input type="checkbox" id="cb-water">' +
    '        <label for="cb-water">Water</label>' +
    '        <span class="val-badge" id="badge-water"></span>' +
    '      </div>' +
    '      <div class="layer" id="row-ion" style="display:none">' +
    '        <input type="checkbox" id="cb-ion">' +
    '        <label for="cb-ion">Ions</label>' +
    '        <span class="val-badge" id="badge-ion"></span>' +
    '      </div>' +
    '      <div class="layer" id="row-ligand" style="display:none">' +
    '        <input type="checkbox" id="cb-ligand">' +
    '        <label for="cb-ligand">Ligand / Probe</label>' +
    '        <span class="val-badge" id="badge-ligand"></span>' +
    '      </div>' +
    '      <div class="no-layers-msg" id="no-layers">No extra components detected</div>' +
    '    </div>' +
    '  </div>' +

    '</div>';

  // ── Section collapse ──────────────────────────────────────────────────────
  document.querySelectorAll(".section-header").forEach(function (hdr) {
    hdr.addEventListener("click", function () {
      hdr.closest(".section-card").classList.toggle("collapsed");
    });
  });

  // ── Service Worker registration ───────────────────────────────────────────
  if (!('serviceWorker' in navigator)) {
    document.getElementById("status").textContent =
      "Service Workers not supported in this browser.";
  } else {
    navigator.serviceWorker.register('./sw.js').catch(function (err) {
      console.warn("SW registration failed:", err);
    });
  }

  // ── NGL Stage ─────────────────────────────────────────────────────────────
  var stage = new NGL.Stage("viewport", { backgroundColor: "#1a1a2e" });
  window.addEventListener("resize", function () { stage.handleResize(); });

  // ── State ─────────────────────────────────────────────────────────────────
  var pdbFile    = null;
  var dcdFile    = null;
  var activeComp = null;
  var activeTraj = null;
  var player     = null;
  var nframes    = 0;
  var playing    = false;

  var reprCartoon  = null;
  var reprBackbone = null;
  var reprSurface  = null;
  var reprWater    = null;
  var reprIon      = null;
  var reprLigand   = null;

  // ── File pickers ──────────────────────────────────────────────────────────
  document.getElementById("pdb-btn").addEventListener("click", function () {
    document.getElementById("pdb-input").click();
  });
  document.getElementById("dcd-btn").addEventListener("click", function () {
    document.getElementById("dcd-input").click();
  });

  document.getElementById("pdb-input").addEventListener("change", function (e) {
    pdbFile = e.target.files[0] || null;
    var el  = document.getElementById("pdb-name");
    el.textContent = pdbFile ? pdbFile.name : "none";
    el.className   = "file-name" + (pdbFile ? " ready" : "");
    syncLoadBtn();
  });

  document.getElementById("dcd-input").addEventListener("change", function (e) {
    dcdFile = e.target.files[0] || null;
    var el  = document.getElementById("dcd-name");
    el.textContent = dcdFile ? dcdFile.name : "none";
    el.className   = "file-name" + (dcdFile ? " ready" : "");
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

    var comp;

    stage.loadFile(pdbFile, { ext: "pdb", defaultRepresentation: false })
      .then(function (c) {
        comp       = c;
        activeComp = c;

        // Protein representations — read current checkbox state so user prefs
        // survive reloads triggered by toggling superpose.
        reprCartoon  = c.addRepresentation("cartoon",  {
          color: "chainindex", smoothSheet: true,
          visible: document.getElementById("cb-cartoon").checked
        });
        reprBackbone = c.addRepresentation("backbone", {
          color: "#7b8fff",
          visible: document.getElementById("cb-backbone").checked
        });
        reprSurface  = c.addRepresentation("surface",  {
          sele: "protein", color: "chainindex", opacity: 0.35,
          visible: document.getElementById("cb-surface").checked
        });

        // Extra component layers — detect which are present and build toggles.
        reprWater  = c.addRepresentation("point",      {
          sele: "water",  color: "#4fc3f7", pointSize: 2,
          visible: document.getElementById("cb-water").checked
        });
        reprIon    = c.addRepresentation("spacefill",  {
          sele: "ion",    color: "element",  scale: 0.8,
          visible: document.getElementById("cb-ion").checked
        });
        reprLigand = c.addRepresentation("ball+stick", {
          sele: "ligand", color: "element",
          visible: document.getElementById("cb-ligand").checked
        });

        // Detect which component types exist and show/hide layer rows.
        var comps = detectComponents(c.structure);
        updateLayerRow("water",  comps.water);
        updateLayerRow("ion",    comps.ion);
        updateLayerRow("ligand", comps.ligand);
        document.getElementById("no-layers").style.display =
          (comps.water + comps.ion + comps.ligand === 0) ? "" : "none";

        c.autoView();
        setStatus("Reading DCD...");

        return readFileAsBuffer(dcdFile);
      })
      .then(function (buffer) {
        setStatus("Sending to trajectory worker...");
        return sendDCDtoSW(buffer);
      })
      .then(function (meta) {
        nframes = meta.nset;
        setStatus("Loading trajectory...");

        NGL.setTrajectoryDatasource(makeDatasource());

        var superpose = document.getElementById("cb-superpose").checked;
        return comp.addTrajectory("trajectory.dcd", {
          superpose: superpose,
          sele: ".CA"
        });
      })
      .then(function (tc) {
        activeTraj = tc.trajectory;
        return waitForFrameCount(activeTraj);
      })
      .then(function (count) {
        nframes = count;

        var fps = parseInt(document.getElementById("sl-speed").value, 10);
        player  = new NGL.TrajectoryPlayer(activeTraj, {
          step: 1,
          timeout: Math.round(1000 / fps),
          mode: "loop",
          interpolateType: ""
        });

        activeTraj.signals.frameChanged.add(function (i) {
          document.getElementById("sl-frame").value = i;
          updateCounter(i);
        });

        var slFrame = document.getElementById("sl-frame");
        slFrame.max   = Math.max(0, nframes - 1);
        slFrame.value = 0;

        // Load frame 0 immediately so the view is populated and the player has
        // a starting point. updateCounter is called from the frameChanged handler.
        activeTraj.setFrame(0);

        document.getElementById("empty-state").style.display = "none";
        setStatus("Ready — " + nframes + " frames");
        showPostLoad();
      })
      .catch(function (err) {
        setStatus("Error: " + err.message);
        console.error(err);
      });
  }

  // ── Playback controls ─────────────────────────────────────────────────────
  document.getElementById("play-btn").addEventListener("click", function () {
    if (!player) return;
    if (playing) {
      player.pause();
      playing = false;
      this.innerHTML = "&#9654;&#xFE0E; Play";
    } else {
      player.play();
      playing = true;
      this.innerHTML = "&#9646;&#9646; Pause";
    }
  });

  document.getElementById("sl-frame").addEventListener("input", function () {
    if (!activeTraj) return;
    if (playing && player) { player.pause(); playing = false; }
    document.getElementById("play-btn").innerHTML = "&#9654;&#xFE0E; Play";
    activeTraj.setFrame(parseInt(this.value, 10));
  });

  document.getElementById("sl-speed").addEventListener("input", function () {
    var fps = parseInt(this.value, 10);
    document.getElementById("sv-speed").textContent = fps + " fps";
    if (!activeTraj) return;
    var wasPlaying = playing;
    if (player) player.pause();
    player = new NGL.TrajectoryPlayer(activeTraj, {
      step: 1,
      timeout: Math.round(1000 / fps),
      mode: "loop",
      interpolateType: ""
    });
    if (wasPlaying) { player.play(); }
    playing = wasPlaying;
  });

  document.getElementById("cb-superpose").addEventListener("change", function () {
    if (activeComp && dcdFile) doLoad();
  });

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

  // ── Layer toggles ─────────────────────────────────────────────────────────
  document.getElementById("cb-water").addEventListener("change", function () {
    if (reprWater)  reprWater.setVisibility(this.checked);
  });
  document.getElementById("cb-ion").addEventListener("change", function () {
    if (reprIon)    reprIon.setVisibility(this.checked);
  });
  document.getElementById("cb-ligand").addEventListener("change", function () {
    if (reprLigand) reprLigand.setVisibility(this.checked);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function makeDatasource() {
    if (typeof NGL.MdsrvDatasource === "function") {
      return new NGL.MdsrvDatasource("");
    }
    return {
      getUrl:         function (p) { return "file/" + p; },
      getCountUrl:    function (p) { return "traj/numframes/" + p; },
      getFrameUrl:    function (p, i) { return "traj/frame/" + i + "/" + p; },
      getFrameParams: function (p, idx) { return "atomIndices=" + idx.join(";"); },
      getPathUrl:     function (p, t) { return "traj/path/" + t + "/" + p; },
      getExt:         function (p) { return p.split(".").pop(); }
    };
  }

  function sendDCDtoSW(buffer) {
    return new Promise(function (resolve, reject) {
      function onMsg(e) {
        if (e.data && e.data.type === "DCD_READY") {
          navigator.serviceWorker.removeEventListener("message", onMsg);
          resolve({ nset: e.data.nset, natom: e.data.natom });
        } else if (e.data && e.data.type === "DCD_ERROR") {
          navigator.serviceWorker.removeEventListener("message", onMsg);
          reject(new Error(e.data.message));
        }
      }
      navigator.serviceWorker.addEventListener("message", onMsg);
      navigator.serviceWorker.ready.then(function (reg) {
        reg.active.postMessage({ type: "DCD_LOAD", buffer: buffer }, [buffer]);
      });
    });
  }

  function waitForFrameCount(traj) {
    return new Promise(function (resolve) {
      if (traj.numframes > 0) { resolve(traj.numframes); return; }
      // NGL dispatches the count as the signal argument; traj.numframes is also
      // set before the signal fires, so prefer the argument then fall back.
      traj.signals.countChanged.addOnce(function (count) {
        resolve(count || traj.numframes);
      });
    });
  }

  function readFileAsBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload  = function (e) { resolve(e.target.result); };
      reader.onerror = function ()  { reject(new Error("Failed to read file")); };
      reader.readAsArrayBuffer(file);
    });
  }

  // Detect which extra molecular components exist and how many atoms each has.
  // Uses eachResidue + ResidueProxy methods — no NGL.Selection needed.
  function detectComponents(structure) {
    var water = 0, ion = 0, ligand = 0;
    structure.eachResidue(function (rp) {
      if      (rp.isWater())  { water  += rp.atomCount; }
      else if (rp.isIon())    { ion    += rp.atomCount; }
      else if (rp.isHetero()) { ligand += rp.atomCount; }
    });
    return { water: water, ion: ion, ligand: ligand };
  }

  // Show a layer row with its atom count badge, or keep it hidden if count is 0.
  function updateLayerRow(id, count) {
    document.getElementById("row-" + id).style.display =
      count > 0 ? "" : "none";
    document.getElementById("badge-" + id).textContent =
      count > 0 ? String(count) : "";
  }

  function teardown() {
    if (player) { player.stop(); player = null; }
    activeTraj = null;
    stage.removeAllComponents();
    activeComp   = null;
    reprCartoon  = null; reprBackbone = null; reprSurface = null;
    reprWater    = null; reprIon      = null; reprLigand  = null;
    nframes = 0; playing = false;
    document.getElementById("play-btn").innerHTML = "&#9654;&#xFE0E; Play";
    document.getElementById("empty-state").style.display = "";
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "DCD_CLEAR" });
    }
    // Reset layer rows so they re-detect on next load.
    ["water", "ion", "ligand"].forEach(function (id) {
      document.getElementById("row-" + id).style.display = "none";
      document.getElementById("badge-" + id).textContent = "";
    });
    document.getElementById("no-layers").style.display = "";
    hidePostLoad();
  }

  function showPostLoad() {
    document.getElementById("card-playback").classList.remove("hidden");
    document.getElementById("card-repr").classList.remove("hidden");
    document.getElementById("card-layers").classList.remove("hidden");
  }

  function hidePostLoad() {
    document.getElementById("card-playback").classList.add("hidden");
    document.getElementById("card-repr").classList.add("hidden");
    document.getElementById("card-layers").classList.add("hidden");
  }

  function setStatus(msg) { document.getElementById("status").textContent = msg; }

  function updateCounter(i) {
    if (i < 0 || !nframes) return; // ignore NGL's -1 init signal and unset state
    document.getElementById("frame-counter").textContent =
      "Frame " + (i + 1) + " / " + nframes;
  }

  });
})();
