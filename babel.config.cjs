module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: { node: "current" },
                corejs: "2",
                useBuiltIns: "usage",
            },
        ],
        "@babel/preset-typescript",
    ],
    plugins: [
        [
            "@babel/plugin-transform-runtime",
            {
                regenerator: true,
            },
        ],
        "./babel-plugin/webpack-alias"
        // The local plugin "./babel-plugin/webpack-alias"
        // is used exclusively for ava's use of babel for the tests
    ],
};
