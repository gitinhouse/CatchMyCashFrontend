import Link from 'next/link';
import { RESOURCES_PATH, articlePath } from '../../lib/resources/constants';
import { formatShortDate } from '../../lib/resources/format';
import { EYEBROW, HOME_CONTAINER, SECTION_SPACE, TEXT_LINK } from './Section';

// Written out in full so Tailwind's scanner sees each class. Below the large
// breakpoint the guides stack in one column, so a third card never sits alone
// on a row of two.
const COLUMNS = {
  1: 'max-w-xl',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
};

/**
 * A compact card for the home page. Unlike the Resources grid card it has no
 * generated cover panel (which repeats the title), so three of them stay short
 * on a phone. An uploaded cover image is still shown.
 */
function HomeGuideCard({ post }) {
  const image = post.coverImage?.url;
  return (
    <article className="group relative flex flex-col bg-white border border-[#E8E6E3] rounded-xl overflow-hidden shadow-sm transition-colors hover:border-[#D4D4D4] hover:shadow-md">
      {image ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[#F0EEEB]">
          {/* A plain img, as on the Resources cards: covers can come from any
              https host, which next/image would need listing one by one. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={post.coverImage.alt || ''}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : (
        <div aria-hidden="true" className="h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]" />
      )}
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {post.topic && (
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#E1261C] mb-2.5">
            {post.topic.name}
          </p>
        )}
        <h3 className="font-['Fraunces'] text-[20px] sm:text-[21px] leading-[1.25] font-semibold tracking-[-0.01em] text-[#0A0A0A] mb-2">
          {/* The link is stretched over the whole card. */}
          <Link
            href={articlePath(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] transition-colors group-hover:text-[#E1261C]"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="text-[15px] leading-relaxed text-[#4A4A4A] line-clamp-2 mb-4">{post.excerpt}</p>
        )}
        <p className="mt-auto flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] tracking-[0.06em] uppercase text-[#888888]">
          <time dateTime={post.publishedAt}>{formatShortDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </p>
      </div>
    </article>
  );
}

/**
 * Home page guides: up to three published Resources articles, featured ones
 * first (see getHomeGuides). Renders nothing until an article is published.
 * Self contained: removing its line in LandingPage removes the section.
 */
export default function HomeGuides({ guides = [] }) {
  if (!guides.length) return null;
  const shown = guides.slice(0, 3);
  return (
    <section aria-labelledby="home-guides-heading" className={`bg-[#F7F5F2] ${SECTION_SPACE}`}>
      <div className={HOME_CONTAINER}>
        {/* The small label is the section's heading; the guide titles carry it. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-6">
          <h2 id="home-guides-heading" className={`${EYEBROW} font-normal`}>
            From Resources
          </h2>
          <Link href={RESOURCES_PATH} className={`${TEXT_LINK} text-[15px]`}>
            All guides
          </Link>
        </div>
        <div className={`grid gap-4 sm:gap-6 ${COLUMNS[shown.length]}`}>
          {shown.map((post) => (
            <HomeGuideCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
