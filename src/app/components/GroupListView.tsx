import { useState } from 'react';
import { Plus, Search, ChevronDown, MoreHorizontal } from 'lucide-react';
import type { MastermindGroup, Coach } from '../App';

type GroupListViewProps = {
  groups: MastermindGroup[];
  coaches: Coach[];
  sessions: unknown[];
  registrations: unknown[];
  onOpenGroup: (id: string) => void;
  onNewGroup: () => void;
};

export function GroupListView({ groups, coaches, onOpenGroup, onNewGroup }: GroupListViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'flexible'>('all');

  const filtered = groups.filter(g => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      coaches.find(c => c.id === g.coachId)?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || g.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-[#DDDBDA] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-normal text-[#080707]">Mastermind Groups</h1>
            <ChevronDown className="w-4 h-4 text-[#706E6B]" />
          </div>
          <button
            onClick={onNewGroup}
            className="px-4 py-1.5 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[13px] text-[#706E6B]">{filtered.length} groups</p>

          {/* Type filter */}
          <div className="flex items-center rounded border border-[#DDDBDA] overflow-hidden">
            {(['all', 'fixed', 'flexible'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setTypeFilter(opt)}
                className={`px-3 py-1 text-[12px] transition-colors ${
                  typeFilter === opt
                    ? 'bg-[#032D60] text-white'
                    : 'bg-white text-[#706E6B] hover:bg-[#F3F2F2]'
                }`}
              >
                {opt === 'all' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs relative">
            <Search className="w-3.5 h-3.5 text-[#706E6B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups or coaches..."
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
              <th className="w-10 px-3 py-2">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#DDDBDA]" />
              </th>
              {['Group Name', 'Coach', 'Type', 'Status', 'Members'].map(h => (
                <th
                  key={h}
                  className="text-left px-3 py-2 text-[12px] font-bold text-[#080707] uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDDBDA]">
            {filtered.map(group => {
              const coach = coaches.find(c => c.id === group.coachId);
              return (
                <tr
                  key={group.id}
                  className="bg-white hover:bg-[#F3F2F2] transition-colors cursor-pointer group"
                  onClick={() => onOpenGroup(group.id)}
                >
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#DDDBDA]" />
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2">
                    <button
                      className="text-[#0176D3] text-[13px] hover:underline text-left font-normal"
                      onClick={e => { e.stopPropagation(); onOpenGroup(group.id); }}
                    >
                      {group.name}
                    </button>
                  </td>

                  {/* Coach */}
                  <td className="px-3 py-2">
                    <p className="text-[13px] text-[#080707]">{coach?.name}</p>
                    <p className="text-[11px] text-[#706E6B]">{coach?.email}</p>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
                      group.type === 'fixed'
                        ? 'bg-[#F3F2F2] text-[#706E6B]'
                        : 'bg-[#EEF4FF] text-[#014486]'
                    }`}>
                      {group.type === 'fixed' ? 'Fixed' : 'Flexible'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
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

                  {/* Members */}
                  <td className="px-3 py-2 text-[13px] text-[#080707]">
                    {group.memberIds.length}
                  </td>

                  {/* Row actions */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
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
