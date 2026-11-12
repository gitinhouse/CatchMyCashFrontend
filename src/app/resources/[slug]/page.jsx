import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '../../components/seo/Breadcrumbs';
import JsonLd from '../../components/seo/JsonLd';
import CtaBand from '../../components/content/CtaBand';
import ResourceCard from '../../components/resources/ResourceCard';
import { ArticleBody, ArticleToc, ShareLinks } from '../../components/resources/ResourceParts';
import { getPostBySlug, getRelatedPosts } from '../../lib/resources/queries';
import { RESOURCES_PATH, articlePath, topicPath } from '../../lib/resources/constants';
import { formatArticleDate, wasUpdated } from '../../lib/resources/format';
import { articleFaqJsonLd, articleMetadata, blogPostingJsonLd } from '../../lib/resources/seo';
import { absoluteUrl } from '../../lib/site';

export const dynamic = 'force-dynamic';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** { post } | { redirectTo } | null */
async function load(params) {
  const { slug: raw } = await params;
  let slug = '';
  try {
    slug = decodeURIComponent(String(raw || ''));
  } catch {
    return null;
  }
  const lower = slug.toLowerCase();
  if (!SLUG.test(lower) || lower.length > 100) return null;
  // /resources/How-To-Claim and /resources/how-to-claim are one article.
  if (slug !== lower) return { redirectTo: lower };
  return getPostBySlug(slug);
}

export async function generateMetadata({ params }) {
  const result = await load(params);
  if (!result?.post) return { title: 'Article not found', robots: { index: false, follow: true } };
  return articleMetadata(result.post);
}

