# Reeya Kiosk — Frontend

React + TypeScript + Vite + Tailwind v4 UI for the jewelry visual-search kiosk.
A shopper uploads a photo, it goes straight to S3 via a presigned URL, and the
backend returns visually similar catalog products.

## Setup

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:8000` (see
`vite.config.ts`), so run the FastAPI backend locally alongside it. To point
at a different backend, copy `.env.example` to `.env` and set
`VITE_API_BASE_URL`.

## Structure

```
src/
  lib/api.ts               API client: presign upload -> S3 PUT -> /image-search
  components/
    ImageUploader.tsx        Drag/drop + tap-to-capture photo input
    ResultsGrid.tsx           Matched product grid
  App.tsx                   Page wiring: upload -> loading -> results
```

## Backend contract

Matches `backend/app/models/schemas.py`:

- `POST /uploads/presign` `{ user_id, filename, content_type }` -> `{ upload_url, object_key, public_url }`
- `PUT` the raw file bytes to `upload_url` directly (no backend involved)
- `POST /image-search` `{ s3_url, user_id }` -> `{ uploaded_image_id, matches: [{ id, name, image_s3_url, similarity }] }`

`user_id` is a random UUID generated client-side and persisted in
`localStorage` — there's no auth system yet.

---

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

### Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
