# Connect the IIITS calculator to Supabase

The calculator works now without login. Optional guest drafts are stored only in the current browser. Account saving requires the setup below; it has not yet been connected or tested against a live Supabase project.

## What remembers what?

- **Supabase Auth** verifies an institute email using a code and keeps a renewable login session in the browser. Closing a normal browser or installed web app does not itself sign the user out. Clearing browser data, private browsing, explicit sign-out, or a revoked/expired session can require login again.
- **Supabase Postgres** stores the calculator worksheet under the verified user's ID. That data survives closing the app, clearing browser storage, and signing in on another device.
- The current implementation uses explicit **Save to my account** and **Load saved account data** buttons. This prevents silently replacing a guest worksheet or another device's save. Save before closing; load on the next visit. Saving replaces the account's previous worksheet, so avoid concurrent editing on different devices.
- Optional device drafts are for guests. They are separate from account saves and are not a cloud backup. Signing out clears the account worksheet from the open page.

## Steps to activate now

1. Create a project in [Supabase](https://supabase.com/dashboard). Keep the database password private.
2. Open the project's **SQL Editor**, paste `supabase-setup.sql` from this folder, and run it once. It creates `calculator_states`, ownership policies, and an update timestamp. Do this before enabling account saving. If it was already run successfully, do not rerun unchanged policies/triggers.
3. Under **Authentication → Sign In / Providers**, enable Email and keep email confirmation enabled. Disable anonymous sign-ins. For a student-only app, add a **Before User Created** auth hook to reject addresses outside the approved institute domain. The supplied database policies already deny calculator access to non-`@iiits.in` accounts, but the UI check alone does not prevent account creation through direct API requests.
4. Under **Authentication → Email Templates → Magic Link**, use a code template containing `{{ .Token }}`. For example: `<h2>Your IIITS sign-in code</h2><p>{{ .Token }}</p>`. The app uses `signInWithOtp` and `verifyOtp` with type `email`; no passwords are collected. Confirm the template used for first-time signup also presents a usable code during testing.
5. Configure **custom SMTP** before a student rollout. Supabase's default email service is restricted and is unsuitable for sending codes to a whole campus. Configure an email provider you control, sender identity, rate limits, and OTP expiration. Do not put SMTP credentials in website files.
6. Set **Authentication → URL Configuration → Site URL** to the website's actual HTTPS address. Add your development URL if needed. Email-code entry does not require clicking a redirect link, but the project URLs should still be correct.
7. In the project **Connect** dialog or **Settings → API Keys**, copy the project URL and **publishable key**. Put only these two public values in `calculator/config.js`:

   ```js
   window.IIITS_SUPABASE = {
     url: 'https://YOUR_PROJECT.supabase.co',
     publishableKey: 'sb_publishable_...'
   };
   ```

   Never put `service_role`, `sb_secret_...`, database passwords, or SMTP secrets in this file. A publishable key is intended for browser use; row-level security is what protects each account's data.
8. Serve `classroom_dashboard.html`, `calculator.html`, and the entire `calculator/` folder together on your existing host. Use HTTP on localhost for development and HTTPS for the published app, rather than a double-clicked `file://` page. The app loads a pinned Supabase JavaScript SDK from esm.sh only after configuration is present; allow it in your content security policy, or bundle it locally for production.
9. Test with two real test accounts: A saves a worksheet; close and reopen, sign in if needed, and load it. B must see no A data. Test failed/expired OTP, offline save, sign-out, and a reload with an existing session. Verify direct API requests using B's token cannot select/update/delete A's row or insert a row owned by A, and signed-out requests cannot access any worksheet. Do not use a service-role key for these checks because it bypasses RLS.

## Profile and personal timetable integration

For name, roll number, UG and section, add a separate profile linked to `auth.users.id`. A typed roll number is not verified identity. Import an approved student roster on the server and match the **verified institute email** to its roll number and section. Keep roster access private; do not let students assign themselves another student's identity through editable profile metadata. Your collaborator's timetable can then read that trusted section mapping after login.

## Academic rules

See `../academic-points.html` for the student summary of the official November 2025 guidelines. Grades P or higher earn credits; F earns none but remains in the registered-credit GPA denominator. The live numerator updates as grades are entered; it is provisional until all grades are supplied. Both registered and earned credits are displayed.

Attendance below 65% defaults to F. Medical cases in the 65–75% range can receive institute-confirmed exemption; a pending claim or old generic medical checkbox does not establish exemption. Leave requires at least 50% physical attendance. Exceptional relaxation requires Dean forwarding and Director approval. The calculator now uses standard physical-attendance rules only. For approved exceptions, turn adjustment off and enter the institute-confirmed grade. Removed approval fields, including legacy saved values, no longer change results.

Official references: [Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [sessions](https://supabase.com/docs/guides/auth/sessions), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

## Merging the two apps later

Use one shared Supabase project for the final student dashboard. Both apps should reference the same Auth user UUID (`auth.users.id`) for saved calculator records, profiles, and timetable preferences. Keep the current calculator table; add separate tables for timetable/profile features and keep ownership policies on each. Store schema changes as SQL migrations in the shared repository. Avoid creating separate user databases for each app; moving already-created accounts between projects is additional migration work.

When moving to the final domain, update Site URL and allowed redirect URLs. Browser sessions may require a fresh sign-in on a new origin, but records remain in the same database under the same user ID. Integration still requires combining the UI, session handling, data formats, and testing both features; setting Supabase up now does not prevent that work.

## Attendance inputs and live totals

GPA uses all registered academic credits, including F, as the denominator. The numerator updates with entered grade points and the result remains provisional until all grades are entered. Ungraded courses are not recorded as F. Earned credits include only resolved P-or-higher outcomes. CGPA uses all registered credits from the included semesters.

Attendance is optional. Confirmed UG1 semester 1 subjects have fixed semester totals: CP/DLD/OCW use 36 lecture hours + 12 lab sessions; DSMA uses 48 lecture hours; FHVE/EE/EDL use 24. Users enter missed lecture hours, and missed lab sessions only for lab subjects. One two-hour lab session is one unit. This is a full-semester projection assuming no further absences, not attendance measured to date. GPA attendance adjustment is unavailable for unconfirmed course sets until the lab details are provided. Attendance remains available as a separate temporary worksheet.

Every page loads `page-state.js` for theme sharing and dashboard return position. Theme and return position are carried in local navigation links as well as normal theme storage, including when opening HTML files directly. Existing guest/account drafts are retained; fixed attendance totals replace earlier editable denominators when rendering confirmed courses. Preset course credits are now fixed and corrected on loading saved worksheets; editable custom credits represent registered course weight, never credits acquired. Earned credits are derived automatically from passing grades.
