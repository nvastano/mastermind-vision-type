import type { MastermindGroup, MastermindSession, SessionRegistration, FixedSlot } from '../app/App';

// ── Coaches (matches App.tsx) ─────────────────────────────────────────────────
const COACHES = [
  { id: 'c1', name: 'David LaBahn'         },
  { id: 'c2', name: 'Tori Wheeler'         },
  { id: 'c3', name: 'Colin Bellios'        },
  { id: 'c4', name: 'Katrien Shaw'         },
  { id: 'c5', name: 'Angelica Dotson'      },
  { id: 'c6', name: 'Lily Lee'             },
  { id: 'c7', name: 'Ashley Cook'          },
  { id: 'c8', name: 'Cynthia Navarro'      },
  { id: 'c9', name: 'Conner Brooke Binkley'},
  { id: 'c10', name: 'Justin Nguyen'       },
  { id: 'c11', name: 'Kevin Dunn'          },
  { id: 'c12', name: 'Sarah Francis'       },
];
void COACHES; // referenced only for documentation

// ── Helper ────────────────────────────────────────────────────────────────────
function proRange(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    `pro-${String(start + i).padStart(4, '0')}`
  );
}

// ── Fixed slots ───────────────────────────────────────────────────────────────
const DAVID_SLOTS: FixedSlot[] = [
  { id: 'fs-d-1', label: 'Group 1', dayOfWeek: 1, hour: 10, minute: 0,  memberIds: proRange(1,  20) },
  { id: 'fs-d-2', label: 'Group 2', dayOfWeek: 3, hour: 14, minute: 0,  memberIds: proRange(21, 40) },
  { id: 'fs-d-3', label: 'Group 3', dayOfWeek: 5, hour: 18, minute: 0,  memberIds: proRange(41, 60) },
];

const TORI_SLOTS: FixedSlot[] = [
  { id: 'fs-t-1', label: 'Group 1', dayOfWeek: 1, hour:  9, minute:  0, memberIds: proRange(61,  80) },
  { id: 'fs-t-2', label: 'Group 2', dayOfWeek: 3, hour: 13, minute:  0, memberIds: proRange(81, 100) },
  { id: 'fs-t-3', label: 'Group 3', dayOfWeek: 5, hour:  9, minute: 30, memberIds: proRange(101, 120) },
];

const COLIN_SLOTS: FixedSlot[] = [
  { id: 'fs-c-1', label: 'Group 1', dayOfWeek: 2, hour: 11, minute:  0, memberIds: proRange(121, 140) },
  { id: 'fs-c-2', label: 'Group 2', dayOfWeek: 4, hour: 15, minute:  0, memberIds: proRange(141, 160) },
  { id: 'fs-c-3', label: 'Group 3', dayOfWeek: 1, hour: 19, minute:  0, memberIds: proRange(161, 180) },
];

const KATRIEN_SLOTS: FixedSlot[] = [
  { id: 'fs-k-1', label: 'Group 1', dayOfWeek: 2, hour: 10, minute: 30, memberIds: proRange(181, 200) },
  { id: 'fs-k-2', label: 'Group 2', dayOfWeek: 4, hour: 14, minute: 30, memberIds: proRange(201, 220) },
  { id: 'fs-k-3', label: 'Group 3', dayOfWeek: 2, hour: 17, minute: 30, memberIds: proRange(221, 240) },
];

const ANGELICA_SLOTS: FixedSlot[] = [
  { id: 'fs-a-1', label: 'Group 1', dayOfWeek: 3, hour:  9, minute: 30, memberIds: proRange(241, 260) },
  { id: 'fs-a-2', label: 'Group 2', dayOfWeek: 5, hour: 13, minute: 30, memberIds: proRange(261, 280) },
  { id: 'fs-a-3', label: 'Group 3', dayOfWeek: 4, hour: 18, minute:  0, memberIds: proRange(281, 300) },
];

