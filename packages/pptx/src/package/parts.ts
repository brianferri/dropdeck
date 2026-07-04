import { xml } from "../oox.js";
import { contentTypes, defaultType, override } from "./builders.js";
import { ContentType } from "./constants.js";
import { buildZip } from "./zip.js";
import type { Node } from "../oox.js";
import type { CT_Default, CT_Override, CT_Types } from "./Specification.js";
import type { ZipEntry } from "./zip.js";

const PROLOG = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\r\n";

const PACKAGE_DEFAULTS = [
    defaultType("rels", ContentType.Relationships),
    defaultType("xml", ContentType.Xml)
] satisfies ReadonlyArray<CT_Default>;

export enum PartKind {
    Xml,
    Bytes
}

export type Part =
    | { kind: PartKind.Xml, path: string, contentType: string, root: Node }
    | { kind: PartKind.Bytes, path: string, contentType: string, data: Uint8Array };

export function xmlPart(path: string, contentType: string, root: Node): Part {
    return { kind: PartKind.Xml, path, contentType, root };
}

export function bytesPart(path: string, contentType: string, data: Uint8Array): Part {
    return { kind: PartKind.Bytes, path, contentType, data };
}

export function document(root: Node): string {
    return PROLOG + xml(root);
}

export async function pack(parts: ReadonlyArray<Part>): Promise<Uint8Array> {
    const entries: Array<ZipEntry> = [ { path: "[Content_Types].xml", bytes: encode(document(contentTypesFor(parts))) } ];
    for (const part of parts) {
        if (part.kind === PartKind.Xml) entries.push({ path: part.path, bytes: encode(document(part.root)) });
        else entries.push({ path: part.path, bytes: part.data });
    }
    return buildZip(entries);
}

function contentTypesFor(parts: ReadonlyArray<Part>): CT_Types {
    const mediaByExtension = new Map<string, string>();
    const overrides: Array<CT_Override> = [];
    for (const part of parts) {
        if (part.kind === PartKind.Bytes) mediaByExtension.set(extensionOf(part.path), part.contentType);
        // Relationship parts are covered by the package "rels" default, so they need no per-part override.
        else if (extensionOf(part.path) !== "rels") overrides.push(override(`/${part.path}`, part.contentType));
    }
    const mediaDefaults = Array.from(mediaByExtension, ([extension, contentType]) => defaultType(extension, contentType));
    return contentTypes([PACKAGE_DEFAULTS, mediaDefaults, overrides].flat());
}

function extensionOf(path: string): string {
    const dot = path.lastIndexOf(".");
    return dot < 0 ? "" : path.slice(dot + 1).toLowerCase();
}

function encode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}
