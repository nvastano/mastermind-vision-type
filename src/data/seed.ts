import type { MastermindGroup, MastermindSession, SessionRegistration, FixedSlot } from '../app/App';

// ── Coaches (matches App.tsx) ─────────────────────────────────────────────────
const COACHES = [
  { id: 'c1', name: 'David LaBahn' },
  { id: 'c2', name: 'Tori'         },
  { id: 'c3', name: 'Colin'        },
  { id: 'c4', name: 'Katrien'      },
  { id: 'c5', name: 'Angelica'     },
];

// ── Helper to build a range of pro IDs ────────────────────────────────────────
function proRange(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    `pro-${String(start + i).padStart(4, '0')}`
  );
}

// ── Fixed slots for David (sg-1) ─────────────────────────────────────────────
const DAVID_SLOTS: FixedSlot[] = [
  { id: 'fs-d-1', label: 'Group 1', dayOfWeek: 1, hour: 10, minute: 0,  memberIds: proRange(1,  20) },
  { id: 'fs-d-2', label: 'Group 2', dayOfWeek: 3, hour: 14, minute: 0,  memberIds: proRange(21, 40) },
  { id: 'fs-d-3', label: 'Group 3', dayOfWeek: 5, hour: 18, minute: 0,  memberIds: proRange(41, 60) },
];

// ── Fixed slots for Katrien (sg-4) ────────────────────────────────────────────
const KATRIEN_SLOTS: FixedSlot[] = [
  { id: 'fs-k-1', label: 'Group 1', dayOfWeek: 2, hour: 10, minute: 30, memberIds: proRange(181, 200) },
  { id: 'fs-k-2', label: 'Group 2', dayOfWeek: 4, hour: 14, minute: 30, memberIds: proRange(201, 220) },
  { id: 'fs-k-3', label: 'Group 3', dayOfWeek: 2, hour: 17, minute: 30, memberIds: proRange(221, 240) },
];

