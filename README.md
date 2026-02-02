# IM-DOE Planner

Local, offline-friendly DOE planner for injection molding. Built with Node.js + Express + SQLite + EJS + PureCSS.

## Install + Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Core Flows
1) Import recipes from a CSV/TSV matrix.
2) Create an experiment (BBD/FFA/SCREEN/SIM).
3) Configure factors and defaults.
4) Generate a runlist.
5) Enter run data and defect tags.
6) Review analysis (charts + heatmap + 3D when possible).
7) Export runs (wide or long CSV).

## Qualification (Scientific Molding)
The qualification flow includes 6 steps based on scientific molding methodology:
1) Rheology / Viscosity curve
2) Cavity balance
3) Pressure drop
4) Cosmetic process window
5) Gate seal study
6) Cooling time optimization

Reference book (Amazon search):
- Robust Process Development and Scientific Molding (Suhas Kulkarni): https://a.co/d/aDv52KL

## Report Plan (Next Work)
The current report plan lives at `report_plan` in the project root. That file is the source of truth
for the upcoming HTML/PDF/CSV report work and should be reviewed first before coding.

## Recent Changes (for handoff)
- Machine library now supports parameter tokens in the format `%machineId:paramId%`.
  These tokens can be used inside qualification setup inputs and custom fields.
- UI shows live previews for tokenized values; inputs keep the token, summaries display the resolved value.
- Step calculations resolve tokens at runtime (server + client), so values survive reloads.
- Machine edit page shows a small read-only token field next to each parameter for quick copy.

## Supported Recipe Import Formats
The importer accepts two common formats:

### 1) Matrix format
```
Component,Recipe A,Recipe B
Resin 1,50,60
Resin 2,50,40
Additive,3,2
```
- Column 0: component name
- Other columns: recipe name with PHR values

### 2) Two-row header (BPACKs style)
```
,Recipe A,,Recipe B,
,phr,,phr,
Resin 1,50,,60,
Resin 2,50,,40,
Additive,3,,2,
```
- Row 1 contains recipe names
- Row 2 contains `phr` under recipe columns
- Subsequent rows are components

## Notes
- The SQLite database is `im_doe.sqlite` in this folder.
- Custom input/output fields are stored in the flexible `param_definitions` and `run_values` tables.
- SCREEN design is a sampled factorial (labeled in-app). For higher rigor, add a dedicated generator.

## Scripts
- `npm run dev` - start with hot reload
- `npm run build` - compile to `dist/`
- `npm run start` - run compiled output
