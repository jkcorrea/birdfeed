/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  serverDependenciesToBundle: ["langchain/llms", "langchain/prompts", "langchain/text_splitter", "p-queue", "p-timeout"],
  future: {
    unstable_tailwind: true,
    v2_routeConvention: true,
  }
};
