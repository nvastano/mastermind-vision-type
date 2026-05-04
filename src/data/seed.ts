import type { MastermindGroup, MastermindSession, SessionRegistration, FixedSlot } from '../app/App';

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

// ── Groups ────────────────────────────────────────────────────────────────────
export const SEED_GROUPS: MastermindGroup[] = [
  // ── Fixed ──────────────────────────────────────────────────────────────────
  {
    id: 'sg-1',
    name: 'David LaBahn Mastermind',
    coachId: 'c1',
    memberIds: proRange(1, 60),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: DAVID_SLOTS,
  },
  {
    id: 'sg-2',
    name: 'Tori Wheeler Mastermind',
    coachId: 'c2',
    memberIds: proRange(61, 120),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: TORI_SLOTS,
  },
  {
    id: 'sg-3',
    name: 'Colin Bellios Mastermind',
    coachId: 'c3',
    memberIds: proRange(121, 180),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: COLIN_SLOTS,
  },
  // ── Flexible ───────────────────────────────────────────────────────────────
  {
    id: 'sg-4',
    name: 'Katrien Shaw Mastermind',
    coachId: 'c4',
    memberIds: proRange(181, 240),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  {
    id: 'sg-5',
    name: 'Angelica Dotson Mastermind',
    coachId: 'c5',
    memberIds: proRange(241, 300),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  {
    id: 'sg-6',
    name: 'Lily Lee Mastermind',
    coachId: 'c6',
    memberIds: proRange(301, 360),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
];

// ── Shared month configs ──────────────────────────────────────────────────────
type MonthConfig = {
  key: string;
  status: MastermindSession['status'];
  slotDays: [number, number, number];
  makeupDay: number;
};

// Fixed group month configs
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

// ── Fixed session builder ─────────────────────────────────────────────────────
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

// ── Flexible session configs ──────────────────────────────────────────────────
type FlexMonth = { key: string; days: [number,number,number]; status: MastermindSession['status'] };

const FLEX_MONTHS: FlexMonth[] = [
  { key: '2026-03', days: [11, 18, 25], status: 'completed'        },
  { key: '2026-04', days: [ 9, 16, 23], status: 'completed'        },
  { key: '2026-05', days: [ 7, 14, 21], status: 'invitations_sent' },
];

const FLEX_GROUPS = [
  { groupId: 'sg-4', idPrefix: 'k4', zoomBase: 860_000_000, times: [[10,30],[14,30],[17,30]] as [number,number][] },
  { groupId: 'sg-5', idPrefix: 'a5', zoomBase: 870_000_000, times: [[ 9,30],[13,30],[18, 0]] as [number,number][] },
  { groupId: 'sg-6', idPrefix: 'l6', zoomBase: 880_000_000, times: [[ 9, 0],[13, 0],[17, 0]] as [number,number][] },
];

function buildFlexSessions(): MastermindSession[] {
  return FLEX_GROUPS.flatMap(({ groupId, idPrefix, zoomBase, times }) =>
    FLEX_MONTHS.flatMap((month, mi) =>
      ([0, 1, 2] as const).map(opt => {
        const [hour, min] = times[opt];
        const [year, mo] = month.key.split('-').map(Number);
        return {
          id:            `ss-${idPrefix}-${mi + 1}-${opt + 1}`,
          groupId,
          month:         month.key,
          sessionNumber: opt + 1,
          date:          new Date(year, mo - 1, month.days[opt], hour, min),
          status:        month.status,
          zoomLink:      `https://zoom.us/j/${zoomBase + mi * 1000 + opt}`,
          sessionType:   'option' as const,
        };
      })
    )
  );
}

// ── Build all sessions ────────────────────────────────────────────────────────
export const SEED_SESSIONS: MastermindSession[] = [
  ...buildFixedSessions('sg-1', DAVID_SLOTS, DAVID_MONTHS, 'd', 810_000_000),
  ...buildFixedSessions('sg-2', TORI_SLOTS,  TORI_MONTHS,  't', 820_000_000),
  ...buildFixedSessions('sg-3', COLIN_SLOTS, COLIN_MONTHS, 'c', 830_000_000),
  ...buildFlexSessions(),
];

// ── Registration builders ─────────────────────────────────────────────────────

// Fixed group registrations
function buildFixedRegs(
  groupId: string,
  slots: FixedSlot[],
  months: MonthConfig[],
  idPrefix: string,
  startIdx: number,
): { regs: SessionRegistration[]; nextIdx: number } {
  const regs: SessionRegistration[] = [];
  let idx = startIdx;

  months.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const noShows: string[] = [];

    slots.forEach((slot, si) => {
      const sessionId = `ss-${idPrefix}-${mi + 1}-${si + 1}`;
      const session = SEED_SESSIONS.find(s => s.id === sessionId)!;
      slot.memberIds.forEach((proId, k) => {
        const attended: boolean | null = isCompleted
          ? (k < 17 ? true : k < 19 ? false : null)
          : null;
        if (isCompleted && k >= 17 && k < 19) noShows.push(proId);
        regs.push({
          id: `sr-${++idx}`,
          sessionId,
          groupId,
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 86400000),
          attended,
        });
      });
    });

    if (isCompleted && noShows.length) {
      const makeupId = `ss-${idPrefix}-${mi + 1}-4`;
      const makeupSession = SEED_SESSIONS.find(s => s.id === makeupId)!;
      noShows.forEach((proId, k) => {
        regs.push({
          id: `sr-${++idx}`,
          sessionId: makeupId,
          groupId,
          proId,
          registeredDate: new Date(makeupSession.date.getTime() - 5 * 86400000),
          attended: k < 4 ? true : false,
        });
      });
    }
  });

  return { regs, nextIdx: idx };
}

