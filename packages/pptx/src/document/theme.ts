// Each format-scheme style list requires at least three entries, hence the triple() repetition.

import { Namespace, element } from "../oox.js";
import { srgbClr } from "../drawingml/builders.js";
import type { Element } from "../oox.js";
import type { CT_SRgbColor } from "../typings/drawingml.js";

const ACCENTS = ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"] as const;

function colorSlot<const N extends string>(name: N, color: CT_SRgbColor): Element<`a:${N}`> {
    return element(`a:${name}`, [], [color]);
}

function systemSlot<const N extends string>(name: N, value: string, lastColor: string): Element<`a:${N}`> {
    return element(`a:${name}`, [], [element("a:sysClr", [["val", value], ["lastClr", lastColor]], [])]);
}

function colorScheme(): Element<"a:clrScheme"> {
    const accents = ACCENTS.map((hex, index) => colorSlot(`accent${index + 1}`, srgbClr(hex)));
    const slots = [
        systemSlot("dk1", "windowText", "000000"),
        systemSlot("lt1", "window", "FFFFFF"),
        colorSlot("dk2", srgbClr("44546A")),
        colorSlot("lt2", srgbClr("E7E6E6")),
        accents,
        colorSlot("hlink", srgbClr("0563C1")),
        colorSlot("folHlink", srgbClr("954F72"))
    ].flat();
    return element("a:clrScheme", [["name", "Office"]], slots);
}

function font(latin: string): Element<"a:latin"> {
    return element("a:latin", [["typeface", latin]], []);
}

function fontScheme(): Element<"a:fontScheme"> {
    const major = element("a:majorFont", [], [font("Calibri Light"), element("a:ea", [["typeface", ""]], []), element("a:cs", [["typeface", ""]], [])]);
    const minor = element("a:minorFont", [], [font("Calibri"), element("a:ea", [["typeface", ""]], []), element("a:cs", [["typeface", ""]], [])]);
    return element("a:fontScheme", [["name", "Office"]], [major, minor]);
}

function triple<const E extends Element>(make: () => E): readonly [E, E, E] {
    return [make(), make(), make()];
}

function phColorFill(): Element<"a:solidFill"> {
    return element("a:solidFill", [], [element("a:schemeClr", [["val", "phClr"]], [])]);
}

function lineStyle(): Element<"a:ln"> {
    return element("a:ln", [["w", 6350]], [phColorFill()]);
}

function effectStyle(): Element<"a:effectStyle"> {
    return element("a:effectStyle", [], [element("a:effectLst", [], [])]);
}

function formatScheme(): Element<"a:fmtScheme"> {
    return element("a:fmtScheme", [["name", "Office"]], [
        element("a:fillStyleLst", [], triple(phColorFill)),
        element("a:lnStyleLst", [], triple(lineStyle)),
        element("a:effectStyleLst", [], triple(effectStyle)),
        element("a:bgFillStyleLst", [], triple(phColorFill))
    ]);
}

export function theme(): Element<"a:theme"> {
    const elements = element("a:themeElements", [], [colorScheme(), fontScheme(), formatScheme()]);
    return element("a:theme", [["xmlns:a", Namespace.a], ["name", "Office"]], [
        elements,
        element("a:objectDefaults", [], []),
        element("a:extraClrSchemeLst", [], [])
    ]);
}
