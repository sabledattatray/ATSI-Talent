import { PageSkeleton } from "@/components/common/PageSkeleton";
import { pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/common/StructuredData";
import { articlePosting, breadcrumbs } from "@/lib/structured-data";
/* eslint-disable @next/next/no-img-element -- Uploaded content uses native images with user-defined dimensions. */
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { records } from "@/lib/admin/db";
import { plainText } from "@/lib/admin/public";
import { RichContent } from "@/components/admin/RichContent";
import "@/components/admin/admin.css";
import "@/components/admin/public.css";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { const { slug } = await params; await connection(); const p = (await records("post", true)).find(r => r.slug === slug); if (!p) notFound(); const metadata = pageMetadata(`/blog/${p.slug}`, p.seoTitle || p.title, p.seoDescription || p.excerpt, p.cover || undefined); return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: p.publishedAt!, modifiedTime: p.updatedAt, authors: [p.author] } }; }

async function Article({ params }: Props) { await connection(); const { slug } = await params; const p = (await records("post", true)).find(r => r.slug === slug); if (!p) notFound(); const related = (await records("post", true)).filter(r => r.id !== p.id).slice(0, 3); return <article className="cms-public cms-public-article"><StructuredData data={articlePosting(p)} /><StructuredData data={breadcrumbs([{ name: "Career insights", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }])} /><Link href="/blog" className="cms-public-back"><ArrowLeft size={16} />Back to the journal</Link><header><span className="cms-public-eyebrow">{p.category}</span><h1>{p.title}</h1><p>{p.excerpt}</p><div className="cms-public-article-byline"><span className="cms-public-author-avatar">{p.author.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><span><strong>{p.author}</strong><small>{new Date(p.publishedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</small></span><span className="cms-public-read-time"><Clock3 size={14} />{Math.max(1, Math.ceil(plainText(p.content).split(/\s+/).length / 220))} min read</span></div></header>{p.cover && <img className="cms-public-article-cover" src={p.cover} alt={p.title} />}<div className="cms-public-article-body"><RichContent document={p.content} /></div><footer className="cms-public-article-footer"><span>Published by {p.author} · ATS AI</span><Link href="/jobs">Find your next opportunity<ArrowUpRight size={16} /></Link></footer>{!!related.length && <section className="cms-public-related"><h2>Keep exploring</h2>{related.map(r => <Link key={r.id} href={`/blog/${r.slug}`}><span>{r.category}</span><strong>{r.title}</strong><ArrowUpRight size={19} /></Link>)}</section>}</article>; }
export default function Page(props: Props) { return <Suspense fallback={<PageSkeleton title="Career insights" />}><Article {...props} /></Suspense>; }
