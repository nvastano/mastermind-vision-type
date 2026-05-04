import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, UserPlus, Plus, Mail, ClipboardList,
  Video, CheckCircle, MoreHorizontal, Users, Calendar,
  Check, X, ChevronDown, Pencil, Wifi
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
  onOpenRegistrations: (groupId: string, month: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Pick<MastermindGroup, 'name' | 'status'>>) => void;
  onSyncAttendance: (sessionId: string) => void;
};

const SESSION_LABELS = ['Option A', 'Option B', 'Option C'] as const;

// ── Path Component ───────────────────────────────────────────────────────────

function RecordPath({ sessions }: { sessions: MastermindSession[] }) {
  const latestMonth = [...new Set(sessions.map(s => s.month))].sort().reverse()[0];
  const monthSessions = sessions.filter(s => s.month === latestMonth);

  const hasSessions = monthSessions.length > 0;
  const invSent = monthSessions.length > 0 && monthSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
  const hasRegs = false; // derived from registrations passed in — simplified
  const allCompleted = monthSessions.length > 0 && monthSessions.every(s => s.status === 'completed');

  const stages = [
    { label: 'Sessions Scheduled', done: hasSessions },
    { label: 'Invitations Sent', done: invSent },
    { label: 'Registrations Open', done: invSent },
    { label: 'Sessions Completed', done: allCompleted },
  ];

  const activeIdx = stages.reduce((acc, s, i) => (s.done ? i : acc), -1);

  return (
    <div className="bg-white border-b border-[#DDDBDA]">
      <div className="px-4 py-2 flex items-center gap-0 overflow-x-auto">
        {stages.map((stage, i) => {
          const isActive = i === activeIdx;
          const isDone = stage.done && i < activeIdx;
          const isFuture = !stage.done;

          return (
            <div key={stage.label} className="flex items-center flex-shrink-0">
              {/* Chevron stage */}
              <div
                className={`relative flex items-center px-5 py-2.5 text-[12px] font-normal transition-colors ${
                  isActive
                    ? 'text-white'
                    : isDone
                    ? 'bg-[#E7F6EC] text-[#2E844A]'
                    : 'bg-[#FAFAF9] text-[#706E6B]'
                }`}
                style={{
                  background: isActive ? '#032D60' : undefined,
                  clipPath: i === 0
                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                    : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                  marginLeft: i === 0 ? 0 : -1,
                  minWidth: 140,
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

        <div className="ml-auto pl-4 flex-shrink-0">
          {allCompleted ? (
            <span className="px-3 py-2 bg-[#E7F6EC] text-[#1C6E42] text-[12px] rounded border border-[#2E844A] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> All Sessions Complete
            </span>
          ) : (
            <button className="px-3 py-2 bg-[#0176D3] text-white text-[12px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors">
              Mark Status as Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, value, link }: { label: string; value: React.ReactNode; link?: boolean }) {
  return (
    <div className="py-2 px-3 border-b border-[#DDDBDA] last:border-b-0">
      <p className="text-[11px] text-[#706E6B] mb-0.5">{label}</p>
      <p className={`text-[13px] ${link ? 'text-[#0176D3]' : 'text-[#080707]'}`}>{value || <span className="text-[#C9C7C5]">—</span>}</p>
    </div>
  );
}

// ── Session status helpers ────────────────────────────────────────────────────

function statusPill(status: MastermindSession['status']) {
  const map: Record<string, { cls: string; label: string }> = {
    scheduled: { cls: 'bg-[#EEF4FF] text-[#014486]', label: 'Scheduled' },
    invitations_sent: { cls: 'bg-[#FEF3E2] text-[#7A4F00]', label: 'Invites Sent' },
    completed: { cls: 'bg-[#E7F6EC] text-[#1C6E42]', label: 'Completed' },
    cancelled: { cls: 'bg-[#F3F2F2] text-[#706E6B]', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? map.scheduled;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{label}</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────

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
  onOpenRegistrations,
  onStartSession,
  onCompleteSession,
  onUpdateGroup,
  onSyncAttendance,
}: Props) {
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'members'>('sessions');
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keep local name value in sync if group prop changes
  useEffect(() => { setNameValue(group.name); }, [group.name]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== group.name) onUpdateGroup(group.id, { name: trimmed });
    else setNameValue(group.name); // revert if empty
    setEditingName(false);
  };

  const cancelEdit = () => {
    setNameValue(group.name);
    setEditingName(false);
  };
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set([...new Set(sessions.map(s => s.month))].sort().reverse().slice(0, 1))
  );

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const monthGroups = [...new Set(sessions.map(s => s.month))]
    .sort().reverse()
    .map(month => ({
      month,
      label: format(parseISO(month + '-02'), 'MMMM yyyy'),
      sessions: sessions.filter(s => s.month === month).sort((a, b) => a.sessionNumber - b.sessionNumber),
    }));

  const getRegCount = (sessionId: string) => registrations.filter(r => r.sessionId === sessionId).length;
  const getMonthRegCount = (month: string) => {
    const ids = sessions.filter(s => s.month === month).map(s => s.id);
    return registrations.filter(r => ids.includes(r.sessionId)).length;
  };

  const latestMonth = monthGroups[0]?.month ?? null;
  const totalRegistrations = registrations.length;

  // Highlights data
  const highlights = [
    { label: 'Status', value: <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${group.status === 'active' ? 'bg-[#2E844A]' : 'bg-[#706E6B]'}`} />{group.status === 'active' ? 'Active' : 'Inactive'}</span> },
    { label: 'Coach', value: coach.name },
    { label: 'Members', value: members.length },
    { label: 'Current Month', value: latestMonth ? format(parseISO(latestMonth + '-02'), 'MMM yyyy') : '—' },
    { label: 'Registrations', value: totalRegistrations },
    { label: 'Sessions', value: sessions.length },
  ];

  const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'sessions', label: `Sessions (${monthGroups.length} months)` },
    { id: 'members', label: `Members (${members.length})` },
  ] as const;

  return (
    <div className="min-h-full bg-[#F3F2F2]">
      {/* ── Record Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA]">
        {/* Breadcrumb */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[12px]">
          <button onClick={onBackToList} className="text-[#0176D3] hover:underline">
            Mastermind Groups
          </button>
          <ChevronRight className="w-3 h-3 text-[#C9C7C5]" />
          <span className="text-[#706E6B]">{group.name}</span>
        </div>

        {/* Record title row */}
        <div className="px-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Record type icon */}
            <div className="w-10 h-10 rounded bg-[#0176D3] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-[#706E6B] mb-0.5">Mastermind</p>
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') cancelEdit(); }}
                    className="text-[20px] font-normal text-[#080707] leading-tight border-b-2 border-[#0176D3] bg-transparent outline-none w-80"
                    autoFocus
                  />
                  <button onClick={commitName} className="p-1 rounded bg-[#0176D3] hover:bg-[#014486] text-white transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] text-[#706E6B] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/title">
                  <h1 className="text-[20px] font-normal text-[#080707] leading-tight">{group.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 rounded hover:bg-[#F3F2F2] text-[#706E6B] transition-all"
                    title="Rename group"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-2">
            <button
              onClick={() => setEditingName(true)}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onCreateSessions}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Sessions
            </button>
            <button
              onClick={onManageMembers}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Manage Members
            </button>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-3 py-1.5 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Send Email
            </button>
            <button className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1">
              More <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Key Fields panel */}
        <div className="border-t border-[#DDDBDA]">
          <div className="flex items-center justify-between px-4 py-1 bg-[#FAFAF9]">
            <span className="text-[11px] font-bold text-[#080707] uppercase tracking-wide">Key Fields</span>
            <button className="text-[11px] text-[#0176D3] hover:underline">Edit</button>
          </div>
          <div className="flex divide-x divide-[#DDDBDA]">
            {highlights.map(h => (
              <div key={h.label} className="px-4 py-2.5 flex-1 min-w-0">
                <p className="text-[11px] text-[#706E6B] mb-0.5 truncate">{h.label}</p>
                <div className="text-[13px] text-[#080707] truncate">{h.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Path ────────────────────────────────────────────────────────────── */}
      <RecordPath sessions={sessions} />

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA] px-4">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#0176D3] text-[#0176D3] font-normal'
                  : 'border-transparent text-[#706E6B] hover:text-[#080707] hover:border-[#DDDBDA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <div className="p-4">

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-3 gap-4">
            {/* Left: record fields */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#080707]">Group Information</h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-[#DDDBDA]">
                    <Field label="Group Name" value={group.name} />
                    <Field label="Status" value={group.status === 'active' ? 'Active' : 'Inactive'} />
                    <Field label="Total Members" value={members.length} />
                    <Field label="Created Date" value={format(group.createdDate, 'M/d/yyyy')} />
                  </div>
                  <div>
                    <Field label="Coach" value={coach.name} link />
                    <Field label="Coach Email" value={coach.email} link />
                    <Field label="Total Sessions" value={sessions.length} />
                    <Field label="Current Month" value={latestMonth ? format(parseISO(latestMonth + '-02'), 'MMMM yyyy') : '—'} />
                  </div>
                </div>
              </div>

              {/* Salesforce object info */}
              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#2E844A] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#080707]">Salesforce Object Mapping</h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-[#DDDBDA]">
                    <Field label="Parent Object" value="Mastermind__c" />
                    <Field label="Session Object" value="Mastermind_Session__c" />
                  </div>
                  <div>
                    <Field label="Member Object" value="Mastermind_Group_Member__c" />
                    <Field label="Registration Object" value="Session_Registration__c" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#080707]">Session Summary</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Total Sessions', val: sessions.length, color: 'text-[#0176D3]' },
                    { label: 'Completed', val: sessions.filter(s => s.status === 'completed').length, color: 'text-[#2E844A]' },
                    { label: 'Scheduled', val: sessions.filter(s => s.status === 'scheduled' || s.status === 'invitations_sent').length, color: 'text-[#7A4F00]' },
                    { label: 'Registrations', val: totalRegistrations, color: 'text-[#0176D3]' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#706E6B]">{label}</span>
                      <span className={`font-bold ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members quick list */}
              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#080707]">Members ({members.length})</h3>
                  </div>
                  <button onClick={onManageMembers} className="text-[11px] text-[#0176D3] hover:underline">
                    Manage
                  </button>
                </div>
                <div className="divide-y divide-[#DDDBDA]">
                  {members.map(m => (
                    <div key={m.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#EEF4FF] border border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-[#0176D3] font-bold">
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#0176D3] hover:underline cursor-pointer truncate">{m.name}</p>
                        <p className="text-[11px] text-[#706E6B] truncate">{m.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {/* Related list header */}
            <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
              <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#080707]">
                    Mastermind Sessions <span className="text-[#706E6B] font-normal">({sessions.length})</span>
                  </h3>
                </div>
                <button
                  onClick={onCreateSessions}
                  className="px-3 py-1.5 bg-[#0176D3] text-white text-[12px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Sessions
                </button>
              </div>

              {monthGroups.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="w-10 h-10 text-[#C9C7C5] mx-auto mb-3" />
                  <p className="text-[#706E6B] text-[13px] mb-4">No sessions yet.</p>
                  <button
                    onClick={onCreateSessions}
                    className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create First Sessions
                  </button>
                </div>
              ) : (
                <div>
                  {monthGroups.map(({ month, label, sessions: mSessions }) => {
                    const isExpanded = expandedMonths.has(month);
                    const regCount = getMonthRegCount(month);
                    const invSent = mSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
                    const canSend = mSessions.some(s => s.status === 'scheduled');
                    const allDone = mSessions.every(s => s.status === 'completed');

                    return (
                      <div key={month} className="border-t border-[#DDDBDA]">
                        {/* Month subheader */}
                        <div
                          className="px-4 py-3 bg-[#FAFAF9] flex items-center justify-between cursor-pointer hover:bg-[#F3F2F2] transition-colors"
                          onClick={() => toggleMonth(month)}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`w-4 h-4 text-[#706E6B] transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                            />
                            <span className="text-[13px] font-bold text-[#080707]">{label}</span>
                            {allDone && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E7F6EC] text-[#1C6E42]">Completed</span>
                            )}
                            {invSent && !allDone && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3E2] text-[#7A4F00]">Invites Sent</span>
                            )}
                            <span className="text-[12px] text-[#706E6B]">{regCount} registrations · {mSessions.length} sessions</span>
                          </div>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {canSend && (
                              <button
                                onClick={() => onSendInvitations(group.id, month)}
                                className="px-3 py-1.5 bg-[#FE9339] text-white text-[12px] rounded border border-[#FE9339] hover:bg-[#DD7A01] transition-colors flex items-center gap-1.5"
                              >
                                <Mail className="w-3.5 h-3.5" /> Send Invitations
                              </button>
                            )}
                            <button
                              onClick={() => onOpenRegistrations(group.id, month)}
                              className="px-3 py-1.5 bg-white text-[#0176D3] text-[12px] rounded border border-[#0176D3] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5"
                            >
                              <ClipboardList className="w-3.5 h-3.5" /> Registrations
                            </button>
                          </div>
                        </div>

                        {/* Session rows (table style) */}
                        {isExpanded && (
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white border-b border-[#DDDBDA]">
                                {['Option', 'Date & Time', 'Status', 'Registered', 'Zoom Link', 'Actions'].map(h => (
                                  <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DDDBDA]">
                              {mSessions.map((session, idx) => (
                                <tr key={session.id} className="bg-white hover:bg-[#F3F2F2] transition-colors">
                                  <td className="px-4 py-3">
                                    <span className="text-[12px] font-bold text-[#706E6B]">
                                      {SESSION_LABELS[idx]}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-[13px] text-[#080707]">
                                      {format(session.date, 'EEE, MMM d, yyyy')}
                                    </p>
                                    <p className="text-[11px] text-[#706E6B]">
                                      {format(session.date, 'h:mm a')}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">
                                    {statusPill(session.status)}
                                  </td>
                                  <td className="px-4 py-3 text-[13px] text-[#080707] text-center">
                                    <span className="text-[#0176D3]">{getRegCount(session.id)}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <a
                                      href={session.zoomLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-[#0176D3] hover:underline truncate block max-w-[160px]"
                                    >
                                      {session.zoomLink}
                                    </a>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {(session.status === 'scheduled' || session.status === 'invitations_sent') && (
                                        <>
                                          <button
                                            onClick={() => onStartSession(session.id)}
                                            className="px-2.5 py-1 bg-[#0176D3] text-white text-[11px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1"
                                          >
                                            <Video className="w-3 h-3" /> Start
                                          </button>
                                          <button
                                            onClick={() => onCompleteSession(session.id)}
                                            className="px-2.5 py-1 bg-white text-[#2E844A] text-[11px] rounded border border-[#2E844A] hover:bg-[#E7F6EC] transition-colors flex items-center gap-1"
                                          >
                                            <CheckCircle className="w-3 h-3" /> Complete
                                          </button>
                                        </>
                                      )}
                                      {session.status === 'completed' && (
                                        <button
                                          onClick={() => onSyncAttendance(session.id)}
                                          className="px-2.5 py-1 bg-white text-[#0176D3] text-[11px] rounded border border-[#0176D3] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5"
                                          title="Simulate Zoom attendance sync"
                                        >
                                          <Wifi className="w-3 h-3" /> Sync from Zoom
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
            <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-[13px] font-bold text-[#080707]">
                  Group Members <span className="text-[#706E6B] font-normal">({members.length})</span>
                </h3>
                <span className="text-[11px] text-[#706E6B]">· Mastermind_Group_Member__c</span>
              </div>
              <button
                onClick={onManageMembers}
                className="px-3 py-1.5 bg-[#0176D3] text-white text-[12px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Manage Members
              </button>
            </div>

            {members.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-10 h-10 text-[#C9C7C5] mx-auto mb-3" />
                <p className="text-[#706E6B] text-[13px] mb-3">No members yet.</p>
                <button
                  onClick={onManageMembers}
                  className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
                >
                  Add Members
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAFAF9] border-b border-[#DDDBDA]">
                    <th className="w-10 px-4 py-2.5">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded" />
                    </th>
                    {['Name', 'Email', 'Phone', 'May Registration', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDBDA]">
                  {members.map(member => {
                    const latestMo = [...new Set(sessions.map(s => s.month))].sort().reverse()[0];
                    const latestIds = sessions.filter(s => s.month === latestMo).map(s => s.id);
                    const memberReg = registrations.find(r => r.proId === member.id && latestIds.includes(r.sessionId));
                    const regSession = memberReg ? sessions.find(s => s.id === memberReg.sessionId) : null;

                    return (
                      <tr key={member.id} className="bg-white hover:bg-[#F3F2F2] transition-colors group">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="w-3.5 h-3.5 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#EEF4FF] border border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-[#0176D3] font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedPro(member)}
                              className="text-[13px] text-[#0176D3] hover:underline cursor-pointer text-left"
                            >
                              {member.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#080707]">{member.email}</td>
                        <td className="px-4 py-3 text-[13px] text-[#080707]">{member.phone}</td>
                        <td className="px-4 py-3">
                          {memberReg && regSession ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-[#080707]">
                                {SESSION_LABELS[regSession.sessionNumber - 1]} · {format(regSession.date, 'MMM d')}
                              </span>
                              {memberReg.attended === true && <span className="text-[10px] bg-[#E7F6EC] text-[#1C6E42] px-1.5 py-0.5 rounded-full">Attended</span>}
                              {memberReg.attended === false && <span className="text-[10px] bg-[#FCE3E3] text-[#C23934] px-1.5 py-0.5 rounded-full">No-Show</span>}
                              {memberReg.attended === null && <span className="text-[10px] bg-[#F3F2F2] text-[#706E6B] px-1.5 py-0.5 rounded-full">Pending</span>}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#C9C7C5]">Not registered</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#DDDBDA] transition-all text-[#706E6B]">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pro record modal */}
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

      {/* Bulk email modal */}
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
