export function capitalizeFirstLetter(val : string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function getIcon(completion: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'COMPLETED_BY_OTHER_RECORDS' | 'MISSED' | 'LOADING' | 'FAILED' | 'DISABLED' | 'DISABLED_COMPLETED_BY_OTHER_RECORDS', value?: number) {
    switch (completion) {
        case 'DISABLED':
            if (value && value > 0) {
                return '✓';
            }
            return '';
        case 'COMPLETED':
            return '✓';
        case 'FAILED':
            return '✓';
        case 'PARTIALLY_COMPLETED':
        case 'COMPLETED_BY_OTHER_RECORDS':
            return '✗';
        case 'DISABLED_COMPLETED_BY_OTHER_RECORDS':
            if (value && value > 0) {
                return '✓';
            }
            return '';
        default:
            return '✗';
    }
}