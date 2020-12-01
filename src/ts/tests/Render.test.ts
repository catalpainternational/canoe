import test from "ava";

const fn = () => "foo";

test("fn() returns foo", (t: any) => {
    t.is(fn(), "foo");
});
