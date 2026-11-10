"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";

export default function RedirectGeneratorPage() {
  const router = useRouter();
  const params = useParams();
  const { setActiveProjectId } = useHospital();

  React.useEffect(() => {
    if (params?.projectId) {
      setActiveProjectId(params.projectId as string);
    }
    router.replace("/generator");
  }, [params, router, setActiveProjectId]);

  return (
    <div className="p-8 text-center text-xs text-hospital-text-muted">
      Redirecting to System Generator...
    </div>
  );
}
