# Canoe Project Integration

Canoe is currently integrated into Olgeta and Asteroid.

Projects should:
1. submodule this repository
2. create and check in configuration files
3. create and check in scripts to run, build and deploy canoe
4. Configure overrides for assets in Canoe - see below

## Ovverriding Canoe Assets

Canoe assets can be overridden using [Webpack Resolve alias](https://webpack.js.org/configuration/resolve/#resolvealias)

One resolve alias is by default in Canoe, aliasing `~OverrideSass` to `canoe/overrides`.
Projects can replace this override to a directory in their project, and add more overrides through the project configuration file

For example:
add this to your project configuration file: 
```
    WEBPACK_CONFIG: {
        resolve: {
            alias: {
                OverrideSass: path.resolve(__dirname, "canoe-overrides", "scss"),
                OverrideImages: path.resolve(__dirname, "canoe-overrides", "img"),
            }
        }
    },
```

Place scss files in `canoe-overrides/scss` in your project ( check that the import point uses the `~OverrideSass/..`)
Refer to images using `url('~/OverrideImages/your-image.svg')`, and they will be impmorted from your `canoe-overrides/img` folder.





