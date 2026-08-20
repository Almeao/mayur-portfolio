const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",

  basePath: process.env.NEXT_PUBLIC_BASE_PATH || (isProd ? "/mayur-portfolio" : ""),

  images: {
    unoptimized: true,
  },
};

export default nextConfig;