const initialsOf = (name) =>
  String(name || 'CatchMyCash')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default async function ArticlePage({ params }) {
  const result = await load(params);
  if (!result) notFound();
  if (result.redirectTo) permanentRedirect(articlePath(result.redirectTo));

  const { post } = result;
  const related = await getRelatedPosts(post.id, post.topicId, 3);
  const url = absoluteUrl(articlePath(post.slug));
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: RESOURCES_PATH },
    ...(post.topic ? [{ name: post.topic.name, path: topicPath(post.topic.slug) }] : []),
    { name: post.title, path: articlePath(post.slug) },
  ];
  const updated = wasUpdated(post);

  return (
    <>
      <JsonLd data={[blogPostingJsonLd(post), articleFaqJsonLd(post)].filter(Boolean)} />

      <article>
        <header className="bg-white">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 lg:pt-14 pb-10">
            <Breadcrumbs crumbs={crumbs} className="mb-8" />
            <div className="max-w-[820px]">
              {post.topic && (
                <Link
                  href={topicPath(post.topic.slug)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FCE9E7] px-3.5 py-1.5 font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#E1261C] hover:bg-[#E1261C] hover:text-white transition-colors mb-5"
                >
                  {post.topic.name}
                </Link>
              )}
              <h1 className="font-['Fraunces'] text-[clamp(32px,5vw,56px)] font-semibold tracking-[-0.02em] leading-[1.06] text-[#0A0A0A] mb-5">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg md:text-[21px] leading-relaxed text-[#4A4A4A] max-w-[62ch] mb-7">{post.excerpt}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#E8E6E3] pt-5">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white font-['Fraunces'] text-sm font-bold flex items-center justify-center"
                  >
                    {initialsOf(post.authorName)}
                  </span>
                  <span className="text-sm">
                    <span className="block text-[#888888] text-xs">Written by</span>
                    <span className="font-semibold text-[#0A0A0A]">{post.authorName}</span>
                  </span>
                </span>
                <span className="text-sm text-[#4A4A4A]">
                  <span className="block text-[#888888] text-xs">Published</span>
                  <time dateTime={post.publishedAt}>{formatArticleDate(post.publishedAt)}</time>
                </span>
                {updated && (
                  <span className="text-sm text-[#4A4A4A]">
                    <span className="block text-[#888888] text-xs">Updated</span>
                    <time dateTime={post.updatedAt}>{formatArticleDate(post.updatedAt)}</time>
                  </span>
                )}
                <span className="text-sm text-[#4A4A4A]">
                  <span className="block text-[#888888] text-xs">Reading time</span>
                  {`${post.readingMinutes} min`}
                </span>
              </div>
            </div>
          </div>
          {post.coverImage.url && (
            <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pb-2">
              <img
                src={post.coverImage.url}
                alt={post.coverImage.alt}
                fetchPriority="high"
                decoding="async"
                className="w-full max-h-[520px] object-cover rounded-3xl border border-[#E8E6E3]"
              />
            </div>
          )}
        </header>

        <div className="bg-white">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-10 lg:py-14 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-12 xl:gap-20">
            <div className="min-w-0 max-w-[720px]">
              {post.toc.length >= 2 && (
                <details className="lg:hidden mb-10 rounded-2xl border border-[#E8E6E3] bg-[#F7F5F2] px-5 py-4">
                  <summary className="cursor-pointer font-['JetBrains_Mono'] text-[12px] tracking-[0.14em] uppercase text-[#0A0A0A]">
                    In this article
                  </summary>
                  <ArticleToc toc={post.toc} className="mt-4" />
                </details>
              )}

              <ArticleBody html={post.content} />

              {post.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="mt-14">
                  <h2 id="faq-heading" className="font-['Fraunces'] text-[28px] md:text-[32px] font-semibold tracking-[-0.01em] mb-4">
                    Frequently asked questions
                  </h2>
                  <div className="border-y border-[#E8E6E3] divide-y divide-[#E8E6E3]">
                    {post.faqs.map((faq, i) => (
                      <details key={i} className="group py-5" open={i === 0}>
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-['Fraunces'] text-[19px] font-semibold text-[#0A0A0A] [&::-webkit-details-marker]:hidden">
                          {faq.question}
                          <span
                            aria-hidden="true"
                            className="mt-0.5 w-7 h-7 shrink-0 rounded-full border border-[#D4D4D4] flex items-center justify-center text-lg leading-none transition-transform group-open:rotate-45 group-open:bg-[#E1261C] group-open:border-[#E1261C] group-open:text-white"
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-[16px] leading-relaxed text-[#4A4A4A] whitespace-pre-line">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {post.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-12 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`${RESOURCES_PATH}?q=${encodeURIComponent(tag)}`}
                        rel="nofollow"
                        className="inline-block rounded-full border border-[#D4D4D4] px-3 py-1 text-[13px] text-[#4A4A4A] hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                      >
                        {`#${tag}`}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="lg:hidden mt-10 flex items-center gap-4">
                <span className="font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#888888]">Share</span>
                <ShareLinks url={url} title={post.title} />
              </div>

              <p className="mt-12 border-l-2 border-[#E1261C] pl-4 text-sm leading-relaxed text-[#888888]">
                This guide is general information about California’s unclaimed property process, not legal or tax advice.
                Anyone can search and claim directly with the State Controller’s Office for free.
              </p>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-8">
                {post.toc.length >= 2 && (
                  <nav aria-label="In this article">
                    <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.14em] uppercase text-[#0A0A0A] mb-4">
                      In this article
                    </p>
                    <ArticleToc toc={post.toc} />
                  </nav>
                )}
                <div className="rounded-2xl bg-[#0A0A0A] text-white p-6">
                  <p className="font-['Fraunces'] text-xl font-semibold leading-snug mb-2">Is California holding money for you?</p>
                  <p className="text-sm text-[#D4D4D4] mb-5">The search is free and takes about thirty seconds.</p>
                  <Link
                    href="/?step=search"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#E1261C] px-4 py-3 text-sm font-semibold hover:bg-[#B11912] transition-colors"
                  >
                    Check your name
                  </Link>
                </div>
                <div>
                  <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.14em] uppercase text-[#0A0A0A] mb-3">Share</p>
                  <ShareLinks url={url} title={post.title} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="bg-[#F7F5F2] border-t border-[#E8E6E3]">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-14 lg:py-16">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
              <h2 id="related-heading" className="font-['Fraunces'] text-3xl md:text-[36px] font-semibold tracking-[-0.01em]">
                Keep reading
              </h2>
              <Link href={RESOURCES_PATH} className="text-sm font-semibold text-[#E1261C] hover:underline underline-offset-4">
                All guides →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <ResourceCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
