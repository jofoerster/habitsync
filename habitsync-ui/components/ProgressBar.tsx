import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from "@/context/ThemeContext";

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    width?: number | string;
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
                                                     progress,
                                                     height = 10,
                                                     width = '100%',
                                                     color = '#4CAF50',
                                                     backgroundColor = '#e0e0e0',
                                                     style,
                                                 }) => {
    const {theme} = useTheme();
    const validProgress = Math.max(0, Math.min(1, progress));

    return (
        <View style={[styles.container, {height, width, backgroundColor}, style]}>
            <View
                style={[
                    styles.progress,
                    {
                        width: `${validProgress * 100}%`,
                        backgroundColor: color
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 5,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
    },
});

export default ProgressBar;
