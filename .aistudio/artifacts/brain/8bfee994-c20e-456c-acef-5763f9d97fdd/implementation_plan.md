# Implementation Plan: Vercel Production Deployment for ilitha.co.za (Zero-404 Architecture)

This plan outlines the architecture, configuration files, build adjustments, and DNS setup required to deploy the **ZAtax Compliance Advisor** to live production on Vercel under `ilitha.co.za` (and alias `ilithafintech.co.za`) with guaranteed zero-404 client routing and seamless backend API execution.

---

## 1. Architecture & Vercel Hosting Strategy

### The 404 Prevention Challenge
In single-page applications (SPAs) built with Vite and React, direct navigation or page refreshes on deep routes (e.g., `/launch`, `/overview`, or sub-views) cause standard web servers and edge CDNs to return HTTP 404 because no physical `launch/index.html` file exists on disk. Furthermore, backend `/api/*` endpoints (such as `/api/env/status`, `/api/ai/tax-assistant-chat`, `/api/sars-gateway/v3`) must execute on serverless compute rather than being redirected to HTML.

### Target Architecture
1. **Edge CDN Layer**: Static assets (`/assets/*`, `/public/*`, `index.html`) served from Vercel's global edge network with immutable caching headers.
2. **SPA Catch-All Rewrites (`vercel.json`)**: All non-API, non-asset paths (`/*` including `/launch`) route cleanly to `/index.html` (HTTP 200).
3. **Serverless API Bridge (`api/index.ts`)**: Server-side Express application exported as a Vercel Serverless Function to service all `/api/*` endpoints without needing a continuous virtual machine.
4. **Custom Domain & SSL**: Automatic Let's Encrypt TLS provisioning for `ilitha.co.za` and `www.ilitha.co.za` via Vercel Edge Network.

---

## 2. Proposed Changes & File Additions

### A. Vercel Configuration (`vercel.json`)
Create a production `vercel.json` file in the project root:
- Configure the Vite framework builder (`dist` output directory).
- Configure route definitions prioritizing serverless functions under `/api/(.*)`.
- Enforce fallback rewrite to `/index.html` for all client-side navigation paths.
- Add security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

### B. Vercel Serverless API Gateway (`api/index.ts`)
Create an entry point in `api/index.ts` exporting the Express backend:
- Expose `/api/*` routes (e.g. `/api/env/status`, `/api/ai/tax-assistant-chat`, `/api/sars-gateway/v3`, `/api/sars-trade-test/*`, `/api/emp501/*`).
- Handle cold starts and environment loading seamlessly in serverless execution environments.

### C. Build Configuration Verification (`vite.config.ts` & `package.json`)
- Verify that `vite.config.ts` has `base: '/'` to ensure all script and stylesheet tags in `index.html` use absolute root URLs rather than relative URLs, avoiding asset 404s when loading nested paths.
- Add `"build:vercel": "vite build"` in `package.json` if needed.

### D. DNS Configuration for `ilitha.co.za`
Provide explicit step-by-step DNS records for the domain registrar:
- **Apex Domain (`ilitha.co.za`)**:
  - Type: `A`
  - Name: `@` (or leave blank)
  - Value: `76.76.21.21` (Vercel Anycast IP)
  - TTL: 3600
- **WWW Subdomain (`www.ilitha.co.za`)**:
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`
  - TTL: 3600
- **Alias (`ilithafintech.co.za`)**:
  - Configured in Vercel as a domain redirect to `ilitha.co.za`.

---

## 3. Environment Variables Configuration for Vercel

Ensure the following production secrets are added to the Vercel Dashboard under **Project Settings > Environment Variables**:
- `NODE_ENV`: `production`
- `TAX_ENV`: `production` (or `sandbox` for live UAT trade testing)
- `SARS_SIMULATION`: `false` (in true live filing) or `true` (in sandbox mode)
- `SARS_API_ENDPOINT`: `https://efiling.sars.gov.za/api/v3`
- `SARS_EDI_HOST`: `edi.sars.gov.za`
- `SARS_EDI_PORT`: `443`
- `APP_URL`: `https://ilitha.co.za`
- `SESSION_SECRET`: Strong 64-character random string for bearer sessions
- `AES_KEY`: Base64-encoded 32-byte key for POPIA Section 19 AES-256-GCM encryption
- `GEMINI_API_KEY`: Google Gemini API key for real-time tax legislation assistance

---

## 4. Verification & Validation Steps

1. **Local Build Check**:
   - Run `npm run build` locally to ensure the `dist/` bundle generates clean static chunks without dangling relative links.
2. **Local Rewrites Simulation**:
   - Verify that routes `/launch`, `/overview`, and `/tax_pro_connect` render properly without 404.
3. **API Endpoint Health Check**:
   - Test `/api/env/status` to ensure environment variables are validated and reported.
4. **Vercel CLI / Git Push Deployment**:
   - Deploy via Vercel CLI (`vercel --prod`) or connect GitHub repository to Vercel for automated CI/CD deployments.
5. **SSL & Zero-404 Smoke Test**:
   - Probe `https://ilitha.co.za/` -> Returns 200 OK.
   - Probe `https://ilitha.co.za/launch` directly in fresh incognito tab -> Returns 200 OK (no 404).
   - Probe `https://ilitha.co.za/api/env/status` -> Returns JSON 200 OK.
