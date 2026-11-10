"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";

export default function RedirectModelWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { setActiveProjectId } = useHospital();

  React.useEffect(() => {
    if (params?.projectId) {
      setActiveProjectId(params.projectId as string);
    }
    const modelId = params?.modelId as string;
    router.replace(modelId ? `/models/${modelId}` : "/models");
  }, [params, router, setActiveProjectId]);

  return (
    <div className="p-8 text-center text-xs text-hospital-text-muted">
      Redirecting to System Model Workspace...
    </div>
  );
}
