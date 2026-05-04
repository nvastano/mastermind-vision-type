import { useState } from 'react';
import { Plus, Search, Bell, HelpCircle, Settings, Grid3X3, ChevronDown, X, List, BarChart2 } from 'lucide-react';
import { GroupListView } from './components/GroupListView';
import { GroupRecordPage } from './components/GroupRecordPage';
import { CreateGroupModal } from './components/CreateGroupModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { CreateSessionsModal } from './components/CreateSessionsModal';
import { RegistrationsModal } from './components/RegistrationsModal';
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

export type MastermindGroup = {
  id: string;
  name: string;
  coachId: string;
  memberIds: string[];
  createdDate: Date;
  status: 'active' | 'inactive';
};

export type MastermindSession = {
  id: string;
  groupId: string;
  month: string;
  sessionNumber: 1 | 2 | 3;
  date: Date;
  status: 'scheduled' | 'invitations_sent' | 'completed' | 'cancelled';
  zoomLink: string;
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
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [registrationsContext, setRegistrationsContext] = useState<{ groupId: string; month: string } | null>(null);

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
      sessionNumber: (i + 1) as 1 | 2 | 3,
      date,
      status: 'scheduled',
      zoomLink: `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`,
    }));
    setSessions(prev => [...prev, ...newSessions]);
    setShowCreateSessions(false);
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

  const handleRegisterPro = (sessionId: string, groupId: string, proId: string, month: string) => {
    const monthSessionIds = sessions.filter(s => s.groupId === groupId && s.month === month).map(s => s.id);
    const existingReg = registrations.find(r => r.groupId === groupId && r.proId === proId && monthSessionIds.includes(r.sessionId));
    if (existingReg?.sessionId === sessionId) {
      setRegistrations(prev => prev.filter(r => r.id !== existingReg.id));
    } else {
      const filtered = existingReg ? registrations.filter(r => r.id !== existingReg.id) : registrations;
      setRegistrations([...filtered, { id: `r${Date.now()}`, sessionId, groupId, proId, registeredDate: new Date(), attended: null }]);
    }
  };

  const handleMarkAttendance = (registrationId: string, attended: boolean) => {
    setRegistrations(prev => prev.map(r => r.id === registrationId ? { ...r, attended } : r));
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s));
  };

  const handleStartSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.zoomLink) window.open(session.zoomLink, '_blank');
  };

  const handleOpenRegistrations = (groupId: string, month: string) => {
    setRegistrationsContext({ groupId, month });
    setShowRegistrations(true);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeGroup = activeTabId !== 'list' ? groups.find(g => g.id === activeTabId) ?? null : null;

  const regModalData = registrationsContext ? (() => {
    const { groupId, month } = registrationsContext;
    const monthSessions = sessions.filter(s => s.groupId === groupId && s.month === month);
    const monthSessionIds = monthSessions.map(s => s.id);
    return {
      group: groups.find(g => g.id === groupId)!,
      month,
      sessions: monthSessions,
      registrations: registrations.filter(r => monthSessionIds.includes(r.sessionId)),
      members: pros.filter(p => groups.find(g => g.id === groupId)?.memberIds.includes(p.id)),
    };
  })() : null;

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
            onOpenRegistrations={handleOpenRegistrations}
            onStartSession={handleStartSession}
            onCompleteSession={handleCompleteSession}
            onUpdateGroup={handleUpdateGroup}
            onSyncAttendance={handleSyncAttendance}
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
      {showRegistrations && regModalData && (
        <RegistrationsModal
          group={regModalData.group}
          month={regModalData.month}
          sessions={regModalData.sessions}
          registrations={regModalData.registrations}
          members={regModalData.members}
          onClose={() => setShowRegistrations(false)}
          onSendInvitations={handleSendInvitations}
          onRegisterPro={handleRegisterPro}
          onMarkAttendance={handleMarkAttendance}
          onStartSession={handleStartSession}
          onCompleteSession={handleCompleteSession}
        />
      )}
    </div>
  );
}
