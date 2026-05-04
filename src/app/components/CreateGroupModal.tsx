import { useState } from 'react';
import { X, Info, Users } from 'lucide-react';
import type { Coach, Pro, MastermindGroup, FixedSlot } from '../App';

type CreateGroupModalProps = {
  coaches: Coach[];
  pros: Pro[];
  onClose: () => void;
  onCreate: (group: Omit<MastermindGroup, 'id' | 'createdDate'>) => void;
};

const DAY_OPTIONS = [
  { value: 1, label: 'Monday'    },
  { value: 2, label: 'Tuesday'   },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday'  },
  { value: 5, label: 'Friday'    },
];

type CohortRow = { dayOfWeek: number; hour: string; minute: string };

const DEFAULT_COHORTS: CohortRow[] = [
  { dayOfWeek: 1, hour: '10', minute: '00' },
  { dayOfWeek: 3, hour: '14', minute: '00' },
  { dayOfWeek: 5, hour: '18', minute: '00' },
];

export function CreateGroupModal({ coaches, pros, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [coachId, setCoachId] = useState('');
  const [groupType, setGroupType] = useState<'flexible' | 'fixed'>('flexible');
  const [cohorts, setCohorts] = useState<CohortRow[]>(DEFAULT_COHORTS);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !coachId) return;

    let fixedSlots: FixedSlot[] | undefined;
    if (groupType === 'fixed') {
      fixedSlots = cohorts.map((c, i) => ({
        id:         `fs-new-${i + 1}`,
        label:      `Cohort ${i + 1}`,
        dayOfWeek:  c.dayOfWeek,
        hour:       parseInt(c.hour) || 0,
        minute:     parseInt(c.minute) || 0,
        memberIds:  [], // assigned after creation via Manage Members
      }));
    }

    onCreate({
      name,
      coachId,
      memberIds: selectedMemberIds,
      status: 'active',
      type: groupType,
      fixedSlots,
    });
  };

  const toggleMember = (proId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(proId) ? prev.filter(id => id !== proId) : [...prev, proId]
    );
  };

  const updateCohort = (idx: number, field: keyof CohortRow, value: string | number) => {
    setCohorts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
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
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-colors">
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
                sessions per month via <strong>Mastermind_Session__c</strong>.
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

          {/* Group Type */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-2 uppercase tracking-wide">
              Group Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-[#F3F2F2] transition-colors border-[#DDDBDA]"
                style={groupType === 'flexible' ? { borderColor: '#0176D3', background: '#EEF4FF' } : {}}
              >
                <input
                  type="radio"
                  name="groupType"
                  value="flexible"
                  checked={groupType === 'flexible'}
                  onChange={() => setGroupType('flexible')}
                  className="mt-0.5 text-[#0176D3]"
                />
                <div>
                  <p className="text-[13px] font-bold text-[#080707]">Flexible</p>
                  <p className="text-[12px] text-[#706E6B]">
                    Pros self-register for one of three monthly session options
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-[#F3F2F2] transition-colors border-[#DDDBDA]"
                style={groupType === 'fixed' ? { borderColor: '#7B5EA7', background: '#F5F0FF' } : {}}
              >
                <input
                  type="radio"
                  name="groupType"
                  value="fixed"
                  checked={groupType === 'fixed'}
                  onChange={() => setGroupType('fixed')}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-[13px] font-bold text-[#080707]">Fixed</p>
                  <p className="text-[12px] text-[#706E6B]">
                    Pros are assigned to a recurring cohort; sessions auto-generate each month
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Cohort Schedule (only for Fixed) */}
          {groupType === 'fixed' && (
            <div>
              <label className="block text-[12px] font-bold text-[#080707] mb-2 uppercase tracking-wide">
                Cohort Schedule
              </label>
              <div className="space-y-2">
                {cohorts.map((cohort, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#FAFAF9] border border-[#DDDBDA] rounded">
                    <span className="text-[12px] font-bold text-[#706E6B] w-16 flex-shrink-0">
                      Cohort {i + 1}
                    </span>
                    <select
                      value={cohort.dayOfWeek}
                      onChange={e => updateCohort(i, 'dayOfWeek', parseInt(e.target.value))}
                      className="px-2 py-1.5 border border-[#DDDBDA] rounded bg-white text-[12px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
                    >
                      {DAY_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0} max={23}
                        value={cohort.hour}
                        onChange={e => updateCohort(i, 'hour', e.target.value)}
                        className="w-12 px-2 py-1.5 border border-[#DDDBDA] rounded bg-white text-[12px] text-center text-[#080707] focus:outline-none focus:border-[#0176D3]"
                        placeholder="HH"
                      />
                      <span className="text-[#706E6B]">:</span>
                      <input
                        type="number"
                        min={0} max={59}
                        value={cohort.minute}
                        onChange={e => updateCohort(i, 'minute', e.target.value)}
                        className="w-12 px-2 py-1.5 border border-[#DDDBDA] rounded bg-white text-[12px] text-center text-[#080707] focus:outline-none focus:border-[#0176D3]"
                        placeholder="MM"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#706E6B] mt-2">
                Cohort member assignment is done after saving via Manage Members.
              </p>
            </div>
          )}

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
