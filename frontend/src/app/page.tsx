"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B2545] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#8DA9C4] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
