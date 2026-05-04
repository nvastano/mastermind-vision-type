import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, UserPlus, Plus, Mail, Users, Calendar,
  Check, X, Pencil, Wifi, ChevronDown
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, Pro, MastermindSession, SessionRegistration } from '../App';
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
  onSyncAttendance: (sessionId: string) => void;
  onGenerateFixedSessions: (month: string) => void;
  onInviteToMakeup: (month: string, proIds: string[]) => void;
};

// ── Session label helper ──────────────────────────────────────────────────────

function getSessionLabel(session: MastermindSession, group: MastermindGroup): string {
  if (session.sessionType === 'makeup') return 'Makeup';
  if (session.sessionType === 'fixed_slot' && group.fixedSlots) {
    const slot = group.fixedSlots.find(s => s.id === session.slotId);
    if (slot) return slot.label;
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

// ── Pipeline bar ──────────────────────────────────────────────────────────────

function RecordPath({ sessions }: { sessions: MastermindSession[] }) {
  const latestMonth = [...new Set(sessions.map(s => s.month))].sort().reverse()[0];
  const monthSessions = sessions.filter(s => s.month === latestMonth);

  const hasSessions  = monthSessions.length > 0;
  const invSent      = monthSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
  const allCompleted = monthSessions.length > 0 && monthSessions.every(s => s.status === 'completed');

  const stages = [
    { label: 'Sessions Created',   done: hasSessions   },
    { label: 'Invitations Sent',   done: invSent       },
    { label: 'Sessions Completed', done: allCompleted  },
    { label: 'Attendance Synced',  done: allCompleted  },
  ];

  const activeIdx = stages.reduce((acc, s, i) => (s.done ? i : acc), -1);

  return (
    <div className="bg-white border-b border-[#DDDBDA]">
      <div className="px-4 py-2 flex items-center gap-0 overflow-x-auto">
        {stages.map((stage, i) => {
          const isActive = i === activeIdx;
          const isDone   = stage.done && i < activeIdx;
          return (
            <div key={stage.label} className="flex items-center flex-shrink-0">
              <div
                className={`relative flex items-center px-5 py-2.5 text-[12px] transition-colors ${
                  isActive ? 'text-white' : isDone ? 'bg-[#E7F6EC] text-[#2E844A]' : 'bg-[#FAFAF9] text-[#706E6B]'
                }`}
                style={{
                  background: isActive ? '#032D60' : undefined,
                  clipPath: i === 0
                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                    : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                  marginLeft: i === 0 ? 0 : -1,
                  minWidth: 160,
                  justifyContent: 'center',
                }}
              >
                <div className="flex items-center gap-1.5">
                  {isDone && <Check className="w-3.5 h-3.5 text-[#2E844A]" />}
                  <span>{stage.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
        {!isComplete && (
          <button
            onClick={() => onComplete(session.id)}
            className="px-2.5 py-1 bg-white text-[#2E844A] text-[11px] rounded border border-[#2E844A] hover:bg-[#E7F6EC] transition-colors flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Mark Complete
          </button>
        )}
        {isComplete && (
          <button
            onClick={() => onSync(session.id)}
            className="px-2.5 py-1 bg-white text-[#0176D3] text-[11px] rounded border border-[#0176D3] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5"
          >
            <Wifi className="w-3 h-3" /> Sync Zoom
          </button>
        )}
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

      {/* ── Pipeline bar ────────────────────────────────────────────────────── */}
      <RecordPath sessions={sessions} />

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="p-4 space-y-4">

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
                    const cohortLabel = group.fixedSlots
                      ? group.fixedSlots.find(sl => sl.memberIds.includes(member.id))?.label
                      : undefined;

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
