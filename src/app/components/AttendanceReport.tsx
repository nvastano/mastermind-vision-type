import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, MastermindSession, SessionRegistration } from '../App';

type Props = {
  groups: MastermindGroup[];
  coaches: Coach[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
};

function pct(num: number, den: number) {
  if (den === 0) return null;
  return Math.round((num / den) * 100);
}

function RateBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-[#C9C7C5] text-[12px]">—</span>;
  const cls =
    rate >= 90 ? 'text-[#1C6E42] bg-[#E7F6EC]' :
    rate >= 75 ? 'text-[#7A4F00] bg-[#FEF3E2]' :
                 'text-[#C23934] bg-[#FCE3E3]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {rate}%
    </span>
  );
}

export function AttendanceReport({ groups, coaches, sessions, registrations }: Props) {
  // Collect all unique months across all sessions, sorted descending
  const allMonths = [...new Set(sessions.map(s => s.month))].sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(allMonths[0] ?? '');

  const monthIdx = allMonths.indexOf(selectedMonth);

  // ── Per-coach stats for the selected month ─────────────────────────────────
  const coachStats = coaches.map(coach => {
    const group = groups.find(g => g.coachId === coach.id);
    if (!group) return null;

    const monthSessions   = sessions.filter(s => s.groupId === group.id && s.month === selectedMonth);
    const monthSessionIds = monthSessions.map(s => s.id);
    const monthRegs       = registrations.filter(r => monthSessionIds.includes(r.sessionId));

    const bookSize   = group.memberIds.length;
    const registered = monthRegs.length;
    const attended   = monthRegs.filter(r => r.attended === true).length;
    const noShow     = monthRegs.filter(r => r.attended === false).length;
    const pending    = monthRegs.filter(r => r.attended === null).length;
    const isComplete = monthSessions.length > 0 && monthSessions.every(s => s.status === 'completed');

    // Trend: attendance rate for each of the last 3 months
    const trend = allMonths.slice(0, 3).map(mo => {
      const mSessions = sessions.filter(s => s.groupId === group.id && s.month === mo);
      const mIds      = mSessions.map(s => s.id);
      const mRegs     = registrations.filter(r => mIds.includes(r.sessionId));
      const mComplete = mSessions.length > 0 && mSessions.every(s => s.status === 'completed');
      return {
        month: mo,
        rate:  mComplete ? pct(mRegs.filter(r => r.attended === true).length, mRegs.length) : null,
      };
    }).reverse();

    return {
      coach,
      group,
      bookSize,
      registered,
      attended,
      noShow,
      pending,
      isComplete,
      regRate:  pct(registered, bookSize),
      attRate:  isComplete ? pct(attended, registered) : null,
      trend,
    };
  }).filter(Boolean) as NonNullable<ReturnType<typeof coachStats[0]>>[];

  // ── Totals row ─────────────────────────────────────────────────────────────
  const totals = coachStats.reduce(
    (acc, r) => ({
      bookSize:   acc.bookSize   + r.bookSize,
      registered: acc.registered + r.registered,
      attended:   acc.attended   + r.attended,
      noShow:     acc.noShow     + r.noShow,
      pending:    acc.pending    + r.pending,
    }),
    { bookSize: 0, registered: 0, attended: 0, noShow: 0, pending: 0 }
  );

  const monthLabel = selectedMonth
    ? format(parseISO(selectedMonth + '-02'), 'MMMM yyyy')
    : '—';

  const anyComplete = coachStats.some(r => r.isComplete);

  return (
    <div className="min-h-full bg-[#F3F2F2]">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDDBDA] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-normal text-[#080707]">Attendance Report</h1>
            <p className="text-[12px] text-[#706E6B] mt-0.5">
              Registration &amp; attendance across all coaching books
            </p>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-2 bg-[#F3F2F2] rounded border border-[#DDDBDA] px-1 py-1">
            <button
              onClick={() => setSelectedMonth(allMonths[monthIdx + 1] ?? selectedMonth)}
              disabled={monthIdx >= allMonths.length - 1}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#706E6B]" />
            </button>
            <span className="text-[13px] font-bold text-[#080707] w-32 text-center">{monthLabel}</span>
            <button
              onClick={() => setSelectedMonth(allMonths[monthIdx - 1] ?? selectedMonth)}
              disabled={monthIdx <= 0}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#706E6B]" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Summary cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Book Size', val: totals.bookSize,   icon: Users,        color: 'text-[#0176D3]', bg: 'bg-[#EEF4FF]' },
            { label: 'Registered',      val: totals.registered, icon: TrendingUp,   color: 'text-[#7A4F00]', bg: 'bg-[#FEF3E2]' },
            { label: 'Attended',        val: anyComplete ? totals.attended  : '—', icon: CheckCircle, color: 'text-[#1C6E42]', bg: 'bg-[#E7F6EC]' },
            { label: 'No-Shows',        val: anyComplete ? totals.noShow    : '—', icon: AlertCircle, color: 'text-[#C23934]', bg: 'bg-[#FCE3E3]' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded border border-[#DDDBDA] shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-[11px] text-[#706E6B]">{label}</p>
                <p className={`text-[22px] font-bold leading-tight ${color}`}>{val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main table ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded border border-[#DDDBDA] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DDDBDA] bg-[#FAFAF9] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[#080707]">By Coach — {monthLabel}</h2>
            {!anyComplete && (
              <span className="text-[11px] text-[#706E6B] italic">
                Attendance auto-populates after sessions are marked complete via Zoom sync
              </span>
            )}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#DDDBDA]">
                {['Coach', 'Book Size', 'Registered', 'Reg Rate', 'Attended', 'No-Show', 'Att. Rate', '3-Month Trend'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-[#706E6B] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDBDA]">
              {coachStats.map(row => (
                <tr key={row.coach.id} className="hover:bg-[#F3F2F2] transition-colors">
                  {/* Coach */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#032D60] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {row.coach.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </span>
                      </div>
                      <span className="text-[13px] text-[#080707]">{row.coach.name}</span>
                      {row.group.type === 'flexible' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#EEF4FF] text-[#014486]">Flexible</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#F3F2F2] text-[#706E6B]">Fixed</span>
                      )}
                    </div>
                  </td>
                  {/* Book size */}
                  <td className="px-4 py-3 text-[13px] text-[#706E6B]">{row.bookSize}</td>
                  {/* Registered */}
                  <td className="px-4 py-3 text-[13px] font-bold text-[#0176D3]">{row.registered}</td>
                  {/* Reg rate */}
                  <td className="px-4 py-3"><RateBadge rate={row.regRate} /></td>
                  {/* Attended */}
                  <td className="px-4 py-3 text-[13px] font-bold text-[#2E844A]">
                    {row.isComplete ? row.attended : <span className="text-[#C9C7C5]">—</span>}
                  </td>
                  {/* No-show */}
                  <td className="px-4 py-3 text-[13px] text-[#C23934]">
                    {row.isComplete ? (row.noShow > 0 ? row.noShow : <span className="text-[#C9C7C5]">0</span>) : <span className="text-[#C9C7C5]">—</span>}
                  </td>
                  {/* Att rate */}
                  <td className="px-4 py-3"><RateBadge rate={row.attRate} /></td>
                  {/* Trend sparkline */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.trend.map(t => (
                        <div key={t.month} className="flex flex-col items-center gap-0.5">
                          <div
                            className="w-6 rounded-sm"
                            style={{
                              height: t.rate !== null ? `${Math.max(4, (t.rate / 100) * 24)}px` : '4px',
                              background: t.rate === null ? '#DDDBDA' :
                                          t.rate >= 90   ? '#2E844A' :
                                          t.rate >= 75   ? '#FE9339' : '#C23934',
                            }}
                          />
                          <span className="text-[9px] text-[#C9C7C5]">
                            {format(parseISO(t.month + '-02'), 'MMM')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Totals row */}
              <tr className="bg-[#F3F2F2] border-t-2 border-[#DDDBDA]">
                <td className="px-4 py-3 text-[12px] font-bold text-[#080707]">All Coaches</td>
                <td className="px-4 py-3 text-[12px] font-bold text-[#706E6B]">{totals.bookSize}</td>
                <td className="px-4 py-3 text-[12px] font-bold text-[#0176D3]">{totals.registered}</td>
                <td className="px-4 py-3"><RateBadge rate={pct(totals.registered, totals.bookSize)} /></td>
                <td className="px-4 py-3 text-[12px] font-bold text-[#2E844A]">
                  {anyComplete ? totals.attended : <span className="text-[#C9C7C5]">—</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#C23934]">
                  {anyComplete ? totals.noShow : <span className="text-[#C9C7C5]">—</span>}
                </td>
                <td className="px-4 py-3">
                  <RateBadge rate={anyComplete ? pct(totals.attended, totals.registered) : null} />
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Zoom integration note ────────────────────────────────────────── */}
        <div className="bg-white rounded border border-[#DDDBDA] shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#080707]">Zoom → Salesforce Integration</p>
              <p className="text-[12px] text-[#706E6B] mt-0.5 leading-relaxed">
                In the full build, attendance will populate automatically. When a Zoom session ends,
                a webhook fires to Salesforce, matching attendees by email to their contact record and
                marking <code className="bg-[#F3F2F2] px-1 rounded text-[11px]">Mastermind_Attended__c = true</code> on
                the <code className="bg-[#F3F2F2] px-1 rounded text-[11px]">Session_Registration__c</code> object.
                No manual entry required. Attendance also surfaces on the Pro's contact record
                as a related list.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
