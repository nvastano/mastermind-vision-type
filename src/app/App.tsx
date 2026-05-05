import { useState } from 'react';
import { Plus, X, List } from 'lucide-react';
import { GroupListView } from './components/GroupListView';
import { GroupRecordPage } from './components/GroupRecordPage';
import { CreateGroupModal } from './components/CreateGroupModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { CreateSessionsModal } from './components/CreateSessionsModal';
import { AttendanceReport } from './components/AttendanceReport';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SEED_PROS } from '../data/pros';
import { SEED_GROUPS, SEED_SESSIONS, SEED_REGISTRATIONS } from '../data/seed';

export type Pro = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type Coach = {
  id: string;
  name: string;
  email: string;
};

export type GroupSchedule = {
  weekOfMonth: number;  // 1=1st, 2=2nd, 3=3rd, 4=4th
  dayOfWeek: number;    // 1=Mon ... 5=Fri
  hour: number;
  minute: number;
};

export type MastermindGroup = {
  id: string;
  name: string;
  coachId: string;
  memberIds: string[];
  createdDate: Date;
  status: 'active' | 'inactive';
  type: 'flexible' | 'fixed';
  schedule?: GroupSchedule;
};

export type MastermindSession = {
  id: string;
  groupId: string;
  month: string;
  sessionNumber: number; // makeup is 4th
  date: Date;
  status: 'scheduled' | 'invitations_sent' | 'completed' | 'cancelled';
  zoomLink: string;
  sessionType: 'option' | 'fixed_slot' | 'makeup';
  slotId?: string; // which cohort this session belongs to
};

export type SessionRegistration = {
  id: string;
  sessionId: string;
  groupId: string;
  proId: string;
  registeredDate: Date;
  attended: boolean | null;
};

