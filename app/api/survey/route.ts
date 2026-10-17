import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The public survey endpoint uses the publishable key and relies on database RLS.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
const REFERENCE_BUCKET = "survey-reference-images";
const MAX_REFERENCE_IMAGE_SIZE = 5 * 1024 * 1024;

function hasValidImageSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  }
  if (contentType === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (contentType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "إعدادات الاتصال بقاعدة البيانات غير متوفرة" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const getString = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };
    const parseStringArray = (key: string): string[] => {
      try {
        const value: unknown = JSON.parse(getString(key));
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 20) : [];
      } catch {
        return [];
      }
    };
    const newsletterOptIn = getString("newsletterOptIn") === "true";
    const email = getString("email").trim();
    if (newsletterOptIn && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صحيح للموافقة على استلام العروض" },
        { status: 400 }
      );
    }
    const noPurchaseReasons = parseStringArray("noPurchaseReasons");
    const imageEntry = formData.get("referenceImage");
    const referenceImage = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;
    if (referenceImage && referenceImage.size > MAX_REFERENCE_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت" }, { status: 413 });
    }
    if (referenceImage && !["image/jpeg", "image/png", "image/webp"].includes(referenceImage.type)) {
      return NextResponse.json({ success: false, error: "الأنواع المقبولة للصور هي JPG وPNG وWebP" }, { status: 415 });
    }
    const varietyDetails = getString("varietyDetails").trim().slice(0, 1000);
    const salesContactDetails = getString("salesContactDetails").trim().slice(0, 1000);
    const exhibitionDetails = getString("exhibitionDetails").trim().slice(0, 1000);
    const missingMaterial = getString("missingMaterial").trim().slice(0, 500);
    const notes = [
      getString("notes").trim().slice(0, 3000),
      noPurchaseReasons.length ? `أسباب عدم إتمام الشراء: ${noPurchaseReasons.join("، ")}${getString("noPurchaseReasonOther") ? ` — ${getString("noPurchaseReasonOther").trim().slice(0, 500)}` : ""}` : "",
      varietyDetails ? `تفاصيل تنوع الخامات: ${varietyDetails}` : "",
      salesContactDetails ? `تفاصيل تجربة المبيعات: ${salesContactDetails}` : "",
      exhibitionDetails ? `تفاصيل تجربة الجناح: ${exhibitionDetails}` : "",
      missingMaterial ? `خامة غير متوفرة: ${missingMaterial}` : "",
      getString("exhibitionRating") ? `تقييم تجربة جناح المعرض: ${getString("exhibitionRating")}` : "",
      newsletterOptIn ? "موافقة على استلام أخبار المنتجات والعروض عبر البريد الإلكتروني: نعم" : "",
    ];
    const phone = getString("phone").trim();
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
    if (getString("hasProblem") === "true" && !getString("problemDetails").trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة تفاصيل المشكلة" },
        { status: 400 }
      );
    }

    let uploadedImagePath: string | null = null;
    if (referenceImage) {
      if (!supabaseAdmin) {
        return NextResponse.json(
          { success: false, error: "رفع الصور يحتاج إعداد SUPABASE_SECRET_KEY أو SUPABASE_SERVICE_ROLE_KEY على الخادم" },
          { status: 503 }
        );
      }
      const bytes = new Uint8Array(await referenceImage.arrayBuffer());
      if (!hasValidImageSignature(bytes, referenceImage.type)) {
        return NextResponse.json({ success: false, error: "محتوى الملف لا يطابق نوع الصورة" }, { status: 415 });
      }

      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      if (bucketsError) {
        return NextResponse.json({ success: false, error: "تعذر التحقق من مساحة رفع الصور" }, { status: 500 });
      }
      if (!buckets?.some((bucket) => bucket.name === REFERENCE_BUCKET)) {
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket(REFERENCE_BUCKET, {
          public: false,
          fileSizeLimit: "5MB",
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        });
        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
          console.error("Storage bucket creation error:", createBucketError);
          return NextResponse.json({ success: false, error: "تعذر تجهيز مساحة حفظ الصور في Supabase" }, { status: 500 });
        }
      }

      const extension = referenceImage.type === "image/jpeg" ? "jpg" : referenceImage.type === "image/png" ? "png" : "webp";
      uploadedImagePath = `${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(REFERENCE_BUCKET)
        .upload(uploadedImagePath, bytes, { contentType: referenceImage.type, upsert: false, cacheControl: "3600" });
      if (uploadError) {
        console.error("Reference image upload error:", uploadError);
        return NextResponse.json({ success: false, error: "تعذر رفع الصورة، حاول مرة أخرى" }, { status: 500 });
      }
    }

    const submittedNotes = [
      ...notes.filter(Boolean),
      uploadedImagePath ? `صورة مرجعية مرفقة: ${uploadedImagePath}` : "",
    ].filter(Boolean).join("\n\n");
    const body = {
      hasProblem: getString("hasProblem") === "true",
      problemDetails: getString("problemDetails"),
      fullName: getString("fullName"),
      visitorRole: getString("visitorRole"),
      visitorRoleOther: getString("visitorRoleOther"),
      interests: parseStringArray("interests"),
      projectType: getString("projectType"),
      projectTypeOther: getString("projectTypeOther"),
      qualityRating: getString("qualityRating"),
      varietyRating: getString("varietyRating"),
      priceRating: getString("priceRating"),
      previousDealing: getString("previousDealing"),
      salesContact: getString("salesContact"),
      invoiceNo: getString("invoiceNo"),
      branch: getString("branch"),
    };
    const { error } = await supabase
      .from("survey_responses")
      .insert([
        {
          has_problem: body.hasProblem ?? true,
          problem_details: body.problemDetails || null,
          full_name: typeof body.fullName === "string" && body.fullName.trim() ? body.fullName.trim() : "زائر",
          phone: normalizedPhone,
          email: newsletterOptIn ? email : null,
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
          notes: submittedNotes || null,
          invoice_no: body.invoiceNo || null,
          branch: body.branch || null,
        },
      ]);

    if (error) {
      console.error("Database Insert Error:", error);
      if (uploadedImagePath && supabaseAdmin) {
        await supabaseAdmin.storage.from(REFERENCE_BUCKET).remove([uploadedImagePath]);
      }
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
  } catch (err: unknown) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
