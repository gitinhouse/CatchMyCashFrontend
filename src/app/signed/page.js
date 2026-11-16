"use client";
import { Suspense } from "react";
import SignedPage from "./SignedPage";
import GlobalLoader from "../components/uicomponents/GlobalLoader";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F2]">
          <GlobalLoader label="Loading" />
        </div>
      }
    >
      <SignedPage />
    </Suspense>
  );
}
