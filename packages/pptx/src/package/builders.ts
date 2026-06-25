import { element } from "../xml/builders.js";
import { Namespace } from "../xml/Specification.js";
import type { TargetMode } from "./Specification.js";
import type { CT_Default, CT_Override, CT_Relationship, CT_Relationships, CT_Types } from "./Specification.js";

export function defaultType(extension: string, contentType: string): CT_Default {
    return element("Default", [["Extension", extension], ["ContentType", contentType]], []);
}

export function override(partName: string, contentType: string): CT_Override {
    return element("Override", [["PartName", partName], ["ContentType", contentType]], []);
}

export function contentTypes(entries: ReadonlyArray<CT_Default | CT_Override>): CT_Types {
    return element("Types", [["xmlns", Namespace.ct]], entries);
}

export function relationship(id: string, type: string, target: string, mode?: TargetMode): CT_Relationship {
    if (mode === undefined) return element("Relationship", [["Id", id], ["Type", type], ["Target", target]], []);
    return element("Relationship", [["Id", id], ["Type", type], ["Target", target], ["TargetMode", mode]], []);
}

export function relationships(items: ReadonlyArray<CT_Relationship>): CT_Relationships {
    return element("Relationships", [["xmlns", Namespace.rel]], items);
}
