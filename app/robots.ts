import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Protect private routes from indexing
    },
    sitemap: 'https://innovate-grade-master-2-0.vercel.app/sitemap.xml',
  };
}