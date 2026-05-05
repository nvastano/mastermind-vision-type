import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, UserPlus, Plus, Mail, Users, Calendar,
  Check, X, Pencil, Wifi, ChevronDown, Save, Search, ArrowUpDown
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, Pro, MastermindSession, SessionRegistration, FixedSlot } from '../App';
import { ProRecordModal } from './ProRecordModal';
import { BulkEmailModal } from './BulkEmailModal';

type Props = {
  group: MastermindGroup;
  coach: Coach;
  members: Pro[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  onBackToList: () => void;
  onManageMembers: () => void;
  onCreateSessions: () => void;
  onSendInvitations: (groupId: string, month: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Pick<MastermindGroup, 'name' | 'status'>>) => void;
  onUpdateFixedSlots: (groupId: string, slots: FixedSlot[]) => void;
  onSyncAttendance: (sessionId: string) => void;
  onGenerateFixedSessions: (month: string) => void;
  onInviteToMakeup: (month: string, proIds: string[]) => void;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

// ── Fixed Groups panel ────────────────────────────────────────────────────────

const DAY_FILTERS = [
  { label: 'All', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
];

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

function slotDisplayName(slot: FixedSlot): string {
  const week = ORDINALS[(slot.weekOfMonth ?? 1) - 1] ?? `${slot.weekOfMonth}th`;
  return `${week} ${DAYS[slot.dayOfWeek].slice(0, 3)} · ${formatTime(slot.hour, slot.minute)}`;
}

function FixedGroupsPanel({
  group,
  members,
  onUpdateSlots,
}: {
  group: MastermindGroup;
  members: Pro[];
  onUpdateSlots: (slots: FixedSlot[]) => void;
}) {
  const slots = group.fixedSlots ?? [];
  const [expandedIds, setExpandedIds]   = useState<Set<string>>(new Set());
  const [editingIdx, setEditingIdx]     = useState<number | null>(null);
  const [draft, setDraft]               = useState<{ weekOfMonth: number; dayOfWeek: number; hour: number; minute: number } | null>(null);
  const [search, setSearch]             = useState('');
  const [dayFilter, setDayFilter]       = useState(0);
  const [sortAsc, setSortAsc]           = useState(true);
  const [memberSearch, setMemberSearch] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const saveSlot = (idx: number) => {
    if (!draft) return;
    const updated = slots.map((s, i) => {
      if (i !== idx) return s;
      const week  = ORDINALS[(draft.weekOfMonth - 1)] ?? `${draft.weekOfMonth}th`;
      const label = `${week} ${DAYS[draft.dayOfWeek].slice(0,3)} · ${formatTime(draft.hour, draft.minute)}`;
      return { ...s, ...draft, label };
    });
    onUpdateSlots(updated);
    setEditingIdx(null); setDraft(null);
  };

  const removeSlot = (idx: number) => {
    if (slots.length <= 1) return;
    onUpdateSlots(slots.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    const newSlot: FixedSlot = {
      id: `fs-new-${Date.now()}`,
      label: '1st Mon · 9:00 AM',
      weekOfMonth: 1, dayOfWeek: 1, hour: 9, minute: 0,
      memberIds: [],
    };
    onUpdateSlots([...slots, newSlot]);
    setEditingIdx(slots.length);
    setDraft({ weekOfMonth: 1, dayOfWeek: 1, hour: 9, minute: 0 });
  };

  const visibleSlots = slots
    .filter(s => {
      const matchDay  = dayFilter === 0 || s.dayOfWeek === dayFilter;
      const name      = slotDisplayName(s).toLowerCase();
      const matchText = search === '' || name.includes(search.toLowerCase());
      return matchDay && matchText;
    })
    .slice()
    .sort((a, b) => {
      const diff = (a.dayOfWeek * 1440 + a.hour * 60 + a.minute) -
                   (b.dayOfWeek * 1440 + b.hour * 60 + b.minute);
      return sortAsc ? diff : -diff;
    });

  return (
    <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0176D3]" />
          <h2 className="text-[13px] font-bold text-[#080707]">Fixed Groups</h2>
          <span className="text-[11px] text-[#706E6B]">
            {visibleSlots.length === slots.length
              ? `${slots.length} group${slots.length !== 1 ? 's' : ''}`
              : `${visibleSlots.length} of ${slots.length}`}
          </span>
        </div>
        <button onClick={addSlot}
          className="px-3 py-1.5 bg-white text-[#0176D3] text-[12px] rounded border border-[#DDDBDA] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add Group
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="w-8 h-8 text-[#C9C7C5] mx-auto mb-2" />
          <p className="text-[#706E6B] text-[13px] mb-3">No groups defined yet.</p>
          <button onClick={addSlot}
            className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded hover:bg-[#014486] transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Group
          </button>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="px-4 py-2 border-b border-[#DDDBDA] flex items-center gap-2 flex-wrap bg-[#FAFAF9]">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-3 h-3 text-[#706E6B] absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="w-full pl-6 pr-2 py-1 border border-[#DDDBDA] rounded text-[11px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#706E6B] hover:text-[#080707]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center rounded border border-[#DDDBDA] overflow-hidden">
              {DAY_FILTERS.map(f => (
                <button key={f.value} onClick={() => setDayFilter(f.value)}
                  className={`px-2.5 py-1 text-[11px] transition-colors ${
                    dayFilter === f.value ? 'bg-[#032D60] text-white' : 'bg-white text-[#706E6B] hover:bg-[#F3F2F2]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSortAsc(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1 border border-[#DDDBDA] rounded bg-white text-[11px] text-[#706E6B] hover:bg-[#F3F2F2] transition-colors">
              <ArrowUpDown className="w-3 h-3" />
              {sortAsc ? 'Day ↑' : 'Day ↓'}
            </button>
          </div>

          {visibleSlots.length === 0 ? (
            <div className="py-8 text-center text-[#706E6B] text-[13px]">No groups match your filter.</div>
          ) : (
            <div className="divide-y divide-[#DDDBDA]">
              {visibleSlots.map(slot => {
                const origIdx     = slots.indexOf(slot);
                const isEditing   = editingIdx === origIdx;
                const isExpanded  = expandedIds.has(slot.id);
                const slotMembers = slot.memberIds.map(id => members.find(m => m.id === id)).filter(Boolean) as Pro[];
                const mSearch     = memberSearch[slot.id] ?? '';
                const filteredMembers = mSearch
                  ? slotMembers.filter(p =>
                      p.name.toLowerCase().includes(mSearch.toLowerCase()) ||
                      p.email.toLowerCase().includes(mSearch.toLowerCase()))
                  : slotMembers;

                return (
                  <div key={slot.id}>
                    <div className={`px-4 py-2.5 ${isExpanded ? 'bg-[#EEF4FF]' : 'hover:bg-[#FAFAF9]'} transition-colors`}>
                      {isEditing && draft ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={draft.weekOfMonth}
                            onChange={e => setDraft(d => d ? { ...d, weekOfMonth: Number(e.target.value) } : d)}
                            className="px-2 py-1 border border-[#DDDBDA] rounded text-[12px] bg-white focus:outline-none focus:border-[#0176D3]">
                            {[1,2,3,4].map(w => <option key={w} value={w}>{ORDINALS[w-1]}</option>)}
                          </select>
                          <select value={draft.dayOfWeek}
                            onChange={e => setDraft(d => d ? { ...d, dayOfWeek: Number(e.target.value) } : d)}
                            className="flex-1 min-w-[100px] px-2 py-1 border border-[#DDDBDA] rounded text-[12px] bg-white focus:outline-none focus:border-[#0176D3]">
                            {[1,2,3,4,5].map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
                          </select>
                          <input type="time"
                            value={`${String(draft.hour).padStart(2,'0')}:${String(draft.minute).padStart(2,'0')}`}
                            onChange={e => { const [h,m] = e.target.value.split(':').map(Number); setDraft(d => d ? { ...d, hour: h, minute: m } : d); }}
                            className="w-28 px-2 py-1 border border-[#DDDBDA] rounded text-[12px] bg-white focus:outline-none focus:border-[#0176D3]"
                          />
                          <button onClick={() => saveSlot(origIdx)}
                            className="px-2.5 py-1 bg-[#0176D3] text-white text-[11px] rounded hover:bg-[#014486] transition-colors flex items-center gap-1">
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => { setEditingIdx(null); setDraft(null); }}
                            className="p-1 rounded text-[#706E6B] hover:bg-[#F3F2F2]">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleExpand(slot.id)}
                            className="p-0.5 rounded hover:bg-[#DDDBDA] text-[#706E6B] transition-colors flex-shrink-0">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {/* Week + day badge */}
                          <span className="text-[10px] font-bold text-[#0176D3] bg-[#EEF4FF] rounded px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap">
                            {ORDINALS[(slot.weekOfMonth ?? 1) - 1]} {DAYS[slot.dayOfWeek].slice(0,3).toUpperCase()}
                          </span>
                          <span className="text-[13px] font-semibold text-[#080707] flex-1 truncate">
                            {formatTime(slot.hour, slot.minute)}
                          </span>
                          <span className="text-[11px] text-[#706E6B] flex-shrink-0 w-20 text-right">
                            {slotMembers.length} member{slotMembers.length !== 1 ? 's' : ''}
                          </span>
                          <button onClick={() => { setEditingIdx(origIdx); setDraft({ weekOfMonth: slot.weekOfMonth ?? 1, dayOfWeek: slot.dayOfWeek, hour: slot.hour, minute: slot.minute }); }}
                            className="p-1 rounded text-[#706E6B] hover:bg-[#F3F2F2] transition-colors flex-shrink-0" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeSlot(origIdx)} disabled={slots.length <= 1}
                            className="p-1 rounded text-[#706E6B] hover:bg-[#FCE3E3] hover:text-[#C23934] disabled:opacity-20 disabled:cursor-not-allowed transition-colors flex-shrink-0" title="Remove">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isExpanded && !isEditing && (
                      <div className="border-t border-[#DDDBDA] bg-[#FAFAF9]">
                        {slotMembers.length > 5 && (
                          <div className="px-4 pt-2 pb-1">
                            <div className="relative max-w-xs">
                              <Search className="w-3 h-3 text-[#706E6B] absolute left-2 top-1/2 -translate-y-1/2" />
                              <input
                                value={mSearch}
                                onChange={e => setMemberSearch(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                placeholder={`Search ${slotMembers.length} members…`}
                                className="w-full pl-6 pr-2 py-1 border border-[#DDDBDA] rounded text-[11px] bg-white focus:outline-none focus:border-[#0176D3]"
                              />
                            </div>
                          </div>
                        )}
                        <div className="px-4 py-1 divide-y divide-[#F3F2F2] max-h-64 overflow-y-auto">
                          {filteredMembers.length === 0 ? (
                            <p className="text-[11px] text-[#706E6B] italic py-2">
                              {slotMembers.length === 0 ? 'No members assigned.' : 'No members match search.'}
                            </p>
                          ) : filteredMembers.map(pro => (
                            <div key={pro.id} className="flex items-center gap-3 py-1.5">
                              <span className="text-[12px] text-[#080707]">{pro.name}</span>
                              <span className="text-[11px] text-[#706E6B]">{pro.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Session label helper ──────────────────────────────────────────────────────

function getSessionLabel(session: MastermindSession, group: MastermindGroup): string {
  if (session.sessionType === 'makeup') return 'Makeup';
  if (session.sessionType === 'fixed_slot' && group.fixedSlots) {
    const slot = group.fixedSlots.find(s => s.id === session.slotId);
    if (slot) return slotDisplayName(slot);
  }
  const labels = ['Option A', 'Option B', 'Option C'];
  return labels[session.sessionNumber - 1] ?? `Session ${session.sessionNumber}`;
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: MastermindSession['status'] }) {
  const map: Record<string, { cls: string; label: string }> = {
    scheduled:        { cls: 'bg-[#EEF4FF] text-[#014486]',   label: 'Scheduled' },
    invitations_sent: { cls: 'bg-[#FEF3E2] text-[#7A4F00]',   label: 'Invites Sent' },
    completed:        { cls: 'bg-[#E7F6EC] text-[#1C6E42]',   label: 'Completed' },
    cancelled:        { cls: 'bg-[#F3F2F2] text-[#706E6B]',   label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? map.scheduled;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal ${cls}`}>{label}</span>;
}



// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  label,
  sessionRegs,
  members,
  isMakeup,
  noShowPros,
  onComplete,
  onSync,
  onInviteNoShows,
}: {
  session: MastermindSession;
  label: string;
  sessionRegs: SessionRegistration[];
  members: Pro[];
  isMakeup?: boolean;
  noShowPros?: Pro[];
  onComplete: (id: string) => void;
  onSync: (id: string) => void;
  onInviteNoShows?: (proIds: string[]) => void;
}) {
  const [listOpen, setListOpen] = useState(false);
  const [makeupOpen, setMakeupOpen] = useState(false);
  const [selectedNoShows, setSelectedNoShows] = useState<string[]>([]);

  const attended = sessionRegs.filter(r => r.attended === true).length;
  const noShow   = sessionRegs.filter(r => r.attended === false).length;
  const total    = sessionRegs.length;
  const isComplete = session.status === 'completed';

  const toggleNoShow = (id: string) =>
    setSelectedNoShows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSendMakeup = () => {
    if (onInviteNoShows && selectedNoShows.length > 0) {
      onInviteNoShows(selectedNoShows);
      setSelectedNoShows([]);
      setMakeupOpen(false);
    }
  };

  return (
    <div className={`border border-[#DDDBDA] rounded overflow-hidden flex flex-col ${isMakeup ? 'border-dashed' : ''}`}>
      {/* Card header */}
      <div className={`px-3 py-2 border-b border-[#DDDBDA] flex items-center justify-between ${
        isMakeup ? 'bg-[#FEF3E2]' : 'bg-[#FAFAF9]'
      }`}>
        <span className={`text-[12px] font-bold ${isMakeup ? 'text-[#7A4F00]' : 'text-[#080707]'}`}>
          {label}
        </span>
        <StatusPill status={session.status} />
      </div>

      {/* Date / time */}
      <div className="px-3 py-3 flex-1">
        <p className="text-[14px] text-[#080707]">{format(session.date, 'EEE, MMM d')}</p>
        <p className="text-[12px] text-[#706E6B]">{format(session.date, 'h:mm a')}</p>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-[#DDDBDA] flex items-center gap-3">
        <button
          onClick={() => setListOpen(v => !v)}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <span className="text-[13px] font-bold text-[#0176D3]">{total}</span>
          <span className="text-[11px] text-[#706E6B]">registered</span>
        </button>
        {isComplete && (
          <>
            <span className="text-[#DDDBDA]">·</span>
            <span className="text-[13px] font-bold text-[#2E844A]">{attended}</span>
            <span className="text-[11px] text-[#706E6B]">attended</span>
            {noShow > 0 && (
              <>
                <span className="text-[#DDDBDA]">·</span>
                <span className="text-[13px] font-bold text-[#C23934]">{noShow}</span>
                <span className="text-[11px] text-[#706E6B]">no-show</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-[#DDDBDA] flex flex-wrap gap-1.5">
        {isMakeup && noShowPros && noShowPros.length > 0 && !isComplete && (
          <button
            onClick={() => setMakeupOpen(v => !v)}
            className="px-2.5 py-1 bg-[#FE9339] text-white text-[11px] rounded border border-[#FE9339] hover:bg-[#DD7A01] transition-colors flex items-center gap-1"
          >
            <Mail className="w-3 h-3" /> Invite No-Shows ({noShowPros.length})
          </button>
        )}
      </div>

      {/* Registrant list (expandable) */}
      {listOpen && (
        <div className="border-t border-[#DDDBDA] max-h-44 overflow-y-auto">
          {sessionRegs.length === 0 ? (
            <p className="py-4 text-center text-[#706E6B] text-[12px]">No registrations yet</p>
          ) : (
            sessionRegs.map(reg => {
              const pro = members.find(m => m.id === reg.proId);
              return (
                <div key={reg.id} className="px-3 py-2 flex items-center justify-between border-b border-[#DDDBDA] last:border-b-0 hover:bg-[#F3F2F2]">
                  <span className="text-[12px] text-[#080707]">{pro?.name ?? reg.proId}</span>
                  {reg.attended === true  && <span className="text-[10px] bg-[#E7F6EC] text-[#1C6E42] px-1.5 py-0.5 rounded-full">Attended</span>}
                  {reg.attended === false && <span className="text-[10px] bg-[#FCE3E3] text-[#C23934] px-1.5 py-0.5 rounded-full">No-Show</span>}
                  {reg.attended === null  && <span className="text-[10px] bg-[#F3F2F2] text-[#706E6B] px-1.5 py-0.5 rounded-full">Pending</span>}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Makeup invite panel */}
      {makeupOpen && noShowPros && (
        <div className="border-t border-[#DDDBDA] bg-[#FFFBF5]">
          <div className="px-3 py-2 border-b border-[#DDDBDA]">
            <p className="text-[11px] font-bold text-[#7A4F00]">Select no-shows to invite</p>
          </div>
          <div className="max-h-36 overflow-y-auto divide-y divide-[#DDDBDA]">
            {noShowPros.map(pro => (
              <label key={pro.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#FEF3E2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNoShows.includes(pro.id)}
                  onChange={() => toggleNoShow(pro.id)}
                  className="w-3.5 h-3.5 accent-[#FE9339]"
                />
                <span className="text-[12px] text-[#080707]">{pro.name}</span>
              </label>
            ))}
          </div>
          <div className="px-3 py-2 flex gap-2 border-t border-[#DDDBDA]">
            <button
              onClick={handleSendMakeup}
              disabled={selectedNoShows.length === 0}
              className="px-3 py-1.5 bg-[#FE9339] text-white text-[11px] rounded border border-[#FE9339] hover:bg-[#DD7A01] disabled:opacity-40 transition-colors"
            >
              Send Invite ({selectedNoShows.length})
            </button>
            <button
              onClick={() => { setMakeupOpen(false); setSelectedNoShows([]); }}
              className="px-3 py-1.5 bg-white text-[#706E6B] text-[11px] rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GroupRecordPage({
  group,
  coach,
  members,
  sessions,
  registrations,
  onBackToList,
  onManageMembers,
  onCreateSessions,
  onSendInvitations,
  onCompleteSession,
  onUpdateGroup,
  onSyncAttendance,
  onGenerateFixedSessions,
  onInviteToMakeup,
}: Props) {
  const [selectedPro, setSelectedPro]   = useState<Pro | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [editingName, setEditingName]   = useState(false);
  const [nameValue, setNameValue]       = useState(group.name);
  const [membersOpen, setMembersOpen]   = useState(false);
  const nameInputRef                    = useRef<HTMLInputElement>(null);


  useEffect(() => { setNameValue(group.name); }, [group.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const commitName = () => {
    const t = nameValue.trim();
    if (t && t !== group.name) onUpdateGroup(group.id, { name: t });
    else setNameValue(group.name);
    setEditingName(false);
  };
  const cancelEdit = () => { setNameValue(group.name); setEditingName(false); };

  // Month navigation
  const allMonths = [...new Set(sessions.map(s => s.month))].sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(allMonths[0] ?? '');
  const monthIdx = allMonths.indexOf(selectedMonth);

  const monthLabel = selectedMonth
    ? format(parseISO(selectedMonth + '-02'), 'MMMM yyyy')
    : '—';

  const currentSessions = sessions
    .filter(s => s.month === selectedMonth)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  const hasSessionsThisMonth = currentSessions.length > 0;
  const canSendInvites = currentSessions.some(s => s.status === 'scheduled');
  const invitesSent    = currentSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');

  // No-show pros for makeup session
  const getNoShowsForMonth = (month: string): Pro[] => {
    const fixedSessions = sessions.filter(s => s.month === month && s.sessionType === 'fixed_slot');
    const noShowRegs = registrations.filter(
      r => fixedSessions.some(s => s.id === r.sessionId) && r.attended === false
    );
    const makeupSession = sessions.find(s => s.month === month && s.sessionType === 'makeup');
    const alreadyInvited = makeupSession
      ? new Set(registrations.filter(r => r.sessionId === makeupSession.id).map(r => r.proId))
      : new Set<string>();
    return noShowRegs
      .map(r => members.find(m => m.id === r.proId))
      .filter((p): p is Pro => !!p && !alreadyInvited.has(p.id));
  };

  const noShowPros = group.type === 'fixed' ? getNoShowsForMonth(selectedMonth) : [];

  return (
    <div className="min-h-full bg-[#F3F2F2]">

      {/* ── Record Header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA]">
        {/* Breadcrumb */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[12px]">
          <button onClick={onBackToList} className="text-[#0176D3] hover:underline">
            Mastermind Groups
          </button>
          <ChevronRight className="w-3 h-3 text-[#C9C7C5]" />
          <span className="text-[#706E6B]">{group.name}</span>
        </div>

        {/* Title + actions */}
        <div className="px-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#0176D3] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] text-[#706E6B]">Mastermind</span>
                <span className={`inline-flex items-center px-1.5 py-px rounded text-[10px] ${
                  group.type === 'fixed'
                    ? 'bg-[#F3F2F2] text-[#706E6B]'
                    : 'bg-[#EEF4FF] text-[#014486]'
                }`}>
                  {group.type === 'fixed' ? 'Fixed' : 'Flexible'}
                </span>
              </div>
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') cancelEdit(); }}
                    className="text-[20px] font-normal text-[#080707] leading-tight border-b-2 border-[#0176D3] bg-transparent outline-none w-72"
                    autoFocus
                  />
                  <button onClick={commitName} className="p-1 rounded bg-[#0176D3] hover:bg-[#014486] text-white">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] text-[#706E6B]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/title">
                  <h1 className="text-[20px] font-normal text-[#080707] leading-tight">{group.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 rounded hover:bg-[#F3F2F2] text-[#706E6B] transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            <button
              onClick={onManageMembers}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Manage Members
            </button>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-3 py-1.5 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Send Email
            </button>
          </div>
        </div>

        {/* Key Fields strip */}
        <div className="border-t border-[#DDDBDA]">
          <div className="flex divide-x divide-[#DDDBDA]">
            {[
              { label: 'Coach',   value: coach.name },
              { label: 'Status',  value: group.status === 'active' ? 'Active' : 'Inactive' },
              { label: 'Members', value: members.length },
              { label: 'Sessions', value: sessions.length },
            ].map(f => (
              <div key={f.label} className="px-4 py-2.5 flex-1">
                <p className="text-[11px] text-[#706E6B]">{f.label}</p>
                <p className="text-[13px] text-[#080707]">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="p-4 space-y-4">

        {/* Fixed Groups section — only for fixed type */}
        {group.type === 'fixed' && (
          <FixedGroupsPanel
            group={group}
            members={members}
            onUpdateSlots={(slots) => onUpdateFixedSlots(group.id, slots)}
          />
        )}

        {/* Sessions section */}
        <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
          {/* Section header */}
          <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0176D3]" />
              <h2 className="text-[13px] font-bold text-[#080707]">Sessions</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Month nav */}
              {allMonths.length > 0 && (
                <div className="flex items-center gap-1 bg-[#F3F2F2] rounded border border-[#DDDBDA] px-1 py-0.5">
                  <button
                    onClick={() => setSelectedMonth(allMonths[monthIdx + 1] ?? selectedMonth)}
                    disabled={monthIdx >= allMonths.length - 1}
                    className="p-1 rounded hover:bg-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#706E6B]" />
                  </button>
                  <span className="text-[12px] font-bold text-[#080707] w-28 text-center">{monthLabel}</span>
                  <button
                    onClick={() => setSelectedMonth(allMonths[monthIdx - 1] ?? selectedMonth)}
                    disabled={monthIdx <= 0}
                    className="p-1 rounded hover:bg-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#706E6B]" />
                  </button>
                </div>
              )}

              {/* Send invitations */}
              {canSendInvites && (
                <button
                  onClick={() => onSendInvitations(group.id, selectedMonth)}
                  className="px-3 py-1.5 bg-[#FE9339] text-white text-[12px] rounded border border-[#FE9339] hover:bg-[#DD7A01] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Send Invitations
                </button>
              )}
              {invitesSent && !canSendInvites && (
                <span className="text-[11px] text-[#2E844A] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Invitations sent
                </span>
              )}

              {/* Generate sessions (fixed) or new sessions (flexible) */}
              {group.type === 'fixed' && !hasSessionsThisMonth && selectedMonth && (
                <button
                  onClick={() => onGenerateFixedSessions(selectedMonth)}
                  className="px-3 py-1.5 bg-[#0176D3] text-white text-[12px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Generate Sessions
                </button>
              )}
              {group.type === 'flexible' && (
                <button
                  onClick={onCreateSessions}
                  className="px-3 py-1.5 bg-white text-[#080707] text-[12px] rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New Month
                </button>
              )}
            </div>
          </div>

          {/* Session cards */}
          {!hasSessionsThisMonth ? (
            <div className="py-14 text-center">
              <Calendar className="w-10 h-10 text-[#C9C7C5] mx-auto mb-3" />
              <p className="text-[#706E6B] text-[13px] mb-4">
                {allMonths.length === 0
                  ? 'No sessions yet.'
                  : `No sessions for ${monthLabel}.`}
              </p>
              {group.type === 'flexible' ? (
                <button
                  onClick={onCreateSessions}
                  className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Sessions
                </button>
              ) : selectedMonth ? (
                <button
                  onClick={() => onGenerateFixedSessions(selectedMonth)}
                  className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Generate {monthLabel} Sessions
                </button>
              ) : null}
            </div>
          ) : (
            <div className={`p-4 grid gap-4 ${currentSessions.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {currentSessions.map(session => {
                const sessionRegs = registrations.filter(r => r.sessionId === session.id);
                const label = getSessionLabel(session, group);
                const isMakeup = session.sessionType === 'makeup';
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    label={label}
                    sessionRegs={sessionRegs}
                    members={members}
                    isMakeup={isMakeup}
                    noShowPros={isMakeup ? noShowPros : undefined}
                    onComplete={onCompleteSession}
                    onSync={onSyncAttendance}
                    onInviteNoShows={isMakeup ? (ids) => onInviteToMakeup(selectedMonth, ids) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Members section */}
        <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAFAF9] transition-colors"
            onClick={() => setMembersOpen(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0176D3]" />
              <h2 className="text-[13px] font-bold text-[#080707]">
                Members <span className="text-[#706E6B] font-normal">({members.length})</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={e => { e.stopPropagation(); onManageMembers(); }}
                className="text-[12px] text-[#0176D3] hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> Manage
              </button>
              <ChevronDown className={`w-4 h-4 text-[#706E6B] transition-transform ${membersOpen ? '' : '-rotate-90'}`} />
            </div>
          </button>

          {membersOpen && (
            <div className="border-t border-[#DDDBDA]">
              {members.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#706E6B] text-[13px] mb-3">No members yet.</p>
                  <button
                    onClick={onManageMembers}
                    className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
                  >
                    Add Members
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#DDDBDA] max-h-96 overflow-y-auto">
                  {members.map(member => {
                    // Registration status for current selected month
                    const latestIds = currentSessions.map(s => s.id);
                    const memberReg = registrations.find(
                      r => r.proId === member.id && latestIds.includes(r.sessionId)
                    );
                    // Cohort label for fixed groups
                    const cohortSlot = group.fixedSlots?.find(sl => sl.memberIds.includes(member.id));
                    const cohortLabel = cohortSlot ? slotDisplayName(cohortSlot) : undefined;

                    return (
                      <div key={member.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#F3F2F2] transition-colors">
                        <div className="w-7 h-7 rounded-full bg-[#EEF4FF] border border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-[#0176D3] font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedPro(member)}
                              className="text-[13px] text-[#0176D3] hover:underline text-left truncate"
                            >
                              {member.name}
                            </button>
                            {cohortLabel && (
                              <span className="text-[10px] bg-[#F3F2F2] text-[#706E6B] px-1.5 py-px rounded shrink-0">
                                {cohortLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#706E6B] truncate">{member.email}</p>
                        </div>
                        <div className="shrink-0">
                          {memberReg?.attended === true  && <span className="text-[10px] bg-[#E7F6EC] text-[#1C6E42] px-1.5 py-0.5 rounded-full">Attended</span>}
                          {memberReg?.attended === false && <span className="text-[10px] bg-[#FCE3E3] text-[#C23934] px-1.5 py-0.5 rounded-full">No-Show</span>}
                          {memberReg?.attended === null  && <span className="text-[10px] bg-[#FEF3E2] text-[#7A4F00] px-1.5 py-0.5 rounded-full">Registered</span>}
                          {!memberReg && <span className="text-[10px] text-[#C9C7C5]">—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {selectedPro && (
        <ProRecordModal
          pro={selectedPro}
          group={group}
          coach={coach}
          sessions={sessions}
          registrations={registrations.filter(r => r.proId === selectedPro.id)}
          onClose={() => setSelectedPro(null)}
        />
      )}
      {emailModalOpen && (
        <BulkEmailModal
          group={group}
          coach={coach}
          members={members}
          sessions={sessions}
          registrations={registrations}
          onClose={() => setEmailModalOpen(false)}
        />
      )}
    </div>
  );
}
