import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, UserPlus, Plus, Mail, ClipboardList,
  Video, CheckCircle, MoreHorizontal, Users, Calendar,
  Check, X, ChevronDown, Pencil, Wifi, Zap
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
  onOpenRegistrations: (groupId: string, month: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Pick<MastermindGroup, 'name' | 'status'>>) => void;
  onSyncAttendance: (sessionId: string) => void;
  onGenerateFixedSessions: (month: string) => void;
  onInviteToMakeup: (month: string, proIds: string[]) => void;
};

// Updated SESSION_LABELS: 4 entries, with safe fallback
const SESSION_LABELS = ['Option A', 'Option B', 'Option C', 'Makeup'] as const;
function getSessionLabel(sessionNumber: number): string {
  return SESSION_LABELS[sessionNumber - 1] ?? `Session ${sessionNumber}`;
}

// ── Path Component ───────────────────────────────────────────────────────────

function RecordPath({ sessions }: { sessions: MastermindSession[] }) {
  const latestMonth = [...new Set(sessions.map(s => s.month))].sort().reverse()[0];
  const monthSessions = sessions.filter(s => s.month === latestMonth);

  const hasSessions  = monthSessions.length > 0;
  const invSent      = monthSessions.length > 0 && monthSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
  const allCompleted = monthSessions.length > 0 && monthSessions.every(s => s.status === 'completed');

  const stages = [
    { label: 'Sessions Scheduled', done: hasSessions },
    { label: 'Invitations Sent',   done: invSent },
    { label: 'Registrations Open', done: invSent },
    { label: 'Sessions Completed', done: allCompleted },
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
                className={`relative flex items-center px-5 py-2.5 text-[12px] font-normal transition-colors ${
                  isActive ? 'text-white' : isDone ? 'bg-[#E7F6EC] text-[#2E844A]' : 'bg-[#FAFAF9] text-[#706E6B]'
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
    scheduled:        { cls: 'bg-[#EEF4FF] text-[#014486]',   label: 'Scheduled'    },
    invitations_sent: { cls: 'bg-[#FEF3E2] text-[#7A4F00]',   label: 'Invites Sent' },
    completed:        { cls: 'bg-[#E7F6EC] text-[#1C6E42]',   label: 'Completed'    },
    cancelled:        { cls: 'bg-[#F3F2F2] text-[#706E6B]',   label: 'Cancelled'    },
  };
  const { cls, label } = map[status] ?? map.scheduled;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{label}</span>;
}

// ── Format time helper ────────────────────────────────────────────────────────
function formatSlotTime(hour: number, minute: number): string {
  const h12   = hour % 12 === 0 ? 12 : hour % 12;
  const ampm  = hour < 12 ? 'AM' : 'PM';
  const mm    = String(minute).padStart(2, '0');
  return `${h12}:${mm} ${ampm}`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Fixed Sessions Tab ────────────────────────────────────────────────────────

function FixedSessionsTab({
  group,
  sessions,
  registrations,
  members,
  onGenerateFixedSessions,
  onInviteToMakeup,
  onStartSession,
  onCompleteSession,
  onSyncAttendance,
}: {
  group: MastermindGroup;
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  members: Pro[];
  onGenerateFixedSessions: (month: string) => void;
  onInviteToMakeup: (month: string, proIds: string[]) => void;
  onStartSession: (id: string) => void;
  onCompleteSession: (id: string) => void;
  onSyncAttendance: (id: string) => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set([...new Set(sessions.map(s => s.month))].sort().reverse().slice(0, 1))
  );
  // Track which makeup panels are open
  const [makeupPanelOpen, setMakeupPanelOpen] = useState<Record<string, boolean>>({});
  const [makeupSelected, setMakeupSelected]   = useState<Record<string, Set<string>>>({});

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const slots = group.fixedSlots ?? [];

  const allMonths = [...new Set(sessions.map(s => s.month))].sort().reverse();

  // Helper: find no-shows for a given month across all fixed_slot sessions
  const getNoShows = (month: string): Pro[] => {
    const slotSessions = sessions.filter(s => s.month === month && s.sessionType === 'fixed_slot');
    const makeupSession = sessions.find(s => s.month === month && s.sessionType === 'makeup');
    const alreadyInMakeup = makeupSession
      ? new Set(registrations.filter(r => r.sessionId === makeupSession.id).map(r => r.proId))
      : new Set<string>();

    const noShowIds = new Set<string>();
    slotSessions.forEach(ss => {
      registrations
        .filter(r => r.sessionId === ss.id && r.attended === false)
        .forEach(r => {
          if (!alreadyInMakeup.has(r.proId)) noShowIds.add(r.proId);
        });
    });
    return members.filter(m => noShowIds.has(m.id));
  };

  return (
    <div className="space-y-4">
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
        </div>

        {allMonths.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-10 h-10 text-[#C9C7C5] mx-auto mb-3" />
            <p className="text-[#706E6B] text-[13px]">No sessions yet.</p>
          </div>
        ) : (
          <div>
            {allMonths.map(month => {
              const isExpanded    = expandedMonths.has(month);
              const monthSessions = sessions.filter(s => s.month === month);
              const allDone       = monthSessions.length > 0 && monthSessions.every(s => s.status === 'completed');
              const invSent       = monthSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
              const hasAny        = monthSessions.length > 0;
              const label         = format(parseISO(month + '-02'), 'MMMM yyyy');

              const slotSessions  = monthSessions.filter(s => s.sessionType === 'fixed_slot');
              const makeupSession = monthSessions.find(s => s.sessionType === 'makeup');

              const noShowsForMonth  = getNoShows(month);
              const isPanelOpen      = makeupPanelOpen[month] ?? false;
              const selectedSet      = makeupSelected[month] ?? new Set<string>();

              const toggleMakeupCheck = (proId: string) => {
                setMakeupSelected(prev => {
                  const cur = new Set(prev[month] ?? []);
                  cur.has(proId) ? cur.delete(proId) : cur.add(proId);
                  return { ...prev, [month]: cur };
                });
              };

              const sendMakeupInvites = () => {
                onInviteToMakeup(month, [...selectedSet]);
                setMakeupSelected(prev => ({ ...prev, [month]: new Set() }));
                setMakeupPanelOpen(prev => ({ ...prev, [month]: false }));
              };

              return (
                <div key={month} className="border-t border-[#DDDBDA]">
                  {/* Month header */}
                  <div
                    className="px-4 py-3 bg-[#FAFAF9] flex items-center justify-between cursor-pointer hover:bg-[#F3F2F2] transition-colors"
                    onClick={() => toggleMonth(month)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`w-4 h-4 text-[#706E6B] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      <span className="text-[13px] font-bold text-[#080707]">{label}</span>
                      {allDone && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E7F6EC] text-[#1C6E42]">Completed</span>}
                      {invSent && !allDone && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3E2] text-[#7A4F00]">Invites Sent</span>}
                    </div>
                    {!hasAny && (
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onGenerateFixedSessions(month)}
                          className="px-3 py-1.5 bg-[#7B5EA7] text-white text-[12px] rounded border border-[#7B5EA7] hover:bg-[#5A3E8A] transition-colors flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> Generate Sessions
                        </button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 py-3 space-y-3">
                      {/* Generate button if no sessions yet */}
                      {!hasAny && (
                        <div className="py-8 text-center">
                          <p className="text-[#706E6B] text-[13px] mb-3">No sessions generated for this month.</p>
                          <button
                            onClick={() => onGenerateFixedSessions(month)}
                            className="px-4 py-2 bg-[#7B5EA7] text-white text-[13px] rounded border border-[#7B5EA7] hover:bg-[#5A3E8A] transition-colors inline-flex items-center gap-2"
                          >
                            <Zap className="w-4 h-4" /> Generate Sessions
                          </button>
                        </div>
                      )}

                      {/* Cohort slot sessions */}
                      {slotSessions.length > 0 && (
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[#FAFAF9] border-b border-[#DDDBDA]">
                              {['Cohort', 'Date & Time', 'Status', 'Registered', 'Zoom Link', 'Actions'].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DDDBDA]">
                            {slotSessions.map(session => {
                              const slot = slots.find((sl: FixedSlot) => sl.id === session.slotId);
                              const regCount = registrations.filter(r => r.sessionId === session.id).length;
                              return (
                                <tr key={session.id} className="bg-white hover:bg-[#F3F2F2] transition-colors">
                                  <td className="px-3 py-3">
                                    <div>
                                      <span className="text-[12px] font-bold text-[#706E6B]">
                                        {slot?.label ?? 'Cohort'}
                                      </span>
                                      {slot && (
                                        <p className="text-[11px] text-[#706E6B]">
                                          {DAY_FULL[slot.dayOfWeek]} {formatSlotTime(slot.hour, slot.minute)}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">
                                    <p className="text-[13px] text-[#080707]">{format(session.date, 'EEE, MMM d, yyyy')}</p>
                                    <p className="text-[11px] text-[#706E6B]">{format(session.date, 'h:mm a')}</p>
                                  </td>
                                  <td className="px-3 py-3">{statusPill(session.status)}</td>
                                  <td className="px-3 py-3 text-[13px] text-[#0176D3] text-center">{regCount}</td>
                                  <td className="px-3 py-3">
                                    <a href={session.zoomLink} target="_blank" rel="noopener noreferrer"
                                      className="text-[11px] text-[#0176D3] hover:underline truncate block max-w-[160px]"
                                    >
                                      {session.zoomLink}
                                    </a>
                                  </td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                      {(session.status === 'scheduled' || session.status === 'invitations_sent') && (
                                        <>
                                          <button onClick={() => onStartSession(session.id)}
                                            className="px-2.5 py-1 bg-[#0176D3] text-white text-[11px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1"
                                          >
                                            <Video className="w-3 h-3" /> Start
                                          </button>
                                          <button onClick={() => onCompleteSession(session.id)}
                                            className="px-2.5 py-1 bg-white text-[#2E844A] text-[11px] rounded border border-[#2E844A] hover:bg-[#E7F6EC] transition-colors flex items-center gap-1"
                                          >
                                            <CheckCircle className="w-3 h-3" /> Complete
                                          </button>
                                        </>
                                      )}
                                      {session.status === 'completed' && (
                                        <button onClick={() => onSyncAttendance(session.id)}
                                          className="px-2.5 py-1 bg-white text-[#0176D3] text-[11px] rounded border border-[#0176D3] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5"
                                        >
                                          <Wifi className="w-3 h-3" /> Sync from Zoom
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {/* Makeup session */}
                      {makeupSession && (
                        <div className="border border-[#DDDBDA] rounded bg-[#FAFAF9]">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDDBDA]">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold text-[#706E6B]">Makeup Session</span>
                              <span className="text-[11px] text-[#706E6B]">
                                {format(makeupSession.date, 'EEE, MMM d')} · {format(makeupSession.date, 'h:mm a')}
                              </span>
                              {statusPill(makeupSession.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              {(makeupSession.status === 'scheduled' || makeupSession.status === 'invitations_sent') && (
                                <>
                                  <button
                                    onClick={() => setMakeupPanelOpen(prev => ({ ...prev, [month]: !isPanelOpen }))}
                                    className="px-2.5 py-1 bg-[#FE9339] text-white text-[11px] rounded border border-[#FE9339] hover:bg-[#DD7A01] transition-colors flex items-center gap-1.5"
                                  >
                                    <UserPlus className="w-3 h-3" /> Invite No-Shows
                                  </button>
                                  <button onClick={() => onStartSession(makeupSession.id)}
                                    className="px-2.5 py-1 bg-[#0176D3] text-white text-[11px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1"
                                  >
                                    <Video className="w-3 h-3" /> Start
                                  </button>
                                  <button onClick={() => onCompleteSession(makeupSession.id)}
                                    className="px-2.5 py-1 bg-white text-[#2E844A] text-[11px] rounded border border-[#2E844A] hover:bg-[#E7F6EC] transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Complete
                                  </button>
                                </>
                              )}
                              {makeupSession.status === 'completed' && (
                                <button onClick={() => onSyncAttendance(makeupSession.id)}
                                  className="px-2.5 py-1 bg-white text-[#0176D3] text-[11px] rounded border border-[#0176D3] hover:bg-[#EEF4FF] transition-colors flex items-center gap-1.5"
                                >
                                  <Wifi className="w-3 h-3" /> Sync from Zoom
                                </button>
                              )}
                            </div>
                          </div>

                          {/* No-show invite panel */}
                          {isPanelOpen && (
                            <div className="px-4 py-3">
                              {noShowsForMonth.length === 0 ? (
                                <p className="text-[12px] text-[#706E6B]">No unregistered no-shows found for this month.</p>
                              ) : (
                                <>
                                  <p className="text-[12px] font-bold text-[#080707] mb-2">
                                    Pros who no-showed their cohort session — invite to makeup:
                                  </p>
                                  <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                                    {noShowsForMonth.map(pro => (
                                      <label key={pro.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedSet.has(pro.id)}
                                          onChange={() => toggleMakeupCheck(pro.id)}
                                          className="w-3.5 h-3.5 text-[#0176D3]"
                                        />
                                        <span className="text-[12px] text-[#080707]">{pro.name}</span>
                                        <span className="text-[11px] text-[#706E6B]">{pro.email}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <button
                                    onClick={sendMakeupInvites}
                                    disabled={selectedSet.size === 0}
                                    className="px-3 py-1.5 bg-[#0176D3] text-white text-[12px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Send Makeup Invite ({selectedSet.size} selected)
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fixed Members Tab ─────────────────────────────────────────────────────────

function FixedMembersTab({
  group,
  members,
  sessions,
  registrations,
  onManageMembers,
  onSelectPro,
}: {
  group: MastermindGroup;
  members: Pro[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  onManageMembers: () => void;
  onSelectPro: (pro: Pro) => void;
}) {
  const slots = group.fixedSlots ?? [];
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set(slots.map(s => s.id)));

  const toggleSlot = (id: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Latest month for attendance display
  const latestMonth = [...new Set(sessions.map(s => s.month))].sort().reverse()[0] ?? null;

  const getMemberAttendance = (proId: string, slotId: string) => {
    if (!latestMonth) return null;
    const slotSession = sessions.find(s => s.month === latestMonth && s.slotId === slotId);
    if (!slotSession) return null;
    return registrations.find(r => r.sessionId === slotSession.id && r.proId === proId) ?? null;
  };

  return (
    <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
      <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
            <Users className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-[13px] font-bold text-[#080707]">
            Group Members <span className="text-[#706E6B] font-normal">({members.length})</span>
          </h3>
          <span className="text-[11px] text-[#706E6B]">· Assigned to Cohorts</span>
        </div>
        <button
          onClick={onManageMembers}
          className="px-3 py-1.5 bg-[#0176D3] text-white text-[12px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" /> Manage Members
        </button>
      </div>

      <div className="divide-y divide-[#DDDBDA]">
        {slots.map((slot: FixedSlot) => {
          const cohortMembers = members.filter(m => slot.memberIds.includes(m.id));
          const isExpanded    = expandedSlots.has(slot.id);

          return (
            <div key={slot.id}>
              {/* Cohort header */}
              <div
                className="px-4 py-3 bg-[#FAFAF9] flex items-center gap-3 cursor-pointer hover:bg-[#F3F2F2] transition-colors"
                onClick={() => toggleSlot(slot.id)}
              >
                <ChevronDown className={`w-4 h-4 text-[#706E6B] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                <span className="text-[13px] font-bold text-[#080707]">{slot.label}</span>
                <span className="text-[11px] text-[#706E6B]">
                  {DAY_FULL[slot.dayOfWeek]} · {formatSlotTime(slot.hour, slot.minute)}
                </span>
                <span className="text-[11px] text-[#706E6B]">· {cohortMembers.length} members</span>
              </div>

              {isExpanded && cohortMembers.length > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-[#DDDBDA]">
                      <th className="w-10 px-4 py-2.5">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded" />
                      </th>
                      {['Name', 'Email', 'Phone', `${latestMonth ? format(parseISO(latestMonth + '-02'), 'MMM yyyy') : 'Latest'} Attendance`, 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDDBDA]">
                    {cohortMembers.map(member => {
                      const reg = getMemberAttendance(member.id, slot.id);
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
                                onClick={() => onSelectPro(member)}
                                className="text-[13px] text-[#0176D3] hover:underline cursor-pointer text-left"
                              >
                                {member.name}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-[#080707]">{member.email}</td>
                          <td className="px-4 py-3 text-[13px] text-[#080707]">{member.phone}</td>
                          <td className="px-4 py-3">
                            {reg ? (
                              <div className="flex items-center gap-2">
                                {reg.attended === true  && <span className="text-[10px] bg-[#E7F6EC] text-[#1C6E42] px-1.5 py-0.5 rounded-full">Attended</span>}
                                {reg.attended === false && <span className="text-[10px] bg-[#FCE3E3] text-[#C23934] px-1.5 py-0.5 rounded-full">No-Show</span>}
                                {reg.attended === null  && <span className="text-[10px] bg-[#F3F2F2] text-[#706E6B] px-1.5 py-0.5 rounded-full">Pending</span>}
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

              {isExpanded && cohortMembers.length === 0 && (
                <div className="px-4 py-6 text-center text-[#706E6B] text-[12px]">
                  No members assigned to this cohort. Use Manage Members to assign pros.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
  onGenerateFixedSessions,
  onInviteToMakeup,
}: Props) {
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'members'>('sessions');
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(group.name); }, [group.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== group.name) onUpdateGroup(group.id, { name: trimmed });
    else setNameValue(group.name);
    setEditingName(false);
  };

  const cancelEdit = () => { setNameValue(group.name); setEditingName(false); };

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
      label:    format(parseISO(month + '-02'), 'MMMM yyyy'),
      sessions: sessions.filter(s => s.month === month).sort((a, b) => a.sessionNumber - b.sessionNumber),
    }));

  const getRegCount      = (sessionId: string) => registrations.filter(r => r.sessionId === sessionId).length;
  const getMonthRegCount = (month: string) => {
    const ids = sessions.filter(s => s.month === month).map(s => s.id);
    return registrations.filter(r => ids.includes(r.sessionId)).length;
  };

  const latestMonth        = monthGroups[0]?.month ?? null;
  const totalRegistrations = registrations.length;

  const typeBadge = group.type === 'flexible'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#EEF4FF] text-[#014486]">Flexible</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#F3F2F2] text-[#706E6B]">Fixed</span>;

  const highlights = [
    { label: 'Status', value: <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${group.status === 'active' ? 'bg-[#2E844A]' : 'bg-[#706E6B]'}`} />{group.status === 'active' ? 'Active' : 'Inactive'}</span> },
    { label: 'Type',   value: typeBadge },
    { label: 'Coach',  value: coach.name },
    { label: 'Members', value: members.length },
    { label: 'Current Month', value: latestMonth ? format(parseISO(latestMonth + '-02'), 'MMM yyyy') : '—' },
    { label: 'Registrations', value: totalRegistrations },
    { label: 'Sessions', value: sessions.length },
  ];

  const TABS = [
    { id: 'details',  label: 'Details' },
    { id: 'sessions', label: `Sessions (${monthGroups.length} months)` },
    { id: 'members',  label: `Members (${members.length})` },
  ] as const;

  return (
    <div className="min-h-full bg-[#F3F2F2]">
      {/* ── Record Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA]">
        {/* Breadcrumb */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[12px]">
          <button onClick={onBackToList} className="text-[#0176D3] hover:underline">Mastermind Groups</button>
          <ChevronRight className="w-3 h-3 text-[#C9C7C5]" />
          <span className="text-[#706E6B]">{group.name}</span>
        </div>

        {/* Record title row */}
        <div className="px-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
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
            <button onClick={() => setEditingName(true)}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >Edit</button>
            {group.type === 'flexible' && (
              <button onClick={onCreateSessions}
                className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Sessions
              </button>
            )}
            <button onClick={onManageMembers}
              className="px-3 py-1.5 bg-white text-[#080707] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Manage Members
            </button>
            <button onClick={() => setEmailModalOpen(true)}
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
                    <Field label="Group Name"    value={group.name} />
                    <Field label="Status"        value={group.status === 'active' ? 'Active' : 'Inactive'} />
                    <Field label="Type"          value={group.type === 'flexible' ? 'Flexible' : 'Fixed'} />
                    <Field label="Total Members" value={members.length} />
                    <Field label="Created Date"  value={format(group.createdDate, 'M/d/yyyy')} />
                  </div>
                  <div>
                    <Field label="Coach"          value={coach.name} link />
                    <Field label="Coach Email"    value={coach.email} link />
                    <Field label="Total Sessions" value={sessions.length} />
                    <Field label="Current Month"  value={latestMonth ? format(parseISO(latestMonth + '-02'), 'MMMM yyyy') : '—'} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#2E844A] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#080707]">Salesforce Object Mapping</h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-[#DDDBDA]">
                    <Field label="Parent Object"  value="Mastermind__c" />
                    <Field label="Session Object" value="Mastermind_Session__c" />
                  </div>
                  <div>
                    <Field label="Member Object"       value="Mastermind_Group_Member__c" />
                    <Field label="Registration Object" value="Session_Registration__c" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
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

              <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
                <div className="px-4 py-3 border-b border-[#DDDBDA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#0176D3] flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#080707]">Members ({members.length})</h3>
                  </div>
                  <button onClick={onManageMembers} className="text-[11px] text-[#0176D3] hover:underline">Manage</button>
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
          group.type === 'fixed' ? (
            <FixedSessionsTab
              group={group}
              sessions={sessions}
              registrations={registrations}
              members={members}
              onGenerateFixedSessions={onGenerateFixedSessions}
              onInviteToMakeup={onInviteToMakeup}
              onStartSession={onStartSession}
              onCompleteSession={onCompleteSession}
              onSyncAttendance={onSyncAttendance}
            />
          ) : (
            <div className="space-y-4">
              {/* Flexible sessions — original layout */}
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
                    <Plus className="w-3.5 h-3.5" /> New Sessions
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
                      const regCount   = getMonthRegCount(month);
                      const invSent    = mSessions.some(s => s.status === 'invitations_sent' || s.status === 'completed');
                      const canSend    = mSessions.some(s => s.status === 'scheduled');
                      const allDone    = mSessions.every(s => s.status === 'completed');

                      return (
                        <div key={month} className="border-t border-[#DDDBDA]">
                          <div
                            className="px-4 py-3 bg-[#FAFAF9] flex items-center justify-between cursor-pointer hover:bg-[#F3F2F2] transition-colors"
                            onClick={() => toggleMonth(month)}
                          >
                            <div className="flex items-center gap-3">
                              <ChevronDown className={`w-4 h-4 text-[#706E6B] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                              <span className="text-[13px] font-bold text-[#080707]">{label}</span>
                              {allDone && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E7F6EC] text-[#1C6E42]">Completed</span>}
                              {invSent && !allDone && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3E2] text-[#7A4F00]">Invites Sent</span>}
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
                                {mSessions.map((session) => (
                                  <tr key={session.id} className="bg-white hover:bg-[#F3F2F2] transition-colors">
                                    <td className="px-4 py-3">
                                      <span className="text-[12px] font-bold text-[#706E6B]">
                                        {getSessionLabel(session.sessionNumber)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="text-[13px] text-[#080707]">{format(session.date, 'EEE, MMM d, yyyy')}</p>
                                      <p className="text-[11px] text-[#706E6B]">{format(session.date, 'h:mm a')}</p>
                                    </td>
                                    <td className="px-4 py-3">{statusPill(session.status)}</td>
                                    <td className="px-4 py-3 text-[13px] text-[#080707] text-center">
                                      <span className="text-[#0176D3]">{getRegCount(session.id)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <a href={session.zoomLink} target="_blank" rel="noopener noreferrer"
                                        className="text-[11px] text-[#0176D3] hover:underline truncate block max-w-[160px]"
                                      >
                                        {session.zoomLink}
                                      </a>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {(session.status === 'scheduled' || session.status === 'invitations_sent') && (
                                          <>
                                            <button onClick={() => onStartSession(session.id)}
                                              className="px-2.5 py-1 bg-[#0176D3] text-white text-[11px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1"
                                            >
                                              <Video className="w-3 h-3" /> Start
                                            </button>
                                            <button onClick={() => onCompleteSession(session.id)}
                                              className="px-2.5 py-1 bg-white text-[#2E844A] text-[11px] rounded border border-[#2E844A] hover:bg-[#E7F6EC] transition-colors flex items-center gap-1"
                                            >
                                              <CheckCircle className="w-3 h-3" /> Complete
                                            </button>
                                          </>
                                        )}
                                        {session.status === 'completed' && (
                                          <button onClick={() => onSyncAttendance(session.id)}
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
          )
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          group.type === 'fixed' ? (
            <FixedMembersTab
              group={group}
              members={members}
              sessions={sessions}
              registrations={registrations}
              onManageMembers={onManageMembers}
              onSelectPro={(pro) => setSelectedPro(pro)}
            />
          ) : (
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
                  <button onClick={onManageMembers}
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
                      const latestMo    = [...new Set(sessions.map(s => s.month))].sort().reverse()[0];
                      const latestIds   = sessions.filter(s => s.month === latestMo).map(s => s.id);
                      const memberReg   = registrations.find(r => r.proId === member.id && latestIds.includes(r.sessionId));
                      const regSession  = memberReg ? sessions.find(s => s.id === memberReg.sessionId) : null;

                      return (
                        <tr key={member.id} className="bg-white hover:bg-[#F3F2F2] transition-colors group">
                          <td className="px-4 py-3"><input type="checkbox" className="w-3.5 h-3.5 rounded" /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-[#EEF4FF] border border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] text-[#0176D3] font-bold">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <button onClick={() => setSelectedPro(member)}
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
                                  {getSessionLabel(regSession.sessionNumber)} · {format(regSession.date, 'MMM d')}
                                </span>
                                {memberReg.attended === true  && <span className="text-[10px] bg-[#E7F6EC] text-[#1C6E42] px-1.5 py-0.5 rounded-full">Attended</span>}
                                {memberReg.attended === false && <span className="text-[10px] bg-[#FCE3E3] text-[#C23934] px-1.5 py-0.5 rounded-full">No-Show</span>}
                                {memberReg.attended === null  && <span className="text-[10px] bg-[#F3F2F2] text-[#706E6B] px-1.5 py-0.5 rounded-full">Pending</span>}
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
          )
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
