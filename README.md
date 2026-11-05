# Michal Wochna — IT & Business Systems

Complete source for Michal Wochna’s personal website, with a Commodore-style loading screen and interactive workbench.

Current site: https://michal-wochna.michalwochna.chatgpt.site

## Run locally

This is a static HTML, CSS and JavaScript site. There is no dependency installation or build step.

From this repository’s root, run:

```sh
python3 -m http.server 8000 --directory dist
```

On Windows, if Python is installed through the Python launcher:

```powershell
py -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser. Serve `dist` as the web root so the asset URLs resolve correctly.

## Project structure

- `dist/index.html` — page content, biography, qualifications and contact links.
- `dist/style.css` — responsive layout, workbench styling and screen colours.
- `dist/script.js` — loading sequence, window controls, sound, motion, clock and shell interactions.
- `dist/retro-core.js` — command parser for the interactive shell.
- `dist/assets/` — portrait, locally hosted fonts and their licences.
- `.openai/hosting.json` — original Sites project identity and static hosting configuration.

## Editing

Edit the HTML for page content and links, the CSS for appearance, and the JavaScript for behaviour. The Commodore intro appears once per browser session; the **C64 boot** button replays it. Sound is off by default, and reduced-motion preferences are respected.

## Hosting

Any static host can serve the contents of `dist`. This repository does not include an automatic deployment workflow. The existing Sites website remains separately hosted. Its sign-in and sharing controls belong to Sites and are not implemented by this static code.

## Source provenance

Exported from Sites version 3, source commit `fe60fef3453ff52a815779528dddfb1f36fef0a9`. Website source files and assets are preserved byte for byte; this README was added for the GitHub handover.

Bundled fonts retain the licences included alongside them in `dist/assets`.
