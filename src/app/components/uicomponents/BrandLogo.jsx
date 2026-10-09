import Link from 'next/link';

/**
 * The CatchMyCash logo — red dot and wordmark — linking to the home page. The
 * site header and the claim-flow step header both draw this one component, so
 * the two cannot drift apart.
 */
const BrandLogo = ({ className = '', ...props }) => (
  <Link
    href="/"
    className={[
      "font-['Fraunces'] font-black text-lg md:text-xl lg:text-[22px] tracking-[-0.02em] flex items-center gap-2 text-black shrink-0",
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    <span className="w-2.5 h-2.5 bg-[#E1261C] rounded-full inline-block"></span>
    CatchMyCash
  </Link>
);

export default BrandLogo;
