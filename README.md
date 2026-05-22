# TimeFlow — Chromebook Edition

Web and PWA build of TimeFlow for **Chrome OS / Chromebook**, parallel to `timeflow-desktop-app` (Electron for Windows/macOS).

## What changed from the desktop app

| Desktop (Electron) | Chromebook (this folder) |
|--------------------|---------------------------|
| Electron + native idle time | Browser activity + tab visibility |
| `screenshot-desktop` / PowerShell | `getDisplayMedia()` screen share |
| Separate overlay window | In-app overlay modal |
| `tracker://` OAuth + localhost callback | Browser popup + `/oauth-callback.html` |
| NSIS/DMG installers | Install as PWA from Chrome |

Core tracking logic (Supabase, projects/tasks, timer, camera, face check, uploads) is shared via `renderer.js`.

## Requirements

- Node.js 18+
- Chrome or Chromium on Chromebook (latest stable)
- Camera and screen-share permissions when prompted
- Network access to Supabase and `timeflow.mechlintech.com` for SSO

## Development

```bash
cd timeflow-desktop-app-chromebook
npm install
npm run dev
```

Open http://localhost:5173 in Chrome.

## Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any HTTPS host (required for camera, screen capture, and PWA install).

## GitHub Pages

This repo includes a workflow that builds and deploys to GitHub Pages on every push to `main`.

**Live URL (after deploy):** https://akshat-mechlin.github.io/timeflow-desktop-app-chromebook/

### One-time setup on GitHub

1. Create a repository named `timeflow-desktop-app-chromebook` (or push this folder to your repo).
2. Push the `main` branch.
3. In the repo: **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
4. After the workflow runs, the site is live at `https://<username>.github.io/<repo>/`.

### SSO redirect URL

Add this to your Azure / Supabase allowed redirect URLs:

`https://akshat-mechlin.github.io/timeflow-desktop-app-chromebook/oauth-callback.html`

## Install on Chromebook

1. Deploy the built app to HTTPS (or use `npm run preview` on a trusted URL).
2. In Chrome: **⋮ → Install TimeFlow** (or “Add to shelf”).
3. Launch from the app shelf like a native app.

## SSO on Chromebook

Azure SSO opens in a popup. After login, `oauth-callback.html` sends tokens back to the main app. Ensure your SSO redirect allowlist includes:

- `https://<your-host>/oauth-callback.html`

## Permissions (Chrome OS)

- **Camera**: Chrome Settings → Privacy → Site settings → Camera → allow for your TimeFlow URL.
- **Screen**: When you start tracking, pick **Entire screen** or your display in Chrome’s share dialog and confirm.

## Project layout

- `lib/` — Browser shims (`electron`, `screenshot-desktop`, `sharp`, `fs`, etc.)
- `src/main.js` — Vite entry (polyfills + loads `renderer.js`)
- `renderer.js` — Shared app logic (ES modules for Chromebook)
- `oauth-callback.html` — SSO return page
- `manifest.webmanifest` — PWA manifest

## Notes

- System-wide idle time (while using other apps) is limited on the web; activity is detected in the TimeFlow tab and via visibility events.
- Keep the TimeFlow window/tab open while tracking for reliable captures.
- Electron-only files (`main.js`, Windows build scripts) are kept for reference but are not used in this build.
