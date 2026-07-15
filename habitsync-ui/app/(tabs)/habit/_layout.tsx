import {Stack} from 'expo-router';
import React from 'react';

export const unstable_settings = {
    initialRouteName: '[habitUuid]',
};

export default function HabitLayout() {
    return <Stack screenOptions={{headerShown: false}}/>;
}

