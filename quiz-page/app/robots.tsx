
import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/signup' ]
    },
    sitemap: 'https://committees-quiz.vercel.app/sitemap.xml',
  }
}
