import { writeFileSync } from "node:fs";
import {
    bodyPr, cNvPr, cover, cSld, dissolve, ext, fade, gridCol, grpSpPr, highlight, latin, nvGrpSpPr, nvSpPr,
    off, paragraph, picture, pPr, prstGeom, push, roundRect, rPr, run, slide, solidFill, sp, spPr, spTree,
    srgbClr, ST_TextAlignType, ST_TextAnchoringType, ST_TransitionEightDirectionType,
    ST_TransitionSideDirectionType, ST_TransitionSpeed, tableFrame, tableStyleId, tbl, tblGrid, tblPr, tc,
    tcPr, toBytes, tr, transition, txBody, txBodyA, wipe, xfrm
} from "../src/index.js";
import { solidPng } from "./png.js";
import type {
    CT_GraphicalObjectFrame, CT_Shape, CT_Slide, CT_SolidColorFillProperties, CT_TableCell, CT_TextBody,
    CT_TextParagraph, DeckSlide, SlideInput, SlideMedia
} from "../src/index.js";

// A 16:9 EMU canvas; every coordinate below is in English Metric Units (914400 per inch).
const W = 12192000;
const H = 6858000;
const MX = 762000;
const CONTENT = W - (2 * MX);

// DropDeck's dark theme, mirrored from src/theme.ts: a near-black field, mint and cyan accents, an amber
// highlight, and the slate text ramp.
const BG = "0B1220";
const PANEL = "16223A";
const TEXT = "E6EDF3";
const MUTED = "AAB6C4";
const TEAL = "5CD0B3";
const CYAN = "58C4DD";
const AMBER = "F59E0B";

const DISPLAY = "Manrope";
const BODY = "Manrope";
const MONO = "Fira Code";

const LOGO_EMBED = "rId2";
const GRID_STYLE = "{5940675A-B579-460E-94D1-54222C63F5DA}";

let nextId = 1;
function id(): number {
    nextId += 1;
    return nextId;
}

function background(): CT_Shape {
    return sp(
        nvSpPr(cNvPr(id(), "bg")),
        spPr(xfrm(off(0, 0), ext(W, H)), prstGeom("rect"), solidFill(srgbClr(BG))),
        txBody(bodyPr([]), paragraph())
    );
}

function panel(x: number, y: number, cx: number, cy: number): CT_Shape {
    return sp(
        nvSpPr(cNvPr(id(), "panel")),
        spPr(xfrm(off(x, y), ext(cx, cy)), roundRect(8000), solidFill(srgbClr(PANEL))),
        txBody(bodyPr([]), paragraph())
    );
}

// A fully-rounded thin bar, used as an accent rule beneath headers. The fill is built by the caller so each
// rule can carry whichever palette colour it needs while the geometry stays fixed.
function rule(x: number, y: number, cx: number, fill: CT_SolidColorFillProperties): CT_Shape {
    return sp(
        nvSpPr(cNvPr(id(), "rule")),
        spPr(xfrm(off(x, y), ext(cx, 54000)), roundRect(50000), fill),
        txBody(bodyPr([]), paragraph())
    );
}

function textShape(name: string, x: number, y: number, cx: number, cy: number, body: CT_TextBody): CT_Shape {
    return sp(nvSpPr(cNvPr(id(), name)), spPr(xfrm(off(x, y), ext(cx, cy))), body);
}

// The colour arrives as a built fill, not a hex string, so the six-digit literal is validated by `srgbClr` at
// the call site rather than widening to `string` here (which `srgbClr` rightly rejects).
function centered(text: string, sizePt: number, fill: CT_SolidColorFillProperties, font: string): CT_TextBody {
    return txBody(
        bodyPr([["anchor", ST_TextAnchoringType.Center]]),
        paragraph(
            pPr([["algn", ST_TextAlignType.Center]]),
            run(text, rPr([["sz", sizePt], ["b", true]], fill, latin(font)))
        )
    );
}

