import { useState } from 'react';
import { Plus, Search, ChevronDown, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, MastermindSession, SessionRegistration } from '../App';

type GroupListViewProps = {
  groups: MastermindGroup[];
  coaches: Coach[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  onOpenGroup: (id: string) => void;
  onNewGroup: () => void;
};

export function GroupListView({ groups, coaches, sessions, registrations, onOpenGroup, onNewGroup }: GroupListViewProps) {
  const [search, setSearch] = useState('');

  const getLatestMonth = (groupId: string) => {
    const months = sessions.filter(s => s.groupId === groupId).map(s => s.month).sort();
    return months[months.length - 1] ?? null;
  };

  const getRegCount = (groupId: string, month: string | null) => {
    if (!month) return 0;
    const ids = sessions.filter(s => s.groupId === groupId && s.month === month).map(s => s.id);
    return registrations.filter(r => ids.includes(r.sessionId)).length;
  };

  const getMonthStatus = (groupId: string, month: string | null) => {
    if (!month) return null;
    const monthSessions = sessions.filter(s => s.groupId === groupId && s.month === month);
    if (monthSessions.every(s => s.status === 'completed')) return 'completed';
    if (monthSessions.some(s => s.status === 'invitations_sent')) return 'invitations_sent';
    if (monthSessions.some(s => s.status === 'scheduled')) return 'scheduled';
    return null;
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    coaches.find(c => c.id === g.coachId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* List View Header */}
      <div className="bg-white border-b border-[#DDDBDA] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-normal text-[#080707]">Mastermind Groups</h1>
            <ChevronDown className="w-4 h-4 text-[#706E6B]" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewGroup}
              className="px-4 py-1.5 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
            <button className="px-3 py-1.5 bg-white text-[#0176D3] text-[13px] border border-[#DDDBDA] rounded hover:bg-[#F3F2F2] transition-colors">
              Actions <ChevronDown className="inline w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-[#706E6B]">{filtered.length} items · Sorted by Group Name</p>
          <div className="flex-1 max-w-xs relative">
            <Search className="w-3.5 h-3.5 text-[#706E6B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search this list..."
              className="w-full pl-8 pr-3 py-1 border border-[#DDDBDA] rounded text-[12px] text-[#080707] focus:outline-none focus:border-[#0176D3] bg-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAF9] border-b border-[#DDDBDA]">
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#DDDBDA]" />
              </th>
              {[
                'Group Name', 'Coach', 'Status', 'Type', 'Members',
                'Latest Month', 'Sessions', 'Registrations', 'Month Status',
              ].map(h => (
                <th
                  key={h}
                  className="text-left px-3 py-2.5 text-[12px] font-bold text-[#080707] uppercase tracking-wide whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {h}
                    <ArrowUpDown className="w-3 h-3 text-[#C9C7C5]" />
                  </div>
                </th>
              ))}
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDDBDA]">
            {filtered.map(group => {
              const coach = coaches.find(c => c.id === group.coachId);
              const latestMonth = getLatestMonth(group.id);
              const regCount = getRegCount(group.id, latestMonth);
              const monthStatus = getMonthStatus(group.id, latestMonth);
              const monthSessions = sessions.filter(s => s.groupId === group.id && s.month === latestMonth);

              return (
                <tr
                  key={group.id}
                  className="bg-white hover:bg-[#F3F2F2] transition-colors cursor-pointer group"
                  onClick={() => onOpenGroup(group.id)}
                >
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#DDDBDA]" />
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3">
                    <button
                      className="text-[#0176D3] text-[13px] hover:underline text-left font-normal"
                      onClick={e => { e.stopPropagation(); onOpenGroup(group.id); }}
                    >
                      {group.name}
                    </button>
                  </td>

                  {/* Coach */}
                  <td className="px-3 py-3 text-[13px] text-[#080707]">
                    <div className="text-[#0176D3] hover:underline cursor-pointer">{coach?.name}</div>
                    <div className="text-[11px] text-[#706E6B]">{coach?.email}</div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
                      group.status === 'active'
                        ? 'bg-[#E7F6EC] text-[#1C6E42]'
                        : 'bg-[#F3F2F2] text-[#706E6B]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        group.status === 'active' ? 'bg-[#2E844A]' : 'bg-[#706E6B]'
                      }`} />
                      {group.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3">
                    {group.type === 'flexible' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#EEF4FF] text-[#014486]">
                        Flexible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#F3F2F2] text-[#706E6B]">
                        Fixed
                      </span>
                    )}
                  </td>

                  {/* Members */}
                  <td className="px-3 py-3 text-[13px] text-[#080707] text-center">
                    {group.memberIds.length}
                  </td>

                  {/* Latest Month */}
                  <td className="px-3 py-3 text-[13px] text-[#080707]">
                    {latestMonth
                      ? format(parseISO(latestMonth + '-02'), 'MMM yyyy')
                      : <span className="text-[#C9C7C5]">—</span>}
                  </td>

                  {/* Sessions */}
                  <td className="px-3 py-3 text-[13px] text-[#080707] text-center">
                    {monthSessions.length > 0 ? monthSessions.length : <span className="text-[#C9C7C5]">—</span>}
                  </td>

                  {/* Registrations */}
                  <td className="px-3 py-3 text-[13px] text-[#0176D3] text-center">
                    {regCount > 0 ? regCount : <span className="text-[#C9C7C5]">—</span>}
                  </td>

                  {/* Month Status */}
                  <td className="px-3 py-3">
                    {monthStatus && (() => {
                      const map: Record<string, { cls: string; label: string }> = {
                        scheduled: { cls: 'bg-[#EEF4FF] text-[#014486]', label: 'Scheduled' },
                        invitations_sent: { cls: 'bg-[#FEF3E2] text-[#7A4F00]', label: 'Invites Sent' },
                        completed: { cls: 'bg-[#E7F6EC] text-[#1C6E42]', label: 'Completed' },
                      };
                      const { cls, label } = map[monthStatus] ?? map.scheduled;
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Row actions */}
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#DDDBDA] transition-all text-[#706E6B]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="bg-white py-16 text-center border-t border-[#DDDBDA]">
            <p className="text-[#706E6B] text-[14px]">No mastermind groups found.</p>
            <button onClick={onNewGroup} className="mt-3 text-[#0176D3] text-[13px] hover:underline">
              Create the first one
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
