# Canoe

Canoe is the shared frontend interface for Catalpa's e-learning projects

## Overview

Canoe is designed to be a pure javascript codebase that can be hosted purely by NGINX or even on a CDN.
It is dependent on a backend server application that lives in the project contianing it to provide authentication, content and action storing APIs

## Instructions

1. In this directory `yarn` to install dependencies.
2. Ensure the project backend is running and note the URL it is running on.
3. Create a local environment configuration file, by copying ./canoe-environment-default.js to a new file, and editing to suit your environment. For example set the `API_BASE_URL` to the URL of your project backend.
This file should not be committed to source control.
4. If the project does not yet exist, create a project configuration file, by copying ./canoe-project-default.js to a new file, and editing to suit your environment. For example set the `API_BASE_URL` to the URL of your project backend.
This file should be committed to source control in the project you are working on.
3. Run the development server with 
```
yarn start \
    --env.ENVIRONMENT_CONFIG_PATH=your-environment-file.js \
    --env.PROJECT_CONFIG_PATH=your-project-file.js
```
Check the project documentation. It is usual for a project to implement build scripts to save you remembering and typing all this.
4. Builds can be produced by using `yarn build` with the same parameters as the start command, by default these will be developmnet builds
5. Production builds can be produced by passing `--env.PRODUCTION` to the build and start commands

## Project Integration

Canoe is intended to be easily and quickly configurable to run in a new project. We have mechanisms through configuration files to allow overriding assets to change css and images.

[Read More](./README_PROJECT_INTEGRATION.md)

## Google Analytics

Canoe is currently instrumented to submit data to google anlaytics if configured at the project level

[Read More](./README_GOOGLE_ANALYTICS.md)
