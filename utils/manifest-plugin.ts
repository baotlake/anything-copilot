import { resolve } from "path";
import type { PluginOption } from "vite";

export default function makeManifest(
  manifest: any,
  config: {
    isDev: boolean;
    assetKeys?: string[];
  }
): PluginOption {
  return {
    name: "manifest-plugin",
    generateBundle(output, bundle) {
      if (config.assetKeys) {
        for (let key of config.assetKeys) {
          const id = resolve(manifest[key]).replace(/\\/g, "/");
          const chunk = Object.values(bundle).find(
            (b) => b.type === "chunk" && b.facadeModuleId == id
          );
          if (chunk) {
            manifest[key] = chunk.fileName;
          }
        }
      }

      const content = JSON.stringify(manifest, null, 2);
      try {
        this.emitFile({
          type: "asset",
          source: content,
          fileName: "manifest.json",
        });
      } catch (e) {
        console.error("manifest-plugin error: ", e);
        console.error("Failed to emit asset file, possibly a naming conflict");
      }
    },
    // buildStart() {
    //   const content = JSON.stringify(manifest, null, 2);
    //   try {
    //     this.emitFile({
    //       type: "asset",
    //       source: content,
    //       fileName: "manifest.json",
    //     });
    //   } catch (e) {
    //     console.error("manifest-plugin error: ", e);
    //     console.error("Failed to emit asset file, possibly a naming conflict");
    //   }
    // },
  };
}
