"use client";

import * as React from "react";
import {
  ClockCircleIcon,
  DocumentTextIcon,
  MedicalKitIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@solar-icons/react/linear";

import type {
  CalibrationListRow,
  EquipmentDetail,
  EquipmentListRow,
  MaintenanceHistoryListRow,
  MaintenanceScheduleListRow,
  WorkOrderListRow,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

const EQUIPMENT_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of service" },
  { value: "retired", label: "Retired" },
];

const WORK_ORDER_STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

const MAINTENANCE_TYPE_OPTIONS = [
  { value: "preventive", label: "Preventive" },
  { value: "calibration", label: "Calibration" },
  { value: "inspection", label: "Inspection" },
  { value: "repair", label: "Repair" },
];

const SCHEDULE_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export interface EquipmentViewProps {
  equipment: EquipmentListRow[];
  equipmentDetails: Record<string, EquipmentDetail>;
  workOrders: WorkOrderListRow[];
  schedules: MaintenanceScheduleListRow[];
  calibrations: CalibrationListRow[];
  history: MaintenanceHistoryListRow[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

export function EquipmentView({
  equipment,
  equipmentDetails,
  workOrders,
  schedules,
  calibrations,
  history,
}: EquipmentViewProps) {
  const [tab, setTab] = React.useState("equipment");
  const [selectedEquipment, setSelectedEquipment] =
    React.useState<EquipmentListRow | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] =
    React.useState<WorkOrderListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const equipmentById = React.useMemo(
    () => new Map(equipment.map((item) => [item.id, item])),
    [equipment]
  );
  const workOrderById = React.useMemo(
    () => new Map(workOrders.map((order) => [order.id, order])),
    [workOrders]
  );

  const openEquipment = React.useCallback(
    (id: string) => {
      const row = equipmentById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedEquipment(row);
      }
    },
    [equipmentById]
  );

  const closeEquipment = React.useCallback(() => {
    setPendingAction(null);
    setSelectedEquipment(null);
  }, []);

  const openWorkOrder = React.useCallback(
    (id: string) => {
      const row = workOrderById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedEquipment(null);
        setSelectedWorkOrder(row);
      }
    },
    [workOrderById]
  );

  const closeWorkOrder = React.useCallback(() => {
    setPendingAction(null);
    setSelectedWorkOrder(null);
  }, []);

  const categories = React.useMemo(
    () => Array.from(new Set(equipment.map((item) => item.category_name))).sort(),
    [equipment]
  );

  const equipmentColumns = React.useMemo<Column<EquipmentListRow>[]>(
    () => [
      {
        key: "asset_number",
        header: "Asset No.",
        sortable: true,
        sortValue: (row) => row.asset_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.asset_number}
          </span>
        ),
      },
      {
        key: "equipment",
        header: "Equipment",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.name}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.manufacturer} · {row.model}
            </p>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        sortable: true,
        sortValue: (row) => row.category_name,
        cell: (row) => <Badge variant="info">{row.category_name}</Badge>,
      },
      {
        key: "department",
        header: "Department / location",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.department_name}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.location}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "next_due",
        header: "Next due",
        sortable: true,
        sortValue: (row) => row.next_due ?? "",
        cell: (row) =>
          row.next_due ? (
            <span className="whitespace-nowrap">
              {formatDate(row.next_due)}
            </span>
          ) : (
            "\u2014"
          ),
      },
      {
        key: "work_orders",
        header: "Open WOs",
        align: "right",
        sortable: true,
        sortValue: (row) => row.open_work_orders,
        cell: (row) => row.open_work_orders,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View equipment ${row.asset_number}`}
            onClick={() => openEquipment(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openEquipment]
  );

  const equipmentFilters = React.useMemo<FilterConfig<EquipmentListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: EQUIPMENT_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "category",
        label: "category",
        allLabel: "All categories",
        options: categories.map((category) => ({
          label: category,
          value: category,
        })),
        accessor: (row) => row.category_name,
      },
    ],
    [categories]
  );

  const workOrderColumns = React.useMemo<Column<WorkOrderListRow>[]>(
    () => [
      {
        key: "work_order_number",
        header: "Work Order",
        sortable: true,
        sortValue: (row) => row.work_order_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.work_order_number}
          </span>
        ),
      },
      {
        key: "equipment",
        header: "Equipment",
        sortable: true,
        sortValue: (row) => row.equipment_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">
              {row.equipment_name}
            </p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.asset_number}
            </p>
          </div>
        ),
      },
      {
        key: "issue",
        header: "Issue",
        cell: (row) => (
          <span className="line-clamp-2 max-w-[18rem] text-xs text-hospital-text">
            {row.issue_description}
          </span>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "technician",
        header: "Technician",
        cell: (row) => row.assigned_technician_name ?? "Unassigned",
      },
      {
        key: "requested",
        header: "Requested",
        sortable: true,
        sortValue: (row) => row.requested_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.requested_at)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View work order ${row.work_order_number}`}
            onClick={() => openWorkOrder(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openWorkOrder]
  );

  const workOrderFilters = React.useMemo<FilterConfig<WorkOrderListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: WORK_ORDER_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "priority",
        label: "priority",
        allLabel: "All priorities",
        options: PRIORITY_OPTIONS,
        accessor: (row) => row.priority,
      },
    ],
    []
  );

  const scheduleColumns = React.useMemo<
    Column<MaintenanceScheduleListRow>[]
  >(
    () => [
      {
        key: "equipment",
        header: "Equipment",
        sortable: true,
        sortValue: (row) => row.equipment_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">
              {row.equipment_name}
            </p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.asset_number}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => <StatusBadge status={row.maintenance_type} />,
      },
      {
        key: "scheduled",
        header: "Scheduled",
        sortable: true,
        sortValue: (row) => row.scheduled_date,
        cell: (row) => formatDate(row.scheduled_date),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "assigned",
        header: "Assigned to",
        cell: (row) => row.assigned_to_name ?? "\u2014",
      },
      {
        key: "notes",
        header: "Notes",
        cell: (row) => row.notes ?? "\u2014",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View equipment ${row.asset_number}`}
            onClick={() => openEquipment(row.equipment_id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openEquipment]
  );

  const scheduleFilters = React.useMemo<
    FilterConfig<MaintenanceScheduleListRow>[]
  >(
    () => [
      {
        key: "type",
        label: "type",
        allLabel: "All types",
        options: MAINTENANCE_TYPE_OPTIONS,
        accessor: (row) => row.maintenance_type,
      },
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: SCHEDULE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const detail = selectedEquipment
    ? equipmentDetails[selectedEquipment.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            {
              value: "equipment",
              label: "Equipment",
              count: equipment.length,
            },
            {
              value: "work-orders",
              label: "Work orders",
              count: workOrders.length,
            },
            {
              value: "schedule",
              label: "Maintenance schedule",
              count: schedules.length,
            },
            {
              value: "history",
              label: "Calibration & history",
              count: calibrations.length + history.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "equipment" ? (
          <RecordTable
            rows={equipment}
            columns={equipmentColumns}
            rowKey={(row) => row.id}
            caption="Medical equipment register"
            searchPlaceholder="Search asset no., equipment, serial, department, or location"
            searchAccessor={(row) =>
              `${row.asset_number} ${row.name} ${row.category_name} ${row.manufacturer} ${row.model} ${row.serial_number} ${row.department_name} ${row.location}`
            }
            filters={equipmentFilters}
            toolbarActions={
              <UnavailableAction
                label="Register Equipment"
                description="Register a medical asset, category, serial number, department, and maintenance schedule."
                size="sm"
                variant="secondary"
                icon={<MedicalKitIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No equipment found"
            emptyDescription="There are no equipment records matching your selected filters."
            emptyIcon={<MedicalKitIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "work-orders" ? (
          <RecordTable
            rows={workOrders}
            columns={workOrderColumns}
            rowKey={(row) => row.id}
            caption="Equipment work orders"
            searchPlaceholder="Search work order, equipment, issue, or technician"
            searchAccessor={(row) =>
              `${row.work_order_number} ${row.equipment_name} ${row.asset_number} ${row.issue_description} ${row.assigned_technician_name ?? ""}`
            }
            filters={workOrderFilters}
            toolbarActions={
              <UnavailableAction
                label="Create Work Order"
                description="Create a repair or maintenance work order for equipment."
                size="sm"
                variant="secondary"
                icon={<SettingsIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No work orders found"
            emptyDescription="There are no work orders matching your selected filters."
            emptyIcon={<SettingsIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "schedule" ? (
          <RecordTable
            rows={schedules}
            columns={scheduleColumns}
            rowKey={(row) => row.id}
            caption="Preventive maintenance and calibration schedule"
            searchPlaceholder="Search equipment, type, or assigned technician"
            searchAccessor={(row) =>
              `${row.equipment_name} ${row.asset_number} ${row.maintenance_type} ${row.assigned_to_name ?? ""}`
            }
            filters={scheduleFilters}
            emptyTitle="No maintenance scheduled"
            emptyDescription="There are no maintenance schedule entries matching your filters."
            emptyIcon={<ClockCircleIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "history" ? (
          <div className="space-y-4">
            <section className="space-y-2">
              <SectionHeading
                icon={<ShieldCheckIcon className="size-3.5" />}
                title="Calibration records"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Calibration</TableHead>
                    <TableHead>Performed at</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Next due</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calibrations.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-hospital-text">
                            {record.equipment_name}
                          </p>
                          <p className="font-mono text-[11px] text-hospital-text-muted">
                            {record.asset_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{record.calibration_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.performed_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.result} />
                      </TableCell>
                      <TableCell>
                        {record.next_due_date
                          ? formatDate(record.next_due_date)
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {record.certificate_number}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="space-y-2">
              <SectionHeading
                icon={<DocumentTextIcon className="size-3.5" />}
                title="Maintenance history"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Performed at</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-hospital-text">
                            {record.equipment_name}
                          </p>
                          <p className="font-mono text-[11px] text-hospital-text-muted">
                            {record.asset_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.event_type} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.performed_at)}
                      </TableCell>
                      <TableCell>{record.performed_by_name}</TableCell>
                      <TableCell className="text-xs text-hospital-text-muted">
                        {record.summary}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(record.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedEquipment !== null}
        onClose={closeEquipment}
        title={
          selectedEquipment
            ? `Equipment ${selectedEquipment.asset_number}`
            : "Equipment details"
        }
        description="Asset record, maintenance schedule, work orders, and calibration"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeEquipment}>
            Close
          </Button>
        }
      >
        {selectedEquipment ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Equipment">
                {selectedEquipment.name}
              </DetailField>
              <DetailField label="Asset number">
                <span className="font-mono text-xs">
                  {selectedEquipment.asset_number}
                </span>
              </DetailField>
              <DetailField label="Category">
                <Badge variant="info">{selectedEquipment.category_name}</Badge>
              </DetailField>
              <DetailField label="Manufacturer / model">
                {selectedEquipment.manufacturer} · {selectedEquipment.model}
              </DetailField>
              <DetailField label="Serial number">
                <span className="font-mono text-xs">
                  {selectedEquipment.serial_number}
                </span>
              </DetailField>
              <DetailField label="Department">
                {selectedEquipment.department_name}
              </DetailField>
              <DetailField label="Location">
                {selectedEquipment.location}
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedEquipment.status} />
              </DetailField>
              <DetailField label="Purchase date">
                {formatDate(selectedEquipment.purchase_date)}
              </DetailField>
              <DetailField label="Warranty expiry">
                {formatDate(selectedEquipment.warranty_expiry)}
              </DetailField>
              <DetailField label="Next maintenance">
                {selectedEquipment.next_maintenance_due
                  ? formatDate(selectedEquipment.next_maintenance_due)
                  : "\u2014"}
              </DetailField>
              <DetailField label="Next calibration">
                {selectedEquipment.next_calibration_due
                  ? formatDate(selectedEquipment.next_calibration_due)
                  : "\u2014"}
              </DetailField>
            </dl>

            {selectedEquipment.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedEquipment.notes}
              </p>
            ) : null}

            {detail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<SettingsIcon className="size-3.5" />}
                    title="Work orders"
                  />
                  {detail.workOrders.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No work orders recorded.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.workOrders.map((order) => (
                        <li
                          key={order.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="font-mono text-[11px] text-hospital-text">
                              {order.work_order_number}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {order.issue_description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={order.status} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openWorkOrder(order.id)}
                            >
                              View
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClockCircleIcon className="size-3.5" />}
                    title="Maintenance schedule"
                  />
                  {detail.schedules.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No maintenance scheduled.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.schedules.map((schedule) => (
                        <li
                          key={schedule.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-hospital-text">
                              {formatDate(schedule.scheduled_date)}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {schedule.assigned_to_name ?? "Unassigned"} ·{" "}
                              {schedule.notes ?? "No notes"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={schedule.maintenance_type} />
                            <StatusBadge status={schedule.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ShieldCheckIcon className="size-3.5" />}
                    title="Calibration history"
                  />
                  <ul className="space-y-1.5">
                    {detail.calibrations.map((record) => (
                      <li
                        key={record.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-hospital-text">
                            {record.calibration_type}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {formatDateTime(record.performed_at)} ·{" "}
                            {record.performed_by_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={record.result} />
                          <span className="text-[11px] text-hospital-text-muted">
                            Next{" "}
                            {record.next_due_date
                              ? formatDate(record.next_due_date)
                              : "\u2014"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Schedule maintenance")}
                  >
                    Schedule maintenance
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Create work order")}
                  >
                    Create work order
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Record calibration")}
                  >
                    Record calibration
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedWorkOrder !== null}
        onClose={closeWorkOrder}
        title={
          selectedWorkOrder
            ? `Work order ${selectedWorkOrder.work_order_number}`
            : "Work order details"
        }
        description="Equipment issue, assignment, and resolution"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeWorkOrder}>
            Close
          </Button>
        }
      >
        {selectedWorkOrder ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Equipment">
                {selectedWorkOrder.equipment_name}
              </DetailField>
              <DetailField label="Asset number">
                <span className="font-mono text-xs">
                  {selectedWorkOrder.asset_number}
                </span>
              </DetailField>
              <DetailField label="Department">
                {selectedWorkOrder.department_name}
              </DetailField>
              <DetailField label="Priority">
                <StatusBadge status={selectedWorkOrder.priority} />
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedWorkOrder.status} />
              </DetailField>
              <DetailField label="Requested by">
                {selectedWorkOrder.requested_by_name}
              </DetailField>
              <DetailField label="Technician">
                {selectedWorkOrder.assigned_technician_name ?? "Unassigned"}
              </DetailField>
              <DetailField label="Requested at">
                {formatDateTime(selectedWorkOrder.requested_at)}
              </DetailField>
              <DetailField label="Scheduled">
                {selectedWorkOrder.scheduled_for
                  ? formatDateTime(selectedWorkOrder.scheduled_for)
                  : "Not scheduled"}
              </DetailField>
              <DetailField label="Completed">
                {selectedWorkOrder.completed_at
                  ? formatDateTime(selectedWorkOrder.completed_at)
                  : "Not completed"}
              </DetailField>
              <DetailField label="Parts used">
                {selectedWorkOrder.parts_used ?? "\u2014"}
              </DetailField>
              <DetailField label="Cost">
                {formatCurrency(selectedWorkOrder.cost)}
              </DetailField>
            </dl>

            <div className="rounded-md border border-hospital-border p-3">
              <p className="text-[11px] font-medium text-hospital-text-muted">
                Issue
              </p>
              <p className="mt-1 text-sm text-hospital-text">
                {selectedWorkOrder.issue_description}
              </p>
              {selectedWorkOrder.resolution_notes ? (
                <>
                  <p className="mt-2 text-[11px] font-medium text-hospital-text-muted">
                    Resolution
                  </p>
                  <p className="mt-1 text-xs text-hospital-text-muted">
                    {selectedWorkOrder.resolution_notes}
                  </p>
                </>
              ) : null}
              {selectedWorkOrder.notes ? (
                <p className="mt-2 text-[11px] text-hospital-text-muted">
                  {selectedWorkOrder.notes}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Assign technician")}
              >
                Assign technician
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Start work")}
              >
                Start work
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Complete work order")}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Put work order on hold")}
              >
                Hold
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingAction("Cancel work order")}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
