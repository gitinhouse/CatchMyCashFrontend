// app/page.js
import { Suspense } from "react";
import HomeContent from "./HomeContent";
import JsonLd from "./components/seo/JsonLd";
import {
  organizationJsonLd,
  pageMetadata,
  serviceJsonLd,
  websiteJsonLd,
} from "./lib/seo";
import { SITE_NAME, SITE_TAGLINE } from "./lib/site";

const HOME_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;

// Every ?step= view of the home page canonicalizes to the bare home page.
export const metadata = pageMetadata({
  title: HOME_TITLE,
  absoluteTitle: true,
  description:
    "Find money California is holding in your name. Free search, nothing upfront, and a 10% fee only if we recover it. We file the claim and track it to payout.",
  path: "/",
});

// Home reads the step from the query string. On a statically prerendered route
// that read bails the whole page out to client rendering, so the HTML would hold
// nothing but the Suspense fallback and the landing page (and the footer under
// it) would jump in only once the JavaScript ran. Rendering per request lets the
// server send the landing page itself.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), serviceJsonLd()]} />
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </>
  );
}
