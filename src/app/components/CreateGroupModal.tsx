import { useState } from 'react';
import { X, Users } from 'lucide-react';
import type { Coach, Pro, MastermindGroup } from '../App';

type CreateGroupModalProps = {
  coaches: Coach[];
  pros: Pro[];
  onClose: () => void;
  onCreate: (group: Omit<MastermindGroup, 'id' | 'createdDate'>) => void;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['1st', '2nd', '3rd', '4th'];

export function CreateGroupModal({ coaches, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [coachId, setCoachId] = useState('');
  const [type, setType] = useState<'flexible' | 'fixed'>('flexible');

  const [schedule, setSchedule] = useState({ weekOfMonth: 1, dayOfWeek: 1, hour: 10, minute: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !coachId) return;

    onCreate({
      name,
      coachId,
      memberIds: [],
      status: 'active',
      type,
      schedule: type === 'fixed' ? schedule : undefined,
    });
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
              <label className="block text-[12px] font-bold text-[#080707] mb-2 uppercase tracking-wide">
                Group Schedule
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#FAFAF9] rounded border border-[#DDDBDA] flex-wrap">
                {/* Week of month */}
                <select
                  value={schedule.weekOfMonth}
                  onChange={e => setSchedule(s => ({ ...s, weekOfMonth: Number(e.target.value) }))}
                  className="px-2 py-1.5 border border-[#DDDBDA] rounded text-[12px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
                >
                  {[1, 2, 3, 4].map(w => (
                    <option key={w} value={w}>{ORDINALS[w - 1]}</option>
                  ))}
                </select>
                {/* Day of week */}
                <select
                  value={schedule.dayOfWeek}
                  onChange={e => setSchedule(s => ({ ...s, dayOfWeek: Number(e.target.value) }))}
                  className="flex-1 px-2 py-1.5 border border-[#DDDBDA] rounded text-[12px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
                >
                  {[1, 2, 3, 4, 5].map(d => (
                    <option key={d} value={d}>{DAYS[d]}</option>
                  ))}
                </select>
                {/* Time */}
                <input
                  type="time"
                  value={`${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    setSchedule(s => ({ ...s, hour: h, minute: m }));
                  }}
                  className="w-28 px-2 py-1.5 border border-[#DDDBDA] rounded text-[12px] text-[#080707] bg-white focus:outline-none focus:border-[#0176D3]"
                />
              </div>
              <p className="text-[11px] text-[#706E6B] mt-1">
                Add members after saving via Manage Members.
              </p>
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
