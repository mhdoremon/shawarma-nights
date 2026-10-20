/**
 * Store Timing & Schedule Automation Helper
 * Automatically calculates store open/close status by day and time,
 * handles overnight timings (e.g. 12:00 PM to 04:00 AM next day),
 * and formats automatic "Open Till" strings.
 */

export const DAYS_LIST = [
  { key: 'sun', label: 'Sunday (रविवार)' },
  { key: 'mon', label: 'Monday (सोमवार)' },
  { key: 'tue', label: 'Tuesday (मंगलवार)' },
  { key: 'wed', label: 'Wednesday (बुधवार)' },
  { key: 'thu', label: 'Thursday (गुरुवार)' },
  { key: 'fri', label: 'Friday (शुक्रवार)' },
  { key: 'sat', label: 'Saturday (शनिवार)' },
];

/**
 * Extracts a 12-hour or 24-hour time string from arbitrary text
 * e.g. "OPEN TILL 04:00 AM" -> "04:00 AM"
 *      "Daily: 09:00 PM – 04:00 AM" -> "04:00 AM"
 */
export function parseTimeFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
  return match ? match[1].trim() : null;
}

/**
 * Converts time string like "12:00 PM" or "4:00 AM" or "23:30" to minutes from midnight (0 - 1439)
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim().toUpperCase();

  // Try 12-hour format: "12:00 PM", "04:30 AM", "4 PM"
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }

  // Try 24-hour format: "23:00", "04:00"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }

  return null;
}

/**
 * Formats minutes from midnight to a readable 12-hour string (e.g. 720 -> "12:00 PM")
 */
export function formatMinutesToTime(totalMins) {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins)) return '';
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minsStr} ${period}`;
}

/**
 * Extracts open and close times from storeInfo (either structured or from timing string)
 */
export function extractStoreHours(storeInfo) {
  const sched = storeInfo?.weeklySchedule;
  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = days[now.getDay()];
  const todaySched = sched?.[todayKey];

  let openStr = todaySched?.open || storeInfo?.openTime;
  let closeStr = todaySched?.close || storeInfo?.closeTime;

  // Extract from timing string if present, e.g. "Open Daily: 09:00 PM – 04:00 AM" or "10:30 AM – 10:00 PM"
  let timingOpen = null;
  let timingClose = null;
  if (storeInfo?.timing) {
    const parts = storeInfo.timing.split(/–|-|to/i);
    if (parts.length >= 2) {
      const p1 = parts[0].replace(/open daily:?/i, '').replace(/daily:?/i, '').replace(/open all 7 days:?/i, '').replace(/mon\s*-\s*sun:?/i, '').trim();
      const p2 = parts[1].split('|')[0].trim();
      timingOpen = parseTimeFromText(p1);
      timingClose = parseTimeFromText(p2);
    }
  }

  // Extract explicit closing time from openTillText, e.g. "OPEN TILL 04:00 AM"
  const openTillClose = parseTimeFromText(storeInfo?.openTillText);

  // If merchant explicitly wrote openTillText (e.g. "OPEN TILL 04:00 AM"), prioritize it as the active closing time
  if (openTillClose) {
    closeStr = openTillClose;
  } else if (timingClose && (!closeStr || closeStr === '11:00 PM' || closeStr === '10:00 PM')) {
    closeStr = timingClose;
  }

  // If timing has explicit open time and todaySched open was default/fallback
  if (timingOpen && (!openStr || openStr === '11:00 AM' || openStr === '09:00 AM')) {
    openStr = timingOpen;
  }

  return {
    openStr: openStr || timingOpen || '12:00 PM',
    closeStr: closeStr || timingClose || openTillClose || '04:00 AM',
    todaySched,
    todayKey
  };
}

/**
 * Comprehensive check for whether the store is currently open or off.
 * Evaluates master toggle, weekly off day, and real-time operational clock.
 */
export function getStoreLiveStatus(storeInfo, customDate = new Date()) {
  // 1. Master toggle check (Dukandar turned off store manually)
  if (storeInfo?.isOpen === false) {
    return {
      isOpen: false,
      reason: 'Dukan filhal band hai (Temporarily Closed)',
      statusBadge: '🔴 CLOSED',
      openTillText: 'CURRENTLY CLOSED',
      isWeeklyOff: false
    };
  }

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = days[customDate.getDay()];
  const todaySched = storeInfo?.weeklySchedule?.[todayKey];

  // 2. Day of Week / Weekly Off check
  if (todaySched && todaySched.isOpen === false) {
    const dayLabel = DAYS_LIST.find(d => d.key === todayKey)?.label || todayKey.toUpperCase();
    return {
      isOpen: false,
      reason: `Aaj dukan ka weekly off hai (${todayKey.toUpperCase()} OFF)`,
      statusBadge: '🔴 CLOSED TODAY',
      openTillText: 'CLOSED TODAY (WEEKLY OFF)',
      isWeeklyOff: true
    };
  }

  // 3. Time Check
  const { openStr, closeStr } = extractStoreHours(storeInfo);
  const openMins = parseTimeToMinutes(openStr);
  const closeMins = parseTimeToMinutes(closeStr);

  const isFashionOrRetail = storeInfo?.type === 'fashion' || 
                            storeInfo?.vertical === 'fashion' || 
                            storeInfo?.vertical === 'clothing' || 
                            storeInfo?.capabilities?.catalog?.hasSizes ||
                            storeInfo?.capabilities?.storeType === 'fashion';

  if (openMins !== null && closeMins !== null) {
    const currentMins = customDate.getHours() * 60 + customDate.getMinutes();

    let isWithinHours = true;
    if (openMins < closeMins) {
      // Normal Daytime: e.g. 10:00 AM (600) to 10:00 PM (1320)
      isWithinHours = currentMins >= openMins && currentMins < closeMins;
    } else {
      // Overnight Window: e.g. 12:00 PM (720) or 09:00 PM (1260) to 04:00 AM (240) next day
      isWithinHours = currentMins >= openMins || currentMins < closeMins;
    }

    if (!isWithinHours) {
      // If it's a fashion/retail online store and merchant has master toggle ON,
      // online ordering remains 24/7 active while displaying physical boutique hours
      if (isFashionOrRetail) {
        const computedOpenTill = storeInfo?.openTillText?.trim() || `OPEN TILL ${closeStr}`;
        return {
          isOpen: true,
          reason: `Atelier hours: ${openStr} – ${closeStr} • 24/7 Online Shopping Active`,
          statusBadge: '🟢 OPEN NOW',
          openTillText: computedOpenTill,
          isWeeklyOff: false,
          openStr,
          closeStr,
          isOnline24x7: true
        };
      }

      return {
        isOpen: false,
        reason: `Abhi dukan band hai • ${openStr} par khulegi`,
        statusBadge: '🔴 CLOSED NOW',
        openTillText: `OPENS AT ${openStr}`,
        isWeeklyOff: false,
        openStr,
        closeStr
      };
    }
  }

  // Active Open
  const computedOpenTill = storeInfo?.openTillText?.trim() || `OPEN TILL ${closeStr || '04:00 AM'}`;
  return {
    isOpen: true,
    reason: `Dukan abhi khuli hai (${computedOpenTill})`,
    statusBadge: '🟢 OPEN NOW',
    openTillText: computedOpenTill,
    isWeeklyOff: false,
    openStr,
    closeStr
  };
}

