import { keyGuard } from "@dropdeck/common";

// The named colors a deck's `color(name, x)` / `\textcolor{name}{x}` directives accept. MathML passes the name
// straight to `mathcolor` (any CSS color name works there), but PowerPoint's DrawingML needs a hex, so this table
// is the portable set: a name outside it still colors the HTML yet renders uncolored in pptx. It is the one source
// the OMML renderer resolves hex from and the editor offers as color completions, so the two never diverge.
export const COLOR_HEX = {
    black: "000000",
    white: "FFFFFF",
    red: "FF0000",
    green: "008000",
    blue: "0000FF",
    yellow: "FFFF00",
    orange: "FFA500",
    purple: "800080",
    gray: "808080",
    grey: "808080",
    cyan: "00FFFF",
    magenta: "FF00FF",
    pink: "FFC0CB",
    brown: "A52A2A"
} as const;

export const isColorName = keyGuard(COLOR_HEX);
