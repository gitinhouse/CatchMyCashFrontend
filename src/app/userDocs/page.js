"use client";
import { Suspense } from "react";
import UserDocs from "./UserDocs";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Docs page...</div>}>
      <UserDocs />
    </Suspense>
  );
}
