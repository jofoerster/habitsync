export const convertLocalTimeToUTC = (hour: number, minute: number): {hour: number, minute: number} => {
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    const utcHour = localDate.getUTCHours();
    const utcMinute = localDate.getUTCMinutes();
    return { hour: utcHour, minute: utcMinute };
};

export const convertUTCToLocalTime = (hour: number, minute: number): {hour: number, minute: number} => {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));
    const localHour = utcDate.getHours();
    const localMinute = utcDate.getMinutes();
    return { hour: localHour, minute: localMinute };
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
