import React from "react";
import type { ClientRecord } from "@/data/workspace";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-secondary">{label}</label>
      {children}
    </div>
  );
}

type Props = {
  initial?: Partial<ClientRecord>;
  onSubmit: (values: Partial<ClientRecord>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitting?: boolean;
};

export default function ClientForm({ initial = {}, onSubmit, onCancel, submitLabel = "Save", submitting = false }: Props) {
  const [form, setForm] = React.useState<Partial<ClientRecord>>(() => ({
    name: initial.name ?? "",
    entityType: initial.entityType ?? "Private Limited",
    serviceLine: initial.serviceLine ?? "Tax + Compliance",
    owner: initial.owner ?? "",
    health: initial.health ?? "low",
    country: initial.country ?? "",
    pan: initial.pan ?? "",
    gstin: initial.gstin ?? "",
    annualBilling: initial.annualBilling ?? "",
    nextDeadline: initial.nextDeadline ?? "",
    notes: initial.notes ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
  }));

  React.useEffect(() => setForm((f) => ({ ...f, ...initial })), [initial]);

  return (
    <div className="space-y-4">
      <FormField label="Client or entity name">
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="glass-input w-full h-10 px-3 text-sm"
          placeholder="Client or entity name"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Entity type">
          <select
            value={form.entityType}
            onChange={(e) => setForm((p) => ({ ...p, entityType: e.target.value }))}
            className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
          >
            <option>Private Limited</option>
            <option>LLP</option>
            <option>Partnership</option>
            <option>Individual</option>
          </select>
        </FormField>

        <FormField label="Service line">
          <select
            value={form.serviceLine}
            onChange={(e) => setForm((p) => ({ ...p, serviceLine: e.target.value }))}
            className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
          >
            <option>Tax + Compliance</option>
            <option>Indirect Tax + CFO</option>
            <option>Tax Planning + Real Estate</option>
            <option>Payroll + Audit Support</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="PAN">
          <input
            value={form.pan}
            onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
            className="glass-input w-full h-10 px-3 text-sm"
            placeholder="ABCDE1234F"
          />
        </FormField>
        <FormField label="GSTIN">
          <input
            value={form.gstin}
            onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
            className="glass-input w-full h-10 px-3 text-sm"
            placeholder="27ABCDE1234F1Z5"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email">
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="glass-input w-full h-10 px-3 text-sm"
            placeholder="finance@client.com"
          />
        </FormField>
        <FormField label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="glass-input w-full h-10 px-3 text-sm"
            placeholder="+91 98765 43210"
          />
        </FormField>
      </div>

      <FormField label="Workspace notes">
        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="glass-input w-full min-h-[96px] px-3 py-3 text-sm"
          placeholder="What work should this workspace own?"
        />
      </FormField>

      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(form)}
          disabled={!form.name || submitting}
          className="flex-1 h-11 mt-2 rounded-lg bg-gradient-orange text-white font-semibold"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="h-11 mt-2 rounded-lg border border-white/10 px-4 text-sm text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
