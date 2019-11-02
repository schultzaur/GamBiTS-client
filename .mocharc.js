module.exports = {
    diff: true,
    spec: "out/test/*.js",
    extension: ['js'],
    opts: false,
    package: './package.json',
    recursive: true,
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'qunit',
    'watch-files': ['lib/**/*.js', 'test/**/*.js'],
    'watch-ignore': []
};