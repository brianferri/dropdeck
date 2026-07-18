import { NodeKind } from "./Specification.js";
import type { BlockNode, Blocks, DocumentNode, InlineNode, Inlines, ListNode } from "./typings/nodes.js";
import type { Serialize } from "./typings/serialize.js";

function serializeInline(node: InlineNode): string {
    switch (node.kind) {
        case NodeKind.Text: return node.value;
        case NodeKind.SoftBreak: return "\n";
        case NodeKind.HardBreak: return "  \n";
        case NodeKind.Code: return `\`${node.value}\``;
        case NodeKind.HtmlInline: return node.value;
        case NodeKind.Emphasis: return `*${serializeInlines(node.children)}*`;
        case NodeKind.Strong: return `**${serializeInlines(node.children)}**`;
        case NodeKind.Link: return `[${serializeInlines(node.children)}](${node.destination})`;
        case NodeKind.Image: return `![${serializeInlines(node.children)}](${node.destination})`;
    }
}

function serializeInlines(nodes: Inlines): string {
    return nodes.map(serializeInline).join("");
}

// Re-indent every line by a fixed prefix; the first line carries `lead`, continuations carry `pad`.
function indentBlock(lead: string, pad: string, body: string): string {
    return body.split("\n").map((line, index) => `${index === 0 ? lead : pad}${line}`).join("\n");
}

function serializeList(node: ListNode): string {
    return node.children.map((item, index) => {
        const lead = node.ordered ? `${node.start + index}${node.marker} ` : `${node.marker} `;
        return indentBlock(lead, " ".repeat(lead.length), serializeBlocks(item.children));
    }).join("\n");
}

function serializeBlock(node: BlockNode): string {
    switch (node.kind) {
        case NodeKind.ThematicBreak: return "---";
        case NodeKind.Heading: return `${"#".repeat(node.level)} ${serializeInlines(node.children)}`;
        case NodeKind.CodeBlock: return node.fenced ? `\`\`\`${node.info}\n${node.literal}\n\`\`\`` : indentBlock("    ", "    ", node.literal);
        case NodeKind.HtmlBlock: return node.literal;
        case NodeKind.Paragraph: return serializeInlines(node.children);
        case NodeKind.BlockQuote: return indentBlock("> ", "> ", serializeBlocks(node.children));
        case NodeKind.List: return serializeList(node);
        case NodeKind.ListItem: return serializeBlocks(node.children);
    }
}

function serializeBlocks(nodes: Blocks): string {
    return nodes.map(serializeBlock).join("\n\n");
}

export function serialize<const N extends DocumentNode>(document: N): Serialize<N> {
    return serializeBlocks(document.children) as Serialize<N>;
}
