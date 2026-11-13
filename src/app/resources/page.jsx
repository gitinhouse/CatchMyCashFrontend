import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '../components/seo/Breadcrumbs';
import JsonLd from '../components/seo/JsonLd';
import CtaBand from '../components/content/CtaBand';
import ResourceCard from '../components/resources/ResourceCard';
import {
  FeaturedResource,
  ResourcePagination,
  ResourceSearch,
  TopicNav,
} from '../components/resources/ResourceParts';
import { getHubSettings, getLeadPost, getTopics, listPosts } from '../lib/resources/queries';
import { DEFAULT_HUB, HUB_PAGE_SIZE, RESOURCES_PATH, topicPath } from '../lib/resources/constants';
import { collectionJsonLd, listingMetadata } from '../lib/resources/seo';
import { pageCrumbs } from '../lib/seo';

// Articles change from the admin console; reads are cached and invalidated on
// every change (lib/resources/queries.js).
export const dynamic = 'force-dynamic';

async function readParams(searchParams) {
  const sp = (await searchParams) || {};
  const q = typeof sp.q === 'string' ? sp.q.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  const page = Math.min(Math.max(parseInt(sp.page, 10) || 1, 1), 500);
  return { q, page };
}

const pageHref = (q) => (n) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (n > 1) params.set('page', String(n));
  const query = params.toString();
  return query ? `${RESOURCES_PATH}?${query}` : RESOURCES_PATH;
};

export async function generateMetadata({ searchParams }) {
  const { q, page } = await readParams(searchParams);
  const settings = await getHubSettings();
  return listingMetadata({
    title: settings.metaTitle || DEFAULT_HUB.metaTitle,
    description: settings.metaDescription || DEFAULT_HUB.metaDescription,
    path: !q && page > 1 ? `${RESOURCES_PATH}?page=${page}` : RESOURCES_PATH,
    // Search results are for visitors, not for search engines.
    noindex: Boolean(q),
    canonicalPath: q ? RESOURCES_PATH : undefined,
  });
}

