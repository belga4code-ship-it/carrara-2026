"use client";

import { useEffect, useState } from "react";

interface ResponseItem {
  id: string;
  created_at: string;
  has_problem: boolean;
  problem_details: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  visitor_role: string | null;
  visitor_role_other?: string | null;
  interests?: string[];
  project_type?: string | null;
  project_type_other?: string | null;
  quality_rating: string | null;
  variety_rating?: string | null;
  price_rating?: string | null;
  previous_dealing?: string | null;
  sales_contact?: string | null;
  branch: string | null;
  invoice_no: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "complaints" | "all">("analytics");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<ResponseItem | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/responses");
      const data = await res.json();
      if (data.success) {
        setResponses(data.data || []);
      }
    } catch (err) {
      console.error("فشل في جلب البيانات", err);
    } finally {
      setLoading(false);
    }
  };

  // --- دالة تصدير البيانات إلى Excel المعالجة والمحدثة ---
  const exportToExcel = () => {
    if (responses.length === 0) {
      alert("لا توجد بيانات متاحة للتصدير حالياً.");
      return;
    }

    const headers = [
      "الرقم التعريفي",
      "تاريخ التسجيل",
      "نوع المشاركة",
      "الاسم الكامل",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "صفة الزائر",
      "نوع المشروع",
      "رقم الفاتورة",
      "الفرع",
      "تفاصيل الشكوى / الملاحظة",
      "جودة التشطيب",
      "تنوع المنتجات",
      "تقييم الأسعار",
      "المنتجات المهتم بها",
      "ملاحظات إضافية"
    ];

    // تنظيف النصوص لمنع انكسار أسطر Excel
    const cleanCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val)
        .replace(/"/g, '""')       // مضاعفة علامات التنصيص
        .replace(/[\r\n]+/g, " "); // استبدال الأسطر الجديدة بمسافات
      return `"${str}"`;
    };

    const rows = responses.map((item) => [
      cleanCell(item.id),
      cleanCell(new Date(item.created_at).toLocaleString("ar-LY")),
      cleanCell(item.has_problem ? "شكوى" : "استبيان"),
      cleanCell(item.full_name),
      cleanCell(item.phone),
      cleanCell(item.email || "-"),
      cleanCell(item.visitor_role || "-"),
      cleanCell(item.project_type || "-"),
      cleanCell(item.invoice_no || "-"),
      cleanCell(item.branch || "-"),
      cleanCell(item.problem_details || "-"),
      cleanCell(item.quality_rating || "-"),
      cleanCell(item.variety_rating || "-"),
      cleanCell(item.price_rating || "-"),
      cleanCell(Array.isArray(item.interests) ? item.interests.join(" - ") : "-"),
      cleanCell(item.notes || "-")
    ]);

    // إضافة توجيه sep=, لإجبار الإكسيل على الفصل بالفاصلة بشكل متناسق
    const csvLines = [
      "sep=,",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.join(","))
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.setAttribute("href", url);
    link.setAttribute("download", `استبيانات_وشكاوى_قرارة_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- دالة إنشاء رابط الواتساب المباشر ---
  const getWhatsAppLink = (phone: string, name: string, invoice?: string | null) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "218" + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("218")) {
      cleanPhone = "218" + cleanPhone;
    }
    const message = encodeURIComponent(
      `أهلاً بك أ. ${name}، نحن فريق خدمة العملاء بشركة قرارة للرخام والجرانيت. بخصوص مشاركتك معنا في استبيان المعرض (فاتورة: ${invoice || "غير محدد"})...`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // --- حسابات الإحصائيات والنسب المئوية ---
  const totalCount = responses.length;
  const totalComplaints = responses.filter((r) => r.has_problem).length;
  const totalSurveys = totalCount - totalComplaints;
  
  const satisfactionRate = totalCount > 0 
    ? Math.round((totalSurveys / totalCount) * 100) 
    : 0;

  const branches = Array.from(new Set(responses.map((r) => r.branch).filter(Boolean))) as string[];

  const getDistribution = (key: keyof ResponseItem) => {
    const counts: { [key: string]: number } = {};
    let totalValid = 0;

    responses.forEach((r) => {
      const val = r[key];
      if (val && typeof val === "string") {
        counts[val] = (counts[val] || 0) + 1;
        totalValid++;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalValid > 0 ? Math.round((count / totalValid) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getInterestsDistribution = () => {
    const counts: { [key: string]: number } = {};
    let totalInterestsCount = 0;

    responses.forEach((r) => {
      if (Array.isArray(r.interests)) {
        r.interests.forEach((item) => {
          counts[item] = (counts[item] || 0) + 1;
          totalInterestsCount++;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalInterestsCount > 0 ? Math.round((count / totalInterestsCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const qualityStats = getDistribution("quality_rating");
  const priceStats = getDistribution("price_rating");
  const roleStats = getDistribution("visitor_role");
  const interestStats = getInterestsDistribution();

  const filteredResponses = responses.filter((item) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "complaints"
        ? item.has_problem
        : true;

    const matchesBranch = branchFilter === "all" || item.branch === branchFilter;

    const matchesSearch =
      (item.full_name && item.full_name.includes(searchTerm)) ||
      (item.phone && item.phone.includes(searchTerm)) ||
      (item.invoice_no && item.invoice_no.includes(searchTerm));

    return matchesTab && matchesBranch && matchesSearch;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* الهيدر العلوي */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-500">لوحة تحليل البيانات والإحصائيات</h1>
              <span className="bg-amber-950/80 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-800/40">
                شركة قرارة للرخام والجرانيت
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">متابعة الأداء، تحليل تفضيلات الزوار، والمعالجة الفورية للشكاوى</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              📥 تصدير Excel منظم
            </button>

            <button
              onClick={fetchResponses}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              🔄 تحديث
            </button>
          </div>
        </div>

        {/* كروت المؤشرات الرئيسية (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span className="text-slate-400 text-xs font-bold block mb-1">إجمالي المشاركات</span>
            <div className="text-3xl font-black text-white">{totalCount}</div>
            <span className="text-xs text-slate-500 mt-1 block">استبيان وشكوى مسجلة</span>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/40 p-5 rounded-2xl shadow-lg">
            <span className="text-emerald-400 text-xs font-bold block mb-1">نسبة الرضا العامة</span>
            <div className="text-3xl font-black text-emerald-400">{satisfactionRate}%</div>
            <span className="text-xs text-emerald-400/60 mt-1 block">تقييمات إيجابية دون شكاوى</span>
          </div>

          <div className="bg-red-950/30 border border-red-900/40 p-5 rounded-2xl shadow-lg">
            <span className="text-red-400 text-xs font-bold block mb-1">الشكاوى والملاحظات</span>
            <div className="text-3xl font-black text-red-400">{totalComplaints}</div>
            <span className="text-xs text-red-400/60 mt-1 block">تستوجب التدخل والتواصل</span>
          </div>

          <div className="bg-sky-950/30 border border-sky-900/40 p-5 rounded-2xl shadow-lg">
            <span className="text-sky-400 text-xs font-bold block mb-1">الاستبيانات المكتملة</span>
            <div className="text-3xl font-black text-sky-400">{totalSurveys}</div>
            <span className="text-xs text-sky-400/60 mt-1 block">استبيان شامل البيانات</span>
          </div>
        </div>

        {/* أزرار التبويب (Tabs) */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-1/3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "analytics" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📊 الرسومات البيانية
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`w-1/3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "complaints" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            ⚠️️ الشكاوى ({totalComplaints})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`w-1/3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "all" ? "bg-slate-700 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📋 السجل الكامل
          </button>
        </div>

        {/* قسم 1: لوحة التحليلات والرسومات البيانية */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. تقييم جودة التشطيب والمعروضات */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                <span>⭐</span> جودة التشطيب
              </h3>
              {qualityStats.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات مسجلة بعد.</p>
              ) : (
                qualityStats.map((st) => (
                  <div key={st.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">{st.name}</span>
                      <span className="text-amber-400">{st.percentage}% ({st.count})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${st.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 2. تقييم الأسعار */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                <span>💰</span> ملاءمة الأسعار
              </h3>
              {priceStats.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات مسجلة بعد.</p>
              ) : (
                priceStats.map((st) => (
                  <div key={st.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">{st.name}</span>
                      <span className="text-amber-400">{st.percentage}% ({st.count})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${st.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3. المنتجات الأكثر طلباً واهتماماً */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                <span>🏛️</span> المنتجات الأكثر اهتماماً
              </h3>
              {interestStats.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات كافية.</p>
              ) : (
                interestStats.map((st) => (
                  <div key={st.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300 truncate max-w-[150px]">{st.name}</span>
                      <span className="text-emerald-400">{st.count} زائر</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${st.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 4. توزيع صفات الزوار */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-sky-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                <span>👷‍♂️</span> صفة الزوار
              </h3>
              {roleStats.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات كافية.</p>
              ) : (
                roleStats.map((st) => (
                  <div key={st.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300 truncate max-w-[150px]">{st.name}</span>
                      <span className="text-sky-400">{st.percentage}% ({st.count})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${st.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* قسم 2 و 3: جداول البيانات */}
        {(activeTab === "complaints" || activeTab === "all") && (
          <div className="space-y-4">
            
            {/* أدوات البحث والفلترة */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="بحث باسم الزائر، رقم الهاتف، أو رقم الفاتورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-96 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />

              {/* فلتر الفروع */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">الفرع:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
                >
                  <option value="all">جميع الفروع</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* الجدول */}
            {loading ? (
              <div className="text-center py-12 text-slate-500 font-bold">جاري تحميل البيانات...</div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-12 text-slate-600 bg-slate-900/40 rounded-2xl border border-slate-800">
                لا توجد نتائج مطابقة للبحث أو الفلتر.
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-slate-800">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الاسم والهاتف</th>
                      <th className="p-4">الفاتورة والفرع</th>
                      <th className="p-4">تفاصيل الشكوى / الملاحظة</th>
                      <th className="p-4">تقييم الجودة</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4 text-center">الإجراء والتواصل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResponses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          {item.has_problem ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800/50">
                              ⚠️ شكوى
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                              ✅ استبيان
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{item.full_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{item.phone}</div>
                          {item.visitor_role && <div className="text-xs text-amber-500/80 mt-0.5">{item.visitor_role}</div>}
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded w-max border border-slate-800">
                            {item.invoice_no || "غير محدد"}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{item.branch || "-"}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          {item.problem_details ? (
                            <p className="text-red-200 text-xs font-medium leading-relaxed bg-red-950/40 p-2.5 rounded-xl border border-red-900/40 truncate">
                              {item.problem_details}
                            </p>
                          ) : item.notes ? (
                            <p className="text-slate-300 text-xs leading-relaxed truncate">{item.notes}</p>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {item.quality_rating ? (
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/40">
                              {item.quality_rating}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-400">
                          {new Date(item.created_at).toLocaleDateString("ar-LY")}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={getWhatsAppLink(item.phone, item.full_name, item.invoice_no)}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-emerald-500/30 flex items-center gap-1"
                              title="تواصل مباشر عبر الواتساب"
                            >
                              💬 واتساب
                            </a>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-slate-700"
                            >
                              عرض
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* نافذة تفاصيل الاستبيان/الشكوى (Modal) */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-right">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-amber-500">تفاصيل السجل الكاملة</h2>
                  {selectedItem.has_problem ? (
                    <span className="bg-red-950 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-800">
                      شكوى
                    </span>
                  ) : (
                    <span className="bg-emerald-950 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-800">
                      استبيان
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {/* بيانات الزائر */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase">البيانات الأساسية</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">الاسم: </span><span className="font-bold text-white">{selectedItem.full_name}</span></div>
                  <div><span className="text-slate-500">الهاتف: </span><span className="font-mono text-amber-400">{selectedItem.phone}</span></div>
                  <div><span className="text-slate-500">الصفة: </span><span className="text-slate-300">{selectedItem.visitor_role || "غير محدد"}</span></div>
                  <div><span className="text-slate-500">نوع المشروع: </span><span className="text-slate-300">{selectedItem.project_type || "غير محدد"}</span></div>
                  <div><span className="text-slate-500">الفاتورة: </span><span className="font-mono text-slate-300">{selectedItem.invoice_no || "-"}</span></div>
                  <div><span className="text-slate-500">الفرع: </span><span className="text-slate-300">{selectedItem.branch || "-"}</span></div>
                </div>
              </div>

              {/* تفاصيل الشكوى */}
              {selectedItem.problem_details && (
                <div className="bg-red-950/30 p-4 rounded-2xl border border-red-900/50 space-y-1">
                  <h3 className="text-xs font-extrabold text-red-400 uppercase">نص الشكوى / الملاحظة:</h3>
                  <p className="text-sm text-red-200 leading-relaxed font-medium whitespace-pre-wrap">{selectedItem.problem_details}</p>
                </div>
              )}

              {/* الاهتمامات والتقييمات */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase">الاهتمامات والتقييمات</h3>
                
                {selectedItem.interests && selectedItem.interests.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1.5">المنتجات المهتم بها:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.interests.map((int, i) => (
                        <span key={i} className="bg-slate-800 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700">
                          {int}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">جودة المعروضات:</span>
                    <span className="font-bold text-amber-400">{selectedItem.quality_rating || "لم يحدد"}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">تنوع المنتجات:</span>
                    <span className="font-bold text-amber-400">{selectedItem.variety_rating || "لم يحدد"}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">الأسعار:</span>
                    <span className="font-bold text-amber-400">{selectedItem.price_rating || "لم يحدد"}</span>
                  </div>
                </div>
              </div>

              {/* الملاحظات */}
              {selectedItem.notes && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase">ملاحظات إضافية:</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <a
                  href={getWhatsAppLink(selectedItem.phone, selectedItem.full_name, selectedItem.invoice_no)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold py-2.5 rounded-xl transition text-sm flex justify-center items-center gap-2"
                >
                  💬 فتح دردشة واتساب للعميل
                </a>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-2.5 rounded-xl transition text-sm"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}