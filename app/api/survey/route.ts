import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    // التحقق فقط من وجود تفاصيل المشكلة عند الإرسال المباشر للشكوى
    if (body.hasProblem && !body.problemDetails?.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة تفاصيل المشكلة" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("survey_responses")
      .insert([
        {
          has_problem: body.hasProblem ?? true,
          problem_details: body.problemDetails || null,
          full_name: body.fullName || "شكوى مباشرة (بدون اسم)",
          phone: body.phone || "غير محدد",
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
      ])
      .select();

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
        message: "تم حفظ الشكوى بنجاح",
        data: data ? data[0] : null,
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