import { useState } from 'react';
import {
  X, Mail, Video, CheckCircle, XCircle, Users, Send, Check, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import type { MastermindGroup, MastermindSession, SessionRegistration, Pro } from '../App';

type RegistrationsModalProps = {
  group: MastermindGroup;
  month: string;
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  members: Pro[];
  onClose: () => void;
  onSendInvitations: (groupId: string, month: string) => void;
  onRegisterPro: (sessionId: string, groupId: string, proId: string, month: string) => void;
  onMarkAttendance: (registrationId: string, attended: boolean) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
};

const SESSION_LABELS = ['Option A', 'Option B', 'Option C'] as const;

function statusPill(status: MastermindSession['status']) {
  const map: Record<string, { cls: string; label: string }> = {
    scheduled: { cls: 'bg-[#EEF4FF] text-[#014486]', label: 'Scheduled' },
    invitations_sent: { cls: 'bg-[#FEF3E2] text-[#7A4F00]', label: 'Invites Sent' },
    completed: { cls: 'bg-[#E7F6EC] text-[#1C6E42]', label: 'Completed' },
    cancelled: { cls: 'bg-[#F3F2F2] text-[#706E6B]', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? map.scheduled;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] ${cls}`}>{label}</span>;
}

export function RegistrationsModal({
  group,
  month,
  sessions,
  registrations,
  members,
  onClose,
  onSendInvitations,
  onRegisterPro,
  onMarkAttendance,
  onStartSession,
  onCompleteSession,
}: RegistrationsModalProps) {
  const [inviteSent, setInviteSent] = useState(false);

  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const canSend = sessions.some(s => s.status === 'scheduled');
  const allSent = sessions.every(s => s.status !== 'scheduled');

  const monthLabel = format(new Date(month + '-02'), 'MMMM yyyy');

  const handleSendInvitations = () => {
    onSendInvitations(group.id, month);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  // Look up a member's registration for this month (one per member per month)
  const getMemberReg = (proId: string): SessionRegistration | undefined => {
    const monthSessionIds = sessions.map(s => s.id);
    return registrations.find(r => r.proId === proId && monthSessionIds.includes(r.sessionId));
  };

  const totalRegistered = new Set(registrations.map(r => r.proId)).size;
  const totalAttended = registrations.filter(r => r.attended === true).length;
  const totalNoShow = registrations.filter(r => r.attended === false).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto border border-[#DDDBDA] flex flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="sticky top-0 bg-[#032D60] px-6 py-4 flex items-start justify-between rounded-t z-10">
          <div>
            <h2 className="text-[16px] font-normal text-white">
              Registrations &amp; Attendance
            </h2>
            <p className="text-[13px] text-[#A8C8F8] mt-0.5">
              {group.name} &mdash; {monthLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canSend && (
              <button
                onClick={handleSendInvitations}
                className="px-3 py-2 bg-[#FE9339] text-white text-[13px] font-normal rounded border border-[#FE9339] hover:bg-[#DD7A01] transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Invitations to {members.length} Members
              </button>
            )}
            {allSent && (
              <span className="px-3 py-2 bg-[#FEF3E2] text-[#7A4F00] text-[12px] rounded border border-[#FE9339] flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                Invitations Sent
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ── Invite Sent Banner ──────────────────────────────── */}
        {inviteSent && (
          <div className="bg-[#2E844A] text-white px-6 py-3 flex items-center gap-2 text-[13px]">
            <Send className="w-4 h-4" />
            Invitation email sent to {members.length} members with all 3 session options. Pros will
            click a link to register for their preferred session.
          </div>
        )}

        {/* ── Stats Row ───────────────────────────────────────── */}
        <div className="px-6 py-3 border-b border-[#DDDBDA] bg-[#FAFAF9] grid grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length, color: 'text-[#080707]' },
            { label: 'Registered', value: totalRegistered, color: 'text-[#0176D3]' },
            { label: 'Attended', value: totalAttended, color: 'text-[#2E844A]' },
            { label: 'No-Show', value: totalNoShow, color: 'text-[#C23934]' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`text-[22px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-[#706E6B]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Session Cards ───────────────────────────────────── */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-[#DDDBDA]">
          {sortedSessions.map((session, idx) => {
            const regCount = registrations.filter(r => r.sessionId === session.id).length;
            return (
              <div key={session.id} className="border border-[#DDDBDA] rounded p-3 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                    {SESSION_LABELS[idx]}
                  </span>
                  {statusPill(session.status)}
                </div>
                <p className="text-[13px] font-bold text-[#080707]">
                  {format(session.date, 'EEE, MMM d, yyyy')}
                </p>
                <p className="text-[12px] text-[#706E6B] mb-2">{format(session.date, 'h:mm a')}</p>
                <div className="flex items-center gap-1 mb-3">
                  <Users className="w-3.5 h-3.5 text-[#706E6B]" />
                  <span className="text-[12px] text-[#706E6B]">{regCount} registered</span>
                </div>
                {(session.status === 'scheduled' || session.status === 'invitations_sent') && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => onStartSession(session.id)}
                      className="w-full py-1.5 bg-[#0176D3] text-white text-[11px] rounded flex items-center justify-center gap-1 hover:bg-[#014486] transition-colors"
                    >
                      <Video className="w-3 h-3" /> Start Meeting
                    </button>
                    <button
                      onClick={() => onCompleteSession(session.id)}
                      className="w-full py-1.5 bg-[#2E844A] text-white text-[11px] rounded flex items-center justify-center gap-1 hover:bg-[#1C6E42] transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Complete
                    </button>
                  </div>
                )}
                {session.status === 'completed' && (
                  <p className="text-[11px] text-[#2E844A] text-center">✓ Completed</p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Member Registration Table ───────────────────────── */}
        <div className="px-6 py-4">
          <h3 className="text-[12px] font-bold text-[#080707] uppercase tracking-wide mb-3">
            Member Registrations
          </h3>
          <p className="text-[12px] text-[#706E6B] mb-4">
            Select which session option each member has registered for. This simulates the pro clicking
            their preferred option from the invitation email.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#DDDBDA]">
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide w-44">
                    Member
                  </th>
                  {sortedSessions.map((session, idx) => (
                    <th
                      key={session.id}
                      className="text-center px-3 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide"
                    >
                      <div>{SESSION_LABELS[idx]}</div>
                      <div className="text-[10px] font-normal text-[#706E6B] normal-case tracking-normal">
                        {format(session.date, 'MMM d · h:mm a')}
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDBDA]">
                {members.map(member => {
                  const memberReg = getMemberReg(member.id);
                  const registeredSession = memberReg
                    ? sessions.find(s => s.id === memberReg.sessionId)
                    : undefined;

                  return (
                    <tr key={member.id} className="hover:bg-[#F3F2F2] transition-colors">
                      {/* Member name */}
                      <td className="px-3 py-3">
                        <p className="text-[13px] font-bold text-[#080707]">{member.name}</p>
                        <p className="text-[11px] text-[#706E6B]">{member.email}</p>
                      </td>

                      {/* Session selection */}
                      {sortedSessions.map(session => {
                        const isSelected = memberReg?.sessionId === session.id;
                        return (
                          <td key={session.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() =>
                                onRegisterPro(session.id, group.id, member.id, month)
                              }
                              className={`w-8 h-8 rounded-full border-2 transition-colors mx-auto flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#0176D3] border-[#0176D3] text-white'
                                  : 'bg-white border-[#DDDBDA] text-[#DDDBDA] hover:border-[#0176D3] hover:text-[#0176D3]'
                              }`}
                              title={
                                isSelected
                                  ? 'Click to unregister'
                                  : `Register ${member.name} for this session`
                              }
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })}

                      {/* Attendance */}
                      <td className="px-3 py-3 text-center">
                        {!memberReg ? (
                          <span className="text-[11px] text-[#C9C7C5]">Not registered</span>
                        ) : registeredSession?.status !== 'completed' ? (
                          <span className="text-[11px] text-[#706E6B] flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        ) : memberReg.attended === null ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onMarkAttendance(memberReg.id, true)}
                              className="p-1 rounded border border-[#DDDBDA] hover:bg-[#E7F6EC] hover:border-[#2E844A] hover:text-[#2E844A] text-[#706E6B] transition-colors"
                              title="Mark Attended"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onMarkAttendance(memberReg.id, false)}
                              className="p-1 rounded border border-[#DDDBDA] hover:bg-[#FCE3E3] hover:border-[#C23934] hover:text-[#C23934] text-[#706E6B] transition-colors"
                              title="Mark No-Show"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : memberReg.attended ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] text-[#2E844A] flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Attended
                            </span>
                            <button
                              onClick={() => onMarkAttendance(memberReg.id, false)}
                              className="ml-1 p-0.5 text-[#C9C7C5] hover:text-[#C23934] transition-colors"
                              title="Change to No-Show"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] text-[#C23934] flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> No-Show
                            </span>
                            <button
                              onClick={() => onMarkAttendance(memberReg.id, true)}
                              className="ml-1 p-0.5 text-[#C9C7C5] hover:text-[#2E844A] transition-colors"
                              title="Change to Attended"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-[#DDDBDA] px-6 py-3 flex items-center justify-between">
          <p className="text-[12px] text-[#706E6B]">
            Registrations are logged as <strong>Session_Registration__c</strong> records in Salesforce.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#0176D3] text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#F3F2F2] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