function slideHeader(kicker: string, title: string): CT_Shape {
    return textShape("header", MX, 540000, CONTENT, 1180000, txBody(
        bodyPr([["anchor", ST_TextAnchoringType.Top]]),
        paragraph(run(kicker, rPr([["sz", 1300], ["b", true]], solidFill(srgbClr(AMBER)), latin(BODY)))),
        paragraph(run(title, rPr([["sz", 3200], ["b", true]], solidFill(srgbClr(TEAL)), latin(DISPLAY))))
    ));
}

// A hanging-indent bullet whose marker is an amber dash, the body slate.
function bullet(text: string): CT_TextParagraph {
    return paragraph(
        pPr([["marL", 274320], ["indent", -274320]]),
        run("-  ", rPr([["sz", 1900], ["b", true]], solidFill(srgbClr(AMBER)), latin(BODY))),
        run(text, rPr([["sz", 1900]], solidFill(srgbClr(TEXT)), latin(BODY)))
    );
}

function codeLine(text: string): CT_TextParagraph {
    return paragraph(run(text, rPr([["sz", 1600]], solidFill(srgbClr(CYAN)), latin(MONO))));
}

function cell(text: string, textFill: CT_SolidColorFillProperties, cellFill: CT_SolidColorFillProperties, bold: boolean): CT_TableCell {
    return tc(
        txBodyA(
            bodyPr([["anchor", ST_TextAnchoringType.Center]]),
            paragraph(
                pPr([["algn", ST_TextAlignType.Left], ["marL", 137160]]),
                run(text, rPr([["sz", 1500], ["b", bold]], textFill, latin(BODY)))
            )
        ),
        tcPr([], cellFill)
    );
}

function media(data: Uint8Array): SlideMedia {
    return { relationshipId: LOGO_EMBED, extension: "png", contentType: "image/png", data };
}

function titleSlide(logo: Uint8Array): DeckSlide {
    const tree = spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        background(),
        picture(id(), "logo", LOGO_EMBED, (W - 820000) / 2, 1120000, 820000, 820000),
        textShape("kicker", MX, 1980000, CONTENT, 360000, centered("DECK TOOLKIT", 1300, solidFill(srgbClr(AMBER)), BODY)),
        textShape("title", MX, 2340000, CONTENT, 1120000, centered("DropDeck", 6600, solidFill(srgbClr(TEAL)), DISPLAY)),
        rule((W - 2200000) / 2, 3560000, 2200000, solidFill(srgbClr(TEAL))),
        textShape("subtitle", MX, 3720000, CONTENT, 640000, centered("Markdown in. A polished deck out.", 2200, solidFill(srgbClr(MUTED)), BODY))
    );
    return { slide: slide(cSld(tree), transition(fade(), ST_TransitionSpeed.Medium)), media: [media(logo)] };
}

function agendaSlide(): CT_Slide {
    const tree = spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        background(),
        slideHeader("WHAT'S INSIDE", "Five ideas, one file"),
        rule(MX, 1820000, 2600000, solidFill(srgbClr(TEAL))),
        textShape("bullets", MX, 2120000, CONTENT, 4200000, txBody(
            bodyPr([["anchor", ST_TextAnchoringType.Top]]),
            bullet("Hand-rolled OOXML writer with zero dependencies"),
            bullet("A type-level XML grammar that serialises to exact strings"),
            bullet("Tables, embedded images, and slide transitions"),
            bullet("Rounded highlight chips and inline text emphasis"),
            bullet("Real .pptx that opens in PowerPoint and LibreOffice")
        ))
    );
    return slide(cSld(tree), transition(push(ST_TransitionSideDirectionType.Left), ST_TransitionSpeed.Medium));
}

