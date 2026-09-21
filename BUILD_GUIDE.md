# OpenLens Windows Build & Architecture Reference

This document preserves the exact environment setup, native compilation patches, architectural decisions, and runtime bug fixes discovered while building OpenLens on Windows with embedded extensions.

---

## 1. Environment Prerequisites

- **Node.js**: `16.20.2` (Strictly `>=16 <17`. Managed via `nvm use 16.20.2`).
- **npm**: `9.6.7`.
- **Python**: `3.11` (Do **not** use Python 3.12+ because `node-gyp` v8 requires `distutils`, which was removed in Python 3.12).
  - Python path: `C:\Users\al\AppData\Roaming\uv\python\cpython-3.11-windows-x86_64-none\python.exe`
- **Visual Studio Build Tools**: VS Community 2026 / Build Tools with toolset `v145` and Windows SDK `10.0.26100.0`.
  - **Patch applied:** `node-gyp/lib/find-visualstudio.js` patched to recognize VS 2026 (v18.x) and MSBuild Current.

---

## 2. Critical Windows-Specific Runtime Pitfalls

### A. The Drive-Letter Case-Sensitivity Bug in Node.js
* **Symptoms**:
  ```
  Error: Tried to inject non-registered injectable "main" -> ... -> "prometheus-providers" -> "computed-inject-many"
  ```
* **Root Cause**: Node.js on Windows treats `c:/...` and `C:/...` as separate module cache keys. The entry point in `open-lens/` loads `@ogre-tools/injectable-extension-for-mobx` under lowercase `c:`, while `@k8slens/core` loads it under uppercase `C:`. Because `@ogre-tools/injectable` relies on object identity for injectables, the container registers one instance and looks up the other.
* **Rule**: **Always use uppercase `C:` drive letter** in scripts, paths, and commands (see `run-open-lens.bat`).

### B. Client Binaries Location in Unpacked Dev
* When running unpacked Electron, `process.resourcesPath` resolves to `node_modules/electron/dist/resources`.
* The client binaries must be present at:
  ```
  node_modules/electron/dist/resources/x64/
    ├── helm.exe
    ├── kubectl.exe
    └── lens-k8s-proxy.exe
  ```
* In packaged production builds, `electron-builder` copies them automatically from `open-lens/binaries/client/windows/x64/` into `dist/win-unpacked/resources/x64/`.

---

## 3. Bundling the Node & Pod Menu Extension

In Lens 6.x, Mirantis removed Pod Logs, Pod Shell, and Node Shell buttons from the open-source core.

To restore them permanently for all users without manual extension installation:
1. **Package Added:**
   `packages/openlens-node-pod-menu/` contains the `@alebcay/openlens-node-pod-menu` extension.
2. **OpenLens Dependency:**
   Added `"@alebcay/openlens-node-pod-menu": "^0.1.2"` to `open-lens/package.json`.
3. **Bundled Extension Injectable:**
   [`open-lens/src/common/node-pod-menu-bundled-extension.injectable.ts`](file:///C:/Users/al/projects/lens/open-lens/src/common/node-pod-menu-bundled-extension.injectable.ts):
   ```ts
   import { bundledExtensionInjectionToken } from "@k8slens/legacy-extensions";
   import { getInjectable } from "@ogre-tools/injectable";
   import nodePodMenuManifest from "@alebcay/openlens-node-pod-menu/package.json";

   const nodePodMenuBundledExtensionInjectable = getInjectable({
     id: "node-pod-menu-bundled-extension",
     instantiate: () => ({
       manifest: nodePodMenuManifest,
       main: () => null,
       renderer: () => require("@alebcay/openlens-node-pod-menu/dist/renderer").default,
     }),
     injectionToken: bundledExtensionInjectionToken,
   });

   export default nodePodMenuBundledExtensionInjectable;
   ```
   This registers the extension under `bundledExtensionInjectionToken`, making it automatically enabled on every startup.

---

## 4. Key Build & Packaging Commands

### Run in Development:
```cmd
C:\Users\al\projects\lens\run-open-lens.bat
```

### Recompile Webpack Bundles:
```cmd
npm.cmd --workspace open-lens run build
```

### Build Windows Installer & Unpacked Binaries:
```cmd
cd C:\Users\al\projects\lens\open-lens
npx.cmd electron-builder --win --x64 --publish never
```

### Outputs:
- **Installer:** `open-lens/dist/OpenLens Setup 6.5.0.exe`
- **Standalone App:** `open-lens/dist/win-unpacked/OpenLens.exe`

---

## 5. Automated CI/CD Build Harness

The repository includes [`.github/workflows/build.yml`](.github/workflows/build.yml):
- **Triggers on change:** Automatically builds on every push to any branch or pull request.
- **Concurrency control:** Cancels in-flight runs when a new push occurs (`cancel-in-progress: true`).
- **Single history record:** Prunes previous workflow runs using `Mattraks/delete-workflow-runs@v2` (`keep_minimum_runs: 1, retain_days: 0`) to maintain a clean single record in GitHub Actions history.
- **Artifact upload & GitHub Release:** Uploads `OpenLens Setup 6.5.0.exe` as an artifact, and automatically publishes/updates a **GitHub Release** (with the `.exe` installer attached) whenever pushed to `master`/`main` or a version tag (`v*`).
