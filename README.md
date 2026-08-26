# Solar Warranty Scan

Act as a world-class Senior Full Stack Engineer, AI Product Architect, SaaS UX Designer, Mobile Web App Expert, and Lovable.dev specialist.

Your task is to fully design and build a complete modern web application using Lovable.dev called:

“Solar Warranty System”

“نظام إدارة ضمان الألواح الشمسية”

The application is a professional mobile-first field management system used to:

- Scan solar panel serial numbers

- Register warranty information

- Manage customers and projects

- Store installation data

- Export reports

- Work efficiently on mobile devices during real field operations

The system must look and behave like a premium industrial SaaS platform with modern UX/UI, ultra-fast interactions, and reliable barcode scanning.

====================================================

PRIMARY OBJECTIVE

====================================================

Create a complete responsive web application optimized mainly for Android mobile devices and tablets used by technicians in the field.

The app must support:

- QR code scanning

- Barcode scanning

- Manual serial input

- Warranty registration

- Customer/project management

- Data storage

- Excel/PDF export

- Offline support

- Fast mobile workflow

The system must feel:

- Professional

- Minimal

- Industrial-tech

- Fast

- Reliable

- Clean

- Modern

- Mobile-first

====================================================

CORE FEATURES

====================================================

1) SMART SCANNER SYSTEM

Create a professional scanner module using:

- html5-qrcode

OR

- BarcodeDetector API as fallback if supported

The scanner must support:

- QR Code

- CODE128

- CODE39

- EAN-13

- UPC

- Data Matrix if possible

Scanner requirements:

- Use rear camera by default

- Auto request camera permission

- Start/Stop scanner buttons

- Flashlight toggle

- Camera selector

- Scan mode selector:

  - QR only

  - Barcode only

  - Both

- Continuous scanning mode

- Sound feedback toggle

- Vibration feedback on mobile

- Animated scanning frame

- Prevent duplicate scans using debounce logic

- Automatically fill serial number field after scan

- Automatically focus next step after successful scan

- Release camera stream properly when stopping scanner

- Handle all scanner errors gracefully

Add scanner states:

- Ready

- Starting

- Scanning

- Success

- Error

- Camera unavailable

====================================================

2) SERIAL REGISTRATION SYSTEM

====================================================

Create a registration form containing:

- Serial Number

- Panel Model

- Warranty Period

- Installation Date

- Customer Name

- Project Name

- Installation Location

- Notes

Requirements:

- Validation

- Duplicate detection

- Smart auto-complete

- Responsive form layout

- Fast mobile entry

- Auto-save draft

- Floating labels

- Inline validation messages

- Highlight duplicate serials

====================================================

3) DATA STORAGE

====================================================

Implement:

- LocalStorage persistence

- Safe JSON parsing

- Automatic save

- Backup system

- Restore system

- Clear all data option

Add:

- JSON export/import

- Data recovery protection

- Corruption prevention

Optional:

If possible inside Lovable:

- Supabase integration

- Cloud sync

- User authentication

====================================================

4) RECORDS MANAGEMENT TABLE

====================================================

Create a modern responsive records table.

Columns:

- Serial Number

- Panel Model

- Warranty

- Installation Date

- Customer

- Project

- Location

- Notes

Features:

- Live search

- Smart filters

- Sorting

- Pagination

- Empty states

- Duplicate highlighting

- Sticky headers

- Mobile card mode

- Fast rendering

Mobile behavior:

Convert rows into expandable cards.

====================================================

5) EXPORT SYSTEM

====================================================

Add export tools:

- Export Excel

- Export PDF

- Export JSON

Requirements:

- Arabic support

- Professional formatting

- Report title

- Creation date

- Total records count

- Mobile-friendly export behavior

====================================================

6) USER INTERFACE DESIGN

====================================================

Design a premium modern UI inspired by:

- Stripe Dashboard

- Linear

- Tesla UI

- Notion

- Modern SaaS dashboards

- Industrial IoT systems

Design style:

- Minimal

- Elegant

- High-tech

- Clean

- Fast

- Field-optimized

====================================================

COLOR SYSTEM

====================================================

Primary Color:

- Deep Orange #ff7a00

Secondary:

- Dark Navy #0f172a

Background:

- Soft Gray #f3f4f6

- White cards

Status Colors:

- Green success

- Amber warning

- Red error

====================================================

TYPOGRAPHY

====================================================

Use modern Arabic-friendly typography.

Requirements:

- Excellent Arabic rendering

- Clear hierarchy

- Large readable mobile text

- Clean labels

- Professional spacing

====================================================

LAYOUT STRUCTURE

====================================================

Create these sections:

1. Sticky top navigation bar

- Logo

- System title

- Status indicator

- Export buttons

2. Scanner section

- Large camera preview

- Scanner controls

- Scan animation

3. Serial input section

- Manual entry

- Add button

- Validation state

4. Installation details section

- Customer/project/location fields

5. Records section

- Search/filter toolbar

- Responsive data table

6. Sticky mobile action bar

- Scan

- Add

- Export

- Backup

====================================================

MOBILE-FIRST UX

====================================================

Optimize heavily for Android phones.

Requirements:

- One-hand usage

- Large touch targets

- Outdoor visibility

- Fast workflow

- Minimal taps

- Smooth scrolling

- Lightweight rendering

- Responsive layout

- Touch-friendly controls

====================================================

ADVANCED UX FEATURES

====================================================

Add:

- Toast notifications

- Loading states

- Success animations

- Smooth transitions

- Animated scan line

- Skeleton loaders

- Smart empty states

- Floating action button

- Micro-interactions

- Auto-focus behavior

- Smart feedback sounds

====================================================

TECHNICAL REQUIREMENTS

====================================================

Use:

- React

- TailwindCSS

- TypeScript if possible

- Clean component structure

- Reusable UI components

- Optimized mobile performance

The code must:

- Be production-ready

- Be modular and clean

- Have no console errors

- Be optimized for low-end devices

- Handle scanner failures gracefully

====================================================

IMPORTANT REQUIREMENTS

====================================================

- Build a REAL working application.

- Do NOT generate only UI mockups.

- All buttons and features must work.

- Focus on scanner stability more than visual effects.

- Prioritize mobile usability.

- Prevent duplicate records.

- Ensure smooth field workflow.

- Keep the interface clean and uncluttered.

====================================================

FINAL GOAL

====================================================

The final result should feel like:

A premium industrial SaaS platform built specifically for real-world solar panel warranty operations and field technicians.

It must look modern, highly professional, practical, and reliable enough for daily operational use.

# SunScan Pro

This project is a native Android application rewritten from its original web/React version.

## Features
- **Barcode/QR Scanning**: Uses CameraX and ML Kit for high-performance scanning of solar panel serial numbers.
- **Warranty Registration**: Register model, warranty years, customer, project, and location.
- **Local Persistence**: All records are saved locally using Room Database.
- **Records Management**: Expandable cards to view and manage existing warranty records.

## Tech Stack
- **Kotlin**
- **Jetpack Compose**
- **Room Database** (Local Storage)
- **ML Kit Vision & CameraX** (Barcode Scanning)

## Development
To build the app:
Run `compile_applet` to generate the APK.
