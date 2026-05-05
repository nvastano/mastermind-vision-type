import type { MastermindGroup, MastermindSession, SessionRegistration, FixedSlot } from '../app/App';

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

/** Returns the day-of-month for the nth occurrence of dayOfWeek in the given month */
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
  return 14; // fallback — should never hit
}

/** Returns the day-of-month for the last occurrence of dayOfWeek in the given month */
function getLastWeekday(year: number, month: number, dayOfWeek: number): number {
  const d = new Date(year, month, 0); // last day of month
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() - 1);
  return d.getDate();
}

const ORDINALS  = ['1st', '2nd', '3rd', '4th'];
const DAY_ABBR  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Build 20 fixed slots — 4 weeks × Mon–Fri — all at the same time.
 * Each slot gets `perGroup` consecutive pros starting at `proStart`.
 */
function makeFixedSlots(
  prefix: string,
  hour: number,
  minute: number,
  proStart: number,
  perGroup: number,
): FixedSlot[] {
  const slots: FixedSlot[] = [];
  let pro = proStart;
  for (let week = 1; week <= 4; week++) {
    for (let dow = 1; dow <= 5; dow++) {
      const label = `${ORDINALS[week - 1]} ${DAY_ABBR[dow]} · ${formatTime(hour, minute)}`;
      slots.push({
        id:          `fs-${prefix}-${week}-${dow}`,
        label,
        weekOfMonth: week,
        dayOfWeek:   dow,
        hour,
        minute,
        memberIds:   proRange(pro, pro + perGroup - 1),
      });
      pro += perGroup;
    }
  }
  return slots;
}

// ── Fixed slots ───────────────────────────────────────────────────────────────
// 20 groups × 15 members = 300 pros per coach

const DAVID_SLOTS = makeFixedSlots('d', 10,  0,   1, 15); // pro-0001 → pro-0300
const TORI_SLOTS  = makeFixedSlots('t',  9,  0, 301, 15); // pro-0301 → pro-0600
const COLIN_SLOTS = makeFixedSlots('c', 11,  0, 601, 15); // pro-0601 → pro-0900

