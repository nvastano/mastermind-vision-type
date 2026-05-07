import type { MastermindGroup, MastermindSession, SessionRegistration } from '../app/App';

// ── Helpers ───────────────────────────────────────────────────────────────────

function proRange(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    `pro-${String(start + i).padStart(4, '0')}`
  );
}

// ── Flexible groups ───────────────────────────────────────────────────────────
// 3 coaches × 60 pros each = 180 pros total (pro-0001 through pro-0180)

// 3 groups × 300 pros each = 900 assigned; pros 901–2000 are in the unassigned pool
export const SEED_GROUPS: MastermindGroup[] = [
  { id: 'sg-4', name: 'Katrien Shaw Mastermind',    coachId: 'c4', memberIds: proRange(1,   300), createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
  { id: 'sg-5', name: 'Angelica Dotson Mastermind', coachId: 'c5', memberIds: proRange(301, 600), createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
  { id: 'sg-6', name: 'Lily Lee Mastermind',        coachId: 'c6', memberIds: proRange(601, 900), createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
];

// ── Flexible session builder ──────────────────────────────────────────────────
// Each month has 3 session options on different days/times

type FlexMonth = { key: string; days: [number, number, number]; status: MastermindSession['status'] };

const FLEX_MONTHS: FlexMonth[] = [
  { key: '2026-03', days: [11, 18, 25], status: 'completed'        },
  { key: '2026-04', days: [ 9, 16, 23], status: 'completed'        },
  { key: '2026-05', days: [ 7, 14, 21], status: 'invitations_sent' },
];

const FLEX_SCHEDULE = [
  { groupId: 'sg-4', idPrefix: 'k4', zoomBase: 860_000_000, times: [[10, 30], [14, 30], [17, 30]] as [number, number][] },
  { groupId: 'sg-5', idPrefix: 'a5', zoomBase: 870_000_000, times: [[ 9, 30], [13, 30], [18,  0]] as [number, number][] },
  { groupId: 'sg-6', idPrefix: 'l6', zoomBase: 880_000_000, times: [[ 9,  0], [13,  0], [17,  0]] as [number, number][] },
];

function buildFlexSessions(): MastermindSession[] {
  return FLEX_SCHEDULE.flatMap(({ groupId, idPrefix, zoomBase, times }) =>
    FLEX_MONTHS.flatMap((month, mi) =>
      ([0, 1, 2] as const).map(opt => {
        const [hour, min] = times[opt];
        const [year, mo]  = month.key.split('-').map(Number);
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

export const SEED_SESSIONS: MastermindSession[] = buildFlexSessions();

// ── Registration builder ──────────────────────────────────────────────────────

function buildFlexRegs(
  groupIdx: number,
  startIdx: number,
): { regs: SessionRegistration[]; nextIdx: number } {
  const regs: SessionRegistration[] = [];
  let idx = startIdx;

  const { groupId, idPrefix } = FLEX_SCHEDULE[groupIdx];
  const group     = SEED_GROUPS.find(g => g.id === groupId)!;
  const memberIds = group.memberIds;

  FLEX_MONTHS.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const countToReg  = isCompleted ? 45 : 30;
    const sessionIds  = ([0, 1, 2] as const).map(opt => `ss-${idPrefix}-${mi + 1}-${opt + 1}`);
    const offset      = groupIdx * 17 + mi * 7;
    const registering = Array.from({ length: countToReg }, (_, k) =>
      memberIds[(offset + k * 3) % memberIds.length]
    );

    registering.forEach((proId, k) => {
      const sessionId = sessionIds[(k + groupIdx + mi) % 3];
      const session   = SEED_SESSIONS.find(s => s.id === sessionId);
      if (!session) return;

      let attended: boolean | null = null;
      if (isCompleted) {
        const roll = (k * 13 + groupIdx * 7 + mi * 3) % 20;
        attended = roll < 17 ? true : roll < 19 ? false : null;
      }

      regs.push({
        id:             `sr-${++idx}`,
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

export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const all: SessionRegistration[] = [];
  let idx = 0;

  const k = buildFlexRegs(0, idx); all.push(...k.regs); idx = k.nextIdx;
  const a = buildFlexRegs(1, idx); all.push(...a.regs); idx = a.nextIdx;
  const l = buildFlexRegs(2, idx); all.push(...l.regs); idx = l.nextIdx;

  void idx;
  return all;
})();
