import { ShieldCheckIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Role } from "@/types/hospital";

export interface RolesPanelProps {
  roles: Role[];
}

export function RolesPanel({ roles }: RolesPanelProps) {
  return (
    <div className="space-y-4">
      <Alert variant="info">
        Permissions are enforced by database row-level security, not by hidden
        navigation.
      </Alert>

      {roles.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="size-5" aria-hidden="true" />}
          title="No roles configured"
          description="Roles will appear here once the hospital database defines them."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium text-hospital-text">
                  {role.name}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {role.slug}
                  </span>
                </TableCell>
                <TableCell className="max-w-[420px] text-hospital-text-muted">
                  {role.description ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={role.is_system ? "info" : "inactive"}>
                    {role.is_system ? "System" : "Custom"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
