import type { LoaderArgs } from '@remix-run/server-runtime'

// TODO: Dynamically generate the routes to include in the sitemap

// eslint-disable-next-line unused-imports/no-unused-vars
export async function loader({ request }: LoaderArgs) {
  // Fetch the data for the sitemap if needed

  const urls = [
    { loc: 'https://birdfeed.ai/', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '1' },
    {
      loc: 'https://birdfeed.ai/join/step/1',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      loc: 'https://birdfeed.ai/login',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.8',
    },
    { loc: 'https://birdfeed.ai/', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '1' },
    { loc: 'https://birdfeed.ai/privacy', lastmod: '2023-06-17T19:27:12.941Z', changefreq: 'yearly', priority: '0.1' },
    { loc: 'https://birdfeed.ai/terms', lastmod: '2023-06-17T19:27:12.941Z', changefreq: 'yearly', priority: '0.1' },
  ]

  let xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  `

  for (const url of urls) {
    xml += `
      <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
      </url>
    `
  }

  xml += `</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'xml-version': '1.0',
      encoding: 'UTF-8',
    },
  })
}
