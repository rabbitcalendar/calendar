import type { CalendarEvent } from '../types';
import { addDays, format, getDay, startOfMonth, setDay, addWeeks, subDays } from 'date-fns';

// Type definition for holiday object
type HolidayBase = Omit<CalendarEvent, 'id' | 'clientId'>;

// 1. Fixed Date Holidays
const FIXED_HOLIDAYS = [
  { title: "New Year's Day", month: 0, day: 1, type: 'holiday', description: 'Public Holiday' },
  { title: "Labour Day", month: 4, day: 1, type: 'holiday', description: 'Public Holiday' },
  { title: "National Day", month: 7, day: 9, type: 'holiday', description: 'Public Holiday' },
  { title: "Christmas Day", month: 11, day: 25, type: 'holiday', description: 'Public Holiday' },
];

const FIXED_RETAIL_EVENTS = [
  { title: "Valentine's Day", month: 1, day: 14, type: 'event', description: 'Retail Event' },
  { title: "9.9 Super Shopping Day", month: 8, day: 9, type: 'promotion', description: 'Major Online Sale' },
  { title: "11.11 Singles Day", month: 10, day: 11, type: 'promotion', description: 'Major Online Sale' },
  { title: "12.12 Double 12", month: 11, day: 12, type: 'promotion', description: 'Year-end Sale' },
];

