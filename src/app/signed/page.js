"use client";
import { Suspense } from "react";
import SignedPage from "./SignedPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading signed page...</div>}>
      <SignedPage />
    </Suspense>
  );
}
