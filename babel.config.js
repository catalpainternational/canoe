module.exports = {
    "presets": [
        [
            "@babel/preset-env",
            { "targets": { "node": "current" }, "useBuiltIns": "usage" }
        ],
        "@babel/preset-typescript"
    ],
    "plugins": [
        [
            "@babel/plugin-transform-runtime",
            {
                "regenerator": true
            }
        ]
    ]
}
