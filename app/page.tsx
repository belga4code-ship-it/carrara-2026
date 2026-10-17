"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface FormDataState {
  hasProblem: boolean;
  problemDetails: string;
  fullName: string;
  phone: string;
  email: string;
  visitorRole: string;
  visitorRoleOther: string;
  interests: string[];
  projectType: string;
  projectTypeOther: string;
  qualityRating: string;
  varietyRating: string;
  varietyDetails: string;
  priceRating: string;
  previousDealing: string;
  noPurchaseReasons: string[];
  noPurchaseReasonOther: string;
  newsletterOptIn: boolean;
  salesContact: string;
  salesContactDetails: string;
  exhibitionRating: string;
  exhibitionDetails: string;
  missingMaterial: string;
  notes: string;
  branch: string;
}

const initialFormData: FormDataState = {
  hasProblem: false,
  problemDetails: "",
  fullName: "",
  phone: "",
  email: "",
  visitorRole: "",
  visitorRoleOther: "",
  interests: [],
  projectType: "",
  projectTypeOther: "",
  qualityRating: "",
  varietyRating: "",
  varietyDetails: "",
  priceRating: "",
  previousDealing: "",
  noPurchaseReasons: [],
  noPurchaseReasonOther: "",
  newsletterOptIn: false,
  salesContact: "",
  salesContactDetails: "",
  exhibitionRating: "",
  exhibitionDetails: "",
  missingMaterial: "",
  notes: "",
  branch: "الإدارة الرئيسية",
};

