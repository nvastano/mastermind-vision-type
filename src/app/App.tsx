import { useState } from 'react';
import { Plus, Search, Bell, HelpCircle, Settings, Grid3X3, ChevronDown, X, List, BarChart2 } from 'lucide-react';
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

export type FixedSlot = {
  id: string;
  label: string;       // "Cohort 1", "Cohort 2", "Cohort 3"
  dayOfWeek: number;   // 0=Sun, 1=Mon ... 6=Sat
  hour: number;
  minute: number;
  memberIds: string[]; // which pros belong to this cohort
};

export type MastermindGroup = {
  id: string;
  name: string;
  coachId: string;
  memberIds: string[];
  createdDate: Date;
  status: 'active' | 'inactive';
  type: 'flexible' | 'fixed';
  fixedSlots?: FixedSlot[];
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
    { id: 'c1', name: 'David LaBahn',  email: 'david.labahn@ramseyrealty.com' },
    { id: 'c2', name: 'Tori',          email: 'tori@ramseyrealty.com' },
    { id: 'c3', name: 'Colin',         email: 'colin@ramseyrealty.com' },
    { id: 'c4', name: 'Katrien',       email: 'katrien@ramseyrealty.com' },
    { id: 'c5', name: 'Angelica',      email: 'angelica@ramseyrealty.com' },
  ]);

  // 300 pros — seeded from static data, persisted in localStorage
  const [pros] = useLocalStorage<Pro[]>('rt-pros', SEED_PROS);

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
    const newGroup: MastermindGroup = { ...group, id: `g${Date.now()}`, createdDate: new Date() };
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

  /** Returns the last occurrence of dayOfWeek in the given month */
  function getLastWeekday(year: number, month: number, dayOfWeek: number): Date {
    const d = new Date(year, month, 0); // last day of month
    while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() - 1);
    return new Date(d);
  }

  /**
   * Generates this month's sessions for a fixed group:
   * 3 fixed_slot sessions (one per cohort) + 1 makeup session.
   * Also auto-creates SessionRegistrations for every cohort member in their slot.
   */
  const handleGenerateFixedSessions = (groupId: string, month: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.fixedSlots || group.fixedSlots.length === 0) return;

    const [yearStr, moStr] = month.split('-');
    const year = parseInt(yearStr);
    const mo   = parseInt(moStr);

    const newSessions: MastermindSession[] = [];
    const newRegistrations: SessionRegistration[] = [];

    // Create one session per fixed slot (2nd occurrence of that weekday)
    group.fixedSlots.forEach((slot, i) => {
      const sessionDate = getNthWeekday(year, mo, slot.dayOfWeek, 2);
      sessionDate.setHours(slot.hour, slot.minute, 0, 0);

      const sessionId = `fs-gen-${groupId}-${month}-${slot.id}`;
      newSessions.push({
        id: sessionId,
        groupId,
        month,
        sessionNumber: i + 1,
        date: sessionDate,
        status: 'scheduled',
        zoomLink: `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`,
        sessionType: 'fixed_slot',
        slotId: slot.id,
      });

      // Auto-register every cohort member
      slot.memberIds.forEach(proId => {
        newRegistrations.push({
          id: `r-gen-${Date.now()}-${proId}-${slot.id}`,
          sessionId,
          groupId,
          proId,
          registeredDate: new Date(),
          attended: null,
        });
      });
    });

    // Create makeup session (last occurrence of the first slot's day of week, at noon)
    const makeupDate = getLastWeekday(year, mo, group.fixedSlots[0].dayOfWeek);
    makeupDate.setHours(12, 0, 0, 0);
    const makeupId = `fs-makeup-${groupId}-${month}`;
    newSessions.push({
      id: makeupId,
      groupId,
      month,
      sessionNumber: 4,
      date: makeupDate,
      status: 'scheduled',
      zoomLink: `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`,
      sessionType: 'makeup',
    });

    setSessions(prev => [...prev, ...newSessions]);
    setRegistrations(prev => [...prev, ...newRegistrations]);
  };

  /**
   * Invites specific pros to the makeup session for the given month.
   * Creates SessionRegistration records for each selected pro.
   */
  const handleInviteToMakeup = (groupId: string, month: string, proIds: string[]) => {
    const makeupSession = sessions.find(
      s => s.groupId === groupId && s.month === month && s.sessionType === 'makeup'
    );
    if (!makeupSession) return;

    const newRegistrations: SessionRegistration[] = proIds
      .filter(proId => !registrations.some(r => r.sessionId === makeupSession.id && r.proId === proId))
      .map(proId => ({
        id: `r-makeup-${Date.now()}-${proId}`,
        sessionId: makeupSession.id,
        groupId,
        proId,
        registeredDate: new Date(),
        attended: null,
      }));

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
        <div className="flex items-center h-12 px-3 gap-2">
          {/* Waffle menu */}
          <button className="p-1.5 rounded hover:bg-white/10 transition-colors text-white">
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1.5">
              {/* RT shield badge */}
              <div className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0" style={{ background: 'linear-gradient(160deg, #C8511B 0%, #E07030 100%)' }}>
                <span className="text-white text-[10px] font-black tracking-tight">RT</span>
              </div>
              <div className="hidden sm:flex flex-col leading-none gap-px">
                <span className="text-white text-[11px] font-bold tracking-wider uppercase" style={{ letterSpacing: '0.08em' }}>Ramsey</span>
                <span className="text-[#A8C8F8] text-[9px] font-normal tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>Trusted</span>
              </div>
            </div>
            <span className="text-[#A8C8F8] text-[12px] hidden sm:block mx-1">|</span>
            <span className="text-[#A8C8F8] text-[12px] hidden sm:block">Masterminds</span>
            <ChevronDown className="w-3 h-3 text-[#A8C8F8]" />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#706E6B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-white/10 border border-white/20 rounded pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-[#A8C8F8] focus:outline-none focus:bg-white/20"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Right utility icons */}
          <div className="flex items-center gap-1 ml-2">
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors text-[#A8C8F8]">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors text-[#A8C8F8]">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors text-[#A8C8F8]">
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-full bg-[#0176D3] border-2 border-white/30 flex items-center justify-center ml-1 cursor-pointer">
              <span className="text-white text-[11px] font-bold">SJ</span>
            </div>
          </div>
        </div>

        {/* ── Record Tab Strip ───────────────────────────────────────────── */}
        <div className="flex items-end bg-[#01284F] overflow-x-auto" style={{ minHeight: 32 }}>
          {/* List view tab */}
          <button
            onClick={() => setActiveTabId('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] whitespace-nowrap border-r border-white/10 transition-colors flex-shrink-0 ${
              activeTabId === 'list'
                ? 'bg-[#F3F2F2] text-[#032D60] font-normal'
                : 'text-[#A8C8F8] hover:bg-white/10'
            }`}
          >
            <List className="w-3 h-3" />
            Mastermind Groups
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Attendance report tab */}
          <button
            onClick={() => setActiveTabId('reports')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] whitespace-nowrap border-r border-white/10 transition-colors flex-shrink-0 ${
              activeTabId === 'reports'
                ? 'bg-[#F3F2F2] text-[#032D60] font-normal'
                : 'text-[#A8C8F8] hover:bg-white/10'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            Attendance
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] whitespace-nowrap border-r border-white/10 transition-colors flex-shrink-0 group ${
                  isActive
                    ? 'bg-[#F3F2F2] text-[#032D60] font-normal'
                    : 'text-[#A8C8F8] hover:bg-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-[#0176D3]' : 'bg-[#A8C8F8]'}`} />
                <span className="max-w-[140px] truncate">{g.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
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
            className="flex items-center gap-1 px-3 py-1.5 text-[#A8C8F8] text-[12px] hover:bg-white/10 transition-colors flex-shrink-0"
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
            onInviteToMakeup={(month, proIds) => handleInviteToMakeup(activeGroup.id, month, proIds)}
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