export default function App() {
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | 'list'>('list');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showCreateSessions, setShowCreateSessions] = useState(false);

  // Coaches — the real RT coaching team
  const [coaches] = useState<Coach[]>([
    // Real Estate
    { id: 'c1',  name: 'David LaBahn',         email: 'david.labahn@ramseyrealty.com' },
    { id: 'c2',  name: 'Tori Wheeler',          email: 'tori.wheeler@ramseyrealty.com' },
    { id: 'c3',  name: 'Colin Bellios',         email: 'colin.bellios@ramseyrealty.com' },
    { id: 'c4',  name: 'Katrien Shaw',          email: 'katrien.shaw@ramseyrealty.com' },
    { id: 'c5',  name: 'Angelica Dotson',       email: 'angelica.dotson@ramseyrealty.com' },
    { id: 'c6',  name: 'Lily Lee',              email: 'lily.lee@ramseyrealty.com' },
    // Protections
    { id: 'c7',  name: 'Ashley Cook',           email: 'ashley.cook@ramseyrealty.com' },
    { id: 'c8',  name: 'Cynthia Navarro',       email: 'cynthia.navarro@ramseyrealty.com' },
    // Investing and Tax
    { id: 'c9',  name: 'Conner Brooke Binkley', email: 'conner.binkley@ramseyrealty.com' },
    { id: 'c10', name: 'Justin Nguyen',         email: 'justin.nguyen@ramseyrealty.com' },
    { id: 'c11', name: 'Kevin Dunn',            email: 'kevin.dunn@ramseyrealty.com' },
    { id: 'c12', name: 'Sarah Francis',         email: 'sarah.francis@ramseyrealty.com' },
  ]);

  // 360 pros — seeded from static data, persisted in localStorage
  const [pros] = useLocalStorage<Pro[]>('rt-pros', SEED_PROS);

  // Each coach's book of business — maps coachId to a list of pro IDs.
  // For flexible groups, these pros are auto-added as members on creation.
  const COACH_BOOKS: Record<string, string[]> = {
    // Fixed coaches — 300 pros each
    c1:  Array.from({ length: 300 }, (_, i) => `pro-${String(i +   1).padStart(4, '0')}`),
    c2:  Array.from({ length: 300 }, (_, i) => `pro-${String(i + 301).padStart(4, '0')}`),
    c3:  Array.from({ length: 300 }, (_, i) => `pro-${String(i + 601).padStart(4, '0')}`),
    // Flexible coaches — 60 pros each
    c4:  Array.from({ length: 60  }, (_, i) => `pro-${String(i + 901).padStart(4, '0')}`),
    c5:  Array.from({ length: 60  }, (_, i) => `pro-${String(i + 961).padStart(4, '0')}`),
    c6:  Array.from({ length: 60  }, (_, i) => `pro-${String(i + 1021).padStart(4, '0')}`),
    // Other coaches — 60 pros each (shared pool for demo purposes)
    c7:  Array.from({ length: 60  }, (_, i) => `pro-${String(i +   1).padStart(4, '0')}`),
    c8:  Array.from({ length: 60  }, (_, i) => `pro-${String(i +  61).padStart(4, '0')}`),
    c9:  Array.from({ length: 60  }, (_, i) => `pro-${String(i + 121).padStart(4, '0')}`),
    c10: Array.from({ length: 60  }, (_, i) => `pro-${String(i + 181).padStart(4, '0')}`),
    c11: Array.from({ length: 60  }, (_, i) => `pro-${String(i + 241).padStart(4, '0')}`),
    c12: Array.from({ length: 60  }, (_, i) => `pro-${String(i + 301).padStart(4, '0')}`),
  };

  // App data — seeded on first load, persisted across refreshes
  const [groups, setGroups]               = useLocalStorage<MastermindGroup[]>('rt-groups', SEED_GROUPS);
  const [sessions, setSessions]           = useLocalStorage<MastermindSession[]>('rt-sessions', SEED_SESSIONS);
  const [registrations, setRegistrations] = useLocalStorage<SessionRegistration[]>('rt-registrations', SEED_REGISTRATIONS);

  // ── Tab Management ────────────────────────────────────────────────────────

  const openGroupTab = (groupId: string) => {
    if (!openTabIds.includes(groupId)) {
      setOpenTabIds(prev => [...prev, groupId]);
    }
    setActiveTabId(groupId);
  };

  const closeTab = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = openTabIds.indexOf(groupId);
    const next = openTabIds.filter(id => id !== groupId);
    setOpenTabIds(next);
    if (activeTabId === groupId) {
      setActiveTabId(idx > 0 && next[idx - 1] ? next[idx - 1] : 'list');
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateGroup = (group: Omit<MastermindGroup, 'id' | 'createdDate'>) => {
    // For flexible groups, auto-populate the book of business as members
    const memberIds = group.type === 'flexible'
      ? (COACH_BOOKS[group.coachId] ?? [])
      : group.memberIds;
    const newGroup: MastermindGroup = { ...group, memberIds, id: `g${Date.now()}`, createdDate: new Date() };
    setGroups(prev => [...prev, newGroup]);
    setShowCreateGroup(false);
    openGroupTab(newGroup.id);
  };

  const handleUpdateMembers = (groupId: string, memberIds: string[]) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, memberIds } : g));
    setShowManageMembers(false);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<Pick<MastermindGroup, 'name' | 'status'>>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  // Simulate Zoom attendance sync — marks all registrants for a session as attended
  const handleSyncAttendance = (sessionId: string) => {
    setRegistrations(prev =>
      prev.map(r => r.sessionId === sessionId && r.attended === null
        ? { ...r, attended: true }
        : r
      )
    );
  };

  const handleCreateSessions = (groupId: string, month: string, dates: [Date, Date, Date]) => {
    const newSessions: MastermindSession[] = dates.map((date, i) => ({
      id: `s${Date.now()}-${i}`,
      groupId,
      month,
      sessionNumber: (i + 1),
      date,
      status: 'scheduled',
      zoomLink: `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`,
      sessionType: 'option' as const,
    }));
    setSessions(prev => [...prev, ...newSessions]);
    setShowCreateSessions(false);
  };

  // ── Fixed Group Session Utilities ────────────────────────────────────────────

  /** Returns the nth occurrence of dayOfWeek (0=Sun..6=Sat) in the given month */
  function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): Date {
    const d = new Date(year, month - 1, 1);
    let count = 0;
    while (d.getMonth() === month - 1) {
      if (d.getDay() === dayOfWeek) {
        count++;
        if (count === n) return new Date(d);
      }
      d.setDate(d.getDate() + 1);
    }
    return new Date(year, month - 1, 14);
  }

  const handleGenerateFixedSessions = (groupId: string, month: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.schedule) return;

    const { weekOfMonth, dayOfWeek, hour, minute } = group.schedule;
    const [yearStr, moStr] = month.split('-');
    const year = parseInt(yearStr);
    const mo   = parseInt(moStr);

    const sessionDate = getNthWeekday(year, mo, dayOfWeek, weekOfMonth);
    sessionDate.setHours(hour, minute, 0, 0);

    const sessionId = `fs-gen-${groupId}-${month}`;

    // Check if already generated
    if (sessions.some(s => s.id === sessionId)) return;

    const newSession: MastermindSession = {
      id: sessionId,
      groupId,
      month,
      sessionNumber: 1,
      date: sessionDate,
      status: 'scheduled',
      zoomLink: `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`,
      sessionType: 'fixed_slot',
    };

    const newRegistrations: SessionRegistration[] = group.memberIds.map(proId => ({
      id: `r-gen-${Date.now()}-${proId}`,
      sessionId,
      groupId,
      proId,
      registeredDate: new Date(),
      attended: null,
    }));

    setSessions(prev => [...prev, newSession]);
    setRegistrations(prev => [...prev, ...newRegistrations]);
  };

  const handleSendInvitations = (groupId: string, month: string) => {
    setSessions(prev =>
      prev.map(s =>
        s.groupId === groupId && s.month === month && s.status === 'scheduled'
          ? { ...s, status: 'invitations_sent' }
          : s
      )
    );
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s));
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeGroup = activeTabId !== 'list' ? groups.find(g => g.id === activeTabId) ?? null : null;

  return (
    <div className="min-h-screen bg-[#F3F2F2] flex flex-col">
      {/* ── Global Nav Bar ─────────────────────────────────────────────────── */}
      <header className="bg-[#032D60] flex-shrink-0" style={{ minHeight: 48 }}>
        <div className="flex items-center h-12 px-4 gap-3">
          {/* Logo */}
          <img src="/mastermind-vision-type/ramsey-logo.svg" alt="Ramsey Solutions" className="h-7 w-auto flex-shrink-0" />

          {/* App title */}
          <span className="text-[#A8C8F8] text-[12px] hidden sm:block">|</span>
          <span className="text-[#A8C8F8] text-[12px] hidden sm:block">Masterminds</span>
        </div>

        {/* ── Record Tab Strip ───────────────────────────────────────────── */}
        <div className="flex items-end bg-[#01284F] overflow-x-auto" style={{ minHeight: 34 }}>
          {/* List view tab */}
          <button
            onClick={() => setActiveTabId('list')}
            className={`flex items-center gap-1.5 px-4 text-[12px] whitespace-nowrap transition-colors flex-shrink-0 relative ${
              activeTabId === 'list'
                ? 'bg-[#F3F2F2] text-[#032D60] font-semibold pt-[3px] pb-[7px] border-t-2 border-t-[#0176D3]'
                : 'text-[#A8C8F8] hover:bg-white/10 py-[6px]'
            }`}
          >
            <List className="w-3 h-3" />
            Mastermind Groups
          </button>

          {/* Open group record tabs */}
          {openTabIds.map(gid => {
            const g = groups.find(gr => gr.id === gid);
            if (!g) return null;
            const isActive = activeTabId === gid;
            return (
              <button
                key={gid}
                onClick={() => setActiveTabId(gid)}
                className={`flex items-center gap-1.5 px-3 text-[12px] whitespace-nowrap transition-colors flex-shrink-0 group relative ${
                  isActive
                    ? 'bg-[#F3F2F2] text-[#032D60] font-semibold pt-[3px] pb-[7px] border-t-2 border-t-[#0176D3]'
                    : 'text-[#A8C8F8] hover:bg-white/10 py-[6px]'
                }`}
              >
                <span className="max-w-[140px] truncate">{g.name}</span>
                <span
                  onClick={e => closeTab(gid, e)}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded p-0.5 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </button>
            );
          })}

          {/* New button */}
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1 px-3 py-[6px] text-[#A8C8F8] text-[12px] hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {activeTabId === 'list' ? (
          <GroupListView
            groups={groups}
            coaches={coaches}
            sessions={sessions}
            registrations={registrations}
            onOpenGroup={openGroupTab}
            onNewGroup={() => setShowCreateGroup(true)}
          />
        ) : activeTabId === 'reports' ? (
          <AttendanceReport
            groups={groups}
            coaches={coaches}
            sessions={sessions}
            registrations={registrations}
          />
        ) : activeGroup ? (
          <GroupRecordPage
            group={activeGroup}
            coach={coaches.find(c => c.id === activeGroup.coachId)!}
            members={pros.filter(p => activeGroup.memberIds.includes(p.id))}
            sessions={sessions.filter(s => s.groupId === activeGroup.id)}
            registrations={registrations.filter(r => r.groupId === activeGroup.id)}
            onBackToList={() => setActiveTabId('list')}
            onManageMembers={() => setShowManageMembers(true)}
            onCreateSessions={() => setShowCreateSessions(true)}
            onSendInvitations={handleSendInvitations}
            onStartSession={() => {}}
            onCompleteSession={handleCompleteSession}
            onUpdateGroup={handleUpdateGroup}
            onSyncAttendance={handleSyncAttendance}
            onGenerateFixedSessions={(month) => handleGenerateFixedSessions(activeGroup.id, month)}
          />
        ) : null}
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showCreateGroup && (
        <CreateGroupModal coaches={coaches} pros={pros} onClose={() => setShowCreateGroup(false)} onCreate={handleCreateGroup} />
      )}
      {showManageMembers && activeGroup && (
        <ManageMembersModal group={activeGroup} allPros={pros} onClose={() => setShowManageMembers(false)} onUpdate={handleUpdateMembers} />
      )}
      {showCreateSessions && activeGroup && (
        <CreateSessionsModal
          group={activeGroup}
          existingMonths={[...new Set(sessions.filter(s => s.groupId === activeGroup.id).map(s => s.month))]}
          onClose={() => setShowCreateSessions(false)}
          onCreate={handleCreateSessions}
        />
      )}
    </div>
  );
}