export default async function ResourcesHub({ searchParams }) {
  const { q, page } = await readParams(searchParams);
  const [settings, topics, lead] = await Promise.all([getHubSettings(), getTopics(), getLeadPost()]);
  // The lead article heads page one and is left out of the grid on every
  // page, so paging through the grid never shows it twice.
  const list = await listPosts({ q, page, pageSize: HUB_PAGE_SIZE, excludeId: q ? '' : lead?.id || '' });
  if (page > 1 && page > list.totalPages) notFound();

  const browsing = !q && page === 1;
  const hasArticles = Boolean(lead);
  const listed = [...(browsing && lead ? [lead] : []), ...list.posts];
  const topicsWithPosts = topics.filter((t) => t.postCount > 0);

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          title: settings.heading,
          description: settings.intro,
          path: RESOURCES_PATH,
          posts: listed,
        })}
      />

      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <span aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full border-[48px] border-[#E1261C]/25" />
        <span aria-hidden="true" className="absolute right-40 -bottom-32 w-64 h-64 rounded-full border-[28px] border-white/5" />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-8 py-12 lg:py-20">
          <Breadcrumbs crumbs={pageCrumbs('Resources', RESOURCES_PATH)} tone="dark" className="mb-8" />
          <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.15em] uppercase text-[#E1261C] mb-5">
            Resource Hub
          </p>
          <h1 className="font-['Fraunces'] text-[clamp(36px,5.5vw,64px)] font-semibold tracking-[-0.02em] leading-[1.04] max-w-[18ch] mb-5">
            {settings.heading}
          </h1>
          <p className="text-lg md:text-xl leading-snug text-[#D4D4D4] max-w-[60ch] mb-8">{settings.intro}</p>
          <ResourceSearch defaultValue={q} tone="dark" />
          {topicsWithPosts.length > 0 && (
            <div className="mt-8">
              <TopicNav topics={topics} tone="dark" />
            </div>
          )}
        </div>
      </section>

      <div className="bg-[#F7F5F2]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-12 lg:py-16">
          {q ? (
            <section aria-labelledby="results-heading">
              <h2 id="results-heading" className="font-['Fraunces'] text-3xl md:text-[38px] font-semibold tracking-[-0.01em] mb-2">
                Results for “{q}”
              </h2>
              <p className="text-[#4A4A4A] mb-8">
                {list.total === 0
                  ? 'No articles match that search yet.'
                  : `${list.total} article${list.total === 1 ? '' : 's'} found.`}{' '}
                <Link href={RESOURCES_PATH} className="text-[#E1261C] underline underline-offset-2">
                  Clear search
                </Link>
              </p>
              {list.total === 0 ? (
                <p className="max-w-[60ch] text-[#4A4A4A]">
                  Try a shorter word, or browse the{' '}
                  <Link href="/faq" className="text-[#E1261C] underline underline-offset-2">FAQ</Link>{' '}
                  and{' '}
                  <Link href="/how-it-works" className="text-[#E1261C] underline underline-offset-2">how it works</Link>.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.posts.map((post) => (
                    <ResourceCard key={post.id} post={post} />
                  ))}
                </div>
              )}
              <ResourcePagination page={list.page} totalPages={list.totalPages} hrefFor={pageHref(q)} />
            </section>
          ) : !hasArticles ? (
            <section className="max-w-[640px] py-10">
              <h2 className="font-['Fraunces'] text-3xl font-semibold mb-3">New guides are on the way.</h2>
              <p className="text-[#4A4A4A] mb-6">
                While we write them, the{' '}
                <Link href="/faq" className="text-[#E1261C] underline underline-offset-2">FAQ</Link>,{' '}
                <Link href="/claim-types" className="text-[#E1261C] underline underline-offset-2">claim types</Link> and{' '}
                <Link href="/eligibility" className="text-[#E1261C] underline underline-offset-2">who can claim</Link>{' '}
                pages answer the most common questions.
              </p>
            </section>
          ) : (
            <>
              {browsing && lead && (
                <section aria-label="Featured guide" className="mb-14">
                  <FeaturedResource post={lead} />
                </section>
              )}

              {list.posts.length > 0 && (
                <section aria-labelledby="latest-heading">
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
                    <h2 id="latest-heading" className="font-['Fraunces'] text-3xl md:text-[38px] font-semibold tracking-[-0.01em]">
                      {browsing ? 'Latest guides' : `All guides — page ${page}`}
                    </h2>
                    <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.1em] uppercase text-[#888888]">
                      {list.total + (lead ? 1 : 0)} articles
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.posts.map((post) => (
                      <ResourceCard key={post.id} post={post} />
                    ))}
                  </div>
                  <ResourcePagination page={list.page} totalPages={list.totalPages} hrefFor={pageHref('')} />
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {browsing && topicsWithPosts.length > 0 && (
        <section aria-labelledby="topics-heading" className="bg-white border-t border-[#E8E6E3]">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-14 lg:py-20">
            <h2 id="topics-heading" className="font-['Fraunces'] text-3xl md:text-[38px] font-semibold tracking-[-0.01em] mb-2">
              Explore by topic
            </h2>
            <p className="text-[#4A4A4A] mb-10 max-w-[60ch]">Every guide, grouped by the question it answers.</p>
            <ol className="grid md:grid-cols-2 border-t border-[#E8E6E3]">
              {topicsWithPosts.map((topic, i) => (
                <li key={topic.id} className="border-b border-[#E8E6E3] md:odd:pr-8 md:even:pl-8 md:[&:nth-child(odd):not(:last-child)]:border-r">
                  <Link href={topicPath(topic.slug)} className="group flex gap-5 py-7">
                    <span className="font-['JetBrains_Mono'] text-[13px] text-[#E1261C] pt-1.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-['Fraunces'] text-2xl font-semibold text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
                          {topic.name}
                        </h3>
                        <span className="shrink-0 font-['JetBrains_Mono'] text-[11px] tracking-[0.08em] uppercase text-[#888888]">
                          {topic.postCount} {topic.postCount === 1 ? 'guide' : 'guides'} →
                        </span>
                      </div>
                      {topic.description && (
                        <p className="mt-2 text-[15px] leading-relaxed text-[#4A4A4A]">{topic.description}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <CtaBand
        title="Ready to check your name?"
        body="Search California’s unclaimed property records for free. If we find something, we file the claim for you."
      />
    </>
  );
}
