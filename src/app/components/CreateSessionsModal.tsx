import { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup } from '../App';

type CreateSessionsModalProps = {
  group: MastermindGroup;
  existingMonths: string[];
  onClose: () => void;
  onCreate: (groupId: string, month: string, dates: [Date, Date, Date]) => void;
};

const CURRENT_YEAR = 2026;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonthOptions() {
  const options: { label: string; value: string }[] = [];
  for (let m = 4; m <= 11; m++) {
    const val = `${CURRENT_YEAR}-${String(m + 1).padStart(2, '0')}`;
    options.push({ label: `${MONTHS[m]} ${CURRENT_YEAR}`, value: val });
  }
  // Add a couple from next year
  options.push({ label: `January 2027`, value: `2027-01` });
  options.push({ label: `February 2027`, value: `2027-02` });
  return options;
}

const SESSION_LABELS = ['Option A', 'Option B', 'Option C'] as const;

export function CreateSessionsModal({
  group,
  existingMonths,
  onClose,
  onCreate,
}: CreateSessionsModalProps) {
  const monthOptions = buildMonthOptions();
  const defaultMonth =
    monthOptions.find(o => !existingMonths.includes(o.value))?.value || monthOptions[0].value;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [dateTimes, setDateTimes] = useState<[string, string, string]>(['', '', '']);

  const monthConflict = existingMonths.includes(selectedMonth);

  const handleDateChange = (idx: 0 | 1 | 2, value: string) => {
    const next = [...dateTimes] as [string, string, string];
    next[idx] = value;
    setDateTimes(next);
  };

  const isValid =
    !monthConflict && dateTimes.every(dt => dt !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const [d1, d2, d3] = dateTimes.map(dt => new Date(dt));
    onCreate(group.id, selectedMonth, [d1, d2, d3]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#DDDBDA]">
        {/* Header */}
        <div className="sticky top-0 bg-[#032D60] border-b border-[#014486] px-6 py-4 flex items-center justify-between rounded-t">
          <div>
            <h2 className="text-[16px] font-normal text-white">Create Monthly Sessions</h2>
            <p className="text-[13px] text-[#A8C8F8] mt-0.5">{group.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Month Selection */}
          <div>
            <label className="block text-[12px] font-bold text-[#080707] mb-1.5 uppercase tracking-wide">
              Month *
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value} disabled={existingMonths.includes(opt.value)}>
                  {opt.label}{existingMonths.includes(opt.value) ? ' (already created)' : ''}
                </option>
              ))}
            </select>
            {monthConflict && (
              <div className="flex items-center gap-2 mt-2 text-[#C23934] text-[12px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Sessions already exist for this month.
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-[#EEF4FF] border border-[#0176D3] rounded p-3 text-[12px] text-[#014486]">
            <p className="font-bold mb-1">Three session options per month</p>
            <p>
              Set three different date &amp; time options. An invitation email will be sent to all{' '}
              <strong>{group.memberIds.length} members</strong> in this group, and they will choose
              which session to attend.
            </p>
          </div>

          {/* Session date/time pickers */}
          {([0, 1, 2] as const).map(idx => (
            <div key={idx} className="border border-[#DDDBDA] rounded p-4 bg-[#FAFAF9]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#0176D3] text-white text-[11px] flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <h3 className="text-[13px] font-bold text-[#080707]">
                  {SESSION_LABELS[idx]}
                </h3>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wide mb-1">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  value={dateTimes[idx]}
                  onChange={e => handleDateChange(idx, e.target.value)}
                  min={`${selectedMonth}-01T00:00`}
                  max={`${selectedMonth}-31T23:59`}
                  className="w-full px-3 py-2 border border-[#DDDBDA] rounded bg-white text-[13px] text-[#080707] focus:outline-none focus:border-[#0176D3]"
                  required
                />
                {dateTimes[idx] && (
                  <p className="text-[11px] text-[#706E6B] mt-1">
                    {format(new Date(dateTimes[idx]), 'EEEE, MMMM d, yyyy · h:mm a')}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#DDDBDA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#0176D3] text-[13px] font-normal rounded border border-[#DDDBDA] hover:bg-[#F3F2F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 bg-[#0176D3] text-white text-[13px] font-normal rounded border border-[#0176D3] hover:bg-[#014486] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create 3 Sessions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
