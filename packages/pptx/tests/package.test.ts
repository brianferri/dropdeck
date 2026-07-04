import { test } from "node:test";
import assert from "node:assert/strict";
import { Namespace, element, xml } from "../src/oox.js";
import { contentTypes, defaultType, override, relationship, relationships } from "../src/package/builders.js";
import { ContentType, RelationshipType } from "../src/package/constants.js";
import { TargetMode } from "../src/package/Specification.js";
import { buildZip } from "../src/package/zip.js";
import { pack, xmlPart } from "../src/package/parts.js";

await test("package: relationships serialise to the OPC .rels shape", () => {
    const part = relationships([relationship("rId1", RelationshipType.OfficeDocument, "ppt/presentation.xml")]);
    assert.equal(
        xml(part),
        [
            `<Relationships xmlns="${Namespace.rel}">`,
            `<Relationship Id="rId1" Type="${RelationshipType.OfficeDocument}" Target="ppt/presentation.xml"/>`,
            "</Relationships>"
        ].join("")
    );
});

await test("package: an external relationship carries TargetMode", () => {
    const part = relationship("rId9", RelationshipType.Slide, "https://example.com", TargetMode.External);
    assert.equal(
        xml(part),
        `<Relationship Id="rId9" Type="${RelationshipType.Slide}" Target="https://example.com" TargetMode="External"/>`
    );
});

await test("package: content types list defaults and overrides", () => {
    const part = contentTypes([
        defaultType("rels", ContentType.Relationships),
        override("/ppt/presentation.xml", ContentType.Presentation)
    ]);
    assert.equal(
        xml(part),
        [
            `<Types xmlns="${Namespace.ct}">`,
            `<Default Extension="rels" ContentType="${ContentType.Relationships}"/>`,
            `<Override PartName="/ppt/presentation.xml" ContentType="${ContentType.Presentation}"/>`,
            "</Types>"
        ].join("")
    );
});

await test("package: buildZip round-trips an entry through the deflated bytes", async () => {
    const data = new TextEncoder().encode("hello deflate world, ".repeat(8));
    const zip = await buildZip([ { path: "a.xml", bytes: data } ]);

    assert.deepEqual(Array.from(zip.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]); // local file header signature
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const nameLength = view.getUint16(26, true);
    const compressedSize = view.getUint32(18, true);
    assert.equal(new TextDecoder().decode(zip.slice(30, 30 + nameLength)), "a.xml");

    const start = 30 + nameLength;
    const compressed = zip.slice(start, start + compressedSize);
    const stream = new Blob([compressed as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
    assert.deepEqual(inflated, data);
});

await test("package: pack writes [Content_Types].xml first and every part path", async () => {
    const presentation = element("p:presentation", [["xmlns:p", Namespace.p]], []);
    const zip = await pack([xmlPart("ppt/presentation.xml", ContentType.Presentation, presentation)]);

    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const firstNameLength = view.getUint16(26, true);
    assert.equal(new TextDecoder().decode(zip.slice(30, 30 + firstNameLength)), "[Content_Types].xml");

    const whole = new TextDecoder().decode(zip);
    assert.ok(whole.includes("ppt/presentation.xml"));
});
