import { coverPalette } from '../../lib/resources/format';

/**
 * An article's cover: its uploaded image, or a generated brand panel when
 * there is none, so every card has something to show. The panel carries the
 * title on cards; beside the featured article, whose title is printed next to
 * it, it carries the topic instead.
 */
export default function ResourceCover({ post, size = 'card', eager = false, className = '' }) {
  const image = post.coverImage?.url;
  const aspect = size === 'hero' ? 'aspect-[16/9]' : 'aspect-[16/10]';

  if (image) {
    return (
      <div className={`relative ${aspect} overflow-hidden bg-[#F0EEEB] ${className}`}>
        {/* A plain img: covers can come from any https host, which next/image
            would need listing one by one. */}
        <img
          src={image}
          alt={post.coverImage.alt || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          {...(eager ? { fetchPriority: 'high' } : {})}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  const palette = coverPalette(post.topic?.slug || post.topicId || post.slug);
  const big = size === 'hero' || size === 'feature';
  const feature = size === 'feature';
  const topicName = post.topic?.name || 'Resources';
  return (
    <div
      aria-hidden="true"
      className={`relative ${aspect} overflow-hidden ${className}`}
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      <span
        className="absolute -right-10 -bottom-12 w-48 h-48 rounded-full border-[18px]"
        style={{ borderColor: palette.ring }}
      />
      <span
        className="absolute right-16 -bottom-6 w-20 h-20 rounded-full border-[10px]"
        style={{ borderColor: palette.ring }}
      />
      <div className={`absolute inset-0 flex flex-col justify-between ${big ? 'p-6 sm:p-8' : 'p-5'}`}>
        <span
          className="font-['JetBrains_Mono'] text-[10px] sm:text-[11px] tracking-[0.18em] uppercase"
          style={{ color: palette.muted }}
        >
          {feature ? 'Start here' : topicName}
        </span>
        <span
          className={`font-['Fraunces'] font-semibold leading-[1.1] tracking-[-0.01em] max-w-[85%] line-clamp-3 ${
            feature ? 'text-[34px] sm:text-[48px]' : big ? 'text-2xl sm:text-[34px]' : 'text-[19px]'
          }`}
        >
          {feature ? topicName : post.title}
        </span>
        <span className="flex items-center gap-1.5 font-['Fraunces'] font-black text-[13px] tracking-[-0.02em]">
          <span className="w-2 h-2 rounded-full bg-[#E1261C] ring-2 ring-white/70" />
          CatchMyCash
        </span>
      </div>
    </div>
  );
}
