/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID,
  },
};

export default nextConfig;
