"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface FormDataState {
  hasProblem: boolean | null;
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
  priceRating: string;
  previousDealing: string;
  salesContact: string;
  notes: string;
  branch: string;
}

const initialFormData: FormDataState = {
  hasProblem: null,
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
  priceRating: "",
  previousDealing: "",
  salesContact: "",
  notes: "",
  branch: "الإدارة الرئيسية",
};

function SurveyFormContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<FormDataState>(initialFormData);

  // التاريخ الحالي تلقائياً بتنسيق YYYY-MM-DD
  const currentDate = new Date().toISOString().split("T")[0];

  // قراءة الفرع ديناميكياً من رابط الـ QR إن وجد
  useEffect(() => {
    const branch = searchParams.get("branch") || "الإدارة الرئيسية";
    setFormData((prev) => ({ ...prev, branch }));
  }, [searchParams]);

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
    if (!formData.fullName.trim()) newErrors.fullName = "يرجى إدخال الاسم الكامل";
    if (!formData.phone.trim()) newErrors.phone = "يرجى إدخال رقم الهاتف";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSurvey = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.visitorRole) newErrors.visitorRole = "يرجى تحديد صفة الزائر";

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

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep(4); // الانتقال لصفحة الشكر والنجاح
      } else {
        const errorData = await response.json();
        alert(`حدث خطأ: ${errorData.error || "فشل إرسال البيانات"}`);
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
      alert("تعذر الاتصال بالخادم، يرجى التأكد من الاتصال بالإنترنت.");
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
    setErrors({});
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
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 font-sans text-right">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* الهيدر مع شعار الفيل وزر الإحصائيات */}
        <div className="bg-slate-900 p-6 text-center text-white border-b-4 border-amber-600 relative">
          
          <Link
            href="/admin"
            className="absolute left-4 top-4 bg-slate-800/90 hover:bg-slate-700 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="عرض لوحة الإحصائيات والشكاوى"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>الإحصائيات</span>
          </Link>

          {/* شعار الفيل والهوية البصرية */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-amber-300 shadow-md flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-400 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C9.5 2 7.5 3.5 6.8 5.6C5.1 6.2 4 7.8 4 9.7C4 11.2 4.8 12.5 6 13.3V18C6 19.1 6.9 20 8 20H9C10.1 20 11 19.1 11 18V17H13V18C13 19.1 13.9 20 15 20H16C17.1 20 18 19.1 18 18V13.3C19.2 12.5 20 11.2 20 9.7C20 7.8 18.9 6.2 17.2 5.6C16.5 3.5 14.5 2 12 2M12 4C13.7 4 15 5.3 15 7C15 8.7 13.7 10 12 10C10.3 10 9 8.7 9 7C9 5.3 10.3 4 12 4M7.5 14C8.3 14 9 13.3 9 12.5C9 11.7 8.3 11 7.5 11C6.7 11 6 11.7 6 12.5C6 13.3 6.7 14 7.5 14M16.5 14C17.3 14 18 13.3 18 12.5C18 11.7 17.3 11 16.5 11C15.7 11 15 11.7 15 12.5C15 13.3 15.7 14 16.5 14Z" />
              </svg>
            </div>
          </div>

          <span className="text-amber-500 text-xs font-bold tracking-wider uppercase bg-amber-950/60 px-3 py-1 rounded-full border border-amber-600/30">
            تأسست 1991
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-wide">شركة قرارة للرخام والجرانيت</h1>
          <p className="text-slate-300 text-xs mt-1 font-medium">استبيان الزوار | {formData.branch}</p>

          {/* شريط التقدم */}
          {step < 4 && (
            <div className="w-full bg-slate-800 h-2 absolute bottom-0 left-0 overflow-hidden">
              <div
                className="bg-amber-500 h-2 transition-all duration-500 ease-out shadow-lg"
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
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">أهلاً بك في الإدارة الرئيسية</h2>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
                  يرجى إدخال اسمك الكريم ورقم الهاتف للمتابعة إلى الاستبيان:
                </p>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-xs text-slate-900 flex justify-between items-center shadow-sm">
                <span className="text-slate-600 font-medium">تاريخ اليوم:</span>
                <span className="font-semibold text-slate-900">{currentDate}</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">
                    الاسم الكامل: <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({...formData, fullName: e.target.value});
                      if (errors.fullName) clearError("fullName");
                    }}
                    placeholder="ادخل اسمك الكريم..."
                    className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 focus:outline-none transition ${
                      errors.fullName ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">
                    رقم الهاتف / الواتساب: <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    placeholder="091XXXXXXX"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (errors.phone) clearError("phone");
                    }}
                    className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 focus:outline-none transition ${
                      errors.phone ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              <button 
                onClick={handleNextFromStep1}
                className="w-full bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-600/20 text-base mt-4"
              >
                الانتقال إلى الاستبيان ←
              </button>
            </div>
          )}

          {/* الخطوة 2: الاستبيان الشامل */}
          {step === 2 && (
            <div className="space-y-8">
              
              {/* تفاصيل الزائر */}
              <div className="space-y-4 border-b border-slate-200 pb-6">
                <h3 className="text-base font-black text-amber-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-600 rounded-full"></span>
                  أولاً: تفاصيل الزائر
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">البريد الإلكتروني (اختياري):</label>
                  <input 
                    type="email"
                    placeholder="example@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    صفة الزائر / جهة العمل: <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 text-sm">
                    {[
                      "مهندس معماري / مصمم داخلي",
                      "صاحب مشروع (سكني / تجاري)",
                      "مقاول / شركة مقاولات",
                      "تاجر / موزع",
                      "زائر مهتم / جهة أخرى"
                    ].map((role) => (
                      <label key={role} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                        <input 
                          type="radio" 
                          name="visitorRole" 
                          value={role} 
                          checked={formData.visitorRole === role}
                          onChange={(e) => {
                            setFormData({...formData, visitorRole: e.target.value});
                            if (errors.visitorRole) clearError("visitorRole");
                          }}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500" 
                        />
                        <span className="font-semibold text-slate-800">{role}</span>
                      </label>
                    ))}
                    {formData.visitorRole === "زائر مهتم / جهة أخرى" && (
                      <input 
                        type="text"
                        placeholder="يرجى التحديد..."
                        value={formData.visitorRoleOther}
                        onChange={(e) => setFormData({...formData, visitorRoleOther: e.target.value})}
                        className="w-full mt-2 border-2 border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:border-amber-600 focus:outline-none"
                      />
                    )}
                  </div>
                  {errors.visitorRole && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.visitorRole}</p>}
                </div>
              </div>

              {/* الاهتمامات والمشاريع */}
              <div className="space-y-4 border-b border-slate-200 pb-6">
                <h3 className="text-base font-black text-amber-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-600 rounded-full"></span>
                  ثانياً: طبيعة الاهتمامات والمشاريع
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    1. ما هي المنتجات التي أثارت اهتمامك؟
                  </label>
                  <div className="space-y-2 text-sm">
                    {[
                      "رخام محلي / مستورد (ألواح / بلاط)",
                      "جرانيت بأنواعه المختلفة",
                      "رخام للواجهات والتلبيس الخارجي",
                      "مطابخ وأحواض",
                      "أعمال قص وتفصيل خاصة (CNC)"
                    ].map((product) => (
                      <label key={product} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                        <input 
                          type="checkbox" 
                          checked={formData.interests.includes(product)}
                          onChange={() => handleInterestChange(product)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" 
                        />
                        <span className="font-semibold text-slate-800">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">2. نوع المشروع:</label>
                  <div className="space-y-2 text-sm">
                    {["فيلا / منزل سكني خاص", "عمارة سكنية / تجارية", "فندق / منتجع", "مجمع تجاري / مكتب", "أخرى"].map((proj) => (
                      <label key={proj} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                        <input 
                          type="radio" 
                          name="projectType" 
                          value={proj} 
                          checked={formData.projectType === proj}
                          onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500" 
                        />
                        <span className="font-semibold text-slate-800">{proj}</span>
                      </label>
                    ))}
                    {formData.projectType === "أخرى" && (
                      <input 
                        type="text"
                        placeholder="يرجى تحديد نوع المشروع..."
                        value={formData.projectTypeOther}
                        onChange={(e) => setFormData({...formData, projectTypeOther: e.target.value})}
                        className="w-full mt-2 border-2 border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:border-amber-600 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* التقييم الشامل */}
              <div className="space-y-6 border-b border-slate-200 pb-6">
                <h3 className="text-base font-black text-amber-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-600 rounded-full"></span>
                  ثالثاً: تقييم المعرض والمنتجات والخدمة
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">1. تقييم جودة التشطيب والمعروضات:</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["ممتاز", "جيد جداً", "متوسط", "بحاجة لتحسين"].map((q) => (
                      <label 
                        key={q} 
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.qualityRating === q 
                            ? "border-amber-600 bg-amber-50 text-amber-900" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="qualityRating" 
                          value={q} 
                          checked={formData.qualityRating === q}
                          onChange={(e) => setFormData({...formData, qualityRating: e.target.value})}
                          className="w-4 h-4 text-amber-600" 
                        />
                        <span>{q}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">2. تقييم تنوع المنتجات والخيارات المتاحة:</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["ممتاز", "جيد جداً", "متوسط", "بحاجة لتحسين"].map((v) => (
                      <label 
                        key={v} 
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.varietyRating === v 
                            ? "border-amber-600 bg-amber-50 text-amber-900" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="varietyRating" 
                          value={v} 
                          checked={formData.varietyRating === v}
                          onChange={(e) => setFormData({...formData, varietyRating: e.target.value})}
                          className="w-4 h-4 text-amber-600" 
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">3. تقييم الأسعار مقارنة بالجودة:</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["مناسبة جداً", "معقولة", "مرتفعة نوعاً ما", "مرتفعة جداً"].map((p) => (
                      <label 
                        key={p} 
                        className={`flex items-center gap-2 border-2 p-3 rounded-xl cursor-pointer transition font-semibold ${
                          formData.priceRating === p 
                            ? "border-amber-600 bg-amber-50 text-amber-900" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="priceRating" 
                          value={p} 
                          checked={formData.priceRating === p}
                          onChange={(e) => setFormData({...formData, priceRating: e.target.value})}
                          className="w-4 h-4 text-amber-600" 
                        />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* الملاحظات أو الشكاوى والإرسال */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">ملاحظات، مقترحات أو شكاوى إضافية:</label>
                  <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value, problemDetails: e.target.value})}
                    placeholder="اكتب أي اقتراح أو شكوى أو استفسار إضافي..."
                    className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-amber-600 focus:outline-none transition"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button 
                    onClick={submitSurvey}
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg text-base flex justify-center items-center gap-2 disabled:opacity-50"
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
                    className="w-full border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition text-sm"
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
                <h2 className="text-2xl font-black text-slate-900">شكراً لحسن تعاونكم!</h2>
                <p className="text-slate-600 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  تم استلام مشاركتكم بنجاح في الإدارة الرئيسية. نعتز بزيارتكم وثقتكم بشركة قرارة للرخام والجرانيت.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-2.5 rounded-xl border border-slate-300 text-sm transition shadow-sm"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-600">جاري التحميل...</div>}>
      <SurveyFormContent />
    </Suspense>
  );
}