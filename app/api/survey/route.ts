import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The public survey endpoint uses the publishable key and relies on database RLS.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "إعدادات الاتصال بقاعدة البيانات غير متوفرة" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const normalizedPhone = phone
      .replace(/[٠-٩]/g, (digit: string) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[۰-۹]/g, (digit: string) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
    const phoneDigits = normalizedPhone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال رقم هاتف صحيح" },
        { status: 400 }
      );
    }

    // التحقق فقط من وجود تفاصيل المشكلة عند الإرسال المباشر للشكوى
    if (body.hasProblem && !body.problemDetails?.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة تفاصيل المشكلة" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("survey_responses")
      .insert([
        {
          has_problem: body.hasProblem ?? true,
          problem_details: body.problemDetails || null,
          full_name: typeof body.fullName === "string" && body.fullName.trim() ? body.fullName.trim() : "زائر",
          phone: normalizedPhone,
          email: body.email || null,
          visitor_role: body.visitorRole || null,
          visitor_role_other: body.visitorRoleOther || null,
          interests: Array.isArray(body.interests) ? body.interests : [],
          project_type: body.projectType || null,
          project_type_other: body.projectTypeOther || null,
          quality_rating: body.qualityRating || null,
          variety_rating: body.varietyRating || null,
          price_rating: body.priceRating || null,
          previous_dealing: body.previousDealing || null,
          sales_contact: body.salesContact || null,
          notes: body.notes || null,
          invoice_no: body.invoiceNo || null,
          branch: body.branch || null,
        },
      ]);

    if (error) {
      console.error("Database Insert Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "تم حفظ المشاركة بنجاح",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
