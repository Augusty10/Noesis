# Provenance — Frontend

This is the complete Next.js frontend for Provenance, built against the API spec and
Prisma schema in the project build doc. It expects the backend API routes
(`/api/notebooks`, `/api/sources`, `/api/query`, etc.) to exist at the same origin —
see the build doc for their implementation.

## What's included

- **Auth**: Clerk (`middleware.ts` protects everything except the landing page and
  the Clerk webhook route).
- **Notebook management**: dashboard (`/notebooks`), create/rename/delete, empty and
  loading states.
- **Source ingestion UI**: add-source grid for all 5 types (PDF, Text, URL, YouTube,
  VTT), each with its own lightweight client-side validation, live status dots that
  poll while a source is indexing, and per-source reindex/remove actions.
- **Chat**: streaming answers rendered as markdown, with inline clickable citation
  badges (`[1]`, `[2]`...) parsed out of `[S1]`-style markers from the backend.
- **Source viewer**: a right-hand panel that swaps content per source type when a
  citation is clicked — PDF page jump, YouTube timestamp embed, web page highlight,
  and text/transcript highlight.
- Theme: black / white / dark-green, defined as CSS variables in `globals.css` and
  wired into Tailwind via `tailwind.config.ts`.

## Setup

```bash
npm install
cp .env.example .env
# fill in Clerk keys
npm run dev
```

## Notes on wiring to your backend

- `src/lib/api.ts` is the single place all fetch calls live — point this at your
  actual API routes if they're not same-origin.
- `streamQuery()` expects the `/api/query` route to respond with newline-delimited
  JSON events: `{"type":"token","data":"..."}` for each streamed token, then a final
  `{"type":"citations","data":[...]}` event once the full answer and its citations
  are ready. Adjust the parser there if your backend streams differently (e.g. SSE).
- `PdfViewer` needs `pdf.worker.min.js` copied into `/public` from
  `node_modules/pdfjs-dist/build/` for `react-pdf` to work in production.
- Every list/detail fetch assumes the backend has already enforced notebook
  ownership server-side (per the Clerk `auth()` check in the build doc) — the
  frontend does not re-check ownership, it trusts the API's 401/403 responses.

## Folder structure

```
src/
├── app/                     # routes (App Router)
├── components/
│   ├── notebook/            # dashboard + notebook card + create dialog
│   ├── sources/              # source list, add-source flow, per-type uploaders
│   │   ├── uploaders/
│   │   └── SourceViewer/     # per-type viewer + dispatcher panel
│   ├── chat/                 # chat panel, message bubble, citation badge, input
│   └── ui/                   # shared Button, Dialog, Skeleton, EmptyState
├── hooks/                    # useNotebooks, useSources (with polling), useChat (streaming)
├── lib/
│   ├── api.ts                # typed fetch client + streaming query helper
│   └── types.ts              # shared TS types mirroring the Prisma schema
└── middleware.ts              # Clerk route protection
```
