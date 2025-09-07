export const COLOR_OPTIONS = [{id: 1, color: '#FF9AA2', secondaryColor: '#FFB3B8', name: 'Rose'}, {
    id: 2,
    color: '#FFD3A5',
    secondaryColor: '#FFE0B8',
    name: 'Peach'
}, {id: 3, color: '#FD9644', secondaryColor: '#FDAB66', name: 'Orange'}, {
    id: 4,
    color: '#FCFC62',
    secondaryColor: '#FDFD7E',
    name: 'Lemon'
}, {id: 5, color: '#C7CEEA', secondaryColor: '#D4DAF0', name: 'Periwinkle'}, {
    id: 6,
    color: '#B5EAD7',
    secondaryColor: '#C7F0E3',
    name: 'Mint'
}, {id: 7, color: '#A0E7E5', secondaryColor: '#B3EDEB', name: 'Aqua'}, {
    id: 8,
    color: '#9BB5FF',
    secondaryColor: '#B0C4FF',
    name: 'Sky'
}, {id: 9, color: '#E0BBE4', secondaryColor: '#E8CCEB', name: 'Lilac'}, {
    id: 10,
    color: '#957DAD',
    secondaryColor: '#A991BD',
    name: 'Mauve'
}];

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
