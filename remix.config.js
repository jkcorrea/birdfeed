const { flatRoutes } = require('remix-flat-routes')

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  serverDependenciesToBundle: [
    'langchain/llms',
    'langchain/prompts',
    'langchain/text_splitter',
    'p-queue',
    'p-timeout',
    'gpt-3-encoder',
  ],
  routes: (defineRoutes) => flatRoutes('routes', defineRoutes),
  future: {
    unstable_tailwind: true,
  },
}
