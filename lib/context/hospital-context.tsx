"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { mockProjects, Project } from "@/lib/mock-data/projects-data";
import { mockReviews, ReviewRequest } from "@/lib/mock-data/reviews-data";

export type UserRole =
  | "super_admin"
  | "system_admin"
  | "project_manager"
  | "system_analyst"
  | "developer"
  | "documentation_manager"
  | "reviewer"
  | "viewer";

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
}

interface HospitalContextValue {
  projects: Project[];
  activeProject: Project;
  setActiveProjectId: (id: string) => void;
  addProject: (
    newProject: Omit<
      Project,
      | "id"
      | "createdAt"
      | "modelsCount"
      | "documentsCount"
      | "pendingApprovalsCount"
      | "members"
      | "owner"
    > &
      Partial<Project>
  ) => void;
  reviews: ReviewRequest[];
  updateReviewStatus: (
    id: string,
    decision: "approved" | "revision_requested" | "rejected"
  ) => void;
  systemMode: "standard" | "complex";
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
}

const HospitalContext = React.createContext<HospitalContextValue | undefined>(
  undefined
);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize projects from localStorage with fallback to mockProjects
  const [projects, setProjects] = React.useState<Project[]>(() => {
    if (typeof window === "undefined") return mockProjects;
    try {
      const stored = localStorage.getItem("spmc_projects");
      return stored ? JSON.parse(stored) : mockProjects;
    } catch {
      return mockProjects;
    }
  });

  const [activeProjectId, setActiveProjectId] = React.useState<string>(() => {
    if (typeof window === "undefined") return mockProjects[0]?.id || "proj-ehr-01";
    try {
      const stored = localStorage.getItem("spmc_active_project_id");
      return stored || mockProjects[0]?.id || "proj-ehr-01";
    } catch {
      return mockProjects[0]?.id || "proj-ehr-01";
    }
  });

  // Dynamic reviews state
  const [reviews, setReviews] = React.useState<ReviewRequest[]>(() => {
    if (typeof window === "undefined") return mockReviews;
    try {
      const stored = localStorage.getItem("spmc_reviews");
      return stored ? JSON.parse(stored) : mockReviews;
    } catch {
      return mockReviews;
    }
  });

  const [activeRole, setActiveRole] = React.useState<UserRole>("project_manager");

  // Lazy initialize user session from localStorage
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("spmc_auth_session");
      return stored ? (JSON.parse(stored) as UserSession) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return Boolean(localStorage.getItem("spmc_auth_session"));
    } catch {
      return false;
    }
  });

  // Switch active project and save preference
  const handleSetActiveProjectId = React.useCallback((id: string) => {
    setActiveProjectId(id);
    try {
      localStorage.setItem("spmc_active_project_id", id);
    } catch {
      // Ignore
    }
  }, []);

  // Add project to state and persist
  const addProject = React.useCallback(
    (
      newProj: Omit<
        Project,
        | "id"
        | "createdAt"
        | "modelsCount"
        | "documentsCount"
        | "pendingApprovalsCount"
        | "members"
        | "owner"
      > &
        Partial<Project>
    ) => {
      const id =
        newProj.id ||
        "proj-" +
          newProj.code.toLowerCase().replace(/[^a-z0-9]/g, "-") +
          "-" +
          Date.now().toString().slice(-4);

      const fullProject: Project = {
        id,
        code: newProj.code,
        name: newProj.name,
        description: newProj.description || "",
        objectives: newProj.objectives || "",
        status: newProj.status || "active",
        systemMode: newProj.systemMode || "standard",
        owner: newProj.owner || currentUser?.name || "Dr. Maria Santos",
        createdAt: new Date().toISOString(),
        modelsCount: newProj.modelsCount || 0,
        documentsCount: newProj.documentsCount || 0,
        pendingApprovalsCount: newProj.pendingApprovalsCount || 0,
        members: newProj.members || [
          {
            id: "m-" + Date.now(),
            name: currentUser?.name || "Dr. Maria Santos",
            email: currentUser?.email || "m.santos@spmc.gov.ph",
            role: "manager",
          },
        ],
      };

      setProjects((prev) => {
        const updated = [fullProject, ...prev];
        try {
          localStorage.setItem("spmc_projects", JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });

      handleSetActiveProjectId(id);
    },
    [currentUser, handleSetActiveProjectId]
  );

  // Update review status and persist
  const updateReviewStatus = React.useCallback(
    (id: string, decision: "approved" | "revision_requested" | "rejected") => {
      setReviews((prev) => {
        const updated = prev.map((rev) => {
          if (rev.id === id) {
            const isApproved = decision === "approved";
            const newApprovals = isApproved
              ? Math.min(rev.currentApprovals + 1, rev.requiredApprovals)
              : rev.currentApprovals;
            return {
              ...rev,
              status: isApproved
                ? (newApprovals >= rev.requiredApprovals ? "approved" : "in_review")
                : decision === "rejected"
                ? "rejected"
                : "in_review",
              currentApprovals: newApprovals,
            } as ReviewRequest;
          }
          return rev;
        });

        try {
          localStorage.setItem("spmc_reviews", JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
    },
    []
  );

  const login = (email: string, role: UserRole = "project_manager") => {
    const sessionData: UserSession = {
      email,
      name: email.includes("santos")
        ? "Dr. Maria Santos"
        : email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role,
    };
    try {
      localStorage.setItem("spmc_auth_session", JSON.stringify(sessionData));
    } catch {
      // Ignore
    }
    setCurrentUser(sessionData);
    setIsAuthenticated(true);
    setActiveRole(role);
  };

  const logout = () => {
    try {
      localStorage.removeItem("spmc_auth_session");
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Find active project or fallback to first
  const baseActiveProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || mockProjects[0];

  // Calculate live pending review count for the active project
  const activeProjectPendingReviews = reviews.filter(
    (r) =>
      (r.projectId === baseActiveProject.id || r.projectCode === baseActiveProject.code) &&
      (r.status === "in_review" || r.status === "pending")
  ).length;

  const activeProject: Project = {
    ...baseActiveProject,
    pendingApprovalsCount: activeProjectPendingReviews,
  };

  const systemMode = activeProject?.systemMode || "complex";

  return (
    <HospitalContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProjectId: handleSetActiveProjectId,
        addProject,
        reviews,
        updateReviewStatus,
        systemMode,
        activeRole,
        setActiveRole,
        currentUser,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = React.useContext(HospitalContext);
  if (!context) {
    throw new Error("useHospital must be used within a HospitalProvider");
  }
  return context;
}
