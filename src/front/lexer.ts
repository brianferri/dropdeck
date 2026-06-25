import type { Card } from "#/ir";

export enum RawBlockKind {
    Fence = "fence",
    Cards = "cards",
    Text = "text"
}

export type RawBlock =
    | { kind: RawBlockKind.Fence, lang: string, content: string }
    | { kind: RawBlockKind.Cards, cards: Array<Card> }
    | { kind: RawBlockKind.Text, content: string };

function isCard(line: string): boolean {
    return (/^###\s+/).test(line);
}

function isFence(line: string): boolean {
    return line.startsWith("```");
}

export function tokenize(body: string): Array<RawBlock> {
    const lines = body.split("\n");
    const blocks: Array<RawBlock> = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? "";
        if (isFence(line)) {
            const lang = line.replace(/^```/, "").trim();
            const buf: Array<string> = [];
            i += 1;
            while (i < lines.length && !isFence(lines[i] ?? "")) buf.push(lines[i++] ?? "");
            i += 1;
            blocks.push({ kind: RawBlockKind.Fence, lang, content: buf.join("\n") });
        } else if (isCard(line)) {
            const cards: Array<Card> = [];
            while (i < lines.length) {
                while (i < lines.length && !(lines[i] ?? "").trim()) i += 1;
                if (i >= lines.length || !isCard(lines[i] ?? "")) break;
                const title = (lines[i] ?? "").replace(/^###\s+/, "").trim();
                i += 1;
                const buf: Array<string> = [];
                while (i < lines.length && !isCard(lines[i] ?? "") && !isFence(lines[i] ?? ""))
                    buf.push(lines[i++] ?? "");

                cards.push({ title, body: buf.join("\n").trim() });
            }
            blocks.push({ kind: RawBlockKind.Cards, cards });
        } else {
            const buf: Array<string> = [];
            while (i < lines.length && !isCard(lines[i] ?? "") && !isFence(lines[i] ?? ""))
                buf.push(lines[i++] ?? "");

            if (buf.join("").trim()) blocks.push({ kind: RawBlockKind.Text, content: buf.join("\n").trim() });
        }
    }
    return blocks;
}
