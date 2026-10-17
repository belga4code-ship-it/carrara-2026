import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  hasAdminAuthConfig,
  verifyAdminPassword,
  verifyAdminSession,
} from "@/lib/admin-auth";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8,
};

export async function GET(request: NextRequest) {
  const authenticated = verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return NextResponse.json(
    { authenticated },
    { status: authenticated ? 200 : 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  if (!hasAdminAuthConfig()) {
    return NextResponse.json(
      { error: "إعدادات دخول لوحة الإدارة غير مكتملة على الخادم" },
      { status: 503 }
    );
  }

  let password: unknown;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "بيانات الدخول غير صالحة" }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = createAdminSessionToken();
  if (!token) return NextResponse.json({ error: "تعذر بدء جلسة الإدارة" }, { status: 503 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, cookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
