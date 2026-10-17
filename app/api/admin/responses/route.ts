import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseStorageAdmin =
  supabaseUrl && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : null;
const REFERENCE_BUCKET = "survey-reference-images";

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { success: false, error: "يلزم تسجيل الدخول لعرض البيانات" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "تعذر عرض الإحصاءات: أضف SUPABASE_SECRET_KEY إلى متغيرات الخادم ثم أعد النشر." },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const message = /invalid api key/i.test(error.message)
        ? "مفتاح Supabase الخاص بلوحة الإدارة غير صالح. حدّث SUPABASE_SECRET_KEY أو SUPABASE_SERVICE_ROLE_KEY من إعدادات المشروع الصحيح."
        : error.message;
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    const dataWithAttachments = await Promise.all((data ?? []).map(async (item) => {
      const match = typeof item.notes === "string"
        ? item.notes.match(/صورة مرجعية مرفقة: ([a-f0-9-]+\.(?:jpg|png|webp))/i)
        : null;
      if (!match || !supabaseStorageAdmin) return { ...item, attachment_url: null };
      const { data: signed, error: signedUrlError } = await supabaseStorageAdmin.storage
        .from(REFERENCE_BUCKET)
        .createSignedUrl(match[1], 60 * 10);
      return { ...item, attachment_url: signedUrlError ? null : signed.signedUrl };
    }));

    return NextResponse.json({ success: true, data: dataWithAttachments }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
