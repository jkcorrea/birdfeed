const { flatRoutes } = require('remix-flat-routes')

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  serverDependenciesToBundle: [
    /^langchain*/,
    'p-queue',
    'p-timeout',
    'gpt-3-encoder',
    'gpt3-tokenizer',
    'eventemitter3',
  ],
  routes: (defineRoutes) => flatRoutes('routes', defineRoutes),
  future: {
    unstable_tailwind: true,
  },
}
