"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Play, Pause, X, ExternalLink, FileText, CheckCircle2, ChevronRight, Volume2, Sparkles, BookOpen } from "lucide-react";

interface SnippetData {
  id: string;
  sourceId: string;
  title: string;
  type: string;
  page?: string;
  relevance: string;
  highlightText: string;
  fullExcerpt: string;
}

interface QuestionScenario {
  question: string;
  answerHtml: string;
  snippets: SnippetData[];
}

const QUESTION_SCENARIOS: QuestionScenario[] = [
  {
    question: "How does the ingestion step split long documents?",
    answerHtml:
      "Documents are divided into smaller passages using semantic chunking so that only the most relevant sections are retrieved for each question <cite data-s='1'>Source 01</cite>. The retrieved passages are then injected into the prompt context before the answer is generated <cite data-s='2'>Source 02</cite>, preventing context dilution and hallucination <cite data-s='3'>Source 03</cite>.",
    snippets: [
      {
        id: "1",
        sourceId: "src-1",
        title: "Ingestion_Pipeline_Spec.pdf",
        type: "PDF Document",
        page: "Page 4, Section 2.1",
        relevance: "98% Match",
        highlightText: "split into smaller passages for retrieval",
        fullExcerpt:
          "Incoming documents are normalized and partitioned into 400-token chunks with a 50-token rolling overlap. This boundary preservation ensures contextual coherence across chunk splits and optimizes dense vector retrieval scoring against cosine distance metrics.",
      },
      {
        id: "2",
        sourceId: "src-2",
        title: "RAG_Prompt_Synthesis.md",
        type: "Text Note",
        page: "Paragraph 12",
        relevance: "94% Match",
        highlightText: "relevant context is added to the prompt",
        fullExcerpt:
          "Retrieved chunk embeddings are formatted with deterministic identifiers. The system prompt instructs the language model to synthesize only from provided citations, strictly rejecting out-of-context assumptions.",
      },
      {
        id: "3",
        sourceId: "src-3",
        title: "Grounding_Evaluation_Report.pdf",
        type: "PDF Document",
        page: "Page 11",
        relevance: "91% Match",
        highlightText: "answers cite the source documents",
        fullExcerpt:
          "Every generated token sequence is cross-verified against the source sentence embeddings. Citations are linked directly to chunk IDs, allowing instant navigation back to the exact passage in the original PDF.",
      },
    ],
  },
  {
    question: "Can Noesis generate audio podcasts from notes?",
    answerHtml:
      "Yes! The built-in Podcast Studio transforms your notebook documents into an engaging multi-speaker audio discussion <cite data-s='1'>Source 01</cite>. Two synthetic hosts—Lisa (UK voice) for analytical depth and Dan (US voice) for questions and pacing—explore your concepts naturally <cite data-s='2'>Source 02</cite>.",
    snippets: [
      {
        id: "1",
        sourceId: "src-4",
        title: "Podcast_Studio_Architecture.md",
        type: "System Spec",
        page: "Section 3.2",
        relevance: "99% Match",
        highlightText: "dialogue generated from uploaded notes",
        fullExcerpt:
          "The studio script generator analyzes key takeaways from notebook sources to compose a natural two-speaker conversation with organic turn-taking, follow-up questions, and synthesized banter.",
      },
      {
        id: "2",
        sourceId: "src-5",
        title: "Audio_Synthesis_Engine.ts",
        type: "Source Code",
        page: "Line 45-80",
        relevance: "96% Match",
        highlightText: "two hosts: Lisa (UK) and Dan (US)",
        fullExcerpt:
          "Lisa provides structural analysis with British articulation, while Dan asks clarifying questions with American pacing. Speech segments are merged into a single timeline with synchronized timestamps.",
      },
      {
        id: "3",
        sourceId: "src-6",
        title: "Audio_Streaming_Buffer.ts",
        type: "Audio Cache",
        page: "Buffer Pipeline",
        relevance: "90% Match",
        highlightText: "instant playback and streaming",
        fullExcerpt:
          "Synthetic audio chunks are synthesized and cached on demand, allowing users to play, pause, and seek through the discussion seamlessly without regeneration delays.",
      },
    ],
  },
  {
    question: "How do learning roadmaps track source references?",
    answerHtml:
      "Learning roadmaps extract core concepts from your ingested sources and organize them into progressive milestones <cite data-s='1'>Source 01</cite>. Each milestone item links directly back to exact page numbers and timestamps in your uploaded documents <cite data-s='2'>Source 02</cite>.",
    snippets: [
      {
        id: "1",
        sourceId: "src-7",
        title: "Curriculum_Roadmap_Engine.ts",
        type: "Roadmap Spec",
        page: "Milestone Planner",
        relevance: "97% Match",
        highlightText: "progressive milestones from sources",
        fullExcerpt:
          "The curriculum planner parses document concept hierarchies, sorting topics from foundational prerequisites to advanced applications with estimated completion times.",
      },
      {
        id: "2",
        sourceId: "src-8",
        title: "Concept_Provenance_Map.md",
        type: "Provenance Index",
        page: "Section 5.1",
        relevance: "95% Match",
        highlightText: "links back to exact document references",
        fullExcerpt:
          "Every milestone competency badge maintains a foreign key to source chunk vectors. Clicking a milestone highlights the corresponding excerpt in the document viewer instantly.",
      },
      {
        id: "3",
        sourceId: "src-9",
        title: "Mastery_Tracking_System.ts",
        type: "Learning State",
        page: "Schema v2",
        relevance: "89% Match",
        highlightText: "tracks knowledge mastery in notebooks",
        fullExcerpt:
          "As users ask questions and verify concepts, mastery indicators update dynamically in the notebook roadmap view, providing continuous progress feedback.",
      },
    ],
  },
];

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "documents" | "podcast" | "roadmap">("chat");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const [heroHoveredSource, setHeroHoveredSource] = useState<string | null>(null);
  const [inspectedSnippet, setInspectedSnippet] = useState<SnippetData | null>(null);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);

  // Intro Splash State
  const [introVisible, setIntroVisible] = useState(true);
  const [introOut, setIntroOut] = useState(false);
  const [bodyGo, setBodyGo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentScenario = QUESTION_SCENARIOS[selectedQuestionIndex];

  // Intro Splash handling
  const finishIntro = useCallback(() => {
    if (introOut) return;
    setIntroOut(true);
    setTimeout(() => {
      setBodyGo(true);
      document.body.classList.add("go");
    }, 450);
    setTimeout(() => {
      setIntroVisible(false);
      document.documentElement.classList.remove("has-intro", "locked");
    }, 1200);
  }, [introOut]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setIntroVisible(false);
      setBodyGo(true);
      return;
    }

    document.documentElement.classList.add("has-intro", "locked");

    const timer = setTimeout(() => {
      finishIntro();
    }, 2600);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove("has-intro", "locked");
    };
  }, [finishIntro]);

  // Navbar scroll background toggle
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility: Escape key closes modal & mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inspectedSnippet) {
          setInspectedSnippet(null);
        } else if (mobileOpen) {
          setMobileOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectedSnippet, mobileOpen]);

  // Scroll reveal IntersectionObserver (.rv elements)
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const revealElements = root.querySelectorAll(".rv");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [introVisible, activeTab]);

  // Spotlight effect on hoverable cards
  const handleCardMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div className={`landing-root ${bodyGo ? "go" : ""}`} ref={containerRef}>
      {/* Intro Splash Screen */}
      {introVisible && (
        <div
          className={`intro-overlay ${introOut ? "out" : ""}`}
          onClick={finishIntro}
          role="button"
          tabIndex={0}
          aria-label="Skip intro animation"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") finishIntro();
          }}
        >
          <div className="glow" />
          <div className="stage">
            <svg className="sym" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M7 20 14 7l7 13M7 20h14"
                stroke="#3B9B70"
                strokeWidth="1.5"
                strokeLinejoin="round"
                pathLength="40"
              />
              <circle cx="14" cy="7" r="3.2" fill="#65C994" />
              <circle cx="7" cy="20" r="3.2" fill="#3B9B70" />
              <circle cx="21" cy="20" r="3.2" fill="#174D35" stroke="#65C994" strokeWidth="1.5" />
            </svg>
            <div className="word">
              <span style={{ "--i": 0 } as React.CSSProperties}>N</span>
              <span style={{ "--i": 1 } as React.CSSProperties}>O</span>
              <span style={{ "--i": 2 } as React.CSSProperties}>E</span>
              <span style={{ "--i": 3 } as React.CSSProperties}>S</span>
              <span style={{ "--i": 4 } as React.CSSProperties}>I</span>
              <span style={{ "--i": 5 } as React.CSSProperties}>S</span>
            </div>
            <div className="tag">Knowledge · Retrieval · Intelligence</div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav id="nav" className={`${navScrolled ? "on" : ""} ${mobileOpen ? "open" : ""}`}>
        <div className="wrap nav">
          <Link className="logo" href="#top" aria-label="Noesis Home">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M7 20 14 7l7 13M7 20h14" stroke="#3B9B70" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="14" cy="7" r="3.2" fill="#65C994" />
              <circle cx="7" cy="20" r="3.2" fill="#3B9B70" />
              <circle cx="21" cy="20" r="3.2" fill="#174D35" stroke="#65C994" strokeWidth="1.5" />
            </svg>
            Noesis
          </Link>

          <div className="links">
            <a href="#product" onClick={() => setMobileOpen(false)}>Product</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#architecture" onClick={() => setMobileOpen(false)}>Architecture</a>
            <a href="#about" onClick={() => setMobileOpen(false)}>About</a>
          </div>

          <div className="nr">
            <a
              className="gh"
              href="https://github.com/Augusty10/Noesis"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              GitHub
            </a>

            <SignedOut>
              <Link href="/sign-in" className="gh">
                Sign In
              </Link>
              <SignUpButton mode="modal">
                <button className="btn p">Get Started</button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link href="/notebooks" className="btn p">
                Go to Notebooks
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <button
              className="burger"
              id="bg"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 5h14M2 9h14M2 13h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="mobile-drawer" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 24px 24px", background: "rgba(6, 17, 12, 0.98)", borderBottom: "1px solid var(--line)" }}>
            <a href="#product" onClick={() => setMobileOpen(false)} style={{ padding: "8px 0", color: "var(--t)", borderBottom: "1px solid var(--line)" }}>Product</a>
            <a href="#how" onClick={() => setMobileOpen(false)} style={{ padding: "8px 0", color: "var(--t)", borderBottom: "1px solid var(--line)" }}>How It Works</a>
            <a href="#features" onClick={() => setMobileOpen(false)} style={{ padding: "8px 0", color: "var(--t)", borderBottom: "1px solid var(--line)" }}>Features</a>
            <a href="#architecture" onClick={() => setMobileOpen(false)} style={{ padding: "8px 0", color: "var(--t)", borderBottom: "1px solid var(--line)" }}>Architecture</a>
            <a href="#about" onClick={() => setMobileOpen(false)} style={{ padding: "8px 0", color: "var(--t)", borderBottom: "1px solid var(--line)" }}>About</a>
            <a
              href="https://github.com/Augusty10/Noesis"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              style={{ padding: "8px 0", color: "var(--m)", borderBottom: "1px solid var(--line)" }}
            >
              GitHub Repository ↗
            </a>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              <SignedOut>
                <Link href="/sign-in" className="btn s" onClick={() => setMobileOpen(false)} style={{ justifyContent: "center" }}>
                  Sign In
                </Link>
                <SignUpButton mode="modal">
                  <button className="btn p" onClick={() => setMobileOpen(false)} style={{ justifyContent: "center", width: "100%" }}>
                    Get Started Free
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/notebooks" className="btn p" onClick={() => setMobileOpen(false)} style={{ justifyContent: "center" }}>
                  Go to Notebooks
                </Link>
              </SignedIn>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="hero" id="top">
        <div className="wrap">
          <div>
            <span className="badge rise" style={{ "--d": ".35s" } as React.CSSProperties}>
              RAG-Powered Knowledge Intelligence
            </span>
            <h1 className="rise d1" style={{ "--d": ".5s" } as React.CSSProperties}>
              Turn Your Knowledge Into Intelligence.
            </h1>
            <p className="lead rise d1" style={{ "--d": ".7s" } as React.CSSProperties}>
              Upload PDFs, articles, YouTube videos and transcripts into isolated notebooks. Ask questions
              grounded in your sources, and click any citation to see exactly where the answer came from.
            </p>
            <div className="cta rise d2" style={{ "--d": ".9s" } as React.CSSProperties}>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="btn p">Get Started Free</button>
                </SignUpButton>
                <a className="btn w" href="#product">
                  Explore Noesis
                </a>
              </SignedOut>
              <SignedIn>
                <Link href="/notebooks" className="btn p">
                  Go to Notebooks
                </Link>
                <a className="btn w" href="#features">
                  Explore Features
                </a>
              </SignedIn>
            </div>
            <div className="trio rise d2" style={{ "--d": "1s" } as React.CSSProperties}>
              Retrieval · Context · Generation
            </div>
          </div>

          {/* Hero Mock Chat Window */}
          <div
            className="mock beam rise d2"
            style={{ "--d": "1.15s" } as React.CSSProperties}
            role="region"
            aria-label="Interactive Noesis chat preview"
          >
            <div className="bar">
              <i /><i /><i />
              <span>Noesis · Notebook Workspace</span>
            </div>
            <div className="chat">
              <div className="u">What are the key insights from my knowledge base?</div>
              <div className="ai">
                <p>
                  Based on the retrieved documents, the ingestion pipeline divides long files into semantic
                  passages so that only relevant context is retrieved
                  <span
                    className="cite"
                    tabIndex={0}
                    role="button"
                    aria-label="Inspect Source 01"
                    onMouseEnter={() => setHeroHoveredSource("01")}
                    onMouseLeave={() => setHeroHoveredSource(null)}
                    onClick={() =>
                      setInspectedSnippet({
                        id: "hero-1",
                        sourceId: "src-pdf",
                        title: "Research.pdf",
                        type: "PDF Document",
                        page: "Page 2",
                        relevance: "98% Match",
                        highlightText: "semantic chunking and vector indexing",
                        fullExcerpt:
                          "Dense vector embeddings are computed for each passage chunk using OpenAI text-embedding-3-small, allowing sub-second semantic retrieval across multi-gigabyte collections.",
                      })
                    }
                  >
                    Source 01
                  </span>
                  , which is then augmented into the model prompt before answer generation
                  <span
                    className="cite"
                    tabIndex={0}
                    role="button"
                    aria-label="Inspect Source 02"
                    onMouseEnter={() => setHeroHoveredSource("02")}
                    onMouseLeave={() => setHeroHoveredSource(null)}
                    onClick={() =>
                      setInspectedSnippet({
                        id: "hero-2",
                        sourceId: "src-art",
                        title: "RAG_Architecture.article",
                        type: "Web Article",
                        page: "Section 3",
                        relevance: "95% Match",
                        highlightText: "grounded context injection",
                        fullExcerpt:
                          "Grounding ensures all assertions made by the LLM are supported by verifiable citations, preventing hallucinations and enabling instant auditability.",
                      })
                    }
                  >
                    Source 02
                  </span>
                  .
                </p>
                <div className="lbl">Retrieved Sources</div>
                <div className="src">
                  <span
                    style={{
                      borderColor: heroHoveredSource === "01" ? "var(--b)" : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setInspectedSnippet({
                        id: "hero-1",
                        sourceId: "src-pdf",
                        title: "Research.pdf",
                        type: "PDF Document",
                        page: "Page 2",
                        relevance: "98% Match",
                        highlightText: "semantic chunking and vector indexing",
                        fullExcerpt:
                          "Dense vector embeddings are computed for each passage chunk using OpenAI text-embedding-3-small, allowing sub-second semantic retrieval across multi-gigabyte collections.",
                      })
                    }
                  >
                    <b>01</b>Research.pdf
                  </span>
                  <span
                    style={{
                      borderColor: heroHoveredSource === "02" ? "var(--b)" : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setInspectedSnippet({
                        id: "hero-2",
                        sourceId: "src-art",
                        title: "RAG_Architecture.article",
                        type: "Web Article",
                        page: "Section 3",
                        relevance: "95% Match",
                        highlightText: "grounded context injection",
                        fullExcerpt:
                          "Grounding ensures all assertions made by the LLM are supported by verifiable citations, preventing hallucinations and enabling instant auditability.",
                      })
                    }
                  >
                    <b>02</b>Article
                  </span>
                  <span
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setInspectedSnippet({
                        id: "hero-3",
                        sourceId: "src-yt",
                        title: "YouTube_Transcript.vtt",
                        type: "Video Transcript",
                        page: "04:15 - 08:30",
                        relevance: "92% Match",
                        highlightText: "timestamped video transcript",
                        fullExcerpt:
                          "YouTube video audio is transcribed with timestamp alignment, allowing Noesis to cite the exact second mark where a concept was discussed in the lecture.",
                      })
                    }
                  >
                    <b>03</b>YouTube video
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Marquee Strip */}
      <div className="strip">
        <div className="wrap">
          <p>Built around better context</p>
          <div className="mq">
            <ul>
              <li>RAG</li>
              <li>Semantic Retrieval</li>
              <li>Embeddings</li>
              <li>Knowledge Base</li>
              <li>Context-Aware AI</li>
            </ul>
            <ul aria-hidden="true">
              <li>RAG</li>
              <li>Semantic Retrieval</li>
              <li>Embeddings</li>
              <li>Knowledge Base</li>
              <li>Context-Aware AI</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Problem Section (Light) */}
      <section id="product" className="light">
        <div className="wrap">
          <h2 className="rv">AI is only as useful as the context behind the answer.</h2>
          <div className="grid3">
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <div className="ic">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="6" height="6" rx="1" />
                  <rect x="10" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="11" width="6" height="5" rx="1" />
                </svg>
              </div>
              <h3>Scattered Knowledge</h3>
              <p>Your important information lives across documents, notes, transcripts, and web sources.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <div className="ic">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="9" r="6.5" strokeDasharray="3 3" />
                  <circle cx="9" cy="9" r="1.5" />
                </svg>
              </div>
              <h3>Missing Context</h3>
              <p>Generic AI responses hallucinate because they lack access to your actual internal materials.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <div className="ic">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h14M2 9h14M2 14h14" />
                </svg>
              </div>
              <h3>Information Overload</h3>
              <p>Finding needle-in-a-haystack references manually becomes impossible as collections expand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section id="how" className="rag">
        <div className="wrap">
          <h2 className="rv">From Knowledge to Answer</h2>
          <div className="flow rv">
            <div className="node">
              Your Knowledge
              <small>PDFs, Articles, YouTube, Notes</small>
            </div>
            <div className="line" />
            <div className="node">
              Retrieve Relevant Context
              <small>High-dimensional vector similarity</small>
            </div>
            <div className="line" />
            <div className="node">
              Augment the Prompt
              <small>Grounded context injection</small>
            </div>
            <div className="line" />
            <div className="node">
              Generate Answer
              <small>Low-temperature verified synthesis</small>
            </div>
            <div className="line" />
            <div className="node hl">
              Cite Sources
              <small>Trace every answer back to original text</small>
            </div>
          </div>
        </div>
      </section>

      {/* RAG Context Explanation */}
      <section>
        <div className="wrap">
          <h2 className="rv">Give AI the context it needs.</h2>
          <p className="lead rv" style={{ maxWidth: "60ch", marginTop: "20px", fontSize: "1.08rem" }}>
            Retrieval-Augmented Generation combines precise vector retrieval with language generation,
            guaranteeing that answers are backed by verifiable evidence.
          </p>
          <div className="rag">
            <div className="row rv" style={{ marginTop: "48px", background: "none", border: 0 }}>
              <div className="n">
                <b>Documents</b>
                <small>Your knowledge</small>
              </div>
              <div className="ar" />
              <div className="n">
                <b>Retrieval</b>
                <small>Find what&apos;s relevant</small>
              </div>
              <div className="ar" />
              <div className="n">
                <b>Context</b>
                <small>Added to the prompt</small>
              </div>
              <div className="ar" />
              <div className="n">
                <b>LLM</b>
                <small>Language model</small>
              </div>
              <div className="ar" />
              <div className="n k">
                <b>Answer</b>
                <small>Grounded in sources</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section (Light) */}
      <section id="features" className="light">
        <div className="wrap">
          <h2 className="rv">Designed around retrieval, context and generation.</h2>
          <div className="feat">
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Context-Aware Answers</h3>
              <p>Generate streaming responses strictly grounded in your retrieved source documents.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Semantic Retrieval</h3>
              <p>Find passages based on underlying conceptual meaning, not brittle exact-keyword matches.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Clickable Citations</h3>
              <p>Click any citation badge in a response to view the exact page and paragraph it originated from.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Isolated Notebooks</h3>
              <p>Keep sources for distinct research projects in their own isolated, secure knowledge spaces.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>5 Source Formats</h3>
              <p>Bring PDFs, web articles, YouTube videos, plain text, and WebVTT transcripts together seamlessly.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Studio & Roadmaps</h3>
              <p>Generate conversational dual-host podcasts and structured learning milestones from your notes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Workspace Preview Section */}
      <section className="rag">
        <div className="wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="badge" style={{ marginBottom: 12 }}>Interactive Sandbox</span>
              <h2 className="rv">See Noesis at work.</h2>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--m)" }}>
              Switch tabs or questions below to explore live capabilities:
            </div>
          </div>

          <div
            className="mock pvbig rv"
            role="region"
            aria-label="Noesis interactive workspace preview"
          >
            <div className="bar">
              <i /><i /><i />
              <span>Noesis · AI Research Assistant Workspace</span>
            </div>

            <div className="pv">
              {/* Left Tab Navigation */}
              <div className="side" role="tablist" aria-label="Workspace tabs">
                <div
                  role="tab"
                  aria-selected={activeTab === "chat"}
                  className={activeTab === "chat" ? "on" : ""}
                  onClick={() => setActiveTab("chat")}
                >
                  <BookOpen size={14} />
                  <span>Chat & RAG</span>
                </div>
                <div
                  role="tab"
                  aria-selected={activeTab === "documents"}
                  className={activeTab === "documents" ? "on" : ""}
                  onClick={() => setActiveTab("documents")}
                >
                  <FileText size={14} />
                  <span>Sources (5)</span>
                </div>
                <div
                  role="tab"
                  aria-selected={activeTab === "podcast"}
                  className={activeTab === "podcast" ? "on" : ""}
                  onClick={() => setActiveTab("podcast")}
                >
                  <Volume2 size={14} />
                  <span>Podcast Studio</span>
                </div>
                <div
                  role="tab"
                  aria-selected={activeTab === "roadmap"}
                  className={activeTab === "roadmap" ? "on" : ""}
                  onClick={() => setActiveTab("roadmap")}
                >
                  <Sparkles size={14} />
                  <span>Roadmaps</span>
                </div>
              </div>

              {/* Middle Main Content Panel */}
              <div style={{ minHeight: 320, display: "flex", flexDirection: "column" }}>
                {activeTab === "chat" && (
                  <div className="chat" style={{ flex: 1 }}>
                    {/* Suggested Question Chips */}
                    <div className="chips-row">
                      {QUESTION_SCENARIOS.map((q, idx) => (
                        <button
                          key={idx}
                          className={`chip ${selectedQuestionIndex === idx ? "active" : ""}`}
                          onClick={() => {
                            setSelectedQuestionIndex(idx);
                            setHoveredCitation(null);
                          }}
                        >
                          {q.question}
                        </button>
                      ))}
                    </div>

                    <div className="u">{currentScenario.question}</div>

                    <div className="ai">
                      <p>
                        {selectedQuestionIndex === 0 && (
                          <>
                            Documents are divided into smaller passages using semantic chunking so that only the most
                            relevant sections are retrieved for each question{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 01"
                              onMouseEnter={() => setHoveredCitation("1")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[0])}
                            >
                              Source 01
                            </span>
                            . The retrieved passages are then added to the prompt context before the answer is generated{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 02"
                              onMouseEnter={() => setHoveredCitation("2")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[1])}
                            >
                              Source 02
                            </span>
                            , preventing context dilution and hallucination{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 03"
                              onMouseEnter={() => setHoveredCitation("3")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[2])}
                            >
                              Source 03
                            </span>
                            .
                          </>
                        )}
                        {selectedQuestionIndex === 1 && (
                          <>
                            Yes! The built-in Podcast Studio transforms your notebook documents into an engaging
                            multi-speaker audio discussion{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 01"
                              onMouseEnter={() => setHoveredCitation("1")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[0])}
                            >
                              Source 01
                            </span>
                            . Two synthetic hosts—Lisa (UK voice) for analytical depth and Dan (US voice) for questions
                            and pacing—explore your concepts naturally{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 02"
                              onMouseEnter={() => setHoveredCitation("2")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[1])}
                            >
                              Source 02
                            </span>
                            .
                          </>
                        )}
                        {selectedQuestionIndex === 2 && (
                          <>
                            Learning roadmaps extract core concepts from your ingested sources and organize them into
                            progressive milestones{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 01"
                              onMouseEnter={() => setHoveredCitation("1")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[0])}
                            >
                              Source 01
                            </span>
                            . Each milestone item links directly back to exact page numbers and timestamps in your
                            uploaded documents{" "}
                            <span
                              className="cite"
                              tabIndex={0}
                              role="button"
                              aria-label="Inspect Source 02"
                              onMouseEnter={() => setHoveredCitation("2")}
                              onMouseLeave={() => setHoveredCitation(null)}
                              onClick={() => setInspectedSnippet(currentScenario.snippets[1])}
                            >
                              Source 02
                            </span>
                            .
                          </>
                        )}
                      </p>
                      <div className="lbl" style={{ marginTop: 14 }}>
                        Click any citation or snippet to inspect the original passage:
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="docs-view">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--m)" }}>
                        Active Notebook: <b>Deep Learning & RAG Systems</b>
                      </span>
                      <Link href="/notebooks" className="btn s" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
                        Manage Sources ↗
                      </Link>
                    </div>

                    <div className="doc-item">
                      <div>
                        <div style={{ fontSize: "0.88rem", color: "var(--t)", fontWeight: 500 }}>
                          Attention_Is_All_You_Need.pdf
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)" }}>PDF • 18 Chunks • Processed</div>
                      </div>
                      <span className="doc-badge">Ready (100%)</span>
                    </div>

                    <div className="doc-item">
                      <div>
                        <div style={{ fontSize: "0.88rem", color: "var(--t)", fontWeight: 500 }}>
                          RAG_Systems_Architecture_Guide.md
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)" }}>Markdown • 6 Chunks • Processed</div>
                      </div>
                      <span className="doc-badge">Ready (100%)</span>
                    </div>

                    <div className="doc-item">
                      <div>
                        <div style={{ fontSize: "0.88rem", color: "var(--t)", fontWeight: 500 }}>
                          Stanford_CS224N_Lecture_08
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)" }}>YouTube • 34 Chunks • Timestamps Attached</div>
                      </div>
                      <span className="doc-badge">Ready (100%)</span>
                    </div>
                  </div>
                )}

                {activeTab === "podcast" && (
                  <div className="podcast-view">
                    <div className="podcast-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--t)" }}>
                            Episode 1: Retrieval-Augmented Generation Deep Dive
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--m)", marginTop: 2 }}>
                            Synthetic Hosts: Lisa (UK) & Dan (US) • 06:42 duration
                          </div>
                        </div>
                        <span className="doc-badge">Audio Generated</span>
                      </div>

                      <div className="podcast-controls">
                        <button
                          className="play-btn"
                          aria-label={isPlayingPodcast ? "Pause podcast" : "Play podcast"}
                          onClick={() => setIsPlayingPodcast(!isPlayingPodcast)}
                        >
                          {isPlayingPodcast ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                        </button>
                        <div className="waveform-mock">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div
                              key={i}
                              className={`wave-bar ${isPlayingPodcast ? "active" : ""}`}
                              style={{
                                height: `${Math.sin(i * 0.4) * 10 + 14}px`,
                                animationDelay: `${(i % 5) * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6, fontSize: "0.78rem", color: "var(--m)" }}>
                        <b style={{ color: "var(--b)" }}>Lisa (UK):</b> &quot;Welcome back! Today we are looking at how Noesis retrieves only the exact passages you need...&quot;
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <Link href="/notebooks" className="btn s" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                        Open Podcast Studio in Notebooks ↗
                      </Link>
                    </div>
                  </div>
                )}

                {activeTab === "roadmap" && (
                  <div className="roadmap-view">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--m)" }}>
                        Generated Curriculum for: <b>RAG Architecture</b>
                      </span>
                      <Link href="/notebooks" className="btn s" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
                        Generate Roadmap ↗
                      </Link>
                    </div>

                    <div className="milestone-card">
                      <div className="milestone-num">1</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--t)" }}>
                          Document Partitioning & Chunk Boundary Preservation
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)", marginTop: 2 }}>
                          3 Source References • Ingestion_Pipeline_Spec.pdf
                        </div>
                      </div>
                      <CheckCircle2 size={16} color="var(--b)" />
                    </div>

                    <div className="milestone-card">
                      <div className="milestone-num">2</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--t)" }}>
                          Dense Vector Embeddings & Cosine Distance Retrieval
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)", marginTop: 2 }}>
                          4 Source References • Stanford_CS224N_Lecture_08
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--m)" />
                    </div>

                    <div className="milestone-card">
                      <div className="milestone-num">3</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--t)" }}>
                          Grounded Context Injection & Citation Verification
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--m)", marginTop: 2 }}>
                          5 Source References • Grounding_Evaluation_Report.pdf
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--m)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Context Inspection Sidebar */}
              <div className="ctx">
                <h4>Retrieved Context Chunks</h4>
                {currentScenario.snippets.map((snip) => (
                  <div
                    key={snip.id}
                    className={`snip ${hoveredCitation === snip.id ? "hot" : ""}`}
                    data-s={snip.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ${snip.title}`}
                    onClick={() => setInspectedSnippet(snip)}
                  >
                    <b>{snip.title}</b>
                    <span>
                      {snip.page} • <mark>{snip.highlightText}</mark>
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "var(--b)", marginTop: 4 }}>
                      {snip.relevance} • Click to inspect passage
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Flow Section */}
      <section id="architecture">
        <div className="wrap">
          <h2 className="rv">Powered by Retrieval. Built for Context.</h2>
          <div className="arch rv">
            <div className="s">User Query</div>
            <div className="c" />
            <div className="s k">Noesis Router</div>
            <div className="c" />
            <div className="s">Vector DB</div>
            <div className="c" />
            <div className="s">Cosine Retrieval</div>
            <div className="c" />
            <div className="s">Context Prompt</div>
            <div className="c" />
            <div className="s">Language Model</div>
            <div className="c" />
            <div className="s k">Grounded Answer</div>
          </div>
        </div>
      </section>

      {/* Use Cases Section (Light) */}
      <section id="about" className="light">
        <div className="wrap">
          <h2 className="rv">Made for the way you work with information.</h2>
          <div className="grid4">
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Research</h3>
              <p>Explore, query, and synthesize complex multi-document scientific collections with citations.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Engineering</h3>
              <p>Index technical documentation, architecture specs, and RFCs for instant developer lookup.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Learning</h3>
              <p>Turn lectures, textbooks, and notes into interactive conversational tutors and roadmaps.</p>
            </div>
            <div className="card rv" onPointerMove={handleCardMouseMove}>
              <h3>Knowledge Teams</h3>
              <p>Eliminate corporate knowledge silos with isolated, searchable team intelligence notebooks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Statement Section */}
      <section className="brand">
        <div className="wrap rv">
          <h2>Better AI doesn&apos;t only need better models.</h2>
          <h2>It needs better context.</h2>
        </div>
      </section>

      {/* Final Call to Action */}
      <section id="start" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="final beam rv">
            <h2>Bring your knowledge closer to AI.</h2>
            <p>Explore Noesis and experience a context-aware way to interact with your sources.</p>
            <div className="cta">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="btn w">Get Started Free</button>
                </SignUpButton>
                <a
                  className="btn s"
                  href="https://github.com/Augusty10/Noesis"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub
                </a>
              </SignedOut>
              <SignedIn>
                <Link href="/notebooks" className="btn w">
                  Go to Notebooks
                </Link>
                <a
                  className="btn s"
                  href="https://github.com/Augusty10/Noesis"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub
                </a>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Source Inspector Modal */}
      {inspectedSnippet && (
        <div
          className="inspector-backdrop"
          onClick={() => setInspectedSnippet(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="inspector-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="inspector-close"
              aria-label="Close inspector modal"
              onClick={() => setInspectedSnippet(null)}
            >
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="doc-badge">{inspectedSnippet.type}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--b)" }}>{inspectedSnippet.relevance}</span>
            </div>
            <h3 id="modal-title" style={{ fontSize: "1.2rem", marginBottom: 6, color: "var(--t)" }}>
              {inspectedSnippet.title}
            </h3>
            <div style={{ fontSize: "0.82rem", color: "var(--m)", marginBottom: 16 }}>
              {inspectedSnippet.page}
            </div>

            <div style={{ borderLeft: "3px solid var(--b)", paddingLeft: 12, margin: "16px 0", background: "rgba(101, 201, 148, 0.04)", padding: "12px", borderRadius: 6 }}>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--b)", marginBottom: 6, fontWeight: 600 }}>
                Retrieved Passage Excerpt
              </div>
              <p style={{ color: "#E0E7E3", fontSize: "0.92rem", lineHeight: 1.6 }}>
                &quot;{inspectedSnippet.fullExcerpt}&quot;
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn s" onClick={() => setInspectedSnippet(null)} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                Close
              </button>
              <Link href="/notebooks" className="btn p" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                Open in Workspace <ExternalLink size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Footer */}
      <footer>
        <div className="wrap">
          <div>
            <Link className="logo" href="#top">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M7 20 14 7l7 13M7 20h14" stroke="#3B9B70" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="14" cy="7" r="3.2" fill="#65C994" />
                <circle cx="7" cy="20" r="3.2" fill="#3B9B70" />
                <circle cx="21" cy="20" r="3.2" fill="#174D35" stroke="#65C994" strokeWidth="1.5" />
              </svg>
              Noesis
            </Link>
            <p className="tag">Knowledge → Retrieval → Intelligence</p>
          </div>

          <ul>
            <li><a href="#product">Product</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li><a href="#about">About</a></li>
            <li><Link href="/notebooks">Notebooks</Link></li>
            <li>
              <a
                href="https://github.com/Augusty10/Noesis#readme"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Augusty10/Noesis"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </li>
          </ul>

          <div className="cp">
            © 2026 Noesis. All rights reserved. RAG-Powered Knowledge Intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
}
