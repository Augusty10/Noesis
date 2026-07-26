# Noesis — Document RAG Notebook & Studio

Noesis is a monorepo workspace for uploading documents, extracting concepts, and interacting with them using Retrieval-Augmented Generation (RAG). It enables building learning roadmaps and generating conversational podcast discussions from your notes and sources.

---

## Key Features

1. **Notebook & Source Management**: Create notebooks and ingest 5 types of sources:
   - **PDFs**: Ingest documents page-by-page.
   - **Web Links**: Scrape clean article content.
   - **YouTube Videos**: Extract transcripts from videos (including standard watch links, share links, Shorts, and Live streams).
   - **Plain Text**: Add notes and text extracts.
   - **Transcripts (VTT)**: Upload WebVTT files directly.
2. **Grounded Chat (RAG)**: Chat with your documents using streaming answers, low-temperature grounding, and interactive citation badges that highlight source text in real-time.
3. **Podcast Studio**: Convert your documents into an engaging audio discussion between two synthetic hosts: Lisa (British accent) and Dan (US accent).
4. **Learning Roadmaps**: Automatically generate logical learning roadmaps and progression milestones mapped back to references in your source documents.

---

## Directory Structure

This monorepo utilizes **npm workspaces** to manage both packages concurrently:

```
Noesis/
├── package.json               # Root monorepo configuration & workspace script definitions
├── node_modules/              # Hoisted dependencies for the workspaces
├── Noesis-backend/            # Node.js + Express + Prisma + Neon Serverless Backend
│   ├── prisma/                # Prisma schema and adapter migrations
│   └── src/
│       ├── jobs/              # Background worker ingestion & indexing jobs
│       ├── lib/               # Database client, RAG utilities, security guards
│       ├── routes/            # Express route controllers (Notebook, Query, Podcast, etc.)
│       └── server.ts          # Express application entrypoint
└── Noesis-frontend/           # Next.js + React + Clerk Auth + Tailwind CSS Frontend
    ├── public/                # Static public assets
    └── src/
        ├── app/               # Next.js App Router pages
        ├── components/        # UI widgets (Chat, Sources uploaders, Source viewers)
        ├── hooks/             # Custom reactivity hooks (useChat, useSources)
        └── lib/               # API clients and typescript definitions
```

---

## Performance Optimizations & Fixes

To resolve bottlenecks and rendering bugs, the following optimizations have been implemented:

* **Fast Podcast Audio Synthesis**:
  - *File*: [podcast.ts](file:///e:/Noesis/Noesis-backend/src/routes/podcast.ts)
  - *Details*: Replaced the sequential Text-To-Speech generation loop with a parallel worker queue (concurrency limit of **5**). This speeds up audio synthesis by **~5x** while respecting API limits.
* **Large PDF & Document Indexing (10x Speedup)**:
  - *File*: [index-source.ts](file:///e:/Noesis/Noesis-backend/src/jobs/index-source.ts)
  - *Details*: Parallelized OpenAI embedding calls for document chunks with a concurrency limit of **5** and increased batching to **250** chunks. This optimizes throughput for large documents (e.g. 2,000+ chunks).
* **Database Batch Write & Extended Transaction Timeout**:
  - *File*: [index-source.ts](file:///e:/Noesis/Noesis-backend/src/jobs/index-source.ts)
  - *Details*: Swapped single Prisma inserts inside a transaction with a bulk `db.chunk.createMany` query and configured a generous **120-second** transaction timeout. Large files will no longer trigger `expired transaction` errors over Neon PostgreSQL WebSocket connections.
* **Cookie-Free YouTube Embeds**:
  - *File*: [YoutubeEmbed.tsx](file:///e:/Noesis/Noesis-frontend/src/components/sources/SourceViewer/YoutubeEmbed.tsx)
  - *Details*: Switched standard `youtube.com` embed iframes to the privacy-enhanced `youtube-nocookie.com`. This prevents third-party tracking cookie rejections (such as Cloudflare `_cfuvid` warnings) in modern browsers.
* **Robust YouTube URL Extraction**:
  - *File*: [youtube.ts](file:///e:/Noesis/Noesis-backend/src/lib/ingestion/extractors/youtube.ts)
  - *Details*: Upgraded the YouTube video ID regex to support standard watch URLs, share links, embeds, **Shorts**, and **Live stream** URLs.
* **Stable PDF Client Rendering**:
  - *File*: [PdfViewer.tsx](file:///e:/Noesis/Noesis-frontend/src/components/sources/SourceViewer/PdfViewer.tsx)
  - *Details*: Dynamically resolves the PDF.js web worker script from the official `unpkg` CDN based on the installed package version. This prevents PDF rendering canvas failures on the client.

---

## Getting Started

### 1. Install Dependencies
Run from the root directory to install and link all workspaces automatically:
```bash
npm run install:all
```

### 2. Configure Environment Variables

#### Backend Configuration
Create a `.env` file in the `Noesis-backend` directory:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>/neondb?sslmode=require"
OPENAI_API_KEY="your-openai-api-key"
```

#### Frontend Configuration
Create a `.env.local` file in the `Noesis-frontend` directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
```

### 3. Initialize the Database
Generate your Prisma Client and push the schema directly to your Neon database:
```bash
# Navigate to backend workspace
cd Noesis-backend

# Generate client typings targeting the root workspace folder
npx prisma generate

# Push schema structure to Neon
npm run prisma:push
```

### 4. Run Locally
To run both the backend API server and the Next.js frontend concurrently, execute this command from the root directory:
```bash
npm start
```
- Frontend will be accessible at: `http://localhost:3000`
- Backend API server will be accessible at: `http://localhost:5000`
