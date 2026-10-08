import Link from 'next/link';

/** Closing call to action shared by the content pages. */
export default function CtaBand({
  title = 'See what California is holding in your name.',
  body = 'The search is free, takes about thirty seconds and needs no account.',
  primary = { href: '/?step=search', label: 'Start your free search' },
  secondary,
}) {
  return (
    <section className="bg-[#0A0A0A] text-white">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-14 md:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="max-w-[46ch]">
          <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] leading-tight mb-3">
            {title}
          </h2>
          <p className="text-[#D4D4D4] text-base md:text-lg">{body}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href={primary.href}
            className="inline-flex items-center justify-center px-7 py-4 bg-[#E1261C] text-white font-semibold rounded-lg hover:bg-[#B11912] transition-colors"
          >
            {primary.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="inline-flex items-center justify-center px-7 py-4 border border-[#4A4A4A] text-white font-semibold rounded-lg hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
