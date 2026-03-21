export const convertLocalTimeToUTC = (hour: number, minute: number): {hour: number, minute: number, dayOffset: number} => {
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    const utcHour = localDate.getUTCHours();
    const utcMinute = localDate.getUTCMinutes();
    const dayOffset = localDate.getUTCDate() - localDate.getDate();
    return { hour: utcHour, minute: utcMinute, dayOffset };
};

export const convertUTCToLocalTime = (hour: number, minute: number): {hour: number, minute: number, dayOffset: number} => {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));
    const dayOffset = utcDate.getDate() - utcDate.getUTCDate();
    const localHour = utcDate.getHours();
    const localMinute = utcDate.getMinutes();
    return { hour: localHour, minute: localMinute, dayOffset };
};

const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export const shiftWeekdays = (weekdays: string[], dayOffset: number): string[] => {
    if (dayOffset === 0) return weekdays;
    return weekdays.map(day => {
        const idx = WEEKDAY_CODES.indexOf(day);
        if (idx === -1) return day;
        const shifted = (idx + dayOffset + 7) % 7;
        return WEEKDAY_CODES[shifted];
    });
};

export const formatTime = (hour: number, minute: number): string => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const parseTime = (timeString: string): {hour: number, minute: number} => {
    const [hourStr, minuteStr] = timeString.split(':');
    return {
        hour: Number(hourStr),
        minute: Number(minuteStr)
    };
};