function codeSlide(): CT_Slide {
    const tree = spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        background(),
        slideHeader("PIPELINE", "From markdown to bytes"),
        rule(MX, 1820000, 2600000, solidFill(srgbClr(TEAL))),
        panel(MX, 2150000, CONTENT, 2900000),
        textShape("code", MX + 360000, 2460000, CONTENT - 720000, 2300000, txBody(
            bodyPr([["anchor", ST_TextAnchoringType.Center]]),
            codeLine("import { toBytes } from \"@dropdeck/pptx\";"),
            paragraph(),
            codeLine("const slides = parse(markdown);"),
            paragraph(
                run("const file = await ", rPr([["sz", 1600]], solidFill(srgbClr(CYAN)), latin(MONO))),
                run(" toBytes(slides) ", rPr([["sz", 1600], ["b", true]], solidFill(srgbClr(BG)), highlight(srgbClr(AMBER)), latin(MONO))),
                run(";", rPr([["sz", 1600]], solidFill(srgbClr(CYAN)), latin(MONO)))
            )
        ))
    );
    return slide(cSld(tree), transition(wipe(ST_TransitionSideDirectionType.Down), ST_TransitionSpeed.Medium));
}

function statusTable(): CT_GraphicalObjectFrame {
    const table = tbl(
        tblPr([["firstRow", true], ["bandRow", true]], tableStyleId(GRID_STYLE)),
        tblGrid(gridCol(4400000), gridCol(2200000), gridCol(3600000)),
        tr(
            620000,
            cell("Capability", solidFill(srgbClr(BG)), solidFill(srgbClr(TEAL)), true),
            cell("State", solidFill(srgbClr(BG)), solidFill(srgbClr(TEAL)), true),
            cell("Detail", solidFill(srgbClr(BG)), solidFill(srgbClr(TEAL)), true)
        ),
        tr(
            560000,
            cell("OOXML writer", solidFill(srgbClr(TEXT)), solidFill(srgbClr(PANEL)), false),
            cell("Shipped", solidFill(srgbClr(TEAL)), solidFill(srgbClr(PANEL)), true),
            cell("Zero deps, hand-rolled zip", solidFill(srgbClr(MUTED)), solidFill(srgbClr(PANEL)), false)
        ),
        tr(
            560000,
            cell("Type-level XML", solidFill(srgbClr(TEXT)), solidFill(srgbClr(PANEL)), false),
            cell("Shipped", solidFill(srgbClr(TEAL)), solidFill(srgbClr(PANEL)), true),
            cell("Serialises to string literals", solidFill(srgbClr(MUTED)), solidFill(srgbClr(PANEL)), false)
        ),
        tr(
            560000,
            cell("Slides & media", solidFill(srgbClr(TEXT)), solidFill(srgbClr(PANEL)), false),
            cell("Shipped", solidFill(srgbClr(TEAL)), solidFill(srgbClr(PANEL)), true),
            cell("Tables, images, transitions", solidFill(srgbClr(MUTED)), solidFill(srgbClr(PANEL)), false)
        )
    );
    return tableFrame(id(), "status", (W - 10200000) / 2, 2200000, 10200000, 2300000, table);
}

function tableSlide(): CT_Slide {
    const tree = spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        background(),
        slideHeader("STATUS", "At a glance"),
        rule(MX, 1820000, 2600000, solidFill(srgbClr(TEAL))),
        statusTable()
    );
    return slide(cSld(tree), transition(cover(ST_TransitionEightDirectionType.RightDown), ST_TransitionSpeed.Medium));
}

function closingSlide(): CT_Slide {
    const tree = spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        background(),
        textShape("thanks", MX, 2400000, CONTENT, 1300000, centered("Thank you", 6000, solidFill(srgbClr(TEAL)), DISPLAY)),
        rule((W - 1800000) / 2, 3760000, 1800000, solidFill(srgbClr(AMBER))),
        textShape("outro", MX, 3920000, CONTENT, 640000, centered("Build decks from plain text.", 2200, solidFill(srgbClr(MUTED)), BODY))
    );
    return slide(cSld(tree), transition(dissolve(), ST_TransitionSpeed.Slow));
}

const logo = solidPng(96, 0x5c, 0xd0, 0xb3);
const slides: ReadonlyArray<SlideInput> = [
    titleSlide(logo),
    agendaSlide(),
    codeSlide(),
    tableSlide(),
    closingSlide()
];

const out = process.argv[2] ?? "dropdeck-demo.pptx";
const bytes = await toBytes(slides);
writeFileSync(out, bytes);
console.log(`wrote ${out} (${bytes.length} bytes, ${slides.length} slides)`);
