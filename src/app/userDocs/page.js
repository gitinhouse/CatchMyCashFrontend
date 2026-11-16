"use client";
import { Suspense } from "react";
import UserDocs from "./UserDocs";
import GlobalLoader from "../components/uicomponents/GlobalLoader";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F2]">
          <GlobalLoader label="Loading your documents page" />
        </div>
      }
    >
      <UserDocs />
    </Suspense>
  );
}
