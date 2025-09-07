Local deployment helpers (ignored by git).

This folder contains private scripts and notes for building and deploying the app to shared hosting via FTP. The `local/` directory is ignored by git.

Requirements
- Python 3.8+
- Node.js (npm/npx) for building/exporting the Next.js app

Configuration
- Prefer placing a private `.env` here in `local/.env` (ignored by git), or use `.env` at the repo root. Provide:
  - `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_REMOTE_DIR`
  - Optional: `LOCAL_DIR` (defaults to `local/out`)

Recommended flow
1) One-step build, export, and deploy

```
python3 local/build_export_deploy.py
```

2) Or deploy an already-exported folder

```
python3 local/deploy_ftp.py
```

Notes
- Static export: configured via `output: 'export'` in `app/next.config.mjs`.
- Manual build (if needed): `cd app && npm ci && npm run build`
  - Then copy `app/out` into `local/out` (the scripts handle this automatically).
- To run on a shared host as a Node app (not necessary for static hosting), set the Start file to `server.js` and run `npm start` in this `local/` folder. The server reads files from `local/out` by default.

Deployment note
- The build script copies `local/server.js` (and `local/package.json` if present) into `local/out/` so shared hosting panels that start from the deploy root can run `server.js` directly inside the uploaded folder.
- The deploy script uploads `local/out` by default and refuses to deploy from inside `./app` unless `--allow-app-dir` is passed.
- Use `--secure` to enable FTPS/TLS and `--dry-run` to preview actions.
- Add a `.ftpignore` inside the local deploy folder to refine excludes.
