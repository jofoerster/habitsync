import React, {useEffect, useRef} from 'react';
import {Animated, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {getColorById, getSecondaryColorById} from '../constants/colors';
import {useTheme} from "@/context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({percentage, color, size = 40, strokeWidth = 4}: {
    percentage: number;
    color?: number;
    size?: number;
    strokeWidth?: number;
}) => {
    const {theme} = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Animated value for smooth transitions
    const animatedValue = useRef(new Animated.Value(0)).current;

    const gradientId = useRef(`progressGradient_${Math.random().toString(36).substr(2, 9)}`).current;

    // Get color from ID or use default
    const baseColor = color ? getColorById(color) : '#667eea';
    const secondaryColor = color ? getSecondaryColorById(color) : '#764ba2';

    useEffect(() => {
        // Animate the progress ring
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{width: size, height: size, position: 'relative'}}>
            <Svg width={size} height={size} style={{position: 'absolute', transform: [{rotate: '-90deg'}]}}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={baseColor} />
                        <Stop offset="100%" stopColor={secondaryColor} />
                    </LinearGradient>
                </Defs>

                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.background}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress circle */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>

            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Text style={{
                    fontSize: size / 4,
                    fontWeight: '600',
                    color: theme.text,
                    textAlign: 'center'
                }}>
                    {Math.round(percentage)}%
                </Text>
            </View>
        </View>
    );
};

export default ProgressRing;
