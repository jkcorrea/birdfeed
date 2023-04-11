const { flatRoutes } = require('remix-flat-routes')

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  serverDependenciesToBundle: [
    'langchain/text_splitter',
    'langchain/llms',
    'p-queue',
    'p-timeout',
    'gpt-3-encoder',
    'gpt3-tokenizer',
    'eventemitter3',
    'lodash-es',
  ],
  routes: (defineRoutes) => flatRoutes('routes', defineRoutes),
  future: {
    unstable_tailwind: true,
    v2_errorBoundary: true,
  },
}
