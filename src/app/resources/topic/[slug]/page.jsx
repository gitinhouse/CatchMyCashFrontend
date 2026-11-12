import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import JsonLd from '../../../components/seo/JsonLd';
import CtaBand from '../../../components/content/CtaBand';
import ResourceCard from '../../../components/resources/ResourceCard';
import { ResourcePagination, TopicNav } from '../../../components/resources/ResourceParts';
import { getTopics, listPosts } from '../../../lib/resources/queries';
import { RESOURCES_PATH, TOPIC_PAGE_SIZE, topicPath } from '../../../lib/resources/constants';
import { collectionJsonLd, listingMetadata } from '../../../lib/resources/seo';

export const dynamic = 'force-dynamic';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** { topic, topics, page } | { redirectTo } | null */
async function load(params, searchParams) {
  const { slug: raw } = await params;
  const sp = (await searchParams) || {};
  let slug = '';
  try {
    slug = decodeURIComponent(String(raw || ''));
  } catch {
    return null;
  }
  const lower = slug.toLowerCase();
  if (!SLUG.test(lower) || lower.length > 100) return null;
  if (slug !== lower) return { redirectTo: lower };
  const topics = await getTopics();
  const topic = topics.find((t) => t.slug === slug);
  if (!topic) return null;
  const page = Math.min(Math.max(parseInt(sp.page, 10) || 1, 1), 500);
  return { topic, topics, page };
}

const describe = (topic) =>
  topic.seo.metaDescription ||
  topic.description ||
  `Guides about ${topic.name.toLowerCase()} from CatchMyCash: plain-English help with California unclaimed property.`;

export async function generateMetadata({ params, searchParams }) {
  const result = await load(params, searchParams);
  if (!result?.topic) return { title: 'Topic not found', robots: { index: false, follow: true } };
  const { topic, page } = result;
  const path = topicPath(topic.slug);
  return listingMetadata({
    title: topic.seo.metaTitle || `${topic.name} guides`,
    description: describe(topic),
    path: page > 1 ? `${path}?page=${page}` : path,
    // A topic with nothing published yet has nothing worth a search result.
    noindex: topic.postCount === 0,
  });
}

export default async function TopicPage({ params, searchParams }) {
  const result = await load(params, searchParams);
  if (!result) notFound();
  if (result.redirectTo) permanentRedirect(topicPath(result.redirectTo));

  const { topic, topics, page } = result;
  const list = await listPosts({ topicId: topic.id, page, pageSize: TOPIC_PAGE_SIZE });
  if (page > 1 && page > list.totalPages) notFound();
  const path = topicPath(topic.slug);
  const pageHref = (n) => (n > 1 ? `${path}?page=${n}` : path);

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          title: `${topic.name} guides`,
          description: describe(topic),
          path,
          posts: list.posts,
        })}
      />

      <section className="relative overflow-hidden bg-white border-b border-[#E8E6E3]">
        <span
          aria-hidden="true"
          className="absolute -right-20 -top-28 w-[380px] h-[380px] rounded-full border-[40px] border-[#FCE9E7]"
        />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-8 py-12 lg:py-16">
          <Breadcrumbs
            crumbs={[
              { name: 'Home', path: '/' },
              { name: 'Resources', path: RESOURCES_PATH },
              { name: topic.name, path },
            ]}
            className="mb-8"
          />
          <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.15em] uppercase text-[#E1261C] mb-4">
            Topic · {topic.postCount} {topic.postCount === 1 ? 'guide' : 'guides'}
          </p>
          <h1 className="font-['Fraunces'] text-[clamp(34px,5vw,56px)] font-semibold tracking-[-0.02em] leading-[1.05] max-w-[20ch] mb-4">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-lg md:text-xl leading-snug text-[#4A4A4A] max-w-[60ch] mb-8">{topic.description}</p>
          )}
          <div className={topic.description ? '' : 'mt-8'}>
            <TopicNav topics={topics} activeSlug={topic.slug} />
          </div>
        </div>
      </section>

      <div className="bg-[#F7F5F2]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-12 lg:py-16">
          {list.posts.length === 0 ? (
            <section className="max-w-[640px] py-6">
              <h2 className="font-['Fraunces'] text-3xl font-semibold mb-3">No guides here yet.</h2>
              <p className="text-[#4A4A4A]">
                We are writing them now. In the meantime,{' '}
                <Link href={RESOURCES_PATH} className="text-[#E1261C] underline underline-offset-2">
                  browse every guide
                </Link>{' '}
                or read the{' '}
                <Link href="/faq" className="text-[#E1261C] underline underline-offset-2">
                  FAQ
                </Link>
                .
              </p>
            </section>
          ) : (
            <section aria-labelledby="topic-list-heading">
              <h2 id="topic-list-heading" className="sr-only">
                {page > 1 ? `${topic.name} guides — page ${page}` : `${topic.name} guides`}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.posts.map((post, i) => (
                  <ResourceCard key={post.id} post={post} eager={page === 1 && i < 3} />
                ))}
              </div>
              <ResourcePagination page={list.page} totalPages={list.totalPages} hrefFor={pageHref} />
            </section>
          )}
        </div>
      </div>

      <CtaBand />
    </>
  );
}
