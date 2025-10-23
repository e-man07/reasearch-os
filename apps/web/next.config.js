/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@research-os/core',
    '@research-os/mcp-connectors',
    '@research-os/agents',
    '@research-os/ingestion',
    '@research-os/rag',
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Disable static generation errors - pages with useSearchParams will be dynamic
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
