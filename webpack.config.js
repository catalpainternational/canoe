const webpack = require("webpack");
const merge = require("webpack-merge");
const path = require("path");
const fs = require("fs");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { InjectManifest } = require("workbox-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");

// default environment configuration
const defaultEnvironmentConfiguration = require("./canoe-environment-default.js");

// default project configuration
const defaultProjectConfiguration = require("./canoe-project-default.js");

module.exports = (env) => {
    // read the environment configuration
    const environmentConfiguration = Object.assign(
        defaultEnvironmentConfiguration,
        env && env.ENVIRONMENT_CONFIG_PATH ? require(env.ENVIRONMENT_CONFIG_PATH) : {}
    );

    // read the project configuration
    const projectConfiguration = Object.assign(
        defaultProjectConfiguration,
        env && env.PROJECT_CONFIG_PATH ? require(env.PROJECT_CONFIG_PATH) : {}
    );

    // merge environment and project configurations for use in webpack compilation
    // webpack.DefinePlugin will replace process.env.CONFIG_KEY with configured valuea
    const processEnvironment = Object.keys(environmentConfiguration).reduce((prev, next) => {
        prev[`process.env.${next}`] = JSON.stringify(environmentConfiguration[next]);
        return prev;
    }, {});

    const baseConfig = {
        context: __dirname,
        mode: "development",
        devtool: "inline-source-map",
        entry: {
            canoe: path.resolve(__dirname, "src", "index.js"),
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, "dist"),
        },
        devServer: {
            contentBase: path.resolve(__dirname, "dist"),
        },
        resolve: {
            modules: ["node_modules", path.resolve(__dirname, "modules")],
            alias: {
                RiotTags: path.resolve(__dirname, "src/riot/"),
                js: path.resolve(__dirname, "src/js"),
                ReduxImpl: path.resolve(__dirname, "src/js/redux"),
                Actions: path.resolve(__dirname, "src/js/actions"),
                OverrideSass: path.resolve(__dirname, "src", "overrides"),
            },
        },
        module: {
            rules: [
                {
                    test: /\.riot.html$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "@riotjs/webpack-loader",
                        options: {
                            type: "es6",
                        },
                    },
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        "style-loader",
                        // Translates CSS into CommonJS
                        "css-loader",
                        // Compiles Sass to CSS
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    use: {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                        },
                    },
                },
                {
  test: /\.(gif|png|jpe?g|svg)$/i,
  use: [
    'file-loader',
    {
      loader: 'image-webpack-loader',
      options: {
        // disable: true, // webpack@2.x and newer
      },
    },
  ],
},
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                            plugins: ["@babel/plugin-transform-runtime"],
                        },
                    },
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: ["**/*"],
            }),
            new webpack.DefinePlugin(processEnvironment),
            new HtmlWebpackPlugin({
                title: projectConfiguration.SITE_NAME,
                template: path.resolve(__dirname, "src/index.html"),
                favicon: projectConfiguration.FAVICON_PATH,
                include_ga: Boolean(environmentConfiguration.GA_TAG),
                ga_tag: environmentConfiguration.GA_TAG,
            }),
            new WebpackPwaManifest({
                name: projectConfiguration.SITE_NAME,
                short_name: projectConfiguration.SITE_SHORT_NAME,
                description: projectConfiguration.SITE_DESCRIPTION,
                background_color: projectConfiguration.BACKGROUND_COLOR,
                icons: [
                    /*{
                      src: projectConfiguration.FAVICON_PATH,
                      sizes: [120, 152, 167, 180, 1024],
                      destination: path.join('icons', 'ios'),
                      ios: true
                    },
                    {
                      src: projectConfiguration.FAVICON_PATH,
                      size: 1024,
                      destination: path.join('icons', 'ios'),
                      ios: 'startup'
                    },*/
                    {
                      src: projectConfiguration.FAVICON_PATH,
                      sizes: [36, 48, 72, 96, 144, 192, 512],
                      destination: path.join("icons", "android"),
                    }
                ]
            }),
            new InjectManifest({
                swSrc: path.resolve(__dirname, "src/sw.js"),
                maximumFileSizeToCacheInBytes: 4000000,
            }),
            new webpack.ProvidePlugin({
                gettext: ["Translation", "gettext"],
                ngettext: ["Translation", "ngettext"],
            }),
        ],
    };

    const productionWebpackConfig = env && env.PRODUCTION ? require("./webpack.prod.js") : {};

    const config = merge(
        baseConfig,
        projectConfiguration.WEBPACK_CONFIG,
        environmentConfiguration.WEBPACK_CONFIG,
        productionWebpackConfig
    );
    return config;
};
