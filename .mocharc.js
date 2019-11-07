module.exports = {
    diff: true,
    spec: "out/tests/**/*.js",
    extension: ['js'],
    opts: false,
    package: './package.json',
    recursive: true,
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'qunit',
    'watch-files': ['out/src/**/*.js', 'out/tests/**/*.js'],
    'watch-ignore': []
};