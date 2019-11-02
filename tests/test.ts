function ok(expr, msg) {
    if (!expr) throw new Error(msg);
}

suite('Array');

test('#length', function() {
    var arr = [1, 2, 3];
    ok(arr.length == 3, "length");
});

test('#indexOf()', function() {
    var arr = [1, 2, 3];
    ok(arr.indexOf(1) == 0, "first element");
    ok(arr.indexOf(2) == 1, "second element");
    ok(arr.indexOf(3) == 2, "third element");
});

suite('String');

test('#length', function() {
    ok('foo'.length == 3, "length");
});
