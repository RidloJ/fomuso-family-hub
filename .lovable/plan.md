

# Deploy to GitHub Pages

## Overview
Set up the project for GitHub Pages hosting with automated deployment via GitHub Actions.

## Steps

### 1. Connect to GitHub
- Go to **Settings** (gear icon) in the Lovable editor, then **GitHub**, and click **Connect project**
- Authorize the Lovable GitHub App and create a repository

### 2. Configure Vite for GitHub Pages
- Update `vite.config.ts` to set `base` dynamically based on an environment variable or the GitHub Pages path (e.g., `/<repo-name>/`)
- This ensures all assets load from the correct path when hosted under a subpath

### 3. Create GitHub Actions Workflow
- Add `.github/workflows/deploy.yml` that:
  - Triggers on pushes to `main`
  - Installs dependencies with `npm ci`
  - Builds the project with `npm run build`
  - Deploys the `dist/` folder to the `gh-pages` branch using `peaceiris/actions-gh-pages`

### 4. SPA Routing Fix
- Add a `public/404.html` file that redirects all routes back to `index.html` using a small JavaScript redirect script
- This is the standard workaround for client-side routing on GitHub Pages, which doesn't support server-side rewrites

### 5. Enable GitHub Pages
- After the first deployment, go to your GitHub repository **Settings > Pages** and set the source to the `gh-pages` branch

---

## Technical Details

**Files to create/modify:**
- `vite.config.ts` -- add `base` config for the repo subpath
- `.github/workflows/deploy.yml` -- GitHub Actions CI/CD workflow
- `public/404.html` -- SPA routing redirect for GitHub Pages

**Important consideration:** The backend (Lovable Cloud) URLs are absolute, so database and auth features will continue to work regardless of where the frontend is hosted. The `.env` variables will need to be set as GitHub Actions secrets or hardcoded in the build step.

