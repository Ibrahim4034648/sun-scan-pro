# بناء تطبيق Android (APK) من SPWMS

تم إعداد المشروع بالكامل لدعم Capacitor مع أذونات الكاميرا والتخزين والاهتزاز.

## المتطلبات (مرة واحدة على جهازك)

- Node.js + npm/bun
- Android Studio (مع Android SDK + JDK 17)
- متغير البيئة `ANDROID_HOME` مضبوط

## خطوات البناء

في مجلد المشروع على جهازك:

```bash
# 1) تثبيت الحزم
bun install

# 2) بناء الواجهة (يُخرج dist/)
bun run build

# 3) إضافة منصة Android (مرة واحدة فقط)
npx cap add android

# 4) نسخ الملفات إلى مشروع Android
npx cap sync android

# 5) فتح Android Studio
npx cap open android
```

ثم في Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

ملف APK يظهر في:
`android/app/build/outputs/apk/debug/app-debug.apk`

## الأذونات (تُضاف تلقائياً عند `cap sync`)

ملف `android/app/src/main/AndroidManifest.xml` سيحتوي تلقائياً على:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

إذا لم تظهر — أضفها يدوياً داخل `<manifest>` قبل `<application>`.

## طلب الأذونات وقت التشغيل

تم بالفعل ✅ — ملف `src/lib/native-permissions.ts` يطلب الأذونات تلقائياً
عند فتح التطبيق على Android (الكاميرا + التخزين)، ولا يفعل شيئاً في المتصفح.

## ملاحظات

- الكاميرا تستخدم `html5-qrcode` عبر `getUserMedia` داخل WebView — الأذونات
  الممنوحة للتطبيق تُمرَّر تلقائياً للـ WebView.
- البيانات تُحفظ في Supabase + localStorage (التخزين الداخلي للتطبيق
  لا يحتاج إذناً خاصاً على Android 13+).
- لتحديث التطبيق بعد أي تعديل في الكود: كرّر الخطوات 2 و 4 فقط.
