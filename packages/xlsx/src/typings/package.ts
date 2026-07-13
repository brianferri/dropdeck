/* eslint-disable @typescript-eslint/naming-convention -- CT_* mirror the OPC schema names; OPC attributes are TitleCase by spec. */

import type { Attr, AttrSeq, Element, Empty, Many, Node, OptAttr, ST_String } from "../oox.js";
import type { PartKind } from "../package/parts.js";

export type CT_Default = Element<
    "Default",
    readonly [Attr<"Extension", ST_String>, Attr<"ContentType", ST_String>],
    Empty
>;

export type CT_Override = Element<
    "Override",
    readonly [Attr<"PartName", ST_String>, Attr<"ContentType", ST_String>],
    Empty
>;

export type CT_Types = Element<
    "Types",
    readonly [Attr<"xmlns", ST_String>],
    Many<CT_Default | CT_Override>
>;

export type CT_Relationship = Element<
    "Relationship",
    AttrSeq<readonly [Attr<"Id", ST_String>, Attr<"Type", ST_String>, Attr<"Target", ST_String>], OptAttr<"TargetMode", ST_String>>,
    Empty
>;

export type CT_Relationships = Element<
    "Relationships",
    readonly [Attr<"xmlns", ST_String>],
    Many<CT_Relationship>
>;

export type Part =
    | { kind: PartKind.Xml, path: string, contentType: string, root: Node }
    | { kind: PartKind.Bytes, path: string, contentType: string, data: Uint8Array };

export type ZipEntry = { path: string, bytes: Uint8Array };

/* eslint-enable @typescript-eslint/naming-convention */
