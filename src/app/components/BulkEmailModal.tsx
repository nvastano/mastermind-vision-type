import { useState, useMemo } from 'react';
import { X, Mail, ChevronDown, ChevronUp, CheckCircle, Users, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MastermindGroup, Coach, Pro, MastermindSession, SessionRegistration } from '../App';

type Props = {
  group: MastermindGroup;
  coach: Coach;
  members: Pro[];
  sessions: MastermindSession[];
  registrations: SessionRegistration[];
  onClose: () => void;
};

const SESSION_LABELS = ['Option A', 'Option B', 'Option C'] as const;

type AudienceOption =
  | { type: 'all' }
  | { type: 'session'; sessionId: string };

export function BulkEmailModal({ group, coach, members, sessions, registrations, onClose }: Props) {
  const [audience, setAudience] = useState<AudienceOption>({ type: 'all' });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState(false);

  // Build audience options — entire book + every session that has registrants
  const sessionOptions = useMemo(() => {
    return [...new Set(sessions.map(s => s.month))]
      .sort()
      .reverse()
      .flatMap(month => {
        const monthLabel = format(parseISO(month + '-02'), 'MMMM yyyy');
        return sessions
          .filter(s => s.month === month)
          .sort((a, b) => a.sessionNumber - b.sessionNumber)
          .map(session => {
            const regs = registrations.filter(r => r.sessionId === session.id);
            return {
              session,
              monthLabel,
              optionLabel: SESSION_LABELS[session.sessionNumber - 1],
              regCount: regs.length,
            };
          })
          .filter(o => o.regCount > 0); // only show sessions with registrants
      });
  }, [sessions, registrations]);

  // Resolve recipients based on selected audience
  const recipients: Pro[] = useMemo(() => {
    if (audience.type === 'all') return members;
    const regs = registrations.filter(r => r.sessionId === audience.sessionId);
    return regs.map(r => members.find(m => m.id === r.proId)).filter(Boolean) as Pro[];
  }, [audience, members, registrations]);

  const selectedSessionInfo = useMemo(() => {
    if (audience.type !== 'session') return null;
    return sessionOptions.find(o => o.session.id === audience.sessionId) ?? null;
  }, [audience, sessionOptions]);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && recipients.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setSent(true);
  };

  // ── Sent confirmation ──────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E7F6EC] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#2E844A]" />
          </div>
          <h2 className="text-[18px] font-normal text-[#080707] mb-2">Email Queued</h2>
          <p className="text-[13px] text-[#706E6B] mb-1">
            <span className="font-bold text-[#080707]">{recipients.length}</span> recipients
          </p>
          <p className="text-[12px] text-[#706E6B] mb-6">
            In the full build, this triggers Salesforce's Mass Email or a Marketing Cloud journey
            using each Pro's <code className="bg-[#F3F2F2] px-1 rounded text-[11px]">Contact.Email</code> field.
          </p>
          <div className="bg-[#F3F2F2] rounded p-3 text-left mb-6">
            <p className="text-[11px] text-[#706E6B] mb-0.5">Subject</p>
            <p className="text-[13px] text-[#080707]">{subject}</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0176D3] text-white text-[13px] rounded border border-[#0176D3] hover:bg-[#014486] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Compose modal ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-[#DDDBDA] flex-shrink-0">
          <div className="px-5 pt-3 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[#706E6B]">
              <span className="text-[#0176D3]">{group.name}</span>
              <span>›</span>
              <span>Send Email</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#F3F2F2] text-[#706E6B] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 pb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#0176D3]" />
            </div>
            <div>
              <p className="text-[11px] text-[#706E6B]">Mass Email</p>
              <h2 className="text-[18px] font-normal text-[#080707]">Send to {group.name}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Audience selector */}
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
            <div className="px-4 py-2.5 border-b border-[#DDDBDA] bg-[#FAFAF9] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0176D3]" />
              <h3 className="text-[12px] font-bold text-[#080707]">Recipients</h3>
            </div>
            <div className="p-4 space-y-2">

              {/* All members option */}
              <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                audience.type === 'all'
                  ? 'border-[#0176D3] bg-[#EEF4FF]'
                  : 'border-[#DDDBDA] hover:bg-[#F3F2F2]'
              }`}>
                <input
                  type="radio"
                  checked={audience.type === 'all'}
                  onChange={() => setAudience({ type: 'all' })}
                  className="w-3.5 h-3.5 accent-[#0176D3]"
                />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-[#080707] font-normal">Entire Book of Business</p>
                    <p className="text-[11px] text-[#706E6B]">All active members in this group</p>
                  </div>
                  <span className="text-[12px] font-bold text-[#0176D3] bg-[#EEF4FF] px-2 py-0.5 rounded-full">
                    {members.length}
                  </span>
                </div>
              </label>

              {/* Per-session options */}
              {sessionOptions.length > 0 && (
                <div>
                  <p className="text-[11px] text-[#706E6B] uppercase tracking-wide font-bold px-1 py-2">
                    — or by session registrants —
                  </p>
                  <div className="space-y-2">
                    {sessionOptions.map(({ session, monthLabel, optionLabel, regCount }) => (
                      <label
                        key={session.id}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                          audience.type === 'session' && audience.sessionId === session.id
                            ? 'border-[#0176D3] bg-[#EEF4FF]'
                            : 'border-[#DDDBDA] hover:bg-[#F3F2F2]'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={audience.type === 'session' && audience.sessionId === session.id}
                          onChange={() => setAudience({ type: 'session', sessionId: session.id })}
                          className="w-3.5 h-3.5 accent-[#0176D3]"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#706E6B]" />
                            <div>
                              <p className="text-[13px] text-[#080707]">
                                {monthLabel} — {optionLabel}
                              </p>
                              <p className="text-[11px] text-[#706E6B]">
                                {format(session.date, 'EEE, MMM d')} · {format(session.date, 'h:mm a')}
                                {session.status === 'completed' && (
                                  <span className="ml-2 text-[#1C6E42]">· Completed</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-[12px] font-bold text-[#0176D3] bg-[#EEF4FF] px-2 py-0.5 rounded-full">
                            {regCount}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recipient preview toggle */}
            {recipients.length > 0 && (
              <div className="border-t border-[#DDDBDA]">
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-[12px] text-[#0176D3] hover:bg-[#F3F2F2] transition-colors"
                >
                  <span>Preview {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
                  {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showPreview && (
                  <div className="border-t border-[#DDDBDA] max-h-40 overflow-y-auto divide-y divide-[#DDDBDA]">
                    {recipients.map(r => (
                      <div key={r.id} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-[12px] text-[#080707]">{r.name}</span>
                        <span className="text-[11px] text-[#706E6B]">{r.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="bg-white rounded border border-[#DDDBDA] shadow-sm">
            <div className="px-4 py-2.5 border-b border-[#DDDBDA] bg-[#FAFAF9] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0176D3]" />
              <h3 className="text-[12px] font-bold text-[#080707]">Compose</h3>
            </div>
            <div className="p-4 space-y-3">

              {/* From / To strip */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="bg-[#F3F2F2] rounded px-3 py-2">
                  <span className="text-[#706E6B]">From: </span>
                  <span className="text-[#080707]">{coach.name} &lt;{coach.email}&gt;</span>
                </div>
                <div className="bg-[#F3F2F2] rounded px-3 py-2">
                  <span className="text-[#706E6B]">To: </span>
                  <span className="text-[#080707]">
                    {audience.type === 'all'
                      ? `All members (${members.length})`
                      : selectedSessionInfo
                        ? `${selectedSessionInfo.monthLabel} — ${selectedSessionInfo.optionLabel} (${recipients.length})`
                        : `${recipients.length} recipients`}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] text-[#706E6B] mb-1">Subject *</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. June Mastermind — Register Now!"
                  className="w-full px-3 py-2 border border-[#DDDBDA] rounded text-[13px] text-[#080707] placeholder:text-[#C9C7C5] focus:outline-none focus:border-[#0176D3] transition-colors"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] text-[#706E6B] mb-1">Message *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={`Hi {First Name},\n\nYour June Mastermind sessions are now open for registration...`}
                  rows={7}
                  className="w-full px-3 py-2 border border-[#DDDBDA] rounded text-[13px] text-[#080707] placeholder:text-[#C9C7C5] focus:outline-none focus:border-[#0176D3] transition-colors resize-none font-sans"
                />
                <p className="text-[11px] text-[#706E6B] mt-1">
                  Merge fields supported: <code className="bg-[#F3F2F2] px-1 rounded">{'{First Name}'}</code>
                  {' '}<code className="bg-[#F3F2F2] px-1 rounded">{'{Group Name}'}</code>
                  {' '}<code className="bg-[#F3F2F2] px-1 rounded">{'{Coach Name}'}</code>
                </p>
              </div>
            </div>
          </div>

          {/* SF integration note */}
          <div className="bg-[#FAFAF9] rounded border border-[#DDDBDA] px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="w-3 h-3 text-[#0176D3]" />
            </div>
            <p className="text-[11px] text-[#706E6B] leading-relaxed">
              <span className="font-bold text-[#080707]">Salesforce integration: </span>
              In the full build, this uses Salesforce Mass Email or a Marketing Cloud journey.
              Recipients are resolved from <code className="bg-white px-1 rounded border border-[#DDDBDA]">Mastermind_Group_Member__c</code> or
              {' '}<code className="bg-white px-1 rounded border border-[#DDDBDA]">Session_Registration__c</code> records.
              Sends are logged as <code className="bg-white px-1 rounded border border-[#DDDBDA]">EmailMessage</code> on each contact.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#DDDBDA] px-5 py-3 bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
          <p className="text-[12px] text-[#706E6B]">
            {recipients.length > 0 ? (
              <><span className="font-bold text-[#080707]">{recipients.length}</span> recipients selected</>
            ) : (
              'Select an audience above'
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[13px] text-[#706E6B] border border-[#DDDBDA] rounded hover:bg-[#F3F2F2] transition-colors bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="px-4 py-1.5 text-[13px] text-white bg-[#0176D3] border border-[#0176D3] rounded hover:bg-[#014486] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
