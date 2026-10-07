/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Magnanimous shares pure capability planners with the Worker. Next/Turbopack
  // resolves only inside its project root by default, so use the repository root
  // rather than duplicating brain logic into the frontend.
  turbopack: {
    root: path.join(__dirname, '..'),
  },
};
module.exports = nextConfig;
