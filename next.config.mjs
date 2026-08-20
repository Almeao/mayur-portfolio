const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",

  basePath: process.env.NEXT_PUBLIC_BASE_PATH || (isProd ? "/mayurr" : ""),

  images: {
    unoptimized: true,
  },
};

export default nextConfig;