// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: (config, { isServer }) => {
//     if (isServer) {
//       config.externals = config.externals || [];
//       config.externals.push("docusign-esign");
//        config.externals.push("twilio");
//     }
//     return config;
//   },

//   // ✅ Remove deprecated top-level key
//   // If you absolutely need it, move it inside experimental:
//   // experimental: {
//   //   serverComponentsExternalPackages: ["docusign-esign"],
//   // },
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce unnecessary response headers.
  poweredByHeader: false,

  // Keep production response compression enabled.
  compress: true,

  // Optimize imports from large icon libraries.
  // This can reduce the JavaScript needed by pages using these packages.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];

      // Keep server-only integrations external.
      config.externals.push("docusign-esign");
      config.externals.push("twilio");
    }

    return config;
  },
};

export default nextConfig;