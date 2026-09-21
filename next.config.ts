import type { NextConfig } from "next";
const nextConfig: NextConfig = { devIndicators: false, distDir: process.env.TEST_AI_FIXTURE === "true" ? ".next/ai-test" : ".next" };
export default nextConfig;
