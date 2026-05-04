import { useState } from 'react';
import { X, Info, Users } from 'lucide-react';
import type { Coach, Pro, MastermindGroup } from '../App';

type CreateGroupModalProps = {
  coaches: Coach[];
  pros: Pro[];
  onClose: () => void;
  onCreate: (group: Omit<MastermindGroup, 'id' | 'createdDate'>) => void;
};

export function CreateGroupModal({ coaches, pros, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [coachId, setCoachId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && coachId) {
      onCreate({ name, coachId, memberIds: selectedMemberIds, status: 'active' });
    }
  };

  const toggleMember = (proId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(proId) ? prev.filter(id => id !== proId) : [...prev, proId]
    );
  };

  const filteredPros = pros.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#DDDBDA]">
        {/* Header */}
        <div className="sticky top-0 bg-[#032D60] border-b border-[#014486] px-6 py-4 flex items-center justify-between rounded-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0176D3] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-normal text-white">New Mastermind Group</h2>
              <p className="text-[12px] text-[#A8C8F8] mt-0.5">Mastermind__c · New Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="bg-[#EEF4FF] border border-[#0176D3] rounded p-3 flex items-start gap-2 text-[12px] text-[#014486]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Salesforce Object Model</p>
              <p>
                This creates a <strong>Mastermind__c</strong> record. Members are stored as{' '}
                <strong>Mastermind_Group_Member__c</strong> child records. After saving, you'll create
                three session options per month via <strong>Mastermind_Session__c</strong>.
              </p>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-1 uppercase tracking-wide">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3] focus:shadow-[0_0_3px_#0176D3]"
              placeholder="e.g., Executive Leadership Circle"
              required
            />
          </div>

          {/* Coach Selection */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-1 uppercase tracking-wide">
              Assigned Coach *
            </label>
            <select
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
              required
            >
              <option value="">Select a coach...</option>
              {coaches.map(coach => (
                <option key={coach.id} value={coach.id}>
                  {coach.name} — {coach.email}
                </option>
              ))}
            </select>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-1 uppercase tracking-wide">
              Book of Business — Add Members ({selectedMemberIds.length} selected)
            </label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pros..."
              className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3] mb-2"
            />
            <div className="border border-[#DDDBDA] rounded max-h-56 overflow-y-auto bg-white">
              {filteredPros.map(pro => (
                <label
                  key={pro.id}
                  className="flex items-center gap-3 p-3 hover:bg-[#F3F2F2] cursor-pointer border-b border-[#DDDBDA] last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(pro.id)}
                    onChange={() => toggleMember(pro.id)}
                    className="w-4 h-4 text-[#0176D3] rounded focus:ring-[#0176D3]"
                  />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#080707]">{pro.name}</p>
                    <p className="text-[11px] text-[#706E6B]">
                      {pro.email} · {pro.phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#DDDBDA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#0176D3] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
            >
              Save Mastermind Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}