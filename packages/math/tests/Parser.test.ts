import { test } from "node:test";
import assert from "node:assert/strict";
import {
    BinaryOperator, MathConstant, MathError, binary, call, constant, logicalNot, negate, number, parse, variable
} from "../src/index.js";

await test("parse: precedence nests multiplication under addition", () => {
    assert.deepEqual(
        parse("a + b * c"),
        binary(BinaryOperator.Add, variable("a"), binary(BinaryOperator.Multiply, variable("b"), variable("c")))
    );
});

await test("parse: power is right associative, subtraction is left associative", () => {
    assert.deepEqual(
        parse("a^b^c"),
        binary(BinaryOperator.Power, variable("a"), binary(BinaryOperator.Power, variable("b"), variable("c")))
    );
    assert.deepEqual(
        parse("a-b-c"),
        binary(BinaryOperator.Subtract, binary(BinaryOperator.Subtract, variable("a"), variable("b")), variable("c"))
    );
});

await test("parse: a reserved constant, but a callee name is a call not a constant", () => {
    assert.deepEqual(parse("pi"), constant(MathConstant.Pi));
    assert.deepEqual(parse("e()"), call("e", []));
});

await test("parse: unary minus, logical not, and decimals", () => {
    assert.deepEqual(parse("-a"), negate(variable("a")));
    assert.deepEqual(parse("not a"), logicalNot(variable("a")));
    assert.deepEqual(parse("3.5"), number(3.5));
});

await test("parse: throws MathError on an unexpected character", () => {
    assert.throws(() => parse("a @ b"), MathError);
});

await test("parse: throws MathError on trailing input", () => {
    assert.throws(() => parse("a b"), MathError);
});

await test("parse: throws MathError on an unclosed group", () => {
    assert.throws(() => parse("(a + b"), MathError);
});
