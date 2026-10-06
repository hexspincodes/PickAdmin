# Pickmymaid Admin Dashboard

React (JSX) + Redux Toolkit + Tailwind CSS + Axios admin panel for the
Pickmymaid backend (`Pick_Back/Backend1` + `Pick_Back/Backend2`).

## Setup

```bash
npm install
cp .env.example .env   # point VITE_BACKEND1_URL / VITE_BACKEND2_URL at your backends
npm run dev
```

Requires Node 20.19+ or 22.12+ for `oxlint`/some devDependencies' engine
checks (warnings only — the app itself runs fine on Node 20.13+). Uses
**Vite 5** (not the newer Vite 8/rolldown default from `create-vite`,
which needs Node ≥20.19 and failed to load its native binding on this
machine).

## Backend split

- **Backend1** (`VITE_BACKEND1_URL`, default `https://api.backendpickmymaid.site`) —
  admin, maids/jobs, blog, contact, analytics.
- **Backend2** (`VITE_BACKEND2_URL`, default `https://api.backendpickmymaid.site`) —
  auth, payments.

Both default to the same production origin — this is the domain in
`Pick_Back/ARCHITECTURE.md` / `Pick_Back/nginx/nginx.conf`, where it's
what's actually live in production (DNS-verified; `pickmymaid.site` /
`api.pickmymaid.site` do **not** resolve, don't use those). Both
backends sit behind that one host (nginx/k8s ingress routes by path
prefix) and every request path already starts with `/api/v1` or
`/api/v2` — e.g. `https://api.backendpickmymaid.site` + `/api/v1/admin/team`
resolves to `https://api.backendpickmymaid.site/api/v1/admin/team`. For
local dev against separately-running backends, override both vars in
`.env` to point at `http://localhost:8080` / `http://localhost:8081`
instead.

Login goes through Backend2 (`POST /api/v1/auth/admin/login`); the
returned JWT is reused for both API clients (`src/api/axiosClient.js`)
since both services verify it against the same `JWT_SECRET`.

## Roles

Mirrors `Backend1/src/models/users/admin.model.js`: `SA` (Super Admin),
`A` (Admin), `Marketing`. Route/nav access per role is defined in
`src/config/nav.js` and enforced with `RoleGuard` — matching each
endpoint's `roleValidator` on the backend (see each feature's `*API.js`
file for the exact route + role comments).

## Structure

```
src/
  api/axiosClient.js       two axios instances (Backend1/Backend2) + JWT interceptor
  app/store.js              Redux store
  features/<name>/          <name>API.js (backend calls) + <name>Slice.js (Redux Toolkit)
  components/common/        Button, Table, Modal, Pagination, form fields, etc.
  components/layout/        Sidebar, Topbar, DashboardLayout
  components/auth/          ProtectedRoute, RoleGuard
  pages/                    one page per route
```

## Known backend quirks the frontend works around

These were found while cross-checking `FRONTEND_API_REFERENCE.md`
against the actual controller code, and are called out with comments at
each call site:

- `PATCH /api/v1/admin/team-member/:id` ignores the `role` field it
  documents — it only toggles `is_super_admin`.
- Team member `:id` / customer `user_id` params are the string
  `user_id`, not the Mongo `_id` (the team list query even excludes
  `_id` from the response).
- Blog `edit/:id` and `delete/:id` treat `:id` as the post's **slug**,
  not its `_id`. `PUT /api/v1/blog/delete-comment` reads `slug`, not the
  documented `blog_id`.
- `GET /api/v1/blog/slug-check` takes a `title` query param and returns
  a freshly generated slug — it's not a boolean uniqueness check.
- Maid verify/disable/assured/hire actions take `{ id, status: '0'|'1' }`
  string flags, not the boolean/field names in the route docs.
- `DELETE /api/v1/job/`, `/api/v1/job/findjob` read `id` from the query
  string, not the request body.
- `GET /api/v1/job/counts` has a backend bug that puts its payload under
  `message` instead of `data` — the frontend reads either.