// ── Groups ────────────────────────────────────────────────────────────────────
export const SEED_GROUPS: MastermindGroup[] = [
  // Fixed
  {
    id: 'sg-1',
    name: 'David LaBahn Mastermind',
    coachId: 'c1',
    memberIds: proRange(1, 300),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: DAVID_SLOTS,
  },
  {
    id: 'sg-2',
    name: 'Tori Wheeler Mastermind',
    coachId: 'c2',
    memberIds: proRange(301, 600),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: TORI_SLOTS,
  },
  {
    id: 'sg-3',
    name: 'Colin Bellios Mastermind',
    coachId: 'c3',
    memberIds: proRange(601, 900),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'fixed',
    fixedSlots: COLIN_SLOTS,
  },
  // Flexible
  {
    id: 'sg-4',
    name: 'Katrien Shaw Mastermind',
    coachId: 'c4',
    memberIds: proRange(901, 960),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  {
    id: 'sg-5',
    name: 'Angelica Dotson Mastermind',
    coachId: 'c5',
    memberIds: proRange(961, 1020),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
  {
    id: 'sg-6',
    name: 'Lily Lee Mastermind',
    coachId: 'c6',
    memberIds: proRange(1021, 1080),
    createdDate: new Date('2026-01-06'),
    status: 'active',
    type: 'flexible',
  },
];

// ── Month configs ─────────────────────────────────────────────────────────────

type MonthConfig = { key: string; status: MastermindSession['status'] };

const FIXED_MONTHS: MonthConfig[] = [
  { key: '2026-03', status: 'completed'        },
  { key: '2026-04', status: 'completed'        },
  { key: '2026-05', status: 'invitations_sent' },
];

// ── Fixed session builder ─────────────────────────────────────────────────────

/**
 * One session per slot per month (date derived from slot.weekOfMonth + dayOfWeek),
 * plus one shared makeup session at the end of the month (last Friday, noon).
 */
function buildFixedSessions(
  groupId: string,
  slots: FixedSlot[],
  months: MonthConfig[],
  idPrefix: string,
  zoomBase: number,
): MastermindSession[] {
  return months.flatMap((month, mi) => {
    const [year, mo] = month.key.split('-').map(Number);

    const slotSessions: MastermindSession[] = slots.map((slot, si) => {
      const day = getNthWeekday(year, mo, slot.dayOfWeek, slot.weekOfMonth);
      return {
        id:            `ss-${idPrefix}-m${mi + 1}-s${si + 1}`,
        groupId,
        month:         month.key,
        sessionNumber: si + 1,
        date:          new Date(year, mo - 1, day, slot.hour, slot.minute),
        status:        month.status,
        zoomLink:      `https://zoom.us/j/${zoomBase + mi * 10000 + si}`,
        sessionType:   'fixed_slot' as const,
        slotId:        slot.id,
      };
    });

    // One shared makeup per month — last Friday at noon
    const makeupDay = getLastWeekday(year, mo, 5);
    const makeup: MastermindSession = {
      id:            `ss-${idPrefix}-m${mi + 1}-makeup`,
      groupId,
      month:         month.key,
      sessionNumber: slots.length + 1,
      date:          new Date(year, mo - 1, makeupDay, 12, 0),
      status:        month.status,
      zoomLink:      `https://zoom.us/j/${zoomBase + mi * 10000 + 9999}`,
      sessionType:   'makeup' as const,
    };

    return [...slotSessions, makeup];
  });
}

// ── Flexible session builder ──────────────────────────────────────────────────

type FlexMonth = { key: string; days: [number, number, number]; status: MastermindSession['status'] };

const FLEX_MONTHS: FlexMonth[] = [
  { key: '2026-03', days: [11, 18, 25], status: 'completed'        },
  { key: '2026-04', days: [ 9, 16, 23], status: 'completed'        },
  { key: '2026-05', days: [ 7, 14, 21], status: 'invitations_sent' },
];

const FLEX_GROUPS = [
  { groupId: 'sg-4', idPrefix: 'k4', zoomBase: 860_000_000, times: [[10, 30], [14, 30], [17, 30]] as [number, number][] },
  { groupId: 'sg-5', idPrefix: 'a5', zoomBase: 870_000_000, times: [[ 9, 30], [13, 30], [18,  0]] as [number, number][] },
  { groupId: 'sg-6', idPrefix: 'l6', zoomBase: 880_000_000, times: [[ 9,  0], [13,  0], [17,  0]] as [number, number][] },
];

function buildFlexSessions(): MastermindSession[] {
  return FLEX_GROUPS.flatMap(({ groupId, idPrefix, zoomBase, times }) =>
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

// ── Build all sessions ────────────────────────────────────────────────────────

export const SEED_SESSIONS: MastermindSession[] = [
  ...buildFixedSessions('sg-1', DAVID_SLOTS, FIXED_MONTHS, 'd', 810_000_000),
  ...buildFixedSessions('sg-2', TORI_SLOTS,  FIXED_MONTHS, 't', 820_000_000),
  ...buildFixedSessions('sg-3', COLIN_SLOTS, FIXED_MONTHS, 'c', 830_000_000),
  ...buildFlexSessions(),
];

// ── Fixed registration builder ────────────────────────────────────────────────

/**
 * For each slot in each completed month:
 *   - 13 of 15 members marked attended, 2 marked no-show
 *   - No-shows get a makeup registration (half of them attended the makeup)
 */
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

    slots.forEach((slot, si) => {
      const sessionId = `ss-${idPrefix}-m${mi + 1}-s${si + 1}`;
      const session   = SEED_SESSIONS.find(s => s.id === sessionId);
      if (!session) return;

      const noShows: string[] = [];

      slot.memberIds.forEach((proId, k) => {
        // 0-12 attended (13), 13-14 no-show (2), rest pending
        const attended: boolean | null = isCompleted
          ? (k < 13 ? true : k < 15 ? false : null)
          : null;
        if (isCompleted && k >= 13 && k < 15) noShows.push(proId);

        regs.push({
          id:             `sr-${++idx}`,
          sessionId,
          groupId,
          proId,
          registeredDate: new Date(session.date.getTime() - (10 - (k % 10)) * 86400000),
          attended,
        });
      });

      // Makeup registrations for no-shows
      if (isCompleted && noShows.length > 0) {
        const makeupId      = `ss-${idPrefix}-m${mi + 1}-makeup`;
        const makeupSession = SEED_SESSIONS.find(s => s.id === makeupId);
        if (makeupSession) {
          noShows.forEach((proId, k) => {
            regs.push({
              id:             `sr-${++idx}`,
              sessionId:      makeupId,
              groupId,
              proId,
              registeredDate: new Date(makeupSession.date.getTime() - 5 * 86400000),
              attended:       k % 2 === 0 ? true : false, // half attended makeup
            });
          });
        }
      }
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

  const { groupId, idPrefix } = FLEX_GROUPS[groupIdx];
  const group     = SEED_GROUPS.find(g => g.id === groupId)!;
  const memberIds = group.memberIds;

  FLEX_MONTHS.forEach((month, mi) => {
    const isCompleted = month.status === 'completed';
    const countToReg  = isCompleted ? 45 : 30;

    const sessionIds = ([0, 1, 2] as const).map(
      opt => `ss-${idPrefix}-${mi + 1}-${opt + 1}`
    );

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

// ── Build all registrations ───────────────────────────────────────────────────

export const SEED_REGISTRATIONS: SessionRegistration[] = (() => {
  const all: SessionRegistration[] = [];
  let idx = 0;

  const d = buildFixedRegs('sg-1', DAVID_SLOTS, FIXED_MONTHS, 'd', idx);
  all.push(...d.regs); idx = d.nextIdx;

  const t = buildFixedRegs('sg-2', TORI_SLOTS, FIXED_MONTHS, 't', idx);
  all.push(...t.regs); idx = t.nextIdx;

  const c = buildFixedRegs('sg-3', COLIN_SLOTS, FIXED_MONTHS, 'c', idx);
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
