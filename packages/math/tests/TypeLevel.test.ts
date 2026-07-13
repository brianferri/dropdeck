import { test } from "node:test";
import assert from "node:assert/strict";
import { BinaryOperator, binary, call, number, parse, variable } from "../src/index.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, One, Pair, Parse,
    ParseError, VariableNode, MathConstant
} from "../src/index.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type A = VariableNode<"a">;
type B = VariableNode<"b">;
type C = VariableNode<"c">;
type Num<V extends number> = NumberNode<V>;

// The operands of a node are its `children` tuple; these mirror that so the assertions read as trees.
type Bin<Op extends BinaryOperator, Left extends Expression, Right extends Expression> = BinaryNode<Op, Pair<Left, Right>>;
type Neg<Operand extends Expression> = NegateNode<One<Operand>>;
type Not<Operand extends Expression> = NotNode<One<Operand>>;
type Call<Callee extends string, Children extends Content> = CallNode<Callee, Children>;

export type Atoms = [
    Assert<Equal<Parse<"1">, Num<1>>>,
    Assert<Equal<Parse<"3.5">, Num<3.5>>>,
    Assert<Equal<Parse<"foo">, VariableNode<"foo">>>,
    Assert<Equal<Parse<"pi">, ConstantNode<MathConstant.Pi>>>
];

export type Calls = [
    Assert<Equal<Parse<"f()">, Call<"f", readonly []>>>,
    Assert<Equal<Parse<"sqrt(a)">, Call<"sqrt", readonly [A]>>>,
    Assert<Equal<Parse<"max(a, b)">, Call<"max", readonly [A, B]>>>
];

export type Unary = [
    Assert<Equal<Parse<"-a+b">, Bin<BinaryOperator.Add, Neg<A>, B>>>,
    Assert<Equal<Parse<"not a and b">, Bin<BinaryOperator.And, Not<A>, B>>>
];

export type Precedence = [
    Assert<Equal<Parse<"a+b*c">, Bin<BinaryOperator.Add, A, Bin<BinaryOperator.Multiply, B, C>>>>,
    Assert<Equal<Parse<"2*3^4">, Bin<BinaryOperator.Multiply, Num<2>, Bin<BinaryOperator.Power, Num<3>, Num<4>>>>>,
    Assert<Equal<Parse<"a < b + c">, Bin<BinaryOperator.LessThan, A, Bin<BinaryOperator.Add, B, C>>>>,
    Assert<Equal<Parse<"a or b and c">, Bin<BinaryOperator.Or, A, Bin<BinaryOperator.And, B, C>>>>
];

export type Associativity = [
    Assert<Equal<Parse<"a-b-c">, Bin<BinaryOperator.Subtract, Bin<BinaryOperator.Subtract, A, B>, C>>>,
    Assert<Equal<Parse<"a^b^c">, Bin<BinaryOperator.Power, A, Bin<BinaryOperator.Power, B, C>>>>
];

export type Grouping = [
    Assert<Equal<Parse<"(a+b)*c">, Bin<BinaryOperator.Multiply, Bin<BinaryOperator.Add, A, B>, C>>>,
    Assert<Equal<Parse<"a >= b">, Bin<BinaryOperator.GreaterOrEqual, A, B>>>,
    Assert<Equal<
        Parse<"sqrt(a^2 + b^2)">,
        Call<"sqrt", readonly [Bin<BinaryOperator.Add, Bin<BinaryOperator.Power, A, Num<2>>, Bin<BinaryOperator.Power, B, Num<2>>>]>
    >>,

    // A non-literal source degrades to the general `Expression`, not an error.
    Assert<Equal<Parse<string>, Expression>>
];

export type Errors = [
    Assert<Equal<Parse<"a b">, ParseError<"Expected end of input, got 'b'">>>,
    Assert<Equal<Parse<"(a">, ParseError<"Expected ')', got <end of input>">>>,
    Assert<Equal<Parse<"1 +">, ParseError<"Expected an expression, got <end of input>">>>,
    Assert<Equal<Parse<"sqrt(a b)">, ParseError<"Expected ',' or ')', got 'b'">>>,
    Assert<Equal<Parse<"a @ b">, ParseError<"Unexpected character at <@ b>">>>
];

await test("the runtime parse matches the type-level Parse for a nested formula", () => {
    assert.deepEqual(
        parse("sqrt(a^2 + b^2)"),
        call("sqrt", [
            binary(
                BinaryOperator.Add,
                binary(BinaryOperator.Power, variable("a"), number(2)),
                binary(BinaryOperator.Power, variable("b"), number(2))
            )
        ])
    );
});
