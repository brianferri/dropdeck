import { element, text } from "@dropdeck/pptx";
import type { Node } from "@dropdeck/pptx";

export enum AnimationKind {
    Fade = "fade",
    Wipe = "wipe",
    Counter = "counter"
}

type SingleShape = { kind: AnimationKind.Fade | AnimationKind.Wipe, id: number };
type CounterShape = { kind: AnimationKind.Counter, frames: ReadonlyArray<number> };
export type AnimatedShape = SingleShape | CounterShape;

const FADE_MS = 420;
const WIPE_MS = 700;
const COUNTER_MS = 760;
const STAGGER_MS = 70;

// The timing tree carries its own node ids, independent of the shapes' drawing ids.
function counter(start: number): () => number {
    let value = start - 1;
    return () => {
        value += 1;
        return value;
    };
}

function startWhen(delay: number | string): Node {
    return element("p:stCondLst", [], [element("p:cond", [["delay", delay]], [])]);
}

function target(shapeId: number): Node {
    return element("p:tgtEl", [], [element("p:spTgt", [["spid", shapeId]], [])]);
}

// A 1ms hold-set fires at delay 0 so the shape isn't visible before its entrance animates in.
function visSet(shapeId: number, value: string, nextNodeId: () => number): Node {
    const cTn = element("p:cTn", [["id", nextNodeId()], ["dur", 1], ["fill", "hold"]], [startWhen(0)]);
    const names = element("p:attrNameLst", [], [element("p:attrName", [], [text("style.visibility")])]);
    const behaviour = element("p:cBhvr", [], [cTn, target(shapeId), names]);
    return element("p:set", [], [behaviour, element("p:to", [], [element("p:strVal", [["val", value]], [])])]);
}

function animEffect(
    shapeId: number,
    filter: string,
    durationMs: number,
    nextNodeId: () => number
): Node {
    const cTn = element("p:cTn", [["id", nextNodeId()], ["dur", durationMs]], []);
    return element("p:animEffect", [
        ["transition", "in"],
        ["filter", filter]
    ], [element("p:cBhvr", [], [cTn, target(shapeId)])]);
}

// The `filter` on the animEffect is what actually drives the render; the preset ids only label the effect in
// PowerPoint's UI.
const PRESET = {
    [AnimationKind.Fade]: { id: 10, subtype: 0, filter: "fade", duration: FADE_MS },
    [AnimationKind.Wipe]: { id: 22, subtype: 4, filter: "wipe(left)", duration: WIPE_MS }
} as const;

function entrance(shape: SingleShape, delay: number, nextNodeId: () => number): Node {
    const preset = PRESET[shape.kind];
    const body = element("p:childTnLst", [], [
        visSet(shape.id, "visible", nextNodeId),
        animEffect(shape.id, preset.filter, preset.duration, nextNodeId)
    ]);
    const effect = element(
        "p:cTn",
        [
            ["id", nextNodeId()],
            ["presetID", preset.id],
            ["presetClass", "entr"],
            ["presetSubtype", preset.subtype],
            ["fill", "hold"],
            ["grpId", 0],
            ["nodeType", "withEffect"]
        ],
        [startWhen(delay), body]
    );
    return element("p:par", [], [effect]);
}

function visStep(
    shapeId: number,
    value: string,
    presetClass: string,
    delay: number,
    nextNodeId: () => number
): Node {
    const effect = element("p:cTn", [
        ["id", nextNodeId()],
        ["presetID", 1],
        ["presetClass", presetClass],
        ["presetSubtype", 0],
        ["fill", "hold"],
        ["grpId", 0],
        ["nodeType", "withEffect"]
    ], [
        startWhen(delay),
        element("p:childTnLst", [], [visSet(shapeId, value, nextNodeId)])
    ]);
    return element("p:par", [], [effect]);
}

function counterEntrance(
    frames: ReadonlyArray<number>,
    delay: number,
    nextNodeId: () => number
): Node {
    const slot = Math.max(24, Math.round(COUNTER_MS / Math.max(1, frames.length)));
    const steps: Array<Node> = [];
    steps.push(entrance({ kind: AnimationKind.Fade, id: frames[0] }, delay, nextNodeId));
    // The roll waits a full fade past the entrance so it begins only once the first frame has faded in.
    const rollDelay = delay + FADE_MS;
    frames.forEach((id, index) => {
        if (index > 0) steps.push(visStep(id, "visible", "entr", rollDelay + ((index - 1) * slot), nextNodeId));
        if (index < frames.length - 1) steps.push(visStep(id, "hidden", "exit", rollDelay + (index * slot), nextNodeId));
    });
    const group = element("p:cTn", [
        ["id", nextNodeId()],
        ["fill", "hold"],
        ["nodeType", "withEffect"]
    ], [
        startWhen(delay),
        element("p:childTnLst", [], steps)
    ]);
    return element("p:par", [], [group]);
}

function effectFor(shape: AnimatedShape, delay: number, nextNodeId: () => number): Node {
    if (shape.kind === AnimationKind.Counter) return counterEntrance(shape.frames, delay, nextNodeId);
    return entrance(shape, delay, nextNodeId);
}

function slideTrigger(event: string): Node {
    return element("p:cond", [["evt", event], ["delay", 0]], [element("p:tgtEl", [], [element("p:sldTgt", [], [])])]);
}

export function slideTiming(shapes: ReadonlyArray<AnimatedShape>): Node | null {
    if (shapes.length === 0) return null;
    const nextNodeId = counter(3);
    const groupId = nextNodeId();
    const effects = shapes.map((shape, index) => effectFor(shape, index * STAGGER_MS, nextNodeId));
    const group = element("p:cTn", [
        ["id", groupId],
        ["fill", "hold"],
        ["nodeType", "afterEffect"]
    ], [
        startWhen(0),
        element("p:childTnLst", [], effects)
    ]);
    const mainSeq = element("p:cTn", [
        ["id", 2],
        ["dur", "indefinite"],
        ["nodeType", "mainSeq"]
    ], [element("p:childTnLst", [], [element("p:par", [], [group])])]);
    const previous = element("p:prevCondLst", [], [slideTrigger("onPrev")]);
    const next = element("p:nextCondLst", [], [slideTrigger("onNext")]);
    const sequence = element("p:seq", [["concurrent", "1"], ["nextAc", "seek"]], [mainSeq, previous, next]);
    const root = element("p:cTn", [
        ["id", 1],
        ["dur", "indefinite"],
        ["restart", "never"],
        ["nodeType", "tmRoot"]
    ], [element("p:childTnLst", [], [sequence])]);
    return element("p:timing", [], [element("p:tnLst", [], [element("p:par", [], [root])])]);
}