function SurveyFormContent() {
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") || "الإدارة الرئيسية";
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  const [formData, setFormData] = useState<FormDataState>(() => ({ ...initialFormData, branch }));

  // عرض التاريخ حسب التوقيت المحلي وبصيغة عربية
  const currentDate = new Intl.DateTimeFormat("ar-LY", { dateStyle: "long" }).format(new Date());

  const handleInterestChange = (interest: string) => {
    setFormData((prev) => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    const normalizedPhone = formData.phone
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
    const phoneDigits = normalizedPhone.replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "يرجى إدخال رقم الهاتف";
    else if (phoneDigits.length < 7 || phoneDigits.length > 15) newErrors.phone = "أدخل رقمًا صحيحًا من 7 إلى 15 رقمًا";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSurvey = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.visitorRole) newErrors.visitorRole = "يرجى تحديد صفة الزائر";
    if (formData.visitorRole === "جهة أخرى" && !formData.visitorRoleOther.trim()) {
      newErrors.visitorRoleOther = "يرجى تحديد صفتك";
    }
    if (formData.projectType === "أخرى" && !formData.projectTypeOther.trim()) {
      newErrors.projectTypeOther = "يرجى تحديد نوع المشروع";
    }
    if (formData.previousDealing === "زرت المعرض دون شراء" && formData.noPurchaseReasons.length === 0) {
      newErrors.noPurchaseReasons = "اختر سببًا واحدًا على الأقل";
    }
    if (formData.previousDealing === "زرت المعرض دون شراء" && formData.noPurchaseReasons.includes("سبب آخر") && !formData.noPurchaseReasonOther.trim()) {
      newErrors.noPurchaseReasonOther = "يرجى توضيح السبب الآخر";
    }
    if (formData.email.trim() && !formData.newsletterOptIn) {
      newErrors.newsletterOptIn = "فعّل الموافقة إذا رغبت في حفظ بريدك لاستلام العروض";
    }
    if (formData.newsletterOptIn && !formData.email.trim()) {
      newErrors.email = "أدخل بريدك الإلكتروني للاشتراك في التحديثات";
    } else if (formData.newsletterOptIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "أدخل بريدًا إلكترونيًا صحيحًا";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setStep(2); // الانتقال المباشر للاستبيان
    }
  };

  const submitSurvey = async () => {
    if (!validateSurvey()) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const submission = new FormData();
      const payload = {
        ...formData,
        phone: formData.phone
          .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
          .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
          .trim(),
        fullName: formData.fullName.trim(),
      };
      Object.entries(payload).forEach(([key, value]) => {
        submission.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
      });
      if (referenceImage) submission.append("referenceImage", referenceImage);
      const response = await fetch("/api/survey", {
        method: "POST",
        body: submission,
      });

      if (response.ok) {
        setSubmitError("");
        setStep(4); // الانتقال لصفحة الشكر والنجاح
      } else {
        const errorData = await response.json().catch(() => null);
        setSubmitError(errorData.error || "فشل إرسال البيانات. يرجى المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
      setSubmitError("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleResetForm = () => {
    setFormData({
      ...initialFormData,
      branch: formData.branch,
    });
    setReferenceImage(null);
    setErrors({});
    setSubmitError("");
    setStep(1);
  };

  const getProgressPercentage = () => {
    switch (step) {
      case 1: return 33;
      case 2: return 75;
      case 4: return 100;
      default: return 0;
    }
  };

  return (
    <div dir="rtl" className="survey-page min-h-screen flex items-center justify-center p-3 sm:p-6 font-sans text-right">
      <div className="survey-card max-w-xl w-full rounded-3xl shadow-2xl overflow-hidden border">

        {/* الهيدر مع شعار الفيل وزر الإحصائيات */}
        <div className="bg-slate-900 p-6 text-center text-white border-b-4 border-yellow-400 relative">

          <Link
            href="/admin"
            className="absolute left-4 top-4 bg-slate-800/90 hover:bg-slate-700 text-yellow-300 hover:text-yellow-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="عرض لوحة الإحصائيات والشكاوى"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>الإحصائيات</span>
          </Link>

          {/* شعار الشركة */}
          <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-200 p-1 shadow-lg">
            <Image src="/carrara-elephant-logo.webp" alt="شعار شركة قرارة" width={512} height={512} priority className="h-full w-full rounded-full object-cover" />
          </div>
          <span className="text-yellow-400 text-xs font-bold tracking-wider uppercase bg-yellow-950/60 px-3 py-1 rounded-full border border-yellow-400/30">
            تأسست 1991
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-wide">شركة قرارة للرخام والجرانيت</h1>
          <p className="text-slate-300 text-xs mt-1 font-medium">استبيان الزوار | {formData.branch}</p>

          {/* شريط التقدم */}
          {step < 4 && (
            <div className="w-full bg-slate-800 h-2 absolute bottom-0 left-0 overflow-hidden">
              <div
                className="bg-yellow-400 h-2 transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">

          {/* الخطوة 1: البيانات الأساسية */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-yellow-950/40 text-yellow-300 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-100">أهلاً بك في {formData.branch}</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  رقم الهاتف مطلوب للتواصل معك، أما الاسم فيمكنك تركه فارغًا.
                </p>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-400/20 p-3.5 rounded-2xl text-xs text-slate-100 flex justify-between items-center shadow-sm">
                <span className="text-slate-400 font-medium">تاريخ اليوم:</span>
                <span className="font-semibold text-slate-100">{currentDate}</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-1.5">
                    الاسم (اختياري):
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({...formData, fullName: e.target.value});
                      if (errors.fullName) clearError("fullName");
                    }}
                    autoComplete="name"
                    placeholder="اكتب اسمك إن رغبت"
                    className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-100 bg-slate-950 focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 focus:outline-none transition ${
                      errors.fullName ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-1.5">
                    رقم الهاتف / الواتساب: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    required
                    placeholder="09XXXXXXXX أو +2189XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (errors.phone) clearError("phone");
                    }}
                    className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-100 bg-slate-950 focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 focus:outline-none transition ${
                      errors.phone ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              <button
                onClick={handleNextFromStep1}
                className="w-full bg-yellow-400 hover:bg-yellow-300 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-yellow-400/20 text-base mt-4"
              >
                الانتقال إلى الاستبيان ←
              </button>
            </div>
          )}

          {/* الخطوة 2: الاستبيان الشامل */}
          {step === 2 && (
            <div className="space-y-8">

              {/* تفاصيل الزائر */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <h3 className="text-base font-black text-yellow-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  أولاً: تفاصيل الزائر
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">
                    صفة الزائر / جهة العمل: <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 text-sm">
                    {[
                      "زائر مهتم",
                      "مهندس معماري / مصمم داخلي",
                      "صاحب مشروع (سكني / تجاري)",
                      "مقاول / شركة مقاولات",
                      "تاجر / موزع",
                      "جهة أخرى"
                    ].map((role) => (
                      <label key={role} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/70 cursor-pointer transition">
                        <input
                          type="radio"
                          name="visitorRole"
                          value={role}
                          checked={formData.visitorRole === role}
                          onChange={(e) => {
                            setFormData({...formData, visitorRole: e.target.value});
                            if (errors.visitorRole) clearError("visitorRole");
                            if (errors.visitorRoleOther) clearError("visitorRoleOther");
                          }}
                          className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                        />
                        <span className="font-semibold text-slate-200">{role}</span>
                      </label>
                    ))}
                    {formData.visitorRole === "جهة أخرى" && (
                      <input
                        type="text"
                        placeholder="يرجى التحديد..."
                        value={formData.visitorRoleOther}
                        onChange={(e) => {
                          setFormData({...formData, visitorRoleOther: e.target.value});
                          if (errors.visitorRoleOther) clearError("visitorRoleOther");
                        }}
                        className="w-full mt-2 border-2 border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-slate-100 focus:border-yellow-400 focus:outline-none"
                      />
                    )}
                  </div>
                  {errors.visitorRole && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.visitorRole}</p>}
                  {errors.visitorRoleOther && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.visitorRoleOther}</p>}
                </div>
              </div>

              <div className="space-y-4 border-b border-slate-700 pb-6">
                <h3 className="text-base font-black text-yellow-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  هل سبق لك التعامل مع الشركة؟
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["هذه أول زيارة", "زرت المعرض دون شراء", "نعم، سبق لي الشراء"].map((answer) => (
                    <label key={answer} className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition cursor-pointer ${formData.previousDealing === answer ? "border-yellow-400 bg-yellow-950/40 text-yellow-100" : "border-slate-700 text-slate-300 hover:bg-slate-800/70"}`}>
                      <input type="radio" name="previousDealing" value={answer} checked={formData.previousDealing === answer} onChange={(event) => setFormData({ ...formData, previousDealing: event.target.value, qualityRating: event.target.value === "نعم، سبق لي الشراء" ? formData.qualityRating : "", noPurchaseReasons: event.target.value === "زرت المعرض دون شراء" ? formData.noPurchaseReasons : [], noPurchaseReasonOther: event.target.value === "زرت المعرض دون شراء" ? formData.noPurchaseReasonOther : "" })} className="h-4 w-4 accent-yellow-400" />
                      <span>{answer}</span>
                    </label>
                  ))}
                </div>
                {formData.previousDealing === "زرت المعرض دون شراء" && (
                  <div className="rounded-2xl border border-yellow-400/30 bg-yellow-950/20 p-4 space-y-3">
                    <label className="block text-sm font-bold text-slate-100">ما الأسباب التي حالت دون إتمام الشراء؟ <span className="font-normal text-slate-400">(يمكن اختيار أكثر من سبب)</span></label>
                    {["الأسعار لم تناسب ميزانيتي", "لم أجد نوع الخام الذي أبحث عنه", "لم أجد اللون أو التصميم المناسب", "الكمية المطلوبة لم تكن متوفرة", "وجدت خيارات أنسب لدى شركة أخرى", "سبب آخر"].map((reason) => (
                      <label key={reason} className="flex items-center gap-2.5 rounded-xl border border-slate-700 p-2.5 text-sm text-slate-200 hover:bg-slate-800/70 cursor-pointer">
                        <input type="checkbox" checked={formData.noPurchaseReasons.includes(reason)} onChange={() => { setFormData((prev) => ({ ...prev, noPurchaseReasons: prev.noPurchaseReasons.includes(reason) ? prev.noPurchaseReasons.filter((item) => item !== reason) : [...prev.noPurchaseReasons, reason] })); if (errors.noPurchaseReasons) clearError("noPurchaseReasons"); }} className="h-4 w-4 accent-yellow-400" />
                        <span>{reason}</span>
                      </label>
                    ))}
                    {formData.noPurchaseReasons.includes("سبب آخر") && <input type="text" value={formData.noPurchaseReasonOther} onChange={(event) => { setFormData({ ...formData, noPurchaseReasonOther: event.target.value }); if (errors.noPurchaseReasonOther) clearError("noPurchaseReasonOther"); }} placeholder="يرجى توضيح السبب الآخر" className="w-full rounded-xl border-2 border-slate-600 bg-slate-950 p-3 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none" />}
                    {errors.noPurchaseReasons && <p className="text-red-400 text-xs font-semibold">{errors.noPurchaseReasons}</p>}
                    {errors.noPurchaseReasonOther && <p className="text-red-400 text-xs font-semibold">{errors.noPurchaseReasonOther}</p>}
                  </div>
                )}
              </div>
              {/* الاهتمامات والمشاريع */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <h3 className="text-base font-black text-yellow-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  ثانياً: طبيعة الاهتمامات والمشاريع
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">
                    1. ما الخامات والمنتجات التي تفكر في استخدامها في مشروعك؟ <span className="font-normal text-slate-400">(يمكن اختيار أكثر من خيار)</span>
                  </label>
                  <div className="space-y-2 text-sm">
                    {[
                      "رخام طبيعي محلي أو مستورد",
                      "جرانيت",
                      "كوارتز وأسطح للمطابخ",
                      "رخام وجرانيت للواجهات",
                      "أحواض ودرج وديكورات",
                      "قص وتفصيل حسب الطلب (CNC)"
                    ].map((product) => (
                      <label key={product} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/70 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(product)}
                          onChange={() => handleInterestChange(product)}
                          className="w-4 h-4 rounded text-yellow-400 focus:ring-yellow-400"
                        />
                        <span className="font-semibold text-slate-200">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">2. ما نوع المشروع الذي تبحث عن المواد له؟</label>
                  <div className="space-y-2 text-sm">
                    {[
                      { name: "سكني", examples: "فلل، منازل، شقق، عمارات سكنية، استراحات" },
                      { name: "تجاري", examples: "محلات، معارض، مكاتب، مقرات شركات، مجمعات تجارية" },
                      { name: "ضيافة وسياحة", examples: "فنادق، منتجعات، مطاعم، مقاهٍ، قاعات مناسبات" },
                      { name: "خدمي ومؤسسات", examples: "مستشفيات، عيادات، مدارس، جامعات، مصارف" },
                      { name: "مرافق عامة", examples: "حدائق، ملاعب، ساحات، نوافير ومعالم عامة" },
                      { name: "صناعي", examples: "مصانع، مستودعات، ورش ومرافق إنتاج" },
                      { name: "أخرى", examples: "نوع مشروع آخر" },
                    ].map((project) => (
                      <label key={project.name} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${formData.projectType === project.name ? "border-yellow-400 bg-yellow-950/40" : "border-slate-700 hover:bg-slate-800/70"}`}>
                        <input
                          type="radio"
                          name="projectType"
                          value={project.name}
                          checked={formData.projectType === project.name}
                          onChange={(e) => {
                            setFormData({...formData, projectType: e.target.value});
                            if (errors.projectTypeOther) clearError("projectTypeOther");
                          }}
                          className="mt-0.5 h-4 w-4 accent-yellow-400"
                        />
                        <span><span className="block font-bold text-slate-100">{project.name}</span><span className="mt-0.5 block text-xs font-medium text-slate-400">{project.examples}</span></span>
                      </label>
                    ))}
                    {formData.projectType === "أخرى" && (
                      <input
                        type="text"
                        placeholder="يرجى تحديد نوع المشروع..."
                        value={formData.projectTypeOther}
                        onChange={(e) => {
                          setFormData({...formData, projectTypeOther: e.target.value});
                          if (errors.projectTypeOther) clearError("projectTypeOther");
                        }}
                        className="w-full mt-2 border-2 border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-slate-100 focus:border-yellow-400 focus:outline-none"
                      />
                    )}
                    {errors.projectTypeOther && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.projectTypeOther}</p>}
                  </div>
                </div>
              </div>

              {/* التقييم الشامل */}
              <div className="space-y-6 border-b border-slate-700 pb-6">
                <h3 className="text-base font-black text-yellow-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  ثالثاً: تقييم المعرض والمنتجات والخدمة
                </h3>

                {formData.previousDealing === "نعم، سبق لي الشراء" && <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">1. ما مدى رضاك عن جودة المنتجات ومستوى التشطيب؟</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["ممتاز", "جيد جداً", "متوسط", "بحاجة إلى تحسين"].map((q) => (
                      <label
                        key={q}
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.qualityRating === q
                            ? "border-yellow-400 bg-yellow-950/40 text-yellow-100"
                            : "border-slate-700 hover:bg-slate-800/70 text-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="qualityRating"
                          value={q}
                          checked={formData.qualityRating === q}
                          onChange={(e) => setFormData({...formData, qualityRating: e.target.value})}
                          className="w-4 h-4 text-yellow-400"
                        />
                        <span>{q}</span>
                      </label>
                    ))}
                  </div>
                </div>}

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">2. هل وجدت خيارات تناسب احتياجاتك؟</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["نعم", "لا"].map((v) => (
                      <label
                        key={v}
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.varietyRating === v
                            ? "border-yellow-400 bg-yellow-950/40 text-yellow-100"
                            : "border-slate-700 hover:bg-slate-800/70 text-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="varietyRating"
                          value={v}
                          checked={formData.varietyRating === v}
                          onChange={(e) => setFormData({ ...formData, varietyRating: e.target.value, varietyDetails: e.target.value === "لا" ? formData.varietyDetails : "" })}
                          className="w-4 h-4 text-yellow-400"
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                  {formData.varietyRating === "لا" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">ما أنواع أو خيارات الخامات التي كنت تبحث عنها؟ <span className="font-normal text-slate-400">(اختياري)</span></label>
                      <textarea rows={2} value={formData.varietyDetails} onChange={(event) => setFormData({ ...formData, varietyDetails: event.target.value })} placeholder="اكتب الأنواع أو الخيارات التي تقترح إضافتها." className="w-full rounded-xl border-2 border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">كيف تقيّم تعامل فريق المبيعات وسرعة الاستجابة؟</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["ممتاز", "جيد جداً", "مقبول", "بحاجة إلى تحسين", "لم أتحدث مع فريق المبيعات"].map((rating) => (
                      <label key={rating} className="flex items-center gap-2 rounded-xl border-2 border-slate-700 p-3 font-semibold text-slate-200 transition hover:bg-slate-800/70">
                        <input type="radio" name="salesContact" value={rating} checked={formData.salesContact === rating} onChange={(event) => setFormData({ ...formData, salesContact: event.target.value, salesContactDetails: event.target.value === "بحاجة إلى تحسين" ? formData.salesContactDetails : "" })} className="h-4 w-4 text-yellow-400" />
                        <span>{rating}</span>
                      </label>
                    ))}
                  </div>
                  {formData.salesContact === "بحاجة إلى تحسين" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">ما الذي كان يمكن تحسينه؟ <span className="font-normal text-slate-400">(اختياري)</span></label>
                      <textarea rows={2} value={formData.salesContactDetails} onChange={(event) => setFormData({ ...formData, salesContactDetails: event.target.value })} placeholder="مثلاً: لم يتوفر من يساعدني، أو لم تكن معلومات المنتج واضحة." className="w-full rounded-xl border-2 border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">3. كيف ترى الأسعار مقارنة بالجودة؟</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["مناسبة جداً", "مناسبة", "مرتفعة قليلاً", "مرتفعة جداً", "لم أتعرف على الأسعار بعد"].map((p) => (
                      <label
                        key={p}
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.priceRating === p
                            ? "border-yellow-400 bg-yellow-950/40 text-yellow-100"
                            : "border-slate-700 hover:bg-slate-800/70 text-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="priceRating"
                          value={p}
                          checked={formData.priceRating === p}
                          onChange={(e) => setFormData({...formData, priceRating: e.target.value})}
                          className="w-4 h-4 text-yellow-400"
                        />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2">كيف تقيّم تجربة جناح شركة قرارة في المعرض؟</label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {["ممتازة", "متوسطة", "بحاجة إلى تحسين"].map((rating) => (
                      <label key={rating} className={`flex items-center gap-2 rounded-xl border-2 p-3 font-semibold cursor-pointer transition ${formData.exhibitionRating === rating ? "border-yellow-400 bg-yellow-950/40 text-yellow-100" : "border-slate-700 text-slate-200 hover:bg-slate-800/70"}`}>
                        <input type="radio" name="exhibitionRating" value={rating} checked={formData.exhibitionRating === rating} onChange={(event) => setFormData({ ...formData, exhibitionRating: event.target.value, exhibitionDetails: event.target.value === "بحاجة إلى تحسين" ? formData.exhibitionDetails : "" })} className="h-4 w-4 accent-yellow-400" />
                        <span>{rating}</span>
                      </label>
                    ))}
                  </div>
                  {formData.exhibitionRating === "بحاجة إلى تحسين" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">ما الذي تقترح تحسينه؟ <span className="font-normal text-slate-400">(اختياري)</span></label>
                      <textarea rows={2} value={formData.exhibitionDetails} onChange={(event) => setFormData({ ...formData, exhibitionDetails: event.target.value })} placeholder="اكتب اقتراحك لتحسين تجربة الجناح." className="w-full rounded-xl border-2 border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none" />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-100 mb-1.5">هل توجد خامة معينة لم تجدها متوفرة في المعرض؟ <span className="font-medium text-slate-400">(اختياري)</span></label>
                    <input type="text" value={formData.missingMaterial} onChange={(event) => setFormData({ ...formData, missingMaterial: event.target.value })} placeholder="اكتب اسم الخامة إن وجدت" className="w-full rounded-xl border-2 border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-100 mb-1">أرفق صورة مرجعية <span className="font-medium text-slate-400">(اختياري، JPG أو PNG أو WebP، حتى 5 ميغابايت)</span></label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                        setReferenceImage(null);
                        setErrors((prev) => ({ ...prev, referenceImage: file.size > 5 * 1024 * 1024 ? "حجم الصورة يجب ألا يتجاوز 5 ميغابايت" : "الأنواع المقبولة: JPG وPNG وWebP" }));
                        event.target.value = "";
                        return;
                      }
                      setReferenceImage(file);
                      clearError("referenceImage");
                    }} className="block w-full text-sm text-slate-300 file:ml-3 file:rounded-lg file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:font-bold file:text-slate-950 hover:file:bg-yellow-300" />
                    {referenceImage && <p className="mt-1 text-xs text-slate-400">تم اختيار: {referenceImage.name}</p>}
                    {errors.referenceImage && <p className="mt-1 text-xs font-semibold text-red-400">{errors.referenceImage}</p>}
                    {!process.env.NEXT_PUBLIC_SUPABASE_URL && <p className="mt-1 text-xs text-yellow-200">رفع الصور يحتاج إعداد اتصال Supabase على الخادم.</p>}
                  </div>
                </div>
              </div>

              {/* الملاحظات أو الشكاوى والإرسال */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-yellow-400/30 bg-slate-950 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-100 mb-1.5">البريد الإلكتروني <span className="font-medium text-slate-400">(اختياري)</span></label>
                    <p className="mb-2 text-xs leading-relaxed text-slate-400">لإرسال تحديثات المنتجات الجديدة والعروض والتخفيضات فقط.</p>
                    <input type="email" dir="ltr" placeholder="name@example.com" value={formData.email} onChange={(event) => { setFormData({ ...formData, email: event.target.value }); if (errors.email) clearError("email"); }} className="w-full rounded-xl border-2 border-slate-700 bg-slate-900 p-3 text-sm font-semibold text-slate-100 focus:border-yellow-400 focus:outline-none" />
                    {errors.email && <p className="mt-1 text-xs font-semibold text-red-400">{errors.email}</p>}
                  </div>
                  <label className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={formData.newsletterOptIn} onChange={(event) => { setFormData({ ...formData, newsletterOptIn: event.target.checked }); if (errors.newsletterOptIn) clearError("newsletterOptIn"); }} className="mt-1 h-4 w-4 accent-yellow-400" />
                    <span>أوافق على استلام أخبار المنتجات والعروض عبر البريد الإلكتروني. <span className="text-slate-400">(اختياري)</span></span>
                  </label>
                  {errors.newsletterOptIn && <p className="text-xs font-semibold text-red-400">{errors.newsletterOptIn}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-1.5">ملاحظات إضافية (اختياري):</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value, problemDetails: e.target.value})}
                    placeholder="ما الذي أعجبك؟ وما الذي تقترح إضافته أو تحسينه؟"
                    className="w-full border-2 border-slate-600 bg-slate-950 rounded-xl p-3 text-sm font-semibold text-slate-100 focus:border-yellow-400 focus:outline-none transition"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  {submitError && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</p>
                  )}
                  <button
                    onClick={submitSurvey}
                    disabled={isSubmitting}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold py-3.5 rounded-xl transition duration-200 shadow-lg text-base flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      "إرسال الاستبيان بالكامل"
                    )}
                  </button>

                  <button
                    onClick={handleBack}
                    className="w-full border border-slate-600 text-slate-400 font-semibold py-2.5 rounded-xl hover:bg-slate-800/70 transition text-sm"
                  >
                    ← العودة للخطوة السابقة
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* الخطوة 4: تأكيد النجاح */}
          {step === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-100">شكراً لحسن تعاونكم!</h2>
                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  تم استلام مشاركتكم بنجاح في {formData.branch}. نعتز بزيارتكم وثقتكم بشركة قرارة للرخام والجرانيت.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-6 py-2.5 rounded-xl border border-slate-600 text-sm transition shadow-sm"
                >
                  تعبئة استبيان جديد
                </button>
              </div>

              <p className="text-xs text-slate-400 pt-4 font-semibold">جميع الحقوق محفوظة © 2026 - شركة قرارة للرخــــــام والجرانيت</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center font-bold text-slate-400">جاري التحميل...</div>}>
      <SurveyFormContent />
    </Suspense>
  );
}
