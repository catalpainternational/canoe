# Canoe Google Analytics

Canoe is currently instrumented to submit data to google anlaytics if configured at the project level

Projects should set the GA_TAG variable in their environment configuration, and configure the following custom dimensions and metrics in the Google Analytics administration site

## Custom Dimensions

| Custom Dimension Name    | Scope |
| :----------------------- | :---- |
| User Id                  | Hit   |
| Groups                   | Hit   |
| Lesson                   | Hit   |
| Question                 | Hit   |
| Answer                   | Hit   |

## Custom Metrics

| Custom Metric Name                  | Scope | Formatting Type |
| :---------------------------------- | :---- | :-------------- |
| Is a Correct Answer                 | Hit   | Integer         |


