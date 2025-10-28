/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('docusign-esign');
    }
    return config;
  },
  serverComponentsExternalPackages: ['docusign-esign'],
};

export default nextConfig;
