# Shopnot Preview Port Update Spec (48297)

## Goal
Change the Shopnot-inspired local preview URL/port to `http://127.0.0.1:48297/` and keep run/preview commands consistent across scripts and docs.

## Current State (Research)
- `package.json` scripts currently use:
  - `preview:shopnot` -> port `5060`
  - `preview:shopnot:stable` -> port `5060`
  - `preview:shopnot:fallback` -> port `5061`
- Existing Shopnot docs under `docs/SubAgent docs/` reference `5060` and `5061`.

## Exact Files To Edit
1. `package.json`
2. `docs/SubAgent docs/shopnot-bd-tech-sellers-spec.md`
3. `docs/SubAgent docs/shopnot-inspired-site-spec.md`

## Script Updates
Update existing scripts in `package.json`:
- `preview:shopnot`:
  - from: `live-server public/shopnot-inspired --port=5060`
  - to:   `live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser`
- `preview:shopnot:stable`:
  - from: `live-server public/shopnot-inspired --port=5060 --host=127.0.0.1 --no-browser`
  - to:   `live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser`
- `preview:shopnot:fallback`:
  - from: `live-server public/shopnot-inspired --port=5061 --host=127.0.0.1 --no-browser`
  - to:   `live-server public/shopnot-inspired --port=48298 --host=127.0.0.1 --no-browser`

Notes:
- No new script names are required.
- Keep command shape and root path unchanged (`public/shopnot-inspired`).

## Doc Updates
1. `docs/SubAgent docs/shopnot-bd-tech-sellers-spec.md`
- Replace all `127.0.0.1:5060` references with `127.0.0.1:48297`.
- Replace `--port=5060` references with `--port=48297`.
- Replace fallback `--port=5061` references with `--port=48298` where present.
- Keep wording and structure unchanged other than port/URL values.

2. `docs/SubAgent docs/shopnot-inspired-site-spec.md`
- Update the `preview:shopnot` command example to use port `48297` (and host flags if matching current script style).

## Acceptance Checks
1. Startup check
- Run: `npm run preview:shopnot:stable`
- Expected: command starts successfully with no immediate error/exit.

2. HTTP 200 check
- Probe: `http://127.0.0.1:48297/`
- Expected: response status is `200`.

Recommended PowerShell check:
- `try { (Invoke-WebRequest -Uri http://127.0.0.1:48297/ -UseBasicParsing -TimeoutSec 10).StatusCode } catch { Write-Output $_.Exception.Message; exit 1 }`

## Out of Scope
- Any UI/content/data changes in `public/shopnot-inspired/*`.
- Any dependency changes beyond existing `live-server` usage.
