import { decodeEntities } from "./Entities.js";
import { cursor } from "./scan/Cursor.js";
import { NodeKind, ESCAPABLE_RAW_TEXT_TAGS, RAW_TEXT_TAGS, VOID_TAGS } from "./Specification.js";
import { TokenKind, nextToken, readRawText } from "./Tokenizer.js";
import type { Parse } from "./Parse.js";
import type { Cursor } from "./scan/Cursor.js";
import type { AttrList, Content } from "./Specification.js";
import type { Token } from "./Tokenizer.js";

const VOID = new Set<string>(VOID_TAGS);
const RAW_TEXT = new Set<string>(RAW_TEXT_TAGS);
const ESCAPABLE_RAW_TEXT = new Set<string>(ESCAPABLE_RAW_TEXT_TAGS);

// The public `DomNode`/`Content` types are a read-only structural widening of these, so the finished `root`
// returns as `Content` with no cast.
type BuildText = { kind: NodeKind.Text, value: string };
type BuildElement = { kind: NodeKind.Element, tag: string, attrs: AttrList, children: Array<BuildNode> };
type BuildNode = BuildElement | BuildText;

function siblings(root: Array<BuildNode>, open: ReadonlyArray<BuildElement>): Array<BuildNode> {
    const last = open.at(-1);
    return last === undefined ? root : last.children;
}

function appendText(into: Array<BuildNode>, value: string): void {
    if (value.length === 0) return;
    const last = into.at(-1);
    if (last?.kind === NodeKind.Text) last.value += value;
    else into.push({ kind: NodeKind.Text, value });
}

function closeElement(open: Array<BuildElement>, tag: string): void {
    for (let index = open.length - 1; index >= 0; index -= 1) {
        if (open[index].tag === tag) {
            open.length = index;
            return;
        }
    }
}

function openTag(c: Cursor, root: Array<BuildNode>, open: Array<BuildElement>, name: string, attrs: AttrList, selfClosing: boolean): void {
    const element: BuildElement = { kind: NodeKind.Element, tag: name, attrs, children: [] };
    siblings(root, open).push(element);
    if (RAW_TEXT.has(name) && !selfClosing) {
        const raw = readRawText(c, name);
        appendText(element.children, ESCAPABLE_RAW_TEXT.has(name) ? decodeEntities(raw) : raw);
        return;
    }
    if (!selfClosing && !VOID.has(name)) open.push(element);
}

function build(source: string): Content {
    const c = cursor(source);
    const root: Array<BuildNode> = [];
    const open: Array<BuildElement> = [];
    let token: Token = nextToken(c);
    while (token.kind !== TokenKind.Eof) {
        if (token.kind === TokenKind.Text) appendText(siblings(root, open), token.value);
        else if (token.kind === TokenKind.EndTag) closeElement(open, token.name);
        else if (token.kind === TokenKind.StartTag) openTag(c, root, open, token.name, token.attrs, token.selfClosing);
        token = nextToken(c);
    }
    return root;
}

// The cast is sound because `build` produces the tree `Parse<S>` models by construction.
export function parse<const S extends string>(source: S): Parse<S> {
    return build(source) as Parse<S>;
}
