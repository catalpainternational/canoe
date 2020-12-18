/** This babel config is for Javascript only (js|cjs|mjs),
 * for Typescript see the babel settings in the webpack config */

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
    ],
    plugins: [
        [
            "@babel/plugin-transform-runtime",
            {
                regenerator: true,
            },
        ],
    ],
};
