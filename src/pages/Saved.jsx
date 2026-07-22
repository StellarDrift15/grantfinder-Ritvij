import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Bookmark, Wallet, CalendarClock, Trophy, GripVertical } from "lucide-react";
import Shell from "@/components/Shell";
import PipelineCard from "@/components/saved/PipelineCard";
import { base44 } from "@/api/base44Client";
import { deadlineInfo, fmtAmount } from "@/lib/opportunity";

const COLUMNS = [
  { id: "saved", label: "Saved" },
  { id: "drafting", label: "Drafting" },
  { id: "submitted", label: "Submitted" },
  { id: "decided", label: "Decided" },
];

function StatChip({ Icon, label, value, mint, amber }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gf-line bg-gf-panel px-4 py-3 flex-1">
      <span className="w-9 h-9 rounded-xl grid place-items-center border" style={{ background: "rgba(148,163,184,0.06)", borderColor: "var(--gf-line)" }}>
        <Icon size={16} className={mint ? "text-gf-mint" : amber ? "text-[#FCD34D]" : "text-gf-cyan"} />
      </span>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gf-low">{label}</div>
        <div className={`font-mono text-lg font-semibold ${mint ? "text-gf-mint" : amber ? "text-[#FCD34D]" : "text-gf-hi"}`}>{value}</div>
      </div>
    </div>
  );
}

export default function Saved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const rows = await base44.entities.SavedOpportunity.list("-created_date", 500);
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byCol = useMemo(() => {
    const map = { saved: [], drafting: [], submitted: [], decided: [] };
    items.forEach((it) => {
      const key = map[it.status] ? it.status : "saved";
      map[key].push(it);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => deadlineInfo(a.deadline).days - deadlineInfo(b.deadline).days)
    );
    return map;
  }, [items]);

  const potentialValue = items.reduce((s, it) => s + (it.amount || 0), 0);
  const nextDeadline = useMemo(() => {
    const upcoming = items
      .map((it) => ({ it, d: deadlineInfo(it.deadline) }))
      .filter((x) => x.d.days >= 0)
      .sort((a, b) => a.d.days - b.d.days);
    return upcoming[0]?.d || null;
  }, [items]);
  const awarded = items.filter((it) => it.outcome === "won").reduce((s, it) => s + (it.amount || 0), 0);

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) return;
    const id = result.draggableId;
    const newStatus = result.destination.droppableId;
    const moved = items.find((it) => it.id === id);
    if (!moved) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it)));
    try {
      await base44.entities.SavedOpportunity.update(id, { status: newStatus });
    } catch {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: moved.status } : it)));
    }
  };

  const setOutcome = async (id, outcome) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, outcome } : it)));
    try {
      await base44.entities.SavedOpportunity.update(id, { outcome });
    } catch {
      load();
    }
  };

  return (
    <Shell active="Saved">
      <div className="mb-6">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">Pipeline</div>
        <h1 className="font-display text-2xl font-bold text-gf-hi tracking-tight">Saved opportunities</h1>
        <p className="text-[13px] text-gf-low mt-1">Track every saved match from first save to final decision.</p>
      </div>

      {items.length === 0 && !loading ? (
        <div className="border border-dashed border-gf-line-hi rounded-[18px] py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gf-panel border border-gf-line grid place-items-center mx-auto mb-4">
            <Bookmark size={24} className="text-gf-low" />
          </div>
          <h3 className="font-display text-lg font-semibold text-gf-hi mb-2">Nothing saved yet</h3>
          <p className="text-[13.5px] text-gf-low mb-5 max-w-md mx-auto">
            Save matches from the Dashboard or Discover to build your pipeline.
          </p>
          <Link
            to="/discover"
            className="px-4 py-2 rounded-lg text-gf-hi font-semibold text-[13px] transition"
            style={{ backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)" }}
          >
            Browse opportunities
          </Link>
        </div>
      ) : (
        <>
          {/* stat chips */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <StatChip Icon={Bookmark} label="Saved" value={items.length} />
            <StatChip Icon={Wallet} label="Potential value" value={fmtAmount(potentialValue, "grant")} mint />
            <StatChip
              Icon={CalendarClock}
              label="Next deadline"
              value={nextDeadline ? nextDeadline.label : "—"}
              amber={nextDeadline && nextDeadline.days <= 14}
            />
            {awarded > 0 && <StatChip Icon={Trophy} label="Awarded to date" value={fmtAmount(awarded, "grant")} mint />}
          </div>

          {/* board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid lg:grid-cols-4 gap-4">
              {COLUMNS.map((col) => (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-2xl border border-gf-line bg-gf-panel/60 p-3 min-h-[200px]"
                    >
                      <div className="flex items-center justify-between px-1 mb-3">
                        <h3 className="font-display text-sm font-semibold text-gf-hi">{col.label}</h3>
                        <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[rgba(148,163,184,0.12)] text-gf-low">
                          {byCol[col.id].length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {byCol[col.id].map((item, idx) => (
                          <Draggable draggableId={item.id} index={idx} key={item.id}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} className="group">
                                <div {...p.dragHandleProps} className="flex">
                                  <div className="flex-1">
                                    <PipelineCard item={item} onSetOutcome={setOutcome} />
                                  </div>
                                  <span className="opacity-0 group-hover:opacity-100 transition pl-1.5 flex items-center text-gf-low cursor-grab">
                                    <GripVertical size={14} />
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </>
      )}
    </Shell>
  );
}