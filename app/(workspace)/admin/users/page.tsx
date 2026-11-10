"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Shield, CheckCircle2, UserCheck } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
}

export default function UserManagementPage() {
  const [staffList, setStaffList] = React.useState<StaffMember[]>([
    {
      id: "u-1",
      name: "Dr. Maria Santos",
      email: "m.santos@spmc.gov.ph",
      role: "Project Manager",
      department: "Clinical Information Systems",
      status: "active",
      lastLogin: "2026-11-09 08:30 AM",
    },
    {
      id: "u-2",
      name: "Dr. Roberto Gomez",
      email: "r.gomez@spmc.gov.ph",
      role: "Reviewer",
      department: "Clinical Oncology & Quality Assurance",
      status: "active",
      lastLogin: "2026-11-08 02:20 PM",
    },
    {
      id: "u-3",
      name: "Engr. Alan Rivera",
      email: "a.rivera@spmc.gov.ph",
      role: "System Analyst",
      department: "Hospital IT Infrastructure",
      status: "active",
      lastLogin: "2026-11-07 11:15 AM",
    },
    {
      id: "u-4",
      name: "Kaye Villanueva",
      email: "k.villanueva@spmc.gov.ph",
      role: "Developer",
      department: "Software Engineering Unit",
      status: "active",
      lastLogin: "2026-11-09 09:00 AM",
    },
    {
      id: "u-5",
      name: "Pharm. Elena Torres",
      email: "e.torres@spmc.gov.ph",
      role: "Documentation Manager",
      department: "Pharmacy Services",
      status: "active",
      lastLogin: "2026-11-08 04:45 PM",
    },
  ]);

  const [isProvisionOpen, setIsProvisionOpen] = React.useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Form states for provision
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newDepartment, setNewDepartment] = React.useState("Clinical Informatics");
  const [newRole, setNewRole] = React.useState("System Analyst");

  // Form state for edit
  const [editRole, setEditRole] = React.useState("System Analyst");
  const [editStatus, setEditStatus] = React.useState<"active" | "inactive">("active");

  const handleProvisionStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newStaff: StaffMember = {
      id: "u-" + Date.now(),
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      department: newDepartment,
      role: newRole,
      status: "active",
      lastLogin: "Never (Just Provisioned)",
    };

    setStaffList((prev) => [newStaff, ...prev]);
    setNewName("");
    setNewEmail("");
    setIsProvisionOpen(false);

    setSuccessMessage(`Staff account provisioned for ${newStaff.name} with ${newStaff.role} RLS rights.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditRole(staff.role);
    setEditStatus(staff.status);
    setIsEditRoleOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setStaffList((prev) =>
      prev.map((s) =>
        s.id === selectedStaff.id ? { ...s, role: editRole, status: editStatus } : s
      )
    );

    setIsEditRoleOpen(false);
    setSuccessMessage(`Updated privileges for ${selectedStaff.name}: ${editRole} (${editStatus}).`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Hospital Staff & User Management
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Role assignments and access authorization for Southern Philippines Medical Center platform
          </p>
        </div>

        <Button size="sm" onClick={() => setIsProvisionOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Provision Staff Account
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" title="Access Control Updated">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="pb-3 border-b border-hospital-border">
          <CardTitle>Authorized Personnel Directory</CardTitle>
          <CardDescription>
            System-level roles enforce PostgreSQL Row Level Security (RLS) policies
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table borderless>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-28 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="font-semibold text-xs text-hospital-text block">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-hospital-text">
                    {user.department}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold text-hospital-green-dark">
                      <Shield className="w-3 h-3 mr-1 text-hospital-green inline" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "success" : "default"}
                      className="text-[10px] capitalize"
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-hospital-text-muted">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(user)}
                    >
                      Edit Roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Provision Staff Modal */}
      <Modal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        title="Provision Hospital Staff Account"
        description="Assign authorized role and database access credentials"
      >
        <form onSubmit={handleProvisionStaff} className="space-y-4 text-xs">
          <Input
            label="Full Name & Clinical Credentials"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Dr. Francis Aquino, MD"
          />

          <Input
            label="SPMC Email Address"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="f.aquino@spmc.gov.ph"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department"
              required
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="e.g. Emergency Medicine"
            />

            <Select
              label="Assigned System Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { label: "Project Manager", value: "Project Manager" },
                { label: "Clinical Reviewer", value: "Reviewer" },
                { label: "System Analyst", value: "System Analyst" },
                { label: "Software Developer", value: "Developer" },
                { label: "Doc Manager", value: "Documentation Manager" },
                { label: "System Administrator", value: "System Admin" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hospital-border">
            <Button type="button" variant="ghost" onClick={() => setIsProvisionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditRoleOpen}
        onClose={() => setIsEditRoleOpen(false)}
        title={`Edit Role: ${selectedStaff?.name || ""}`}
        description="Update security clearance and Row Level Security permissions"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <Select
            label="Primary Security Role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            options={[
              { label: "Super Administrator", value: "Super Admin" },
              { label: "System Administrator", value: "System Admin" },
              { label: "Project Manager", value: "Project Manager" },
              { label: "Clinical Reviewer", value: "Reviewer" },
              { label: "System Analyst", value: "System Analyst" },
              { label: "Software Developer", value: "Developer" },
              { label: "Documentation Manager", value: "Documentation Manager" },
              { label: "Viewer (Read Only)", value: "Viewer" },
            ]}
          />

          <Select
            label="Account Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
            options={[
              { label: "Active (Permitted Access)", value: "active" },
              { label: "Inactive (Revoke Access)", value: "inactive" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-hospital-border">
            <Button type="button" variant="ghost" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Role Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
