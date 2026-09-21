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
