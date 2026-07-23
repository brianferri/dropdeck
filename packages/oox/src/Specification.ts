/* eslint-disable @typescript-eslint/naming-convention -- CT_* mirror the OPC schema names; OPC attributes are TitleCase by spec. */

import type { Attr, AttrSeq, Element, Empty, Many, OptAttr } from "@dropdeck/xml";
import type { ST_String } from "./primitives.js";

export enum TargetMode {
    Internal = "Internal",
    External = "External"
}

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

/* eslint-enable @typescript-eslint/naming-convention */
