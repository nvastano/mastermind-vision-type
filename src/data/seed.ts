import type { MastermindGroup, MastermindSession, SessionRegistration } from '../app/App';

// ── Coaches (matches App.tsx) ─────────────────────────────────────────────────
const COACHES = [
  { id: 'c1', name: 'David LaBahn' },
  { id: 'c2', name: 'Tori'         },
  { id: 'c3', name: 'Colin'        },
  { id: 'c4', name: 'Katrien'      },
  { id: 'c5', name: 'Angelica'     },
];

// ── Groups — 60 pros each ─────────────────────────────────────────────────────
export const SEED_GROUPS: MastermindGroup[] = COACHES.map((coach, i) => ({
  id: `sg-${i + 1}`,
  name: `${coach.name}'s Book`,
  coachId: coach.id,
  memberIds: Array.from({ length: 60 }, (_, j) =>
    `pro-${String(i * 60 + j + 1).padStart(4, '0')}`
  ),
  createdDate: new Date('2026-01-06'),
  status: 'active' as const,
}));

// ── Session schedule config ───────────────────────────────────────────────────
// Each coach has 3 time slots (A / B / C) that stay consistent month-to-month
const COACH_TIMES: [number, number][][] = [
  [[10,  0], [14,  0], [18,  0]],   // David LaBahn
  [[ 9,  0], [13,  0], [17,  0]],   // Tori
  [[11,  0], [15,  0], [19,  0]],   // Colin
  [[10, 30], [14, 30], [17, 30]],   // Katrien
  [[ 9, 30], [13, 30], [18,  0]],   // Angelica
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

// ── Build sessions ────────────────────────────────────────────────────────────
export const SEED_SESSIONS: MastermindSession[] = SEED_GROUPS.flatMap((group, gi) =>
  MONTHS.flatMap((month, mi) =>
    ([0, 1, 2] as const).map(opt => {
      const [hour, min] = COACH_TIMES[gi][opt];
      const [year, mo]  = month.key.split('-').map(Number);
      return {
        id:            `ss-${gi + 1}-${mi + 1}-${opt + 1}`,
        groupId:       group.id,
        month:         month.key,
        sessionNumber: (opt + 1) as 1 | 2 | 3,
        date:          new Date(year, mo - 1, month.days[opt], hour, min),
        status:        month.status,
        zoomLink:      `https://zoom.us/j/${800000000 + gi * 100000 + mi * 1000 + opt}`,
      };
    })
  )
);

// ── Build registrations ───────────────────────────────────────────────────────
// Completed months: ~45 of 60 pros registered, spread across 3 sessions (~15 each)
// May (in progress): ~30 of 60 registered so far
export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const regs: SessionRegistration[] = [];
  let regIdx = 0;

  SEED_GROUPS.forEach((group, gi) => {
    const memberIds = group.memberIds;

    MONTHS.forEach((month, mi) => {
      const isCompleted  = month.status === 'completed';
      const countToReg   = isCompleted ? 45 : 30;  // how many pros register this month
      const sessionIds   = ([0, 1, 2] as const).map(
        opt => `ss-${gi + 1}-${mi + 1}-${opt + 1}`
      );

      // Deterministically pick which pros register (offset by coach/month to vary books)
      const offset = gi * 17 + mi * 7;
      const registering = Array.from({ length: countToReg }, (_, k) =>
        memberIds[(offset + k * 3) % memberIds.length]
      );

      // Assign each registering pro to one of the 3 sessions (round-robin with variation)
      registering.forEach((proId, k) => {
        const sessionId  = sessionIds[(k + gi + mi) % 3];
        const sessionIdx = SEED_SESSIONS.findIndex(s => s.id === sessionId);
        const session    = SEED_SESSIONS[sessionIdx];

        // Attendance for completed months: 85% attended, 10% no-show, 5% not yet marked
        let attended: boolean | null = null;
        if (isCompleted) {
          const roll = (k * 13 + gi * 7 + mi * 3) % 20;
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

  return regs;
})();
