import { element, fade, transition } from "@dropdeck/pptx";
import { SlideTransition } from "#/animations/spec";
import type { Node } from "@dropdeck/pptx";

const MORPH_NS = "http://schemas.microsoft.com/office/powerpoint/2015/09/main";
const MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006";

// Morph is a PowerPoint 2016+ extension, so it ships inside `mc:AlternateContent`: capable clients take the
// `p159:morph` choice and tween shapes that share a name across slides, while everything else falls back to the
// plain fade the rest of the deck already uses.
function morphTransition(): Node {
    const morph = element("p:transition", [["spd", "slow"]], [element("p159:morph", [["option", "byObject"]], [])]);
    const choice = element("mc:Choice", [["xmlns:p159", MORPH_NS], ["Requires", "p159"]], [morph]);
    const fallback = element("mc:Fallback", [], [transition(fade())]);
    return element("mc:AlternateContent", [["xmlns:mc", MC_NS]], [choice, fallback]);
}

export function slideTransition(kind: SlideTransition): Node | null {
    switch (kind) {
        case SlideTransition.Morph: return morphTransition();
        case SlideTransition.None: return null;
        case SlideTransition.Fade: return transition(fade());
    }
}
