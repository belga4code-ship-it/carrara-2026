"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";

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
  attachment_url?: string | null;
}

export default function AdminDashboard() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterReferenceTime] = useState(() => Date.now());
  const [responsesError, setResponsesError] = useState("");
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "complaints" | "all">("analytics");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "7" | "30">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedItem, setSelectedItem] = useState<ResponseItem | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setResponsesError("");
    try {
      const res = await fetch("/api/admin/responses");
      if (res.status === 401) {
        setAuthStatus("unauthenticated");
        setResponses([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setResponses(data.data || []);
      } else {
        setResponses([]);
        setResponsesError(data.error || "تعذر تحميل الردود.");
      }
    } catch (err) {
      console.error("فشل في جلب البيانات", err);
      setResponsesError("تعذر الاتصال بالخادم لتحميل الردود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then(async (response) => {
        if (response.ok) {
          setAuthStatus("authenticated");
          await fetchResponses();
        } else {
          setAuthStatus("unauthenticated");
          setLoading(false);
        }
      })
      .catch(() => {
        setAuthStatus("unauthenticated");
        setLoading(false);
      });
  }, [fetchResponses]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.error || "تعذر تسجيل الدخول. حاول مرة أخرى.");
        return;
      }
      setPassword("");
      setAuthStatus("authenticated");
      await fetchResponses();
    } catch {
      setAuthError("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setResponses([]);
    setSelectedItem(null);
    setAuthStatus("unauthenticated");
  };

  if (authStatus === "checking") {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <p role="status" className="font-semibold text-slate-300">جارٍ التحقق من تسجيل الدخول...</p>
      </main>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">🔒</div>
            <h1 className="text-2xl font-black text-amber-400">دخول لوحة الإحصائيات</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">أدخل كلمة المرور للمتابعة إلى بيانات الزوار.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <label htmlFor="admin-password" className="block text-sm font-bold text-slate-200">كلمة المرور</label>
            <input
              id="admin-password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-lg tracking-[0.4em] text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              aria-describedby={authError ? "admin-auth-error" : undefined}
            />
            {authError && <p id="admin-auth-error" role="alert" className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-300">{authError}</p>}
            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className="w-full rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAuthenticating ? "جارٍ التحقق..." : "دخول"}
            </button>
          </form>
        </section>
      </main>
    );
  }
  // --- دالة تصدير البيانات إلى Excel المعالجة والمحدثة ---
  const exportToExcel = () => {
    if (filteredResponses.length === 0) {
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
      "تعامل سابق",
      "نوع المشروع",
      "تقييم فريق المبيعات",
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
    const cleanCell = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val)
        .replace(/"/g, '""')       // مضاعفة علامات التنصيص
        .replace(/[\r\n]+/g, " "); // استبدال الأسطر الجديدة بمسافات
      return `"${str}"`;
    };

    const rows = filteredResponses.map((item) => [
      cleanCell(item.id),
      cleanCell(new Date(item.created_at).toLocaleString("ar-LY")),
      cleanCell(item.has_problem ? "شكوى" : "استبيان"),
      cleanCell(item.full_name),
      cleanCell(item.phone),
      cleanCell(item.email || "-"),
      cleanCell(item.visitor_role || "-"),
      cleanCell(item.previous_dealing || "-"),
      cleanCell(item.project_type || "-"),
      cleanCell(item.sales_contact || "-"),
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
  const branches = Array.from(new Set(responses.map((r) => r.branch).filter(Boolean))) as string[];
  const roles = Array.from(new Set(responses.map((r) => r.visitor_role).filter(Boolean))) as string[];
  const projects = Array.from(new Set(responses.map((r) => r.project_type).filter(Boolean))) as string[];
  const filteredResponses = responses
    .filter((item) => {
      const matchesTab = activeTab !== "complaints" || item.has_problem;
      const query = searchTerm.trim().toLocaleLowerCase("ar");
      const matchesSearch = !query || [item.full_name, item.phone, item.invoice_no, item.branch]
        .some((value) => value?.toLocaleLowerCase("ar").includes(query));
      const matchesDate = periodFilter === "all" || filterReferenceTime - new Date(item.created_at).getTime() <= Number(periodFilter) * 24 * 60 * 60 * 1000;
      return matchesTab && matchesSearch && matchesDate &&
        (branchFilter === "all" || item.branch === branchFilter) &&
        (roleFilter === "all" || item.visitor_role === roleFilter) &&
        (projectFilter === "all" || item.project_type === projectFilter);
    })
    .sort((a, b) => (sortOrder === "newest" ? 1 : -1) * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

  const totalCount = filteredResponses.length;
  const totalComplaints = filteredResponses.filter((r) => r.has_problem).length;
  const totalSurveys = totalCount - totalComplaints;
  const surveyShare = totalCount > 0 ? Math.round((totalSurveys / totalCount) * 100) : 0;

  const getDistribution = (key: keyof ResponseItem) => {
    const counts: { [key: string]: number } = {};
    let totalValid = 0;

    filteredResponses.forEach((r) => {
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

    filteredResponses.forEach((r) => {
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

  const getNotesDistribution = (prefix: string) => {
    const counts: Record<string, number> = {};
    filteredResponses.forEach((item) => {
      const line = item.notes?.split(/\r?\n/).find((entry) => entry.startsWith(prefix));
      const value = line?.slice(prefix.length).trim();
      if (value) counts[value] = (counts[value] || 0) + 1;
    });
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  };

  const qualityStats = getDistribution("quality_rating");
  const varietyStats = getDistribution("variety_rating");
  const priceStats = getDistribution("price_rating");
  const salesStats = getDistribution("sales_contact");
  const roleStats = getDistribution("visitor_role");
  const projectStats = getDistribution("project_type");
  const dealingStats = getDistribution("previous_dealing");
  const branchStats = getDistribution("branch");
  const interestStats = getInterestsDistribution();
  const exhibitionStats = getNotesDistribution("تقييم تجربة جناح المعرض:");
  const analyticsCards = [
    { title: "جودة المنتجات والتشطيب", icon: "✦", stats: qualityStats },
    { title: "توفر الخيارات المناسبة", icon: "✓", stats: varietyStats },
    { title: "تجربة فريق المبيعات", icon: "◉", stats: salesStats },
    { title: "تقييم الأسعار", icon: "د.ل", stats: priceStats },
    { title: "تجربة جناح المعرض", icon: "⌂", stats: exhibitionStats },
    { title: "صفة الزوار", icon: "♙", stats: roleStats },
    { title: "نوع المشروع", icon: "▦", stats: projectStats },
    { title: "التعامل السابق", icon: "↗", stats: dealingStats },
    { title: "الفروع", icon: "⌖", stats: branchStats },
    { title: "المنتجات الأكثر اهتمامًا", icon: "◇", stats: interestStats },
  ];

  const exportToPdf = () => {
    if (responses.length === 0) {
      alert("لا توجد بيانات متاحة لإعداد التقرير حالياً.");
      return;
    }
    window.print();
  };

  return (
    <>
    <div dir="rtl" className="admin-screen min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* الهيدر العلوي */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/carrara-elephant-logo.webp" alt="شعار شركة قرارة" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full border border-amber-500/50 bg-white object-cover" />
              <h1 className="text-2xl sm:text-3xl font-black text-amber-500">لوحة تحليل البيانات والإحصائيات</h1>
              <span className="bg-amber-950/80 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-800/40">
                شركة قرارة للرخام والجرانيت
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">متابعة الأداء، تحليل تفضيلات الزوار، والمعالجة الفورية للشكاوى</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportToPdf}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              📄 تصدير التقرير PDF
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold transition"
            >
              تسجيل الخروج
            </button>
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

        {responsesError && (
          <div role="alert" className="rounded-2xl border border-amber-700/50 bg-amber-950/50 px-5 py-4 text-sm font-semibold leading-7 text-amber-200">
            {responsesError}
          </div>
        )}

        {/* كروت المؤشرات الرئيسية (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="dashboard-kpi border-amber-500/30">
            <span>إجمالي المشاركات</span>
            <strong>{totalCount}</strong>
            <small>استبيانات وشكاوى مسجلة</small>
          </div>
          <div className="dashboard-kpi border-emerald-500/30">
            <span>الاستبيانات المكتملة</span>
            <strong className="text-emerald-400">{totalSurveys}</strong>
            <small>مشاركة تضمنت تقييمًا للمعرض</small>
          </div>
          <div className="dashboard-kpi border-red-500/30">
            <span>الشكاوى</span>
            <strong className="text-red-400">{totalComplaints}</strong>
            <small>تحتاج إلى المتابعة</small>
          </div>
          <div className="dashboard-kpi border-sky-500/30">
            <span>نسبة الاستبيانات</span>
            <strong className="text-sky-400">{surveyShare}%</strong>
            <small>من إجمالي المشاركات</small>
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

        <div className="dashboard-filters rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <input type="text" placeholder="ابحث بالاسم أو الهاتف أو الفاتورة أو الفرع..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="dashboard-filter-input" />
          <select aria-label="تصفية حسب الفرع" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="dashboard-filter-input">
            <option value="all">جميع الفروع</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <select aria-label="تصفية حسب صفة الزائر" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="dashboard-filter-input">
            <option value="all">كل صفات الزوار</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select aria-label="تصفية حسب نوع المشروع" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="dashboard-filter-input">
            <option value="all">كل أنواع المشاريع</option>{projects.map((project) => <option key={project} value={project}>{project}</option>)}
          </select>
          <select aria-label="تصفية حسب الفترة" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as "all" | "7" | "30")} className="dashboard-filter-input">
            <option value="all">كل الفترات</option><option value="7">آخر 7 أيام</option><option value="30">آخر 30 يومًا</option>
          </select>
          <select aria-label="ترتيب الردود" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")} className="dashboard-filter-input">
            <option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option>
          </select>
          <div className="dashboard-filter-summary">
            <span>النتائج المعروضة</span><strong>{filteredResponses.length} <small>من {responses.length}</small></strong>
            <button type="button" onClick={() => { setSearchTerm(""); setBranchFilter("all"); setRoleFilter("all"); setProjectFilter("all"); setPeriodFilter("all"); setSortOrder("newest"); }}>مسح الفلاتر</button>
          </div>
        </div>

        {/* قسم 1: لوحة التحليلات والرسومات البيانية */}
        {activeTab === "analytics" && (
          <div className="dashboard-chart-grid">
            {analyticsCards.map((card) => (
              <section key={card.title} className="dashboard-chart-card">
                <h3><span aria-hidden="true">{card.icon}</span>{card.title}</h3>
                {card.stats.length === 0 ? (
                  <p className="dashboard-empty">لا توجد بيانات كافية لهذا المؤشر.</p>
                ) : (
                  <div className="space-y-4">
                    {card.stats.map((stat) => (
                      <div key={stat.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate font-semibold text-slate-200">{stat.name}</span>
                          <span className="shrink-0 font-bold text-amber-300">{stat.count} <span className="text-slate-500">({stat.percentage}%)</span></span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={`${stat.name}: ${stat.count}، ${stat.percentage}%`}>
                          <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-amber-600 transition-all duration-500" style={{ width: `${stat.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* قسم 2 و 3: جداول البيانات */}
        {(activeTab === "complaints" || activeTab === "all") && (
          <div className="space-y-4">
            
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
                  <div><span className="text-slate-500">تعامل سابق: </span><span className="text-slate-300">{selectedItem.previous_dealing || "غير محدد"}</span></div>
                  <div><span className="text-slate-500">تقييم المبيعات: </span><span className="text-slate-300">{selectedItem.sales_contact || "غير محدد"}</span></div>
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
                  {selectedItem.attachment_url && (
                    <a href={selectedItem.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300">
                      فتح الصورة المرجعية
                    </a>
                  )}
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
    <section dir="rtl" className="admin-print-report">
      <header className="report-header">
        <Image src="/carrara-elephant-logo.webp" alt="شعار شركة قرارة" width={64} height={64} />
        <div>
          <h1>تقرير استبيان زوار شركة قرارة</h1>
          <p>شركة قرارة للرخام والجرانيت</p>
        </div>
        <div className="report-meta">
          <span>تاريخ التقرير</span>
          <strong>{new Intl.DateTimeFormat("ar-LY", { dateStyle: "long" }).format(new Date())}</strong>
          <span>النطاق: {branchFilter === "all" ? "جميع الفروع" : branchFilter}</span>
        </div>
      </header>

      <div className="report-kpis">
        <div><span>إجمالي المشاركات</span><strong>{totalCount}</strong></div>
        <div><span>الاستبيانات</span><strong>{totalSurveys}</strong></div>
        <div><span>الشكاوى</span><strong>{totalComplaints}</strong></div>
        <div><span>نسبة الاستبيانات</span><strong>{surveyShare}%</strong></div>
      </div>

      <h2 className="report-section-title">تفاصيل المؤشرات</h2>
      <div className="report-charts">
        {analyticsCards.map((card) => (
          <section key={card.title} className="report-chart-card">
            <h3>{card.title}</h3>
            {card.stats.length === 0 ? (
              <p>لا توجد بيانات كافية.</p>
            ) : (
              <ul>
                {card.stats.map((stat) => (
                  <li key={stat.name}>
                    <span>{stat.name}</span>
                    <strong>{stat.count} ({stat.percentage}%)</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <footer className="report-footer">يعرض هذا التقرير مؤشرات مجمعة لردود الزوار دون إظهار بيانات الاتصال الشخصية.</footer>
    </section>
    </>
  );
}
