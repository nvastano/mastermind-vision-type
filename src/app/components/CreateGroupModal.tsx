import { useState } from 'react';
import { X, Users, Plus } from 'lucide-react';
import type { Coach, Pro, MastermindGroup, FixedSlot } from '../App';

type CreateGroupModalProps = {
  coaches: Coach[];
  pros: Pro[];
  onClose: () => void;
  onCreate: (group: Omit<MastermindGroup, 'id' | 'createdDate'>) => void;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CreateGroupModal({ coaches, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [coachId, setCoachId] = useState('');
  const [type, setType] = useState<'flexible' | 'fixed'>('flexible');

  const [slots, setSlots] = useState([
    { dayOfWeek: 1, hour: 10, minute: 0 },
    { dayOfWeek: 3, hour: 14, minute: 0 },
    { dayOfWeek: 5, hour: 10, minute: 0 },
  ]);

  const updateSlot = (idx: number, field: 'dayOfWeek' | 'hour' | 'minute', val: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const addSlot = () => setSlots(prev => [...prev, { dayOfWeek: 1, hour: 9, minute: 0 }]);

  const removeSlot = (idx: number) =>
    setSlots(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !coachId) return;

    const fixedSlots: FixedSlot[] | undefined = type === 'fixed'
      ? slots.map((s, i) => ({
          id: `fs-new-${Date.now()}-${i}`,
          label: `Group ${i + 1}`,
          dayOfWeek: s.dayOfWeek,
          hour: s.hour,
          minute: s.minute,
          memberIds: [],
        }))
      : undefined;

    onCreate({ name, coachId, memberIds: [], status: 'active', type, fixedSlots });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#DDDBDA]">

        {/* Header */}
        <div className="sticky top-0 bg-[#032D60] border-b border-[#014486] px-6 py-4 flex items-center justify-between rounded-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0176D3] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-normal text-white">New Mastermind Group</h2>
              <p className="text-[12px] text-[#A8C8F8] mt-0.5">Add members after saving via Manage Members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Group Name */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-1 uppercase tracking-wide">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
              placeholder="e.g., David's Book"
              required
            />
          </div>

          {/* Coach */}
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
                <option key={coach.id} value={coach.id}>{coach.name}</option>
              ))}
            </select>
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-2 uppercase tracking-wide">
              Group Type *
            </label>
            <div className="space-y-2">
              {([
                { value: 'flexible', label: 'Flexible', desc: 'Pros self-register for one of three monthly session options' },
                { value: 'fixed',    label: 'Fixed',    desc: 'Pros are assigned to recurring groups with set schedules each month' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    type === opt.value
                      ? 'border-[#0176D3] bg-[#EEF4FF]'
                      : 'border-[#DDDBDA] hover:bg-[#F3F2F2]'
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="mt-0.5 accent-[#0176D3]"
                  />
                  <div>
                    <p className="text-[13px] font-normal text-[#080707]">{opt.label}</p>
                    <p className="text-[11px] text-[#706E6B]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fixed group schedule */}
          {type === 'fixed' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-bold text-[#080707] uppercase tracking-wide">
                  Group Schedule
                </label>
                <span className="text-[11px] text-[#706E6B]">{slots.length} group{slots.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-[#FAFAF9] rounded border border-[#DDDBDA]">
                    <span className="text-[12px] font-bold text-[#706E6B] w-14 shrink-0">Group {i + 1}</span>
                    <select
                      value={slot.dayOfWeek}
                      onChange={e => updateSlot(i, 'dayOfWeek', Number(e.target.value))}
                      className="flex-1 px-2 py-1.5 border border-[#DDDBDA] rounded text-[12px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
                    >
                      {[1, 2, 3, 4, 5].map(d => (
                        <option key={d} value={d}>{DAYS[d]}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={`${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`}
                      onChange={e => {
                        const [h, m] = e.target.value.split(':').map(Number);
                        updateSlot(i, 'hour', h);
                        updateSlot(i, 'minute', m);
                      }}
                      className="w-28 px-2 py-1.5 border border-[#DDDBDA] rounded text-[12px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      disabled={slots.length === 1}
                      className="p-1.5 rounded text-[#706E6B] hover:bg-[#FCE3E3] hover:text-[#C23934] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Remove group"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSlot}
                  className="w-full py-2 border border-dashed border-[#DDDBDA] rounded text-[12px] text-[#0176D3] hover:bg-[#EEF4FF] hover:border-[#0176D3] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Group
                </button>
                <p className="text-[11px] text-[#706E6B]">
                  Assign members to groups after saving via Manage Members.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#DDDBDA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#0176D3] text-[13px] rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
            >
              Save Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