// 2. Lunar / Variable Holidays Lookup Table
// Note: These dates change every year based on lunar calendars.
// We maintain a lookup for the next few years.
const LUNAR_HOLIDAYS_LOOKUP: Record<number, Array<{ title: string, date: string, type: 'holiday', description: string }>> = {
  2025: [
    { title: "Chinese New Year", date: "2025-01-29", type: 'holiday', description: 'Public Holiday' },
    { title: "Chinese New Year", date: "2025-01-30", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Puasa", date: "2025-03-31", type: 'holiday', description: 'Public Holiday' },
    { title: "Good Friday", date: "2025-04-18", type: 'holiday', description: 'Public Holiday' },
    { title: "Vesak Day", date: "2025-05-12", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2025-06-07", type: 'holiday', description: 'Public Holiday' },
    { title: "Deepavali", date: "2025-10-20", type: 'holiday', description: 'Public Holiday' },
  ],
  2026: [
    { title: "Chinese New Year", date: "2026-02-17", type: 'holiday', description: 'Public Holiday' },
    { title: "Chinese New Year", date: "2026-02-18", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Puasa", date: "2026-03-21", type: 'holiday', description: 'Public Holiday' },
    { title: "Good Friday", date: "2026-04-03", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2026-05-27", type: 'holiday', description: 'Public Holiday' },
    { title: "Vesak Day", date: "2026-05-31", type: 'holiday', description: 'Public Holiday' },
    { title: "Deepavali", date: "2026-11-08", type: 'holiday', description: 'Public Holiday' },
  ],
  2027: [
    { title: "Chinese New Year", date: "2027-02-06", type: 'holiday', description: 'Public Holiday' },
    { title: "Chinese New Year", date: "2027-02-07", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Puasa", date: "2027-03-10", type: 'holiday', description: 'Public Holiday' },
    { title: "Good Friday", date: "2027-03-26", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2027-05-17", type: 'holiday', description: 'Public Holiday' },
    { title: "Vesak Day", date: "2027-05-20", type: 'holiday', description: 'Public Holiday' },
    { title: "Deepavali", date: "2027-10-29", type: 'holiday', description: 'Public Holiday' },
  ],
  2028: [
    { title: "Chinese New Year", date: "2028-01-26", type: 'holiday', description: 'Public Holiday' },
    { title: "Chinese New Year", date: "2028-01-27", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Puasa", date: "2028-02-27", type: 'holiday', description: 'Public Holiday' },
    { title: "Good Friday", date: "2028-04-14", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2028-05-05", type: 'holiday', description: 'Public Holiday' },
    { title: "Vesak Day", date: "2028-05-09", type: 'holiday', description: 'Public Holiday' },
    { title: "Deepavali", date: "2028-10-17", type: 'holiday', description: 'Public Holiday' },
  ],
  // Note: 2029 and 2030 dates are estimates based on available calendars
  2029: [
    { title: "Chinese New Year", date: "2029-02-13", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Chinese New Year", date: "2029-02-14", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Hari Raya Puasa", date: "2029-02-15", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Good Friday", date: "2029-03-30", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2029-04-24", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Vesak Day", date: "2029-05-28", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Deepavali", date: "2029-11-05", type: 'holiday', description: 'Public Holiday (Est)' },
  ],
  2030: [
    { title: "Chinese New Year", date: "2030-02-03", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Chinese New Year", date: "2030-02-04", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Hari Raya Puasa", date: "2030-02-05", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Good Friday", date: "2030-04-19", type: 'holiday', description: 'Public Holiday' },
    { title: "Hari Raya Haji", date: "2030-04-13", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Vesak Day", date: "2030-05-17", type: 'holiday', description: 'Public Holiday (Est)' },
    { title: "Deepavali", date: "2030-10-25", type: 'holiday', description: 'Public Holiday (Est)' },
  ]
};

// Helper: Calculate Good Friday (Easter - 2 days)
// Uses anonymous algorithm for Easter calculation
const getGoodFriday = (year: number): string => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  const easterDate = new Date(year, month, day);
  const goodFriday = subDays(easterDate, 2);
  
  return format(goodFriday, 'yyyy-MM-dd');
};

// Helper: Get Nth weekday of month (e.g. 2nd Sunday of May)
// weekday: 0 = Sunday, 1 = Monday, ...
const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): string => {
  const firstDayOfMonth = startOfMonth(new Date(year, month));
  const currentWeekday = getDay(firstDayOfMonth);
  
  // Calculate days to add to get to the first occurrence of the target weekday
  let daysToAdd = weekday - currentWeekday;
  if (daysToAdd < 0) daysToAdd += 7;
  
  // Add weeks to get to Nth occurrence
  daysToAdd += (n - 1) * 7;
  
  const targetDate = addDays(firstDayOfMonth, daysToAdd);
  return format(targetDate, 'yyyy-MM-dd');
};

export const getAllHolidays = (year: number): HolidayBase[] => {
  const holidays: HolidayBase[] = [];

  // 1. Add Fixed Holidays
  FIXED_HOLIDAYS.forEach(h => {
    holidays.push({
      ...h,
      date: format(new Date(year, h.month, h.day), 'yyyy-MM-dd'),
      type: h.type as any
    });
  });

  // 2. Add Fixed Retail Events
  FIXED_RETAIL_EVENTS.forEach(h => {
    holidays.push({
      ...h,
      date: format(new Date(year, h.month, h.day), 'yyyy-MM-dd'),
      type: h.type as any
    });
  });

  // 3. Add Calculated Retail Events
  // Mother's Day: 2nd Sunday of May (Month 4)
  holidays.push({
    title: "Mother's Day",
    date: getNthWeekdayOfMonth(year, 4, 0, 2),
    type: 'event',
    description: 'Retail Event'
  });

  // Father's Day: 3rd Sunday of June (Month 5)
  holidays.push({
    title: "Father's Day",
    date: getNthWeekdayOfMonth(year, 5, 0, 3),
    type: 'event',
    description: 'Retail Event'
  });

  // Thanksgiving: 4th Thursday of November (Month 10) - Used for Black Friday
  const thanksgivingStr = getNthWeekdayOfMonth(year, 10, 4, 4);
  const thanksgivingDate = new Date(thanksgivingStr);
  
  // Black Friday: Day after Thanksgiving
  holidays.push({
    title: "Black Friday",
    date: format(addDays(thanksgivingDate, 1), 'yyyy-MM-dd'),
    type: 'promotion',
    description: 'Major Retail Sale'
  });

  // Cyber Monday: Monday after Thanksgiving
  holidays.push({
    title: "Cyber Monday",
    date: format(addDays(thanksgivingDate, 4), 'yyyy-MM-dd'),
    type: 'promotion',
    description: 'Online Tech Sale'
  });

  // 4. Add Lunar / Lookup Holidays
  const lookupHolidays = LUNAR_HOLIDAYS_LOOKUP[year];
  if (lookupHolidays) {
    lookupHolidays.forEach(h => {
       holidays.push({
         ...h,
         type: h.type as any
       });
    });
    
    // If Good Friday not in lookup, calculate it
    if (!lookupHolidays.some(h => h.title === 'Good Friday')) {
       holidays.push({
         title: "Good Friday",
         date: getGoodFriday(year),
         type: 'holiday',
         description: 'Public Holiday'
       });
    }
  } else {
    // Fallback for Good Friday if no lookup
    holidays.push({
         title: "Good Friday",
         date: getGoodFriday(year),
         type: 'holiday',
         description: 'Public Holiday'
    });
  }

  // 5. Calculate "Observed" Holidays (In Lieu)
  // Logic: If a public holiday falls on a Sunday, the following Monday is a holiday.
  // We only apply this to official public holidays.
  const publicHolidays = holidays.filter(h => h.type === 'holiday');
  const observedHolidays: HolidayBase[] = [];

  publicHolidays.forEach(h => {
    const date = new Date(h.date);
    if (getDay(date) === 0) { // 0 is Sunday
      observedHolidays.push({
        title: `${h.title} (Observed)`,
        date: format(addDays(date, 1), 'yyyy-MM-dd'),
        type: 'holiday',
        description: 'Public Holiday in lieu'
      });
    }
  });

  return [...holidays, ...observedHolidays];
};
