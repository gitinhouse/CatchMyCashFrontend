// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: (config, { isServer }) => {
//     if (isServer) {
//       config.externals = config.externals || [];
//       config.externals.push('docusign-esign');
//     }
//     return config;
//   },
//   serverComponentsExternalPackages: ['docusign-esign'],
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("docusign-esign");
    }
    return config;
  },

  // ✅ Remove deprecated top-level key
  // If you absolutely need it, move it inside experimental:
  // experimental: {
  //   serverComponentsExternalPackages: ["docusign-esign"],
  // },
};

export default nextConfig;
