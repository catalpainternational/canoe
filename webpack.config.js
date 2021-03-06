/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const { mergeWithCustomize, customizeArray } = require("webpack-merge");
const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { InjectManifest } = require("workbox-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSVGPlugin = require("html-webpack-inline-svg-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const defaultEnvironmentConfiguration = require("./canoe-environment-default.js");
const defaultProjectConfiguration = require("./canoe-project-default.js");

// uncomment this to find the source of webpack deprecation warnings
// process.traceDeprecation = true;

module.exports = env => {
    // read the environment configuration
    const environmentConfiguration = Object.assign(
        defaultEnvironmentConfiguration,
        env && env.ENVIRONMENT_CONFIG_PATH
            ? require(env.ENVIRONMENT_CONFIG_PATH)
            : {}
    );

    // read the project configuration
    const projectConfiguration = Object.assign(
        defaultProjectConfiguration,
        env && env.PROJECT_CONFIG_PATH ? require(env.PROJECT_CONFIG_PATH) : {}
    );

    // merge environment and project configurations for use in webpack compilation
    // webpack.DefinePlugin will replace process.env.CONFIG_KEY with configured values
    const processEnvironment = Object.keys(environmentConfiguration).reduce(
        (prev, next) => {
            prev[`process.env.${next}`] = JSON.stringify(
                environmentConfiguration[next]
            );
            return prev;
        },
        {}
    );
    processEnvironment["process.env.REQUIRE_LOGIN"] = projectConfiguration.REQUIRE_LOGIN;
    processEnvironment["process.env.PROFILE_LINK"] = JSON.stringify(projectConfiguration.PROFILE_LINK);
    processEnvironment["process.env.SITE_NAME"] = JSON.stringify(
        projectConfiguration.SITE_NAME
    );
    processEnvironment["process.env.LANGUAGES"] = JSON.stringify(projectConfiguration.LANGUAGES);

    const baseConfig = {
        context: __dirname,
        mode: "development",
        devtool: "eval-source-map",
        optimization: {
            minimizer: [new TerserPlugin(), new OptimizeCSSAssetsPlugin({})],
        },
        entry: {
            canoe: path.resolve(__dirname, "src", "index.js"),
        },
        output: {
            filename: "[name]-[contenthash].js",
            chunkFilename: "[name]-[contenthash].bundle.js",
            path: path.resolve(__dirname, "dist"),
        },
        devServer: {
            contentBase: path.resolve(__dirname, "dist"),
            historyApiFallback: true,
        },
        resolve: {
            extensions: [".ts", ".js", ".cjs", ".mjs", ".json", ".riot.html"],
            modules: [path.resolve(__dirname, "src")],
            plugins: [
                PnpWebpackPlugin,
            ],
        },
        resolveLoader: {
            plugins: [PnpWebpackPlugin.moduleLoader(module)],
        },
        module: {
            rules: [
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader",
                    query: {
                        inlineRequires: 'img\/',
                        rootRelative: '',
                    }
                },
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
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
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
                    test: /\.(png|jpg|gif)$/,
                    use: {
                        loader: "file-loader",
                        options: {
                            esModule: false,
                        },
                    },
                },
                {
                    test: /\.svg$/,
                    use: {
                        loader: "svg-url-loader",
                        options: {
                            encoding: "base64",
                        },
                    },
                },
                {
                    test: /\.(js|cjs|mjs)$/,
                    exclude: [/node_modules/, "/src/**/tests/**/*"],
                    use: {
                        loader: "babel-loader",
                    },
                },
                {
                    test: /\.(ts)$/,
                    exclude: [/node_modules/, "/src/**/tests/**/*"],
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-typescript",
                                "@babel/preset-env",
                            ],
                            plugins: [
                                [
                                    "@babel/plugin-transform-runtime",
                                    {
                                        regenerator: true,
                                    },
                                ],
                                [
                                    "@babel/plugin-proposal-class-properties",
                                    {
                                        loose: true,
                                    },
                                ],
                            ],
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
                template: path.resolve(__dirname, "src/index.hbs"),
                favicon: projectConfiguration.FAVICON_PATH,
                favicon_path: path.basename(projectConfiguration.FAVICON_PATH),
                include_ga: Boolean(environmentConfiguration.GA_TAG),
                ga_tag: environmentConfiguration.GA_TAG,
                theme_color: projectConfiguration.THEME_COLOR,
            }),
            new HtmlWebpackInlineSVGPlugin({ runPreEmit: true }),
            new WebpackPwaManifest({
                inject: true,
                ios: true,
                name: projectConfiguration.SITE_NAME,
                short_name: projectConfiguration.SITE_SHORT_NAME,
                description: projectConfiguration.SITE_DESCRIPTION,
                background_color: "black",
                theme_color: "blue",
                start_url: "/",
                icons: [
                    {
                        src: projectConfiguration.ICON_PATH,
                        sizes: [120],
                        destination: path.join("icons"),
                        ios: "startup",
                        purpose: "any maskable",
                    },
                    {
                        src: projectConfiguration.ICON_PATH,
                        sizes: [1024],
                        destination: path.join("icons"),
                        ios: true,
                        purpose: "any maskable",
                    },
                ],
            }),
            new InjectManifest({
                swSrc: path.resolve(__dirname, "src/sw.js"),
                maximumFileSizeToCacheInBytes: 4000000,
            }),
            new webpack.ProvidePlugin({
                gettext: ["js/Translation", "gettext"],
                ngettext: ["js/Translation", "ngettext"],
            }),
            new MiniCssExtractPlugin(),
            new ForkTsCheckerWebpackPlugin({
                async: false,
                eslint: {
                    files: ["./src/**/*.ts"],
                },
            }),
        ],
    };

    const productionWebpackConfig =
        env && env.PRODUCTION ? require("./webpack.prod.js") : {};

    const config = mergeWithCustomize({
        customizeArray: customizeArray({
            "resolve.modules": "prepend",
        }),
    })(
        baseConfig,
        projectConfiguration.WEBPACK_CONFIG,
        environmentConfiguration.WEBPACK_CONFIG,
        productionWebpackConfig
    );
    return config;
};
