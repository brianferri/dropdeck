import { NodeKind } from "./Specification.js";
import type { Attr, DomNode } from "./Specification.js";

// `style` is dropped too: a stylesheet can exfiltrate via `url(...)`.
const FORBIDDEN_TAGS = new Set<string>([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "base",
    "meta",
    "link",
    "form",
    "noscript"
]);

const URL_ATTRS = new Set<string>(["href", "src", "poster", "action", "formaction", "xlink:href"]);

// Browsers ignore leading control characters and whitespace when matching a URL scheme, so strip them before the
// scheme test rather than trusting the raw prefix.
function schemeOf(value: string): string {
    let out = "";
    for (const character of value) if (character.charCodeAt(0) > 0x20) out += character;
    return out.toLowerCase();
}

function dangerousUrl(value: string): boolean {
    const scheme = schemeOf(value);
    if (scheme.startsWith("javascript:")) return true;
    if (scheme.startsWith("vbscript:")) return true;
    return scheme.startsWith("data:text/html");
}

function safeAttr(attr: Attr): boolean {
    const name = attr[0].toLowerCase();
    if (name.startsWith("on")) return false;
    if (name === "srcdoc") return false;
    if (URL_ATTRS.has(name)) return !dangerousUrl(attr[1]);
    return true;
}

function sanitizeNode(node: DomNode): DomNode | null {
    if (node.kind === NodeKind.Text) return node;
    if (FORBIDDEN_TAGS.has(node.tag.toLowerCase())) return null;
    return { kind: NodeKind.Element, tag: node.tag, attrs: node.attrs.filter(safeAttr), children: sanitize(node.children) };
}

export function sanitize(nodes: ReadonlyArray<DomNode>): Array<DomNode> {
    const safe: Array<DomNode> = [];
    for (const node of nodes) {
        const clean = sanitizeNode(node);
        if (clean) safe.push(clean);
    }
    return safe;
}
