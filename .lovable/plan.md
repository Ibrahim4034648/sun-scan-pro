# برومت إنشاء تطبيق SPWMS (نظام إدارة ضمان الألواح الشمسية)

انسخ النص التالي والصقه في مشروع Lovable جديد لإعادة بناء التطبيق كاملاً.

---

## البرومت

> **أنشئ تطبيق ويب/موبايل احترافي باسم "SPWMS – Solar Panel Warranty Management System" لإدارة ضمانات الألواح الشمسية، مع دعم كامل للعربية والإنجليزية (RTL/LTR)، وتصميم عصري بألوان الطاقة الشمسية (أزرق داكن + برتقالي/ذهبي + أبيض).**
>
> ### التقنيات
> - TanStack Start + React 19 + TypeScript + Vite 7 + Tailwind v4 + shadcn/ui.
> - Lovable Cloud (Supabase) للمصادقة وقاعدة البيانات و RLS.
> - Capacitor لتحويله إلى تطبيق Android/iOS مع أذونات الكاميرا والتخزين.
> - html5-qrcode لقراءة الباركود/الأرقام التسلسلية.
> - jsPDF + jspdf-autotable + xlsx لتصدير التقارير.
>
> ### الشاشات (Routes)
> 1. `/welcome` – شاشة ترحيب مع شعار، اسم التطبيق، وصف موجز، وزر "ابدأ".
> 2. `/auth` – تسجيل دخول/إنشاء حساب بالبريد + كلمة المرور، **وزر "الدخول عبر Google"** (فعّل موفر Google في Cloud).
> 3. `/app` – الشاشة الرئيسية بعد الدخول: نموذج تسجيل مشروع + ماسح باركود + جدول السجلات + أزرار التصدير.
> 4. `/privacy` – صفحة سياسة الخصوصية (مطلوبة لـ Google Play).
>
> ### شاشة الأذونات (قبل تشغيل الماسح)
> عرض خطوتين متتاليتين بواجهة overlay مع شريط تقدم:
> - **الخطوة 1 – الكاميرا:** أيقونة كاميرا + شرح "نستخدمها لقراءة الأرقام التسلسلية على الألواح"، زر "أوافق" يستدعي `getUserMedia({facingMode:'environment'})` مع معالجة أخطاء `NotAllowedError / NotFoundError / NotReadableError / OverconstrainedError`.
> - **الخطوة 2 – التخزين:** أيقونة مجلد + شرح "لحفظ التقارير محلياً"، يستدعي `Filesystem.readdir` كاختبار.
> - حفظ الموافقة في `localStorage` بمفتاح `spwms_perm_consent_v2` وعدم إعادة السؤال.
>
> ### نموذج تسجيل المشروع (RegistrationForm)
> الحقول: اسم العميل، رقم الجوال، اسم المشروع، موقع التركيب، تاريخ التركيب، عدد الألواح، عدد السلاسل (Strings)، مدة الضمان، ملاحظات، + قائمة الأرقام التسلسلية (تُضاف بالماسح أو يدوياً).
>
> ### قاعدة البيانات (Supabase)
> - جدول `profiles` (id, full_name, phone, created_at).
> - جدول `projects` (id, user_id, customer_name, customer_phone, project_name, location, install_date, panel_count, string_count, warranty_years, notes, created_at).
> - جدول `serials` (id, project_id, serial_number, position, scanned_at).
> - جدول `user_roles` مع enum `app_role` ودالة `has_role` (security definer).
> - تفعيل RLS + سياسات: كل مستخدم يرى بياناته فقط، والأدمن يرى الكل.
> - **GRANT** على كل جدول لدور `authenticated` و `service_role`.
> - Trigger `handle_new_user` لإنشاء profile تلقائياً + إسناد دور `user`.
>
> ### تصدير التقارير (PDF + Excel)
> قالب احترافي يتضمن:
> - **Header:** شعار الشركة، اسم الشركة، عنوان التقرير "Solar Panel Warranty Report"، بيانات العميل والمشروع، تاريخ التركيب وتاريخ الإصدار.
> - **جدول رئيسي:** No. | Serial | Position | Status | Warranty Start | Warranty End | Notes.
> - **قسم الملخص:** إجمالي الألواح، إجمالي السلاسل، مدة الضمان.
> - **Footer:** توقيع الفني، توقيع العميل، مكان ختم الشركة، ترقيم صفحات تلقائي.
> - دعم RTL للعربية، ألوان هوية الشركة، حدود نظيفة، محسّن للطباعة.
>
> ### التصميم
> - وضع فاتح وداكن.
> - خطوط: Cairo/Tajawal للعربية، Inter للإنجليزية.
> - Semantic tokens في `src/styles.css` (لا ألوان ثابتة داخل المكوّنات).
> - Responsive بالكامل، mobile-first.
>
> ### إعدادات Capacitor
> - `appId: app.lovable.spwms`, `appName: SPWMS`.
> - أذونات في `AndroidManifest.xml`: CAMERA, INTERNET, VIBRATE, READ_MEDIA_IMAGES.
> - ملف `src/lib/native-permissions.ts` يطلب أذونات الكاميرا والتخزين عند فتح التطبيق على الأجهزة الأصلية فقط.
>
> ### SEO & Meta
> - عنوان: "SPWMS – Solar Panel Warranty Management".
> - وصف واضح، og:image، twitter:card.
>
> ### التسليم
> جهّز التطبيق بحيث يمكن بناؤه كـ APK عبر:
> `bun install && bun run build && npx cap add android && npx cap sync android && npx cap open android`
> ونشره على Google Play وApp Store.

---

## طريقة الاستخدام

1. افتح مشروع Lovable جديد.
2. الصق النص أعلاه في أول رسالة.
3. اترك Lovable ينشئ الهيكل ثم اطلب التعديلات التفصيلية (شكل التقرير، الألوان، حقول إضافية…).

هل تريد أن أعدّل البرومت (إضافة/حذف ميزات، تغيير اللغة، أو تبسيطه) قبل الاعتماد؟