// ── Groups — all Fixed ────────────────────────────────────────────────────────
export const SEED_GROUPS: MastermindGroup[] = [
  {
    id: 'sg-1',
    name: "David LaBahn Mastermind",
    coachId: 'c1',
    memberIds: proRange(1, 60),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: DAVID_SLOTS,
  },
  {
    id: 'sg-2',
    name: "Tori Wheeler Mastermind",
    coachId: 'c2',
    memberIds: proRange(61, 120),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: TORI_SLOTS,
  },
  {
    id: 'sg-3',
    name: "Colin Bellios Mastermind",
    coachId: 'c3',
    memberIds: proRange(121, 180),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: COLIN_SLOTS,
  },
  {
    id: 'sg-4',
    name: "Katrien Shaw Mastermind",
    coachId: 'c4',
    memberIds: proRange(181, 240),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: KATRIEN_SLOTS,
  },
  {
    id: 'sg-5',
    name: "Angelica Dotson Mastermind",
    coachId: 'c5',
    memberIds: proRange(241, 300),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: ANGELICA_SLOTS,
  },
];

// ── Month configs (shared shape, different days per coach) ────────────────────
type MonthConfig = {
  key: string;
  status: MastermindSession['status'];
  slotDays: [number, number, number];
  makeupDay: number;
};

const DAVID_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed',        slotDays: [9,  11, 13], makeupDay: 27 },
  { key: '2026-04', status: 'completed',        slotDays: [13, 15, 17], makeupDay: 24 },
  { key: '2026-05', status: 'invitations_sent', slotDays: [11, 13, 15], makeupDay: 29 },
];

const TORI_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed',        slotDays: [9,  11, 13], makeupDay: 27 },
  { key: '2026-04', status: 'completed',        slotDays: [13, 15, 17], makeupDay: 24 },
  { key: '2026-05', status: 'invitations_sent', slotDays: [11, 13, 15], makeupDay: 29 },
];

const COLIN_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed',        slotDays: [10, 12, 16], makeupDay: 26 },
  { key: '2026-04', status: 'completed',        slotDays: [14, 16, 20], makeupDay: 30 },
  { key: '2026-05', status: 'invitations_sent', slotDays: [12, 14, 18], makeupDay: 28 },
];

const KATRIEN_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed',        slotDays: [10, 12, 17], makeupDay: 26 },
  { key: '2026-04', status: 'completed',        slotDays: [14, 16, 21], makeupDay: 30 },
  { key: '2026-05', status: 'invitations_sent', slotDays: [12, 14, 19], makeupDay: 28 },
];

const ANGELICA_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed',        slotDays: [4,  6,  12], makeupDay: 27 },
  { key: '2026-04', status: 'completed',        slotDays: [8,  10, 16], makeupDay: 24 },
  { key: '2026-05', status: 'invitations_sent', slotDays: [6,   8, 14], makeupDay: 29 },
];

// ── Session builder (reused for all 5 fixed groups) ───────────────────────────
function buildFixedSessions(
  groupId: string,
  slots: FixedSlot[],
  months: MonthConfig[],
  idPrefix: string,
  zoomBase: number,
): MastermindSession[] {
  return months.flatMap((month, mi) => {
    const [year, mo] = month.key.split('-').map(Number);
    const slotSessions: MastermindSession[] = slots.map((slot, si) => ({
      id:            `ss-${idPrefix}-${mi + 1}-${si + 1}`,
      groupId,
      month:         month.key,
      sessionNumber: si + 1,
      date:          new Date(year, mo - 1, month.slotDays[si], slot.hour, slot.minute),
      status:        month.status,
      zoomLink:      `https://zoom.us/j/${zoomBase + mi * 1000 + si}`,
      sessionType:   'fixed_slot' as const,
      slotId:        slot.id,
    }));
    const makeup: MastermindSession = {
      id:            `ss-${idPrefix}-${mi + 1}-4`,
      groupId,
      month:         month.key,
      sessionNumber: 4,
      date:          new Date(year, mo - 1, month.makeupDay, 12, 0),
      status:        month.status,
      zoomLink:      `https://zoom.us/j/${zoomBase + mi * 1000 + 3}`,
      sessionType:   'makeup' as const,
    };
    return [...slotSessions, makeup];
  });
}