// Flexible group registrations
function buildFlexRegs(
  groupIdx: number, // index into FLEX_GROUPS
  startIdx: number,
): { regs: SessionRegistration[]; nextIdx: number } {
  const regs: SessionRegistration[] = [];
  let idx = startIdx;

  const { groupId, idPrefix } = FLEX_GROUPS[groupIdx];
  const group = SEED_GROUPS.find(g => g.id === groupId)!;
  const memberIds = group.memberIds;

  FLEX_MONTHS.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const countToReg = isCompleted ? 45 : 30;

    const sessionIds = ([0, 1, 2] as const).map(
      opt => `ss-${idPrefix}-${mi + 1}-${opt + 1}`
    );

    // Pick members in a spread pattern so all 3 sessions get attendees
    const offset = groupIdx * 17 + mi * 7;
    const registering = Array.from({ length: countToReg }, (_, k) =>
      memberIds[(offset + k * 3) % memberIds.length]
    );

    registering.forEach((proId, k) => {
      const sessionId = sessionIds[(k + groupIdx + mi) % 3];
      const session = SEED_SESSIONS.find(s => s.id === sessionId)!;

      let attended: boolean | null = null;
      if (isCompleted) {
        const roll = (k * 13 + groupIdx * 7 + mi * 3) % 20;
        attended = roll < 17 ? true : roll < 19 ? false : null;
      }

      regs.push({
        id: `sr-${++idx}`,
        sessionId,
        groupId,
        proId,
        registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 86400000),
        attended,
      });
    });
  });

  return { regs, nextIdx: idx };
}

// ── Build all registrations ───────────────────────────────────────────────────
export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const all: SessionRegistration[] = [];
  let idx = 0;

  const d = buildFixedRegs('sg-1', DAVID_SLOTS, DAVID_MONTHS, 'd', idx);
  all.push(...d.regs); idx = d.nextIdx;

  const t = buildFixedRegs('sg-2', TORI_SLOTS, TORI_MONTHS, 't', idx);
  all.push(...t.regs); idx = t.nextIdx;

  const c = buildFixedRegs('sg-3', COLIN_SLOTS, COLIN_MONTHS, 'c', idx);
  all.push(...c.regs); idx = c.nextIdx;

  const k = buildFlexRegs(0, idx);
  all.push(...k.regs); idx = k.nextIdx;

  const a = buildFlexRegs(1, idx);
  all.push(...a.regs); idx = a.nextIdx;

  const l = buildFlexRegs(2, idx);
  all.push(...l.regs); idx = l.nextIdx;

  void idx;
  return all;
})();
