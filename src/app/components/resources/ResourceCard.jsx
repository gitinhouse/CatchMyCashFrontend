import Link from 'next/link';
import ResourceCover from './ResourceCover';
import { articlePath, topicPath } from '../../lib/resources/constants';
import { formatShortDate } from '../../lib/resources/format';

/**
 * An article in a grid. The whole card is clickable through the title's link
 * (stretched over the card), with the topic link raised above it.
 */
export default function ResourceCard({ post, headingLevel = 'h3', eager = false }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col bg-white border border-[#E8E6E3] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(10,10,10,0.35)] hover:border-[#D4D4D4]">
      <ResourceCover post={post} eager={eager} />
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {post.topic && (
          <Link
            href={topicPath(post.topic.slug)}
            className="relative z-10 self-start font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#E1261C] hover:underline underline-offset-4 mb-2.5"
          >
            {post.topic.name}
          </Link>
        )}
        <Heading className="font-['Fraunces'] text-[21px] leading-[1.25] font-semibold tracking-[-0.01em] text-[#0A0A0A] mb-2">
          <Link
            href={articlePath(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-[#E1261C] transition-colors"
          >
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && (
          <p className="text-[15px] leading-relaxed text-[#4A4A4A] line-clamp-3 mb-4">{post.excerpt}</p>
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
