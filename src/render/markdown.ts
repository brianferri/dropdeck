// A non-void tag written self-closing (`<video ... />`) would otherwise swallow the rest of the slide.
const VOID_TAGS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);

export function esc(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function fixHtml(source: string): string {
    let html = source;
    html = html.replace(/(\s):([A-Za-z][\w-]*)\s*=\s*"'([^"']*)'"/g, "$1$2=\"$3\"");
    html = html.replace(/(\s):([A-Za-z][\w-]*)\s*=\s*"([^"]*)"/g, "$1$2=\"$3\"");
    html = html.replace(/\sv-[a-z][\w-]*(="[^"]*")?/g, "");
    html = html.replace(/\sautoplay(=("[^"]*"|'[^']*'))?/gi, "");
    html = html.replace(
        /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)\/>/g,
        (match, tag: string, attrs: string) => (VOID_TAGS.has(tag.toLowerCase()) ? match : `<${tag}${attrs}></${tag}>`)
    );
    return html;
}

/** Turn fenced code blocks into `<pre>` so they survive inside raw HTML blocks. */
export function convertFences(source: string): string {
    return source.replace(
        /```([\w-]*)[ \t]*\n([\s\S]*?)```/g,
        (_match, _lang: string, code: string) => `<pre class="code-block"><code>${esc(code.replace(/\n$/, ""))}</code></pre>`
    );
}
