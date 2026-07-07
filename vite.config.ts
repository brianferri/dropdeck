import { defineConfig } from "vitest/config";
import { createServer } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

const PRESENT_ID = "virtual:present-runtime";

// The exported deck ships its own tiny presenter, a separate entry bundled to an IIFE string the HTML exporter
// inlines.
function presentRuntime(): Plugin {
    return {
        name: "dropdeck-present-runtime",
        resolveId(source): string | null {
            return source === PRESENT_ID ? `\0${PRESENT_ID}` : null;
        },
        async load(id): Promise<string | null> {
            if (id !== `\0${PRESENT_ID}`) return null;
            const result = await build({
                entryPoints: [fileURLToPath(new URL("./src/export/html/present.ts", import.meta.url))],
                bundle: true,
                format: "iife",
                minify: true,
                write: false,
                platform: "browser",
                tsconfig: fileURLToPath(new URL("./tsconfig.json", import.meta.url))
            });
            if (result.outputFiles.length === 0) throw new Error("dropdeck: esbuild produced no output for the present runtime");
            return `export default ${JSON.stringify(result.outputFiles[0].text)};`;
        }
    };
}

const SOURCE = fileURLToPath(new URL("./src", import.meta.url));
const INDEX = fileURLToPath(new URL("./index.html", import.meta.url));

// The page has no on-disk file; it is rendered through Vite's SSR pipeline so `#/` aliases and virtual modules
// resolve exactly as the app's do. The build has no dev server, so it spins up a throwaway middleware server to
// do the SSR load.
function pageHtml(): Plugin {
    let standalone: Promise<ViteDevServer> | undefined;
    async function render(loader: ViteDevServer): Promise<string> {
        const page = await loader.ssrLoadModule("/src/index.ts") as { renderPage: () => string };
        return page.renderPage();
    }
    return {
        name: "dropdeck-page-html",
        configureServer(server): void {
            server.middlewares.use((request, response, next) => {
                const [path] = (request.url ?? "/").split("?");
                if (path !== "/" && path !== "/index.html") {
                    next();
                    return;
                }
                render(server)
                    .then(async (raw) => {
                        response.end(await server.transformIndexHtml(path, raw));
                    })
                    .catch(next);
            });
        },
        resolveId(source): string | null {
            return source === INDEX ? INDEX : null;
        },
        async load(id): Promise<string | null> {
            if (id !== INDEX) return null;
            standalone ??= createServer({
                configFile: false,
                appType: "custom",
                logLevel: "warn",
                server: { middlewareMode: true },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                resolve: { alias: { "#": SOURCE } }
            });
            return render(await standalone);
        },
        async closeBundle(): Promise<void> {
            const pending = standalone;
            standalone = undefined;
            await (await pending)?.close();
        }
    };
}

export default defineConfig({
    base: "./",
    plugins: [presentRuntime(), pageHtml(), viteSingleFile()],
    build: { rollupOptions: { input: INDEX } },
    resolve: {
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "#": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        // Rendering a deck in happy-dom would otherwise fetch its Google Fonts <link>; the tests never assert on
        // fonts, so block external resource loads to keep them offline and their output quiet.
        environmentOptions: {
            happyDOM: {
                settings: {
                    disableCSSFileLoading: true,
                    disableJavaScriptFileLoading: true,
                    handleDisabledFileLoadingAsSuccess: true
                }
            }
        },
        coverage: {
            provider: "v8",
            include: ["src/**"],
            // Declarative CSS-builder tables are data, not logic -- testing them would only restate the CSS.
            exclude: ["src/styles/**"]
        }
    }
});
