export function ok(expr, msg) {
    if (!expr) throw new Error(msg);
}
