/**
 * Attendance business day uses Africa/Lagos (WAT, UTC+1, no DST).
 * All "today" / per-day uniqueness and official time rules use this timezone.
 * Official punch times are still raw server UTC Date values.
 */

const ATTENDANCE_TIMEZONE = "Africa/Lagos";

/** Official work-day policy (Africa/Lagos local clock) */
const RESUMPTION_HOUR = 8;
const RESUMPTION_MINUTE = 0;
const GRACE_MINUTES = 15;
/** On time through 08:15 inclusive; late from 08:16 */
const LATE_AFTER_HOUR = 8;
const LATE_AFTER_MINUTE = 15;
const CLOSING_HOUR = 17;
const CLOSING_MINUTE = 0;
const OVERTIME_START_HOUR = 18;
const OVERTIME_START_MINUTE = 0;

const getDatePartsInTimezone = (date = new Date(), timeZone = ATTENDANCE_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
};

const getTimePartsInTimezone = (date = new Date(), timeZone = ATTENDANCE_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
};

const toMinutesOfDay = (hour, minute) => hour * 60 + minute;

/** Calendar date key YYYY-MM-DD in attendance timezone */
const getBusinessDateKey = (date = new Date()) =>
  getDatePartsInTimezone(date).dateKey;

/** Inclusive start (00:00:00.000) of a YYYY-MM-DD day as UTC Date approximating WAT */
const businessDayStartUtc = (dateKey) => {
  // WAT is UTC+1 year-round
  return new Date(`${dateKey}T00:00:00.000+01:00`);
};

const businessDayEndUtc = (dateKey) => {
  return new Date(`${dateKey}T23:59:59.999+01:00`);
};

/**
 * Late if check-in is after 08:15 Lagos (from 08:16 onward).
 * 08:00–08:15 inclusive = on time (includes grace period).
 */
const isLateCheckIn = (checkedAt = new Date()) => {
  if (!checkedAt) return false;
  const { hour, minute } = getTimePartsInTimezone(checkedAt);
  return toMinutesOfDay(hour, minute) > toMinutesOfDay(LATE_AFTER_HOUR, LATE_AFTER_MINUTE);
};

/** Early leave if checkout exists and is before official closing 17:00 Lagos */
const isEarlyLeave = (checkedOutAt) => {
  if (!checkedOutAt) return false;
  const { hour, minute } = getTimePartsInTimezone(checkedOutAt);
  return toMinutesOfDay(hour, minute) < toMinutesOfDay(CLOSING_HOUR, CLOSING_MINUTE);
};

/**
 * Overtime minutes after 18:00 Lagos only.
 * Checkout at/before 18:00 → 0; 18:30 → 30; 19:00 → 60.
 */
const getOvertimeMinutes = (checkedOutAt) => {
  if (!checkedOutAt) return 0;
  const { hour, minute } = getTimePartsInTimezone(checkedOutAt);
  const checkoutMinutes = toMinutesOfDay(hour, minute);
  const otStart = toMinutesOfDay(OVERTIME_START_HOUR, OVERTIME_START_MINUTE);
  return Math.max(0, checkoutMinutes - otStart);
};

const getOvertimeHours = (checkedOutAt) => {
  const minutes = typeof checkedOutAt === "number" ? checkedOutAt : getOvertimeMinutes(checkedOutAt);
  return Math.round((minutes / 60) * 100) / 100;
};

const ATTENDANCE_POLICY = {
  timezone: ATTENDANCE_TIMEZONE,
  resumption: { hour: RESUMPTION_HOUR, minute: RESUMPTION_MINUTE },
  graceMinutes: GRACE_MINUTES,
  lateAfter: { hour: LATE_AFTER_HOUR, minute: LATE_AFTER_MINUTE },
  closing: { hour: CLOSING_HOUR, minute: CLOSING_MINUTE },
  overtimeStart: { hour: OVERTIME_START_HOUR, minute: OVERTIME_START_MINUTE },
};

module.exports = {
  ATTENDANCE_POLICY,
  ATTENDANCE_TIMEZONE,
  businessDayEndUtc,
  businessDayStartUtc,
  CLOSING_HOUR,
  CLOSING_MINUTE,
  getBusinessDateKey,
  getDatePartsInTimezone,
  getOvertimeHours,
  getOvertimeMinutes,
  getTimePartsInTimezone,
  GRACE_MINUTES,
  isEarlyLeave,
  isLateCheckIn,
  LATE_AFTER_HOUR,
  LATE_AFTER_MINUTE,
  OVERTIME_START_HOUR,
  OVERTIME_START_MINUTE,
  RESUMPTION_HOUR,
  RESUMPTION_MINUTE,
};
