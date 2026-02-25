
Goal
- Fix the Android home-screen launch problem where users are seeing the GitHub 404 page instead of the app.

What I found
1. Your GitHub Pages deployment is already building with `GITHUB_PAGES=true`, so `base`, `start_url`, and `scope` are currently generated as `/fomuso-family-hub/`.
2. The live manifest at `.../fomuso-family-hub/manifest.webmanifest` is correct right now (`start_url`, `scope`, and `id` all point to `/fomuso-family-hub/`).
3. The screenshot shows `ridloj.github.io` (root domain) 404. That strongly indicates some Android users still have an older home-screen install/shortcut pointing to the root domain.
4. There is one real routing escape bug in code: `src/pages/NotFound.tsx` uses `<a href="/">`, which can force users to the root domain on GitHub Pages and produce the same 404 experience.

Implementation plan
1. Fix root-domain escape in app routing
- File: `src/pages/NotFound.tsx`
- Replace `<a href="/">` with React Router `<Link to="/">`.
- Reason: keeps navigation inside the app basename (`/fomuso-family-hub`) instead of jumping to `https://ridloj.github.io/`.

2. Add Android migration-safe PWA identity behavior
- File: `vite.config.ts` (PWA manifest block)
- Keep:
  - `start_url: appBase`
  - `scope: appBase`
- Update identity strategy so existing Android installs created before the base-path fix can be upgraded instead of staying pinned to the old root shortcut.
- Practical approach:
  - Use a stable manifest `id` compatible with legacy installs for one migration cycle, then keep it stable going forward.
- Reason: Android treats `id` as app identity. If identity changes, old broken installs often remain as separate entries.

3. Improve install guidance for Android users
- File: `src/components/InstallPrompt.tsx`
- Add concise Android-specific recovery hint:
  - “If your old home-screen icon opens a GitHub 404 page, remove that icon and reinstall from this page.”
- Show this only for Android non-standalone mode.
- Reason: for already-broken legacy shortcuts, one-time reinstall is usually required even after code fixes.

4. Verify end-to-end before release
- Test matrix:
  1) Fresh Android install from browser at `/fomuso-family-hub/` opens app correctly.
  2) Existing old icon scenario: remove old icon, reinstall, relaunch.
  3) In-app unknown route -> NotFound -> “Return to Home” stays inside app.
  4) Login/logout and deep links still work under GitHub Pages subpath.

Technical notes
- No backend/database changes are required.
- This is purely frontend/PWA behavior (routing + manifest identity + install UX).
- Main risk is manifest identity changes causing duplicate icons for some users; mitigation is stable post-migration ID and clear reinstall instruction.

Expected outcome
- New Android installs launch correctly into the app.
- Existing users with legacy broken shortcuts have a clear recovery path.
- Internal app 404 screen no longer sends users to the GitHub root 404.
