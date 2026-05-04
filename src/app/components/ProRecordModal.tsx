import { X, Mail, Phone, User, Check, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Pro, MastermindGroup, Coach, MastermindSession, SessionRegistration } from '../App';

type Props = {
  pro: Pro;
  group: MastermindGroup;
  coach: Coach;
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  onClose: () => void;
};

const SESSION_LABELS = ['Option A', 'Option B', 'Option C'] as const;

export function ProRecordModal({ pro, group, coach, sessions, registrations, onClose }: Props) {
  // All registrations for this pro, sorted newest first
  const proRegs = registrations
    .filter(r => r.proId === pro.id)
    .sort((a, b) => {
      const sA = sessions.find(s => s.id === a.sessionId);
      const sB = sessions.find(s => s.id === b.sessionId);
      return (sB?.date.getTime() ?? 0) - (sA?.date.getTime() ?? 0);
    });

  const totalAttended = proRegs.filter(r => r.attended === true).length;
  const totalRegs     = proRegs.length;
  const attRate       = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : null;

  // Group regs by month
  const months = [...new Set(proRegs.map(r => {
    const s = sessions.find(se => se.id === r.sessionId);
    return s?.month ?? '';
  }).filter(Boolean))].sort().reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* ── SF-style record header ───────────────────────────────────────── */}
        <div className="bg-white border-b border-[#DDDBDA] flex-shrink-0">
          {/* Breadcrumb */}
          <div className="px-5 pt-3 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[#706E6B]">
              <span className="text-[#0176D3] hover:underline cursor-pointer">Mastermind Groups</span>
              <span>›</span>
              <span className="text-[#0176D3] hover:underline cursor-pointer">{group.name}</span>
              <span>›</span>
              <span>Contact Record</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#F3F2F2] text-[#706E6B] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title row */}
          <div className="px-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF4FF] border border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
                <span className="text-[#0176D3] text-[13px] font-bold">
                  {pro.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-[#706E6B] mb-0.5">Contact</p>
                <h2 className="text-[18px] font-normal text-[#080707]">{pro.name}</h2>
              </div>
            </div>
          </div>

          {/* Key fields strip */}
          <div className="border-t border-[#DDDBDA]">
            <div className="flex items-center px-5 py-1 bg-[#FAFAF9]">
              <span className="text-[11px] font-bold text-[#080707] uppercase tracking-wide">Key Fields</span>
            </div>
            <div className="flex divide-x divide-[#DDDBDA]">
              {[
                { label: 'Coach',       value: coach.name },
                { label: 'Sessions',    value: totalRegs },
                { label: 'Attended',    value: totalAttended },
                { label: 'Att. Rate',   value: attRate !== null ? `${attRate}%` : '—' },
              ].map(f => (
                <div key={f.label} className="px-4 py-2.5 flex-1">
                  <p className="text-[11px] text-[#706E6B]">{f.label}</p>
                  <p className="text-[13px] text-[#080707] font-normal">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Contact info */}
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
            <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0176D3]" />
              <h3 className="text-[12px] font-bold text-[#080707]">Contact Information</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#DDDBDA]">
              <div className="px-4 py-3 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#706E6B] flex-shrink-0" />
                <span className="text-[12px] text-[#0176D3] hover:underline cursor-pointer">{pro.email}</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#706E6B] flex-shrink-0" />
                <span className="text-[12px] text-[#080707]">{pro.phone}</span>
              </div>
            </div>
          </div>

          {/* Mastermind attendance — the SF related list */}
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#2E844A]" />
                <h3 className="text-[12px] font-bold text-[#080707]">
                  Mastermind Attendance
                  <span className="text-[#706E6B] font-normal ml-1">({totalRegs})</span>
                </h3>
              </div>
              <span className="text-[10px] text-[#706E6B] italic bg-[#F3F2F2] px-2 py-0.5 rounded">
                Session_Registration__c · auto-updated via Zoom
              </span>
            </div>

            {proRegs.length === 0 ? (
              <div className="py-8 text-center text-[#706E6B] text-[13px]">
                No sessions registered yet.
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#DDDBDA]">
                      {['Month', 'Session', 'Date & Time', 'Status', 'Attended'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDDBDA]">
                    {proRegs.map(reg => {
                      const session = sessions.find(s => s.id === reg.sessionId);
                      if (!session) return null;
                      const optLabel = SESSION_LABELS[session.sessionNumber - 1];
                      return (
                        <tr key={reg.id} className="hover:bg-[#F3F2F2] transition-colors">
                          <td className="px-4 py-2.5 text-[12px] text-[#080707]">
                            {format(parseISO(session.month + '-02'), 'MMMM yyyy')}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] text-[#706E6B]">{optLabel}</td>
                          <td className="px-4 py-2.5">
                            <p className="text-[12px] text-[#080707]">{format(session.date, 'MMM d, yyyy')}</p>
                            <p className="text-[11px] text-[#706E6B]">{format(session.date, 'h:mm a')}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            {session.status === 'completed' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#E7F6EC] text-[#1C6E42]">Completed</span>
                            ) : session.status === 'invitations_sent' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3E2] text-[#7A4F00]">Invites Sent</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#EEF4FF] text-[#014486]">Scheduled</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {reg.attended === true  && (
                              <span className="inline-flex items-center gap-1 text-[12px] text-[#1C6E42] font-bold">
                                <Check className="w-3.5 h-3.5" /> Yes
                              </span>
                            )}
                            {reg.attended === false && (
                              <span className="inline-flex items-center gap-1 text-[12px] text-[#C23934]">
                                <X className="w-3.5 h-3.5" /> No-Show
                              </span>
                            )}
                            {reg.attended === null  && (
                              <span className="inline-flex items-center gap-1 text-[12px] text-[#C9C7C5]">
                                <Minus className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Salesforce field mapping note */}
                <div className="px-4 py-3 bg-[#F3F2F2] border-t border-[#DDDBDA]">
                  <p className="text-[11px] text-[#706E6B]">
                    <span className="font-bold text-[#080707]">Salesforce fields: </span>
                    <code className="bg-white px-1 rounded border border-[#DDDBDA]">Mastermind_Month__c</code>
                    {' · '}
                    <code className="bg-white px-1 rounded border border-[#DDDBDA]">Session_Option__c</code>
                    {' · '}
                    <code className="bg-white px-1 rounded border border-[#DDDBDA]">Attended__c</code>
                    {' · '}
                    <code className="bg-white px-1 rounded border border-[#DDDBDA]">Zoom_Join_Time__c</code>
                    {' — populated automatically when Zoom meeting ends.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
