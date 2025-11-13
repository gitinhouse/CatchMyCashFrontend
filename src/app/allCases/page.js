"use client";
import { Suspense } from "react";
import AllCases from "./AllCases";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Cases page...</div>}>
      <AllCases />
    </Suspense>
  );
}
