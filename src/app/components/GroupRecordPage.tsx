import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, UserPlus, Plus, Mail, Users, Calendar,
  Check, X, Pencil, ChevronDown, Minus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, Pro, MastermindSession, SessionRegistration } from '../App';
import { BulkEmailModal } from './BulkEmailModal';

type Props = {
  group: MastermindGroup;
  coach: Coach;
  members: Pro[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  // cross-group data for pro contact record
  allSessions: MastermindSession[];
  allRegistrations: SessionRegistration[];
  allGroups: MastermindGroup[];
  allCoaches: Coach[];
  allPros: Pro[];
  onBackToList: () => void;
  onManageMembers: () => void;
  onCreateSessions: () => void;
  onSendInvitations: (groupId: string, month: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Pick<MastermindGroup, 'name' | 'status'>>) => void;
  onSyncAttendance: (sessionId: string) => void;
  onUpdateAttendance: (regId: string, attended: boolean | null) => void;
  onOpenPro: (pro: Pro) => void;
  onGenerateFixedSessions: (month: string) => void;
};

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

// ── Session label helper ──────────────────────────────────────────────────────

function getSessionLabel(session: MastermindSession, _group: MastermindGroup): string {
  if (session.sessionType === 'makeup') return 'Makeup';
  if (session.sessionType === 'fixed_slot') return 'Monthly Session';
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
  onComplete,
  onSync,
  onUpdateAttendance,
  onOpenPro,
}: {
  session: MastermindSession;
  label: string;
  sessionRegs: SessionRegistration[];
  members: Pro[];
  isMakeup?: boolean;
  onComplete: (id: string) => void;
  onSync: (id: string) => void;
  onUpdateAttendance: (regId: string, attended: boolean | null) => void;
  onOpenPro: (pro: Pro) => void;
}) {
  const [listOpen, setListOpen] = useState(false);

  const attended = sessionRegs.filter(r => r.attended === true).length;
  const noShow   = sessionRegs.filter(r => r.attended === false).length;
  const total    = sessionRegs.length;
  const isComplete = session.status === 'completed';

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
          <ChevronDown className={`w-3 h-3 text-[#706E6B] transition-transform ${listOpen ? '' : '-rotate-90'}`} />
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

      {/* Registrant list (expandable) */}
      {listOpen && (
        <div className="border-t border-[#DDDBDA] max-h-52 overflow-y-auto">
          {sessionRegs.length === 0 ? (
            <p className="py-4 text-center text-[#706E6B] text-[12px]">No registrations yet</p>
          ) : (
            <>
              {/* Column headers */}
              <div className="px-3 py-1.5 flex items-center justify-between bg-[#FAFAF9] border-b border-[#DDDBDA]">
                <span className="text-[10px] font-bold text-[#706E6B] uppercase tracking-wide">Pro</span>
                <span className="text-[10px] font-bold text-[#706E6B] uppercase tracking-wide">
                  Attended
                  <span className="ml-1 text-[9px] font-normal normal-case text-[#C9C7C5]">· override</span>
                </span>
              </div>
              {sessionRegs.map(reg => {
                const pro = members.find(m => m.id === reg.proId);
                return (
                  <div key={reg.id} className="px-3 py-1.5 flex items-center justify-between border-b border-[#DDDBDA] last:border-b-0 hover:bg-[#F3F2F2]">
                    {/* Clickable name → opens pro contact record */}
                    <button
                      onClick={() => pro && onOpenPro(pro)}
                      className="text-[12px] text-[#0176D3] hover:underline text-left truncate max-w-[140px]"
                    >
                      {pro?.name ?? reg.proId}
                    </button>

                    {/* Manual override toggle — three states */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {/* Attended */}
                      <button
                        onClick={() => onUpdateAttendance(reg.id, reg.attended === true ? null : true)}
                        title="Mark Attended"
                        className={`p-1 rounded transition-colors ${
                          reg.attended === true
                            ? 'bg-[#2E844A] text-white'
                            : 'text-[#706E6B] hover:bg-[#E7F6EC] hover:text-[#1C6E42]'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      {/* No-show */}
                      <button
                        onClick={() => onUpdateAttendance(reg.id, reg.attended === false ? null : false)}
                        title="Mark No-Show"
                        className={`p-1 rounded transition-colors ${
                          reg.attended === false
                            ? 'bg-[#C23934] text-white'
                            : 'text-[#706E6B] hover:bg-[#FCE3E3] hover:text-[#C23934]'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Clear / pending */}
                      <button
                        onClick={() => onUpdateAttendance(reg.id, null)}
                        title="Clear (reset to pending)"
                        className={`p-1 rounded transition-colors ${
                          reg.attended === null
                            ? 'bg-[#706E6B] text-white'
                            : 'text-[#C9C7C5] hover:bg-[#F3F2F2] hover:text-[#706E6B]'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
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
  allSessions,
  allRegistrations,
  allGroups,
  allCoaches,
  allPros,
  onBackToList,
  onManageMembers,
  onCreateSessions,
  onSendInvitations,
  onCompleteSession,
  onUpdateGroup,
  onSyncAttendance,
  onUpdateAttendance,
  onOpenPro,
  onGenerateFixedSessions,
}: Props) {
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
            {(() => {
              const scheduleLabel = group.type === 'fixed' && group.schedule
                ? `${['','1st','2nd','3rd','4th'][group.schedule.weekOfMonth]} ${['','Mon','Tue','Wed','Thu','Fri'][group.schedule.dayOfWeek]} · ${formatTime(group.schedule.hour, group.schedule.minute)}`
                : null;

              const fields = [
                { label: 'Coach',    value: coach.name },
                ...(scheduleLabel ? [{ label: 'Schedule', value: scheduleLabel }] : []),
                { label: 'Status',   value: group.status === 'active' ? 'Active' : 'Inactive' },
                { label: 'Members',  value: members.length },
                { label: 'Sessions', value: sessions.length },
              ];

              return fields.map(f => (
                <div key={f.label} className="px-4 py-2.5 flex-1">
                  <p className="text-[11px] text-[#706E6B]">{f.label}</p>
                  <p className="text-[13px] text-[#080707]">{f.value}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

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
                    onComplete={onCompleteSession}
                    onSync={onSyncAttendance}
                    onUpdateAttendance={onUpdateAttendance}
                    onOpenPro={onOpenPro}
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
                              onClick={() => onOpenPro(member)}
                              className="text-[13px] text-[#0176D3] hover:underline text-left truncate"
                            >
                              {member.name}
                            </button>
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