// ── Groups — 60 pros each ─────────────────────────────────────────────────────
export const SEED_GROUPS: MastermindGroup[] = [
  // sg-1: David — Fixed
  {
    id: 'sg-1',
    name: "David LaBahn's Book",
    coachId: 'c1',
    memberIds: Array.from({ length: 60 }, (_, j) => `pro-${String(j + 1).padStart(4, '0')}`),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: DAVID_SLOTS,
  },
  // sg-2: Tori — Flexible
  {
    id: 'sg-2',
    name: "Tori's Book",
    coachId: 'c2',
    memberIds: Array.from({ length: 60 }, (_, j) => `pro-${String(60 + j + 1).padStart(4, '0')}`),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  // sg-3: Colin — Flexible
  {
    id: 'sg-3',
    name: "Colin's Book",
    coachId: 'c3',
    memberIds: Array.from({ length: 60 }, (_, j) => `pro-${String(120 + j + 1).padStart(4, '0')}`),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  // sg-4: Katrien — Fixed
  {
    id: 'sg-4',
    name: "Katrien's Book",
    coachId: 'c4',
    memberIds: Array.from({ length: 60 }, (_, j) => `pro-${String(180 + j + 1).padStart(4, '0')}`),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: KATRIEN_SLOTS,
  },
  // sg-5: Angelica — Flexible
  {
    id: 'sg-5',
    name: "Angelica's Book",
    coachId: 'c5',
    memberIds: Array.from({ length: 60 }, (_, j) => `pro-${String(240 + j + 1).padStart(4, '0')}`),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
];

// ── Session schedule config for FLEXIBLE groups ───────────────────────────────
// Each coach has 3 time slots (A / B / C) that stay consistent month-to-month
const FLEX_COACH_TIMES: [number, number][][] = [
  [[ 9,  0], [13,  0], [17,  0]],   // Tori  (index 0 → sg-2)
  [[11,  0], [15,  0], [19,  0]],   // Colin (index 1 → sg-3)
  [[ 9, 30], [13, 30], [18,  0]],   // Angelica (index 2 → sg-5)
];

type MonthConfig = {
  key: string;
  days: [number, number, number];   // day-of-month for options A / B / C
  status: MastermindSession['status'];
};

const MONTHS: MonthConfig[] = [
  { key: '2026-03', days: [11, 18, 25], status: 'completed'        },
  { key: '2026-04', days: [ 9, 16, 23], status: 'completed'        },
  { key: '2026-05', days: [ 7, 14, 21], status: 'invitations_sent' },
];

// ── Flexible group IDs (sg-2, sg-3, sg-5) ────────────────────────────────────
const FLEX_GROUPS = [
  { groupIdx: 1, coachTimesIdx: 0 }, // sg-2 Tori
  { groupIdx: 2, coachTimesIdx: 1 }, // sg-3 Colin
  { groupIdx: 4, coachTimesIdx: 2 }, // sg-5 Angelica
];

// Build flexible sessions
const flexSessions: MastermindSession[] = FLEX_GROUPS.flatMap(({ groupIdx, coachTimesIdx }) => {
  const group = SEED_GROUPS[groupIdx];
  return MONTHS.flatMap((month, mi) =>
    ([0, 1, 2] as const).map(opt => {
      const [hour, min] = FLEX_COACH_TIMES[coachTimesIdx][opt];
      const [year, mo]  = month.key.split('-').map(Number);
      return {
        id:            `ss-${groupIdx + 1}-${mi + 1}-${opt + 1}`,
        groupId:       group.id,
        month:         month.key,
        sessionNumber: opt + 1,
        date:          new Date(year, mo - 1, month.days[opt], hour, min),
        status:        month.status,
        zoomLink:      `https://zoom.us/j/${800000000 + groupIdx * 100000 + mi * 1000 + opt}`,
        sessionType:   'option' as const,
      };
    })
  );
});

// ── David's fixed sessions ────────────────────────────────────────────────────
// session 1: fixed_slot, slotId='fs-d-1', Mon 10:00 — March: day 9, April: day 13, May: day 11
// session 2: fixed_slot, slotId='fs-d-2', Wed 14:00 — March: day 11, April: day 15, May: day 13
// session 3: fixed_slot, slotId='fs-d-3', Fri 18:00 — March: day 13, April: day 17, May: day 15
// session 4: makeup, no slotId, Fri 12:00 — March: day 27, April: day 24, May: day 29
const DAVID_MONTHS = [
  { key: '2026-03', status: 'completed' as const,        slotDays: [9, 11, 13],  makeupDay: 27 },
  { key: '2026-04', status: 'completed' as const,        slotDays: [13, 15, 17], makeupDay: 24 },
  { key: '2026-05', status: 'invitations_sent' as const, slotDays: [11, 13, 15], makeupDay: 29 },
];

const davidSessions: MastermindSession[] = DAVID_MONTHS.flatMap((month, mi) => {
  const [year, mo] = month.key.split('-').map(Number);
  const slotSessions: MastermindSession[] = DAVID_SLOTS.map((slot, si) => ({
    id:            `ss-d-${mi + 1}-${si + 1}`,
    groupId:       'sg-1',
    month:         month.key,
    sessionNumber: si + 1,
    date:          new Date(year, mo - 1, month.slotDays[si], slot.hour, slot.minute),
    status:        month.status,
    zoomLink:      `https://zoom.us/j/${810000000 + mi * 1000 + si}`,
    sessionType:   'fixed_slot' as const,
    slotId:        slot.id,
  }));
  const makeupSession: MastermindSession = {
    id:            `ss-d-${mi + 1}-4`,
    groupId:       'sg-1',
    month:         month.key,
    sessionNumber: 4,
    date:          new Date(year, mo - 1, month.makeupDay, 12, 0),
    status:        month.status,
    zoomLink:      `https://zoom.us/j/${810000000 + mi * 1000 + 3}`,
    sessionType:   'makeup' as const,
  };
  return [...slotSessions, makeupSession];
});

// ── Katrien's fixed sessions ──────────────────────────────────────────────────
// session 1: fixed_slot, slotId='fs-k-1', Tue 10:30 — March: day 10, April: day 14, May: day 12
// session 2: fixed_slot, slotId='fs-k-2', Thu 14:30 — March: day 12, April: day 16, May: day 14
// session 3: fixed_slot, slotId='fs-k-3', Tue 17:30 — March: day 17, April: day 21, May: day 19
// session 4: makeup, last Thu 12:00 — March: day 26, April: day 30, May: day 28
const KATRIEN_MONTHS = [
  { key: '2026-03', status: 'completed' as const,        slotDays: [10, 12, 17], makeupDay: 26 },
  { key: '2026-04', status: 'completed' as const,        slotDays: [14, 16, 21], makeupDay: 30 },
  { key: '2026-05', status: 'invitations_sent' as const, slotDays: [12, 14, 19], makeupDay: 28 },
];

const katrienSessions: MastermindSession[] = KATRIEN_MONTHS.flatMap((month, mi) => {
  const [year, mo] = month.key.split('-').map(Number);
  const slotSessions: MastermindSession[] = KATRIEN_SLOTS.map((slot, si) => ({
    id:            `ss-k-${mi + 1}-${si + 1}`,
    groupId:       'sg-4',
    month:         month.key,
    sessionNumber: si + 1,
    date:          new Date(year, mo - 1, month.slotDays[si], slot.hour, slot.minute),
    status:        month.status,
    zoomLink:      `https://zoom.us/j/${820000000 + mi * 1000 + si}`,
    sessionType:   'fixed_slot' as const,
    slotId:        slot.id,
  }));
  const makeupSession: MastermindSession = {
    id:            `ss-k-${mi + 1}-4`,
    groupId:       'sg-4',
    month:         month.key,
    sessionNumber: 4,
    date:          new Date(year, mo - 1, month.makeupDay, 12, 0),
    status:        month.status,
    zoomLink:      `https://zoom.us/j/${820000000 + mi * 1000 + 3}`,
    sessionType:   'makeup' as const,
  };
  return [...slotSessions, makeupSession];
});

export const SEED_SESSIONS: MastermindSession[] = [
  ...davidSessions,
  ...flexSessions,
  ...katrienSessions,
];

// ── Build registrations ───────────────────────────────────────────────────────
export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const regs: SessionRegistration[] = [];
  let regIdx = 0;

  // ── Flexible groups (sg-2 Tori, sg-3 Colin, sg-5 Angelica) ─────────────────
  FLEX_GROUPS.forEach(({ groupIdx }) => {
    const group = SEED_GROUPS[groupIdx];
    const memberIds = group.memberIds;

    MONTHS.forEach((month, mi) => {
      const isCompleted = month.status === 'completed';
      const countToReg  = isCompleted ? 45 : 30;
      const sessionIds  = ([0, 1, 2] as const).map(
        opt => `ss-${groupIdx + 1}-${mi + 1}-${opt + 1}`
      );

      const offset = groupIdx * 17 + mi * 7;
      const registering = Array.from({ length: countToReg }, (_, k) =>
        memberIds[(offset + k * 3) % memberIds.length]
      );

      registering.forEach((proId, k) => {
        const sessionId  = sessionIds[(k + groupIdx + mi) % 3];
        const session    = SEED_SESSIONS.find(s => s.id === sessionId)!;

        let attended: boolean | null = null;
        if (isCompleted) {
          const roll = (k * 13 + groupIdx * 7 + mi * 3) % 20;
          attended = roll < 17 ? true : roll < 19 ? false : null;
        }

        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId,
          groupId:        group.id,
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
          attended,
        });
      });
    });
  });

  // ── Fixed group: David (sg-1) ───────────────────────────────────────────────
  // For completed months (March, April): register all cohort members for their slot session
  // Makeup sessions: register 6 no-shows (2 per cohort), 4 attend, 2 no-show
  // For May: register all cohort members, attendance = null
  DAVID_MONTHS.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';

    // Track no-shows per slot for makeup registration
    const noShows: string[] = [];

    DAVID_SLOTS.forEach((slot, si) => {
      const sessionId = `ss-d-${mi + 1}-${si + 1}`;
      const session   = SEED_SESSIONS.find(s => s.id === sessionId)!;

      slot.memberIds.forEach((proId, k) => {
        let attended: boolean | null = null;
        if (isCompleted) {
          // 17 attended, 2 no-show, 1 null per 20 members
          attended = k < 17 ? true : k < 19 ? false : null;
          if (k >= 17 && k < 19) noShows.push(proId);
        }
        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId,
          groupId:        'sg-1',
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
          attended,
        });
      });
    });

    // Makeup session registrations (completed months only)
    if (isCompleted) {
      const makeupId = `ss-d-${mi + 1}-4`;
      const makeupSession = SEED_SESSIONS.find(s => s.id === makeupId)!;
      // Register all 6 no-shows: 4 attend, 2 no-show
      noShows.forEach((proId, k) => {
        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId:      makeupId,
          groupId:        'sg-1',
          proId,
          registeredDate: new Date(makeupSession.date.getTime() - 5 * 24 * 60 * 60 * 1000),
          attended:       k < 4 ? true : false,
        });
      });
    } else {
      // May (invitations_sent): register all cohort members with null attendance
      DAVID_SLOTS.forEach((slot, si) => {
        const sessionId = `ss-d-${mi + 1}-${si + 1}`;
        const session   = SEED_SESSIONS.find(s => s.id === sessionId)!;
        slot.memberIds.forEach((proId, k) => {
          regs.push({
            id:             `sr-${++regIdx}`,
            sessionId,
            groupId:        'sg-1',
            proId,
            registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
            attended:       null,
          });
        });
      });
    }
  });

  // ── Fixed group: Katrien (sg-4) ─────────────────────────────────────────────
  KATRIEN_MONTHS.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const noShows: string[] = [];

    KATRIEN_SLOTS.forEach((slot, si) => {
      const sessionId = `ss-k-${mi + 1}-${si + 1}`;
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
          groupId:        'sg-4',
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
          attended,
        });
      });
    });

    if (isCompleted) {
      const makeupId = `ss-k-${mi + 1}-4`;
      const makeupSession = SEED_SESSIONS.find(s => s.id === makeupId)!;
      noShows.forEach((proId, k) => {
        regs.push({
          id:             `sr-${++regIdx}`,
          sessionId:      makeupId,
          groupId:        'sg-4',
          proId,
          registeredDate: new Date(makeupSession.date.getTime() - 5 * 24 * 60 * 60 * 1000),
          attended:       k < 4 ? true : false,
        });
      });
    } else {
      KATRIEN_SLOTS.forEach((slot, si) => {
        const sessionId = `ss-k-${mi + 1}-${si + 1}`;
        const session   = SEED_SESSIONS.find(s => s.id === sessionId)!;
        slot.memberIds.forEach((proId, k) => {
          regs.push({
            id:             `sr-${++regIdx}`,
            sessionId,
            groupId:        'sg-4',
            proId,
            registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 24 * 60 * 60 * 1000),
            attended:       null,
          });
        });
      });
    }
  });

  return regs;
})();
