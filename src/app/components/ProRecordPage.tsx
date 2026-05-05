import { useState } from 'react';
import { Check, X, Minus, Mail, Phone, User, ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Pro, MastermindGroup, Coach, MastermindSession, SessionRegistration } from '../App';

type Props = {
  pro: Pro;
  allSessions: MastermindSession[];
  allRegistrations: SessionRegistration[];
  allGroups: MastermindGroup[];
  allCoaches: Coach[];
};

type Tab = 'details' | 'history';

function getSessionLabel(session: MastermindSession): string {
  if (session.sessionType === 'makeup') return 'Makeup';
  if (session.sessionType === 'fixed_slot') return 'Monthly Session';
  const labels = ['Option A', 'Option B', 'Option C'];
  return labels[session.sessionNumber - 1] ?? `Session ${session.sessionNumber}`;
}

export function ProRecordPage({ pro, allSessions, allRegistrations, allGroups, allCoaches }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // All registrations for this pro across all groups
  const proRegs = allRegistrations
    .filter(r => r.proId === pro.id)
    .sort((a, b) => {
      const sA = allSessions.find(s => s.id === a.sessionId);
      const sB = allSessions.find(s => s.id === b.sessionId);
      return (sB?.date.getTime() ?? 0) - (sA?.date.getTime() ?? 0);
    });

  const totalAttended  = proRegs.filter(r => r.attended === true).length;
  const totalRegs      = proRegs.length;
  const attRate        = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : null;
  const distinctGroups = new Set(proRegs.map(r => r.groupId)).size;

  // Primary group membership (first group the pro belongs to)
  const primaryGroup  = allGroups.find(g => g.memberIds.includes(pro.id));
  const primaryCoach  = primaryGroup ? allCoaches.find(c => c.id === primaryGroup.coachId) : null;

  // Initials
  const initials = pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'history', label: `Mastermind History (${totalRegs})` },
  ];

  return (
    <div className="min-h-full bg-[#F3F2F2]">

      {/* ── Record Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA]">

        {/* Breadcrumb */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[12px]">
          <span className="text-[#0176D3]">Contacts</span>
          <ChevronRight className="w-3 h-3 text-[#C9C7C5]" />
          <span className="text-[#706E6B]">{pro.name}</span>
        </div>

        {/* Avatar + title + name + actions */}
        <div className="px-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-[#EEF4FF] border-2 border-[#DDDBDA] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0176D3] text-[14px] font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-[11px] text-[#706E6B] mb-0.5">Contact</p>
              <h1 className="text-[22px] font-normal text-[#080707] leading-tight">{pro.name}</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            <button className="px-3 py-1.5 bg-white text-[#080707] text-[13px] rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Send Email
            </button>
            <button className="px-3 py-1.5 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors">
              Edit
            </button>
          </div>
        </div>

        {/* Key fields strip */}
        <div className="border-t border-[#DDDBDA]">
          <div className="flex divide-x divide-[#DDDBDA]">
            {[
              { label: 'Coach',     value: primaryCoach?.name ?? '—' },
              { label: 'Groups',    value: distinctGroups || '—' },
              { label: 'Sessions',  value: totalRegs || '—' },
              { label: 'Attended',  value: totalAttended },
              { label: 'Att. Rate', value: attRate !== null ? `${attRate}%` : '—' },
            ].map(f => (
              <div key={f.label} className="px-4 py-2.5 flex-1">
                <p className="text-[11px] text-[#706E6B]">{f.label}</p>
                <p className="text-[13px] text-[#080707]">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex border-t border-[#DDDBDA] px-4 bg-white">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors border-b-2 ${
                activeTab === t.id
                  ? 'border-[#0176D3] text-[#0176D3] font-semibold'
                  : 'border-transparent text-[#706E6B] hover:text-[#080707]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="p-4 space-y-4">

        {/* ── DETAILS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Contact Information */}
            <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center gap-2 bg-[#FAFAF9]">
                <User className="w-4 h-4 text-[#0176D3]" />
                <h2 className="text-[12px] font-bold text-[#080707]">Contact Information</h2>
              </div>
              <div className="divide-y divide-[#DDDBDA]">
                {[
                  { label: 'Name',  value: pro.name },
                  { label: 'Email', value: pro.email, link: true },
                  { label: 'Phone', value: pro.phone },
                ].map(row => (
                  <div key={row.label} className="px-4 py-2.5 grid grid-cols-2 gap-4">
                    <span className="text-[12px] text-[#706E6B]">{row.label}</span>
                    {row.link ? (
                      <a href={`mailto:${row.value}`} className="text-[12px] text-[#0176D3] hover:underline">
                        {row.value}
                      </a>
                    ) : (
                      <span className="text-[12px] text-[#080707]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mastermind Overview */}
            <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center gap-2 bg-[#FAFAF9]">
                <Calendar className="w-4 h-4 text-[#0176D3]" />
                <h2 className="text-[12px] font-bold text-[#080707]">Mastermind Overview</h2>
              </div>
              <div className="divide-y divide-[#DDDBDA]">
                {[
                  { label: 'Coach',             value: primaryCoach?.name ?? '—' },
                  { label: 'Primary Group',      value: primaryGroup?.name ?? '—' },
                  { label: 'Sessions Registered',value: String(totalRegs) },
                  { label: 'Sessions Attended',  value: String(totalAttended) },
                  { label: 'Attendance Rate',    value: attRate !== null ? `${attRate}%` : '—' },
                ].map(row => (
                  <div key={row.label} className="px-4 py-2.5 grid grid-cols-2 gap-4">
                    <span className="text-[12px] text-[#706E6B]">{row.label}</span>
                    <span className="text-[12px] text-[#080707]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── MASTERMIND HISTORY TAB ───────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm overflow-hidden">
            {/* Related list header */}
            <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#2E844A]" />
                <h2 className="text-[12px] font-bold text-[#080707]">
                  Mastermind Attendance
                  <span className="text-[#706E6B] font-normal ml-1">({totalRegs})</span>
                </h2>
              </div>
              <span className="text-[10px] text-[#706E6B] italic bg-[#F3F2F2] px-2 py-0.5 rounded">
                Session_Registration__c · auto-synced via Zoom
              </span>
            </div>

            {proRegs.length === 0 ? (
              <div className="py-12 text-center text-[#706E6B] text-[13px]">
                No sessions registered yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#DDDBDA]">
                        {['Month', 'Group', 'Session', 'Date & Time', 'Status', 'Attended'].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide whitespace-nowrap bg-[#FAFAF9]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDDBDA]">
                      {proRegs.map(reg => {
                        const session  = allSessions.find(s => s.id === reg.sessionId);
                        if (!session) return null;
                        const regGroup = allGroups.find(g => g.id === reg.groupId);
                        const optLabel = getSessionLabel(session);
                        return (
                          <tr key={reg.id} className="hover:bg-[#F3F2F2] transition-colors">
                            <td className="px-4 py-2.5 text-[12px] text-[#080707] whitespace-nowrap">
                              {format(parseISO(session.month + '-02'), 'MMM yyyy')}
                            </td>
                            <td className="px-4 py-2.5 text-[12px] text-[#706E6B] max-w-[180px]">
                              <span className="truncate block" title={regGroup?.name}>{regGroup?.name ?? '—'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-[12px] text-[#706E6B] whitespace-nowrap">{optLabel}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <p className="text-[12px] text-[#080707]">{format(session.date, 'MMM d, yyyy')}</p>
                              <p className="text-[11px] text-[#706E6B]">{format(session.date, 'h:mm a')}</p>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {session.status === 'completed' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#E7F6EC] text-[#1C6E42]">Completed</span>
                              ) : session.status === 'invitations_sent' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3E2] text-[#7A4F00]">Invites Sent</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#EEF4FF] text-[#014486]">Scheduled</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
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
                </div>

                {/* SF field mapping note */}
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
                    {' — auto-populated when Zoom meeting ends. Coaches may manually override.'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