const davidSessions   = buildFixedSessions('sg-1', DAVID_SLOTS,   DAVID_MONTHS,   'd', 810_000_000);
const toriSessions    = buildFixedSessions('sg-2', TORI_SLOTS,    TORI_MONTHS,    't', 820_000_000);
const colinSessions   = buildFixedSessions('sg-3', COLIN_SLOTS,   COLIN_MONTHS,   'c', 830_000_000);
const katrienSessions = buildFixedSessions('sg-4', KATRIEN_SLOTS, KATRIEN_MONTHS, 'k', 840_000_000);
const angelicaSessions = buildFixedSessions('sg-5', ANGELICA_SLOTS, ANGELICA_MONTHS, 'a', 850_000_000);

export const SEED_SESSIONS: MastermindSession[] = [
  ...davidSessions,
  ...toriSessions,
  ...colinSessions,
  ...katrienSessions,
  ...angelicaSessions,
];

// ── Registration builder (reused for all 5 fixed groups) ─────────────────────
function buildFixedRegs(
  groupId: string,
  slots: FixedSlot[],
  months: MonthConfig[],
  idPrefix: string,
  startRegIdx: number,
): { regs: SessionRegistration[]; nextIdx: number } {
  const regs: SessionRegistration[] = [];
  let regIdx = startRegIdx;

  months.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const noShows: string[] = [];

    slots.forEach((slot, si) => {
      const sessionId = `ss-${idPrefix}-${mi + 1}-${si + 1}`;
      const session   = SEED_SESSIONS.find(s => s.id === sessionId)!;

      slot.memberIds.forEach((proId, k) => {
        let attended: boolean | null = null;
        if (isCompleted) {
          attended = k < 17 ? true : k < 19 ? false : null;
          if (k >= 17 && k < 19) noShows.push(proId);
        }
        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId,
          groupId,
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
          attended,
        });
      });
    });

    if (isCompleted) {
      // Register no-shows in makeup; 4 attend, rest no-show
      const makeupId = `ss-${idPrefix}-${mi + 1}-4`;
      const makeupSession = SEED_SESSIONS.find(s => s.id === makeupId)!;
      noShows.forEach((proId, k) => {
        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId:      makeupId,
          groupId,
          proId,
          registeredDate: new Date(makeupSession.date.getTime() - 5 * 24 * 60 * 60 * 1000),
          attended:       k < 4 ? true : false,
        });
      });
    }
    // For invitations_sent months, fixed group members are auto-registered via the session
    // generator; no seed registrations needed (they'll be generated when coach creates sessions)
  });

  return { regs, nextIdx: regIdx };
}

export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const allRegs: SessionRegistration[] = [];
  let idx = 0;

  const d = buildFixedRegs('sg-1', DAVID_SLOTS,    DAVID_MONTHS,    'd', idx);
  allRegs.push(...d.regs); idx = d.nextIdx;

  const t = buildFixedRegs('sg-2', TORI_SLOTS,     TORI_MONTHS,     't', idx);
  allRegs.push(...t.regs); idx = t.nextIdx;

  const c = buildFixedRegs('sg-3', COLIN_SLOTS,    COLIN_MONTHS,    'c', idx);
  allRegs.push(...c.regs); idx = c.nextIdx;

  const k = buildFixedRegs('sg-4', KATRIEN_SLOTS,  KATRIEN_MONTHS,  'k', idx);
  allRegs.push(...k.regs); idx = k.nextIdx;

  const a = buildFixedRegs('sg-5', ANGELICA_SLOTS, ANGELICA_MONTHS, 'a', idx);
  allRegs.push(...a.regs); idx = a.nextIdx;

  void idx;
  return allRegs;
})();
