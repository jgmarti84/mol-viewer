# Pocket Viewer — GitHub Pages

Interactive 3D molecular viewer for binding pocket pipeline results.
Built with NGL Viewer 2.3.1. Hosted on GitHub Pages.

## What this repo is
A static site linked from Google Slides presentations. Each system has a
folder under `viewer/<SYSTEM>/` containing protein.pdb, ligand.pdb,
pockets.pdb, and index.html. The landing page is `viewer/index.html`.

## pockets.pdb field schema (from assemble_pockets.py)
| PDB field  | NGL property   | Content                                          |
|------------|----------------|--------------------------------------------------|
| ResName    | `ap.resname`   | HYD=hydrophobic anchor, DON=donor, ACC=acceptor  |
| ResSeq     | `ap.resno`     | pocket_rank (scorer rank; ≠ hydrophobic_rank when scorer was used) |
| SegID      | `ap.segid`     | hydrophobic_rank (Phase-1 rank, always present)  |
| Occupancy  | `ap.occupancy` | mean_WFP score (capped at 99.99 by PDB format)   |
| B-factor   | `ap.bfactor`   | buriedness 0–1 (HYD) or mean_R90_A in Å (DON/ACC) |

The pockets in this repo were generated **with the scorer** (`--weights`),
so pocket_rank ≠ hydrophobic_rank — both fields in labels are meaningful.

## NGL viewer key decisions
- Labels use `labelType: "text"` with a `labelText: {atomIndex: string}` map
  built by iterating `pockets.structure.eachAtom()` before addRepresentation.
- Label format: `#pocket_rank (HR:hydrophobic_rank)  WFP:xx  bur:xx`
- Residue selection syntax: `sele: "[HYD]"` (square brackets around resname)
- Colors: HYD=#f5a623 (orange), DON=#4a90e2 (blue), ACC=#e05c5c (red)
- Radius sliders call `rep.setParameters({ radiusScale: v })` for live update
- `stage.autoView()` must be inside the `.then()` of the Promise.all, not outside
- ngl.js (~3.5 MB) is self-hosted in the repo root to avoid unpkg latency

## Systems
Add new systems by adding an entry to the `systems` array in `viewer/index.html`.
Each entry: `{ id, name, ligand, pockets, path }`.
If `path` is omitted the card renders as "coming soon".

## Source pipeline
The pipeline lives in a separate repo. Key scripts:
- Phase 1: blind_sites.py (hydrophobic site detection)
- Phase 2: polar_neighborhood.py (donor/acceptor around each hydrophobic site)
- Phase 3: assemble_pockets.py (assembles pockets.pdb + pockets.csv)
- Optional scorer: --weights pocket_weights_default.json re-ranks pockets
