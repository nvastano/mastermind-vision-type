import { useState } from 'react';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import type { MastermindGroup, Pro } from '../App';

type ManageMembersModalProps = {
  group: MastermindGroup;
  allPros: Pro[];
  onClose: () => void;
  onUpdate: (groupId: string, memberIds: string[]) => void;
};

export function ManageMembersModal({ group, allPros, onClose, onUpdate }: ManageMembersModalProps) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(group.memberIds);
  const [search, setSearch] = useState('');

  const currentMembers = allPros.filter(p => selectedMemberIds.includes(p.id));
  const availablePros = allPros.filter(
    p =>
      !selectedMemberIds.includes(p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()))
  );

  const hasChanges =
    JSON.stringify([...selectedMemberIds].sort()) !==
    JSON.stringify([...group.memberIds].sort());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#DDDBDA]">
        {/* Header */}
        <div className="sticky top-0 bg-[#032D60] border-b border-[#014486] px-6 py-4 flex items-center justify-between rounded-t">
          <div>
            <h2 className="text-[16px] font-normal text-white">Manage Members</h2>
            <p className="text-[13px] text-[#A8C8F8] mt-0.5">
              {group.name} &mdash; Mastermind_Group_Member__c
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Members */}
            <div>
              <h3 className="text-[12px] font-bold text-[#080707] uppercase tracking-wide mb-2">
                Current Members ({currentMembers.length})
              </h3>
              <div className="border border-[#DDDBDA] rounded max-h-96 overflow-y-auto bg-white">
                {currentMembers.length === 0 ? (
                  <div className="p-8 text-center text-[#706E6B] text-[13px]">
                    No members yet
                  </div>
                ) : (
                  currentMembers.map(pro => (
                    <div
                      key={pro.id}
                      className="flex items-center justify-between p-3 border-b border-[#DDDBDA] last:border-b-0 hover:bg-[#F3F2F2]"
                    >
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#080707]">{pro.name}</p>
                        <p className="text-[11px] text-[#706E6B]">{pro.email}</p>
                        <p className="text-[11px] text-[#706E6B]">{pro.phone}</p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedMemberIds(prev => prev.filter(id => id !== pro.id))
                        }
                        className="p-2 text-[#C23934] hover:bg-[#FCE3E3] rounded transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Pros */}
            <div>
              <h3 className="text-[12px] font-bold text-[#080707] uppercase tracking-wide mb-2">
                Available Pros ({availablePros.length})
              </h3>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-[#706E6B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search pros..."
                  className="w-full pl-9 pr-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
                />
              </div>
              <div className="border border-[#DDDBDA] rounded max-h-[336px] overflow-y-auto bg-white">
                {availablePros.length === 0 ? (
                  <div className="p-8 text-center text-[#706E6B] text-[13px]">
                    {search ? 'No matching pros found' : 'All pros are already members'}
                  </div>
                ) : (
                  availablePros.map(pro => (
                    <div
                      key={pro.id}
                      className="flex items-center justify-between p-3 border-b border-[#DDDBDA] last:border-b-0 hover:bg-[#F3F2F2]"
                    >
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#080707]">{pro.name}</p>
                        <p className="text-[11px] text-[#706E6B]">{pro.email}</p>
                        <p className="text-[11px] text-[#706E6B]">{pro.phone}</p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedMemberIds(prev => [...prev, pro.id])
                        }
                        className="p-2 text-[#2E844A] hover:bg-[#E7F6EC] rounded transition-colors"
                        title="Add member"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-[#DDDBDA] mt-6">
            <p className="text-[13px] text-[#706E6B]">
              {hasChanges && (
                <span className="text-[#FE9339]">You have unsaved changes</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white text-[#0176D3] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onUpdate(group.id, selectedMemberIds)}
                className="px-4 py-2 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
              >
                Save Members
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
