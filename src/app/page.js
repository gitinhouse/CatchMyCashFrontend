// // app/page.js
// import { Suspense } from "react";
// import HomeContent from "./HomeContent";
// import JsonLd from "./components/seo/JsonLd";
// import {
//   organizationJsonLd,
//   pageMetadata,
//   serviceJsonLd,
//   websiteJsonLd,
// } from "./lib/seo";
// import { SITE_NAME, SITE_TAGLINE } from "./lib/site";

// const HOME_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;

// // Every ?step= view of the home page canonicalizes to the bare home page.
// export const metadata = pageMetadata({
//   title: HOME_TITLE,
//   absoluteTitle: true,
//   description:
//     "Find money California is holding in your name. Free search, nothing upfront, and a 10% fee only if we recover it. We file the claim and track it to payout.",
//   path: "/",
// });

// // Home reads the step from the query string. On a statically prerendered route
// // that read bails the whole page out to client rendering, so the HTML would hold
// // nothing but the Suspense fallback and the landing page (and the footer under
// // it) would jump in only once the JavaScript ran. Rendering per request lets the
// // server send the landing page itself.
// export const dynamic = "force-dynamic";

// export default function Page() {
//   return (
//     <>
//       <JsonLd data={[organizationJsonLd(), websiteJsonLd(), serviceJsonLd()]} />
//       <Suspense fallback={null}>
//         <HomeContent />
//       </Suspense>
//     </>
//   );
// }
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

export const metadata = pageMetadata({
  title: HOME_TITLE,
  absoluteTitle: true,
  description:
    "Find money California is holding in your name. Free search, nothing upfront, and a 10% fee only if we recover it. We file the claim and track it to payout.",
  path: "/",
});

// The guides shown on the home page. Loaded lazily, so a database that is down
// or not configured costs the page that one section and nothing else. They are
// cached, so this is normally instant; if they are not ready within the wait
// below (a slow database), the page renders without them rather than waiting.
const GUIDES_WAIT_MS = 2500;

async function homeGuides() {
  let timer;
  try {
    const { getHomeGuides } = await import("./lib/resources/queries");
    return await Promise.race([
      getHomeGuides(3),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve([]), GUIDES_WAIT_MS);
      }),
    ]);
  } catch (error) {
    console.error("home: could not load guides", error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default async function Page({ searchParams }) {
  // Next.js 15 provides searchParams as a Promise.
  const params = await searchParams;
  const guides = await homeGuides();

  // Read the requested step on the server so the initial page
  // can render with the correct state.
  const initialStep =
    typeof params?.step === "string" ? params.step : null;

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          serviceJsonLd(),
        ]}
      />

      <HomeContent initialStep={initialStep} guides={guides} />
    </>
  );
}