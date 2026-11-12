import Link from 'next/link';
import { FaEnvelope, FaFacebookF, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import ResourceCover from './ResourceCover';
import { RESOURCES_PATH, articlePath, topicPath } from '../../lib/resources/constants';
import { formatShortDate } from '../../lib/resources/format';

/** The hub's lead article: wide, with the cover beside the text. */
export function FeaturedResource({ post }) {
  return (
    <article className="group relative grid md:grid-cols-[1.15fr_1fr] bg-white border border-[#E8E6E3] rounded-3xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(10,10,10,0.4)]">
      <ResourceCover post={post} size="feature" eager className="md:aspect-auto md:h-full md:min-h-[320px]" />
      <div className="flex flex-col p-6 sm:p-10">
        <p className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0A0A0A] text-white px-3 py-1 font-['JetBrains_Mono'] text-[10px] tracking-[0.16em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E1261C]" />
            Featured
          </span>
          {post.topic && (
            <Link
              href={topicPath(post.topic.slug)}
              className="relative z-10 font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#E1261C] hover:underline underline-offset-4"
            >
              {post.topic.name}
            </Link>
          )}
        </p>
        <h2 className="font-['Fraunces'] text-[28px] sm:text-[36px] leading-[1.12] font-semibold tracking-[-0.015em] text-[#0A0A0A] mb-4">
          <Link
            href={articlePath(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-[#E1261C] transition-colors"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="text-[17px] leading-relaxed text-[#4A4A4A] mb-6">{post.excerpt}</p>}
        <p className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="font-['JetBrains_Mono'] text-[11px] tracking-[0.06em] uppercase text-[#888888]">
            <time dateTime={post.publishedAt}>{formatShortDate(post.publishedAt)}</time> · {post.readingMinutes} min read
          </span>
          <span className="text-sm font-semibold text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
            Read the guide →
          </span>
        </p>
      </div>
    </article>
  );
}

/** "All" plus every topic that has articles, the current one marked. */
export function TopicNav({ topics, activeSlug = '', tone = 'light' }) {
  const dark = tone === 'dark';
  const base = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors';
  const idle = dark
    ? 'border-white/25 text-white/85 hover:border-white hover:text-white'
    : 'border-[#D4D4D4] text-[#4A4A4A] hover:border-[#0A0A0A] hover:text-[#0A0A0A]';
  const active = dark ? 'border-white bg-white text-[#0A0A0A]' : 'border-[#0A0A0A] bg-[#0A0A0A] text-white';
  const shown = topics.filter((t) => t.postCount > 0);
  return (
    <nav aria-label="Topics">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href={RESOURCES_PATH} className={`${base} ${activeSlug ? idle : active}`} aria-current={activeSlug ? undefined : 'page'}>
            All articles
          </Link>
        </li>
        {shown.map((topic) => {
          const current = topic.slug === activeSlug;
          return (
            <li key={topic.id}>
              <Link
                href={topicPath(topic.slug)}
                className={`${base} ${current ? active : idle}`}
                aria-current={current ? 'page' : undefined}
              >
                {topic.name}
                <span className={`font-['JetBrains_Mono'] text-[11px] ${current ? 'opacity-70' : 'opacity-60'}`}>{topic.postCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** A plain search form: it works without JavaScript and lands on the hub. */
export function ResourceSearch({ defaultValue = '', tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <form action={RESOURCES_PATH} method="get" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="resource-search" className="sr-only">
        Search articles
      </label>
      <input
        id="resource-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="Search guides — e.g. “heir claim”, “how long”"
        className={`min-w-0 flex-1 rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#E1261C] ${
          dark ? 'bg-white text-[#0A0A0A] placeholder-[#888888]' : 'bg-white border border-[#D4D4D4] text-[#0A0A0A] placeholder-[#888888]'
        }`}
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-[#E1261C] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#B11912] transition-colors"
      >
        Search
      </button>
    </form>
  );
}

/** Numbered page links, kept crawlable as plain links. */
export function ResourcePagination({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const linkBase = 'inline-flex min-w-10 h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors';
  return (
    <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${linkBase} border-[#D4D4D4] text-[#0A0A0A] hover:border-[#0A0A0A]`}>
          ← Newer
        </Link>
      )}
      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${linkBase} ${n === page ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white' : 'border-[#D4D4D4] text-[#4A4A4A] hover:border-[#0A0A0A]'}`}
        >
          {n}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} rel="next" className={`${linkBase} border-[#D4D4D4] text-[#0A0A0A] hover:border-[#0A0A0A]`}>
          Older →
        </Link>
      )}
    </nav>
  );
}

/** The article's sections, linked to their headings. */
export function ArticleToc({ toc, className = '' }) {
  if (!toc || toc.length < 2) return null;
  let n = 0;
  return (
    <ol className={`space-y-2.5 ${className}`}>
      {toc.map((item) => {
        if (item.level === 2) n += 1;
        return (
          <li key={item.id} className={item.level === 3 ? 'pl-7' : ''}>
            <a href={`#${item.id}`} className="group flex gap-3 text-[14px] leading-snug text-[#4A4A4A] hover:text-[#E1261C]">
              {item.level === 2 && (
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#E1261C] pt-0.5 w-4 shrink-0">
                  {String(n).padStart(2, '0')}
                </span>
              )}
              <span className="group-hover:underline underline-offset-4">{item.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Share links that need no script: each opens the network's own share page. */
export function ShareLinks({ url, title }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: 'Share on X', href: `https://x.com/intent/post?url=${u}&text=${t}`, Icon: FaXTwitter },
    { label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: FaLinkedinIn },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: FaFacebookF },
    { label: 'Share by email', href: `mailto:?subject=${t}&body=${u}`, Icon: FaEnvelope },
  ];
  return (
    <ul className="flex gap-2">
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            aria-label={label}
            title={label}
            className="w-9 h-9 rounded-full border border-[#D4D4D4] flex items-center justify-center text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** An article's body. The HTML has been through the sanitizer. */
export function ArticleBody({ html }) {
  return <div className="resource-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
