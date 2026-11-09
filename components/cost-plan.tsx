"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellValueChangedEvent, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { opportunities } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { EMPTY_LOG, EMPTY_PLAN, EMPTY_SAVED, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { PlanRow } from "@/lib/types";
import { SponsorPanel } from "./sponsor-panel";

ModuleRegistry.registerModules([AllCommunityModule]);

// Light grid in the Hapi colours: paper header, navy text, blue accent
const gridTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  foregroundColor: "#0e1b2e",
  headerBackgroundColor: "#f7f5f0",
  headerTextColor: "#4a5161",
  accentColor: "#1f5eff",
  borderColor: "#e4e0d7",
  rowHoverColor: "#f2f5ff",
  oddRowBackgroundColor: "#fbfaf7",
  wrapperBorderRadius: 16,
  fontFamily: "inherit",
  fontSize: 14,
});

type GridRow = PlanRow & { isTotal?: boolean };

export function CostPlan() {
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [saved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [log, setLog] = useStored(STORAGE.log, EMPTY_LOG);
  const [newItem, setNewItem] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const totals = useMemo(() => {
    const byCurrency = new Map<string, { total: number; paid: number }>();
    for (const r of plan) {
      const t = byCurrency.get(r.currency) ?? { total: 0, paid: 0 };
      t.total += r.amount;
      if (r.status === "paid") t.paid += r.amount;
      byCurrency.set(r.currency, t);
    }
    return [...byCurrency.entries()];
  }, [plan]);

  const pinned: GridRow[] = totals.map(([currency, t]) => ({
    id: `total-${currency}`, item: `Total (${currency})`, amount: t.total, currency, dueDate: null, sponsor: "", status: "unpaid", isTotal: true,
  }));

  const columns = useMemo<ColDef<GridRow>[]>(
    () => [
      { field: "item", headerName: "Item", flex: 2, editable: (p) => !p.data?.isTotal },
      { field: "amount", headerName: "Amount", flex: 1, editable: (p) => !p.data?.isTotal, cellDataType: "number", valueFormatter: (p) => (p.value == null ? "" : Number(p.value).toLocaleString("en-GB", { minimumFractionDigits: 2 })) },
      { field: "currency", headerName: "Cur.", width: 76, editable: (p) => !p.data?.isTotal },
      { field: "dueDate", headerName: "Due", flex: 1, editable: (p) => !p.data?.isTotal, valueFormatter: (p) => (p.data?.isTotal ? "" : formatDate(p.value ?? null)) },
      { field: "sponsor", headerName: "Sponsor", flex: 1, editable: (p) => !p.data?.isTotal },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (p: ICellRendererParams<GridRow>) =>
          p.data && !p.data.isTotal ? (
            <button
              onClick={() => toggleStatus(p.data!.id)}
              title="Click to switch between paid and unpaid"
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.data.status === "paid" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"}`}
            >
              {p.data.status === "paid" ? "Paid" : "Unpaid"}
            </button>
          ) : null,
      },
      {
        headerName: "Edit",
        width: 92,
        sortable: false,
        cellRenderer: (p: ICellRendererParams<GridRow>) =>
          p.data && !p.data.isTotal ? (
            <button className="rounded-full px-2 py-0.5 text-xs font-medium text-rose-700 hover:bg-rose-50" onClick={() => removeRow(p.data!.id)}>Remove</button>
          ) : null,
      },
    ],
    // removeRow reads the latest plan through the store
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function toggleStatus(id: string) {
    setPlan((rows) => rows.map((r) => (r.id === id ? { ...r, status: r.status === "paid" ? "unpaid" : "paid" } : r)));
  }

  function removeRow(id: string) {
    setPlan((rows) => rows.filter((r) => r.id !== id));
    setLog((l) => [logEntry("Removed cost", id), ...l]);
  }

  function onCellValueChanged(e: CellValueChangedEvent<GridRow>) {
    if (!e.data || e.data.isTotal) return;
    const changed = { ...e.data, amount: Number(e.data.amount) || 0 };
    setPlan((rows) => rows.map((r) => (r.id === changed.id ? { ...r, ...changed } : r)));
  }

  function addRow() {
    const amount = Number(newAmount);
    if (!newItem.trim() || !(amount > 0)) return;
    setPlan([...plan, { id: `own-${Date.now()}`, item: newItem.trim(), amount, currency: "EUR", dueDate: null, sponsor: "", status: "unpaid" }]);
    setLog((l) => [logEntry("Added cost", `${newItem.trim()}: ${amount} EUR`), ...l]);
    setNewItem("");
    setNewAmount("");
  }

  const savedItems = opportunities.filter((o) => saved.includes(o.id));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        {totals.map(([currency, t]) => (
          <div key={currency} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Sponsored and paid ({currency})</span>
              <span>{t.paid.toLocaleString("en-GB")} of {t.total.toLocaleString("en-GB")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-teal-600 transition-all" style={{ width: `${t.total ? Math.round((t.paid / t.total) * 100) : 0}%` }} />
            </div>
          </div>
        ))}
        <div className="w-full">
          <AgGridReact<GridRow>
            theme={gridTheme}
            domLayout="autoHeight"
            defaultColDef={{ minWidth: 72, resizable: false }}
            rowData={plan}
            columnDefs={columns}
            pinnedBottomRowData={pinned}
            getRowId={(p) => p.data.id}
            onCellValueChanged={onCellValueChanged}
            overlayNoRowsTemplate="No costs yet. Add a paid opportunity or plan a university."
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <input aria-label="Own cost" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Own cost, e.g. visa fee" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <input aria-label="Amount in euro" className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2" type="number" min={0} placeholder="EUR" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          <button onClick={addRow} className="rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800">Add cost</button>
        </div>
      </section>

      <SponsorPanel />

      {savedItems.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Saved opportunities</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {savedItems.map((o) => (
              <li key={o.id} className="flex justify-between gap-2">
                <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{o.title}</a>
                <span className="text-slate-600">Deadline: {formatDate(o.deadline)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-panel p-4">
        <h2 className="font-semibold">Activity log</h2>
        {log.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing yet.</p>
        ) : (
          <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-xs text-slate-700">
            {log.slice(0, 100).map((e, i) => (
              <li key={i}><span className="text-slate-500">{new Date(e.at).toLocaleString("en-GB")}</span> · {e.action}: {e.detail}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
