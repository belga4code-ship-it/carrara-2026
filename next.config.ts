import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تحديد المجلد الحالي كجذر لـ Turbopack لمنع الخطأ
  experimental: {
    // تركها فارغة أو ضبط الجذر حسب الحاجة، أو استخدام إعدادات turbopack المباشرة:
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;