(function () {
  var sys = window.SYSTEM || { id: "?", ligand: "?" };

  document.addEventListener("DOMContentLoaded", function () {

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent =
    "* { box-sizing: border-box; margin: 0; padding: 0; }\n" +
    "body { background: #1a1a2e; color: #e0e0e0; font-family: sans-serif; display: flex; height: 100vh; overflow: hidden; }\n" +
    "#viewport { flex: 1; }\n" +
    "#panel {\n" +
    "  width: 190px; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);\n" +
    "  padding: 16px 14px; display: flex; flex-direction: column; gap: 14px;\n" +
    "  border-left: 1px solid rgba(255,255,255,0.08); z-index: 10;\n" +
    "}\n" +
    "#panel h3 { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; }\n" +
    ".layer { display: flex; align-items: center; gap: 9px; font-size: 13px; }\n" +
    ".dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; opacity: 0.9; }\n" +
    "input[type=checkbox] { cursor: pointer; accent-color: #7b8fff; }\n" +
    "label { cursor: pointer; user-select: none; }\n" +
    ".divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); }\n" +
    "#status { font-size: 11px; color: #666; margin-top: auto; }\n" +
    ".slider-row { display: flex; align-items: center; gap: 6px; padding-left: 20px; }\n" +
    ".slider-row input[type=range] { flex: 1; cursor: pointer; accent-color: #7b8fff; height: 3px; }\n" +
    ".slider-val { font-size: 11px; color: #999; width: 26px; text-align: right; flex-shrink: 0; }\n" +
    "#tooltip {\n" +
    "  position: fixed; pointer-events: none; z-index: 100;\n" +
    "  background: rgba(0,0,0,0.82); color: #fff;\n" +
    "  font-family: monospace; font-size: 12px; white-space: nowrap;\n" +
    "  padding: 6px 10px; border-radius: 5px;\n" +
    "  border: 1px solid rgba(255,255,255,0.18);\n" +
    "  display: none;\n" +
    "}";
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  document.body.innerHTML =
    '<div id="viewport"></div>' +
    '<div id="panel">' +
    '  <h3>Layers</h3>' +
    '  <div class="layer">' +
    '    <div class="dot" style="background:#5c7fd4;"></div>' +
    '    <input type="checkbox" id="cb-protein" checked>' +
    '    <label for="cb-protein">Protein</label>' +
    '  </div>' +
    '  <div class="layer">' +
    '    <div class="dot" style="background:#cccccc;"></div>' +
    '    <input type="checkbox" id="cb-ligand" checked>' +
    '    <label for="cb-ligand">Ligand</label>' +
    '  </div>' +
    '  <hr class="divider">' +
    '  <h3>Pockets</h3>' +
    '  <div class="layer">' +
    '    <div class="dot" style="background:#f5a623;"></div>' +
    '    <input type="checkbox" id="cb-hyd" checked>' +
    '    <label for="cb-hyd">Hydrophobic (HYD)</label>' +
    '  </div>' +
    '  <div class="slider-row">' +
    '    <input type="range" id="sl-hyd" min="0.2" max="2" step="0.05" value="0.5">' +
    '    <span class="slider-val" id="sv-hyd">0.5</span>' +
    '  </div>' +
    '  <div class="layer">' +
    '    <div class="dot" style="background:#4a90e2;"></div>' +
    '    <input type="checkbox" id="cb-don" checked>' +
    '    <label for="cb-don">Donor (DON)</label>' +
    '  </div>' +
    '  <div class="slider-row">' +
    '    <input type="range" id="sl-don" min="0.2" max="2" step="0.05" value="0.2">' +
    '    <span class="slider-val" id="sv-don">0.2</span>' +
    '  </div>' +
    '  <div class="layer">' +
    '    <div class="dot" style="background:#e05c5c;"></div>' +
    '    <input type="checkbox" id="cb-acc" checked>' +
    '    <label for="cb-acc">Acceptor (ACC)</label>' +
    '  </div>' +
    '  <div class="slider-row">' +
    '    <input type="range" id="sl-acc" min="0.2" max="2" step="0.05" value="0.2">' +
    '    <span class="slider-val" id="sv-acc">0.2</span>' +
    '  </div>' +
    '  <div class="layer">' +
    '    <input type="checkbox" id="cb-labels" checked>' +
    '    <label for="cb-labels">Pocket labels</label>' +
    '  </div>' +
    '  <div id="status">Loading…</div>' +
    '</div>' +
    '<div id="tooltip"></div>';

  // ── NGL ───────────────────────────────────────────────────────────────────
  var stage = new NGL.Stage("viewport", { backgroundColor: "#1a1a2e" });
  // Permanently suppress NGL's built-in tooltip — its internal hovered handler
  // overrides a one-time display:none, so we watch for style changes and revert.
  if (stage.tooltip) {
    stage.tooltip.style.display = "none";
    new MutationObserver(function () {
      stage.tooltip.style.display = "none";
    }).observe(stage.tooltip, { attributes: true, attributeFilter: ["style"] });
  }
  window.addEventListener("resize", function () { stage.handleResize(); });

  Promise.all([
    stage.loadFile("protein.pdb", { defaultRepresentation: false }),
    stage.loadFile("ligand.pdb",  { defaultRepresentation: false }),
    stage.loadFile("pockets.pdb", { defaultRepresentation: false }),
    fetch("pockets.pdb").then(function (r) { return r.text(); })
  ]).then(function (results) {
    var protein = results[0];
    var ligand  = results[1];
    var pockets = results[2];
    var pdbText = results[3];

    // Parse SegID (cols 73-76) from raw PDB — ap.segid is unreliable in NGL 2.3.1
    var hydRankByResno = {};
    pdbText.split("\n").forEach(function (line) {
      if (line.length >= 76 && line.startsWith("HETATM") &&
          line.substring(17, 20).trim() === "HYD") {
        var resno = parseInt(line.substring(22, 26).trim(), 10);
        var segi  = line.substring(72, 76).trim();
        if (segi) hydRankByResno[resno] = segi;
      }
    });

    protein.addRepresentation("cartoon", { color: "chainid" });
    ligand.addRepresentation("ball+stick", { color: "element" });

    var repHyd = pockets.addRepresentation("spacefill", {
      sele: "[HYD]", color: "#f5a623", opacity: 0.55, radiusScale: 0.5
    });
    var repDon = pockets.addRepresentation("spacefill", {
      sele: "[DON]", color: "#4a90e2", opacity: 0.45, radiusScale: 0.2
    });
    var repAcc = pockets.addRepresentation("spacefill", {
      sele: "[ACC]", color: "#e05c5c", opacity: 0.45, radiusScale: 0.2
    });

    var labelText = {};
    pockets.structure.eachAtom(function (ap) {
      if (ap.resname === "HYD") {
        var pocketRank = ap.resno;
        var hydRank    = hydRankByResno[pocketRank] || String(pocketRank);
        var wfp        = ap.occupancy.toFixed(1);
        var bur        = ap.bfactor.toFixed(2);
        labelText[ap.index] = "#" + pocketRank + " (HR:" + hydRank + ")  WFP:" + wfp + "  bur:" + bur;
      }
    });

    var repLabels = pockets.addRepresentation("label", {
      sele: "[HYD]",
      labelType: "text",
      labelText: labelText,
      color: "white",
      fontSize: 1.8,
      fontWeight: "bold",
      showBackground: true,
      backgroundColor: "black",
      backgroundOpacity: 0.55
    });

    stage.autoView();
    document.getElementById("status").textContent = sys.id + " · " + sys.ligand;

    // ── Hover tooltip (HYD / DON / ACC) ──────────────────────────────────
    var tooltip = document.getElementById("tooltip");
    var mouseX = 0, mouseY = 0;
    document.getElementById("viewport").addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    stage.signals.hovered.add(function (pickingProxy) {
      if (!pickingProxy || !pickingProxy.atom) {
        tooltip.style.display = "none";
        return;
      }
      var ap      = pickingProxy.atom;
      var rn      = ap.resname;
      var pocketRank = ap.resno;
      var hydRank    = hydRankByResno[pocketRank] || String(pocketRank);
      var wfp        = ap.occupancy.toFixed(1);
      var text;

      if (rn === "HYD") {
        var bur = ap.bfactor.toFixed(2);
        text = "#" + pocketRank + " (HR:" + hydRank + ")  WFP:" + wfp + "  bur:" + bur;
      } else if (rn === "DON" || rn === "ACC") {
        var r90 = ap.bfactor.toFixed(2);
        text = rn + "  →  pocket #" + pocketRank + " (HR:" + hydRank + ")  WFP:" + wfp + "  R90:" + r90 + "Å";
      } else {
        tooltip.style.display = "none";
        return;
      }

      tooltip.textContent    = text;
      tooltip.style.left     = (mouseX + 14) + "px";
      tooltip.style.top      = (mouseY - 10) + "px";
      tooltip.style.display  = "block";
    });

    function bindComp(id, comp) {
      document.getElementById(id).addEventListener("change", function (e) {
        comp.setVisibility(e.target.checked);
      });
    }
    function bindRep(id, rep) {
      document.getElementById(id).addEventListener("change", function (e) {
        rep.setVisibility(e.target.checked);
      });
    }

    bindComp("cb-protein", protein);
    bindComp("cb-ligand",  ligand);
    bindRep("cb-hyd",      repHyd);
    bindRep("cb-don",      repDon);
    bindRep("cb-acc",      repAcc);
    bindRep("cb-labels",   repLabels);

    function bindSlider(sliderId, valId, rep) {
      var slider = document.getElementById(sliderId);
      var valEl  = document.getElementById(valId);
      slider.addEventListener("input", function () {
        var v = parseFloat(slider.value);
        valEl.textContent = v.toFixed(1);
        rep.setParameters({ radiusScale: v });
      });
    }

    bindSlider("sl-hyd", "sv-hyd", repHyd);
    bindSlider("sl-don", "sv-don", repDon);
    bindSlider("sl-acc", "sv-acc", repAcc);
  }).catch(function (err) {
    document.getElementById("status").textContent = "Error: " + err.message;
    console.error(err);
  });

  }); // DOMContentLoaded
})();
