# AI Assistant Context & Repository Knowledge

This file provides future AI sessions (Antigravity, Claude, Copilot, etc.) with critical context regarding this customized OpenLens codebase.

## Key Facts & Decisions
1. **Branch**: `master` (full monorepo with 49 packages managed by Lerna/Nx).
2. **Node Version**: Strict requirement for Node 16 (`nvm use 16.20.2`). Do not upgrade Node in this repo.
3. **Python**: Python 3.11 with `distutils` is required by `node-gyp`.
4. **Drive Letter Rule**: Always use uppercase `C:` (not lowercase `c:`) when executing Node or Electron commands to avoid splitting module instances in Node's module cache.
5. **Bundled Extensions**:
   - Upstream OpenLens 6 stripped Pod Logs and Shell buttons.
   - We restored them by creating `packages/openlens-node-pod-menu/` and registering it in `open-lens/src/common/node-pod-menu-bundled-extension.injectable.ts` via `bundledExtensionInjectionToken`.
   - Any new extension can be permanently bundled the exact same way.
6. **Binaries**:
   - `kubectl.exe` (v1.32.2), `helm.exe` (v3.17.1), and `lens-k8s-proxy.exe` (v0.4.0) are downloaded via `@k8slens/ensure-binaries` from `dl.k8s.io`, `get.helm.sh`, and GitHub Releases into `open-lens/binaries/client/windows/x64/` and `node_modules/electron/dist/resources/x64/`.
7. **Packaging**:
   - `open-lens/package.json` uses `electron-builder`.
   - Run `npx.cmd electron-builder --win --x64 --publish never` from `open-lens/` to build the NSIS installer.
