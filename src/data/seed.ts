import type { MastermindGroup, MastermindSession, SessionRegistration, GroupSchedule } from '../app/App';

// ── Helpers ───────────────────────────────────────────────────────────────────

function proRange(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    `pro-${String(start + i).padStart(4, '0')}`
  );
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): number {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (d.getMonth() === month - 1) {
    if (d.getDay() === dayOfWeek) {
      count++;
      if (count === n) return d.getDate();
    }
    d.setDate(d.getDate() + 1);
  }
  return 14;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'];
const DAY_ABBRs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Fixed group factory ───────────────────────────────────────────────────────

type CoachConfig = {
  coachId: string;
  lastName: string;
  hour: number;
  minute: number;
  proStart: number;
  idStart: number;
};

function buildFixedGroups(cfg: CoachConfig): MastermindGroup[] {
  const groups: MastermindGroup[] = [];
  let pro = cfg.proStart;
  let n   = cfg.idStart;

  for (let week = 1; week <= 4; week++) {
    for (let dow = 1; dow <= 5; dow++) {
      const schedule: GroupSchedule = {
        weekOfMonth: week,
        dayOfWeek:   dow,
        hour:        cfg.hour,
        minute:      cfg.minute,
      };
      groups.push({
        id:          `sg-f${n++}`,
        name:        `${cfg.lastName} · ${ORDINALS[week - 1]} ${DAY_ABBRs[dow]} ${formatTime(cfg.hour, cfg.minute)}`,
        coachId:     cfg.coachId,
        memberIds:   proRange(pro, pro + 14),
        createdDate: new Date('2026-01-06'),
        status:      'active',
        type:        'fixed',
        schedule,
      });
      pro += 15;
    }
  }
  return groups;
}

// ── Fixed groups (20 per coach, 300 pros each) ───────────────────────────────

const DAVID_GROUPS  = buildFixedGroups({ coachId: 'c1', lastName: 'LaBahn',  hour: 10, minute: 0, proStart: 1,   idStart: 1  });
const TORI_GROUPS   = buildFixedGroups({ coachId: 'c2', lastName: 'Wheeler', hour:  9, minute: 0, proStart: 301, idStart: 21 });
const COLIN_GROUPS  = buildFixedGroups({ coachId: 'c3', lastName: 'Bellios', hour: 11, minute: 0, proStart: 601, idStart: 41 });

const ALL_FIXED_GROUPS = [...DAVID_GROUPS, ...TORI_GROUPS, ...COLIN_GROUPS];

// ── Flexible groups (60 pros each) ───────────────────────────────────────────

const FLEX_GROUPS_DATA: MastermindGroup[] = [
  { id: 'sg-4', name: 'Katrien Shaw Mastermind',   coachId: 'c4', memberIds: proRange(901,  960),  createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
  { id: 'sg-5', name: 'Angelica Dotson Mastermind', coachId: 'c5', memberIds: proRange(961,  1020), createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
  { id: 'sg-6', name: 'Lily Lee Mastermind',        coachId: 'c6', memberIds: proRange(1021, 1080), createdDate: new Date('2026-01-06'), status: 'active', type: 'flexible' },
];

export const SEED_GROUPS: MastermindGroup[] = [...ALL_FIXED_GROUPS, ...FLEX_GROUPS_DATA];

// ── Month configs ─────────────────────────────────────────────────────────────

type MonthConfig = { key: string; status: MastermindSession['status'] };

const FIXED_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed'        },
  { key: '2026-04', status: 'completed'        },
  { key: '2026-05', status: 'invitations_sent' },
];

// ── Fixed session builder (1 session per group per month) ─────────────────────

function buildFixedSessions(
  groups: MastermindGroup[],
  months: MonthConfig[],
  idPrefix: string,
  zoomBase: number,
): MastermindSession[] {
  return groups.flatMap((group, gi) =>
    months.map((month, mi) => {
      const { weekOfMonth, dayOfWeek, hour, minute } = group.schedule!;
      const [year, mo] = month.key.split('-').map(Number);
      const day = getNthWeekday(year, mo, dayOfWeek, weekOfMonth);
      return {
        id:            `ss-${idPrefix}-g${gi + 1}-m${mi + 1}`,
        groupId:       group.id,
        month:         month.key,
        sessionNumber: 1,
        date:          new Date(year, mo - 1, day, hour, minute),
        status:        month.status,
        zoomLink:      `https://zoom.us/j/${zoomBase + gi * 100 + mi}`,
        sessionType:   'fixed_slot' as const,
      };
    })
  );
}

// ── Flexible session builder ──────────────────────────────────────────────────

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

// ── All sessions ──────────────────────────────────────────────────────────────

export const SEED_SESSIONS: MastermindSession[] = [
  ...buildFixedSessions(DAVID_GROUPS,  FIXED_MONTHS, 'd', 810_000_000),
  ...buildFixedSessions(TORI_GROUPS,   FIXED_MONTHS, 't', 820_000_000),
  ...buildFixedSessions(COLIN_GROUPS,  FIXED_MONTHS, 'c', 830_000_000),
  ...buildFlexSessions(),
];

// ── Fixed registration builder ────────────────────────────────────────────────

function buildFixedRegs(
  groups: MastermindGroup[],
  months: MonthConfig[],
  idPrefix: string,
  startIdx: number,
): { regs: SessionRegistration[]; nextIdx: number } {
  const regs: SessionRegistration[] = [];
  let idx = startIdx;

  groups.forEach((group, gi) => {
    months.forEach((month, mi) => {
      const sessionId = `ss-${idPrefix}-g${gi + 1}-m${mi + 1}`;
      const session   = SEED_SESSIONS.find(s => s.id === sessionId);
      if (!session) return;

      const isCompleted = month.status === 'completed';

      group.memberIds.forEach((proId, k) => {
        const attended: boolean | null = isCompleted
          ? (k < 13 ? true : k < 15 ? false : null)
          : null;

        regs.push({
          id:             `sr-${++idx}`,
          sessionId,
          groupId:        group.id,
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 86400000),
          attended,
        });
      });
    });
  });

  return { regs, nextIdx: idx };
}

// ── Flexible registration builder ─────────────────────────────────────────────

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

// ── All registrations ─────────────────────────────────────────────────────────

export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const all: SessionRegistration[] = [];
  let idx = 0;

  const d = buildFixedRegs(DAVID_GROUPS,  FIXED_MONTHS, 'd', idx);
  all.push(...d.regs); idx = d.nextIdx;

  const t = buildFixedRegs(TORI_GROUPS,   FIXED_MONTHS, 't', idx);
  all.push(...t.regs); idx = t.nextIdx;

  const c = buildFixedRegs(COLIN_GROUPS,  FIXED_MONTHS, 'c', idx);
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
