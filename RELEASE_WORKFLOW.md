# 🚀 MineServe Release Workflow

This document explains exactly how to deploy a new version of MineServe so that the auto-updater works correctly for all users.

## 📦 1. Pre-Deployment Checklist
Before building, ensure you have:
- Tested your changes in `npm run dev`.
- **Bumped the version number** in `package.json` (e.g., `1.0.2` -> `1.0.3`).
  - *Note: Antigravity (AI) usually does this for you upon request.*

## 🛠️ 2. Build the Application
Run the build command to generate the release artifacts:

```bash
npm run build
```

This will create a `release/` folder containing:
- `MineServe-Setup-X.Y.Z.exe` (The installer)
- `latest.yml` (The update configuration file)

## ☁️ 3. Push to GitHub
Commit your code changes and the new version number:

```bash
git add .
git commit -m "Bump version to X.Y.Z"
git push origin main
```

## 🏷️ 4. Create GitHub Release (CRITICAL)
This is the most important step for the auto-updater.

1.  Go to: **[https://github.com/MikAmaral123/MineServe/releases/new](https://github.com/MikAmaral123/MineServe/releases/new)**
2.  **Tag version:** Create a new tag matching your `package.json` version (e.g., `v1.0.3`).
3.  **Release Title:** `MineServe v1.0.3` (or similar).
4.  **Describe this release:** Write your changelog here. You can use Markdown! 
    - *Tip: Use emojis and bullet points. The app will display this nicely.*
5.  **Attach binaries:** Drag & drop the following files from your `release/` folder:
    - `MineServe-Setup-X.Y.Z.exe`
    - `latest.yml`
    - *⚠️ IMPORTANT: Ensure `latest.yml` is the one just generated. It contains the SHA512 hash of the EXE via `electron-builder`.*
6.  Click **Publish release**.

## ✅ 5. Verification
- Open an installed version of MineServe (previous version).
- Go to the **Updates** tab.
- It should fail to check (if in dev mode) or successfully detect the new version (if installed as production).
- The release notes should appear formatted in the app.

---
**Troubleshooting:**
- **Infinite Loading?** Check if `latest.yml` is present in the release assets.
- **Error 404?** Ensure the filename in `latest.yml` matches the uploaded EXE filename (no spaces!).
