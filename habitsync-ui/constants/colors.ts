export const COLOR_OPTIONS = [
    {id: 1, color: '#FF6B6B', secondaryColor: '#FF8E8E', name: 'Red'},
    {id: 2, color: '#4ECDC4', secondaryColor: '#6ED5CE', name: 'Teal'},
    {id: 3, color: '#45B7D1', secondaryColor: '#6BC5D8', name: 'Blue'},
    {id: 4, color: '#96CEB4', secondaryColor: '#A8D4C0', name: 'Green'},
    {id: 5, color: '#66e0e3', secondaryColor: '#85E6E8', name: 'Yellow'},
    {id: 6, color: '#5f5ff1', secondaryColor: '#7F7FF4', name: 'Purple'},
    {id: 7, color: '#2decbf', secondaryColor: '#52F0CB', name: 'Mint'},
    {id: 8, color: '#F7DC6F', secondaryColor: '#F9E386', name: 'Gold'},
    {id: 9, color: '#BB8FCE', secondaryColor: '#C8A2D6', name: 'Lavender'},
    {id: 10, color: '#f5a25b', secondaryColor: '#F7B177', name: 'Sky Blue'}
];

export const getColorById = (id: number) => {
    const colorOption = COLOR_OPTIONS.find(option => option.id === id);
    return colorOption ? colorOption.color : null;
}

export const getSecondaryColorById = (id: number) => {
    const colorOption = COLOR_OPTIONS.find(option => option.id === id);
    return colorOption ? colorOption.secondaryColor : null;
}

export const lightTheme = {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceSecondary: '#f5f5f5',
    surfaceTertiary: '#e9ecef',

    text: '#212529',
    textSecondary: '#6c757d',
    textTertiary: '#adb5bd',
    textInverse: '#ffffff',

    border: '#dee2e6',
    borderSecondary: '#e9ecef',

    primary: '#667eea',
    primaryLight: '#8fa4f3',
    primaryDark: '#5a67d8',

    success: '#4CAF50',
    successLight: '#81C784',
    warning: '#f6ddb1',
    warningSecondary: '#a4cca6',
    error: '#f44336',
    info: '#2196F3',

    shadow: '#000000',
    shadowOpacity: 0.1,
    elevation: {
        level1: 2,
        level2: 4,
        level3: 8,
    },

    headerGradient: ['#667eea', '#764ba2'],

    disabled: '#e0e0e0',
    disabledText: '#9e9e9e',
};

export const darkTheme = {
    background: '#121212',
    surface: '#1e1e1e',
    surfaceSecondary: '#2d2d2d',
    surfaceTertiary: '#3d3d3d',

    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    textInverse: '#000000',

    border: '#404040',
    borderSecondary: '#2d2d2d',

    primary: '#7c3aed',
    primaryLight: '#a855f7',
    primaryDark: '#6d28d9',

    success: '#22c55e',
    successLight: '#4ade80',
    warning: '#f59e0b',
    warningSecondary: '#65a30d',
    error: '#ef4444',
    info: '#3b82f6',

    shadow: '#000000',
    shadowOpacity: 0.3,
    elevation: {
        level1: 2,
        level2: 4,
        level3: 8,
    },

    headerGradient: ['#7c3aed', '#a855f7'],

    disabled: '#404040',
    disabledText: '#666666',
};

export type Theme = typeof lightTheme;
