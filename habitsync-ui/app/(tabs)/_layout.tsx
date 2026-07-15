import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Tabs} from 'expo-router';
import {useTheme} from "@/context/ThemeContext";
import AuthGuard from '@/components/AuthGuard';
import {useConfiguration} from "@/hooks/useConfiguration";
import {useTranslation} from 'react-i18next';

export default function TabLayout() {
    const {theme} = useTheme();
    const {t} = useTranslation();

    const {data: config} = useConfiguration();
    const showChallengesTab = !config || !config?.hideChallenges

    return (
        <AuthGuard>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.surface,
                        borderTopColor: theme.border,
                    },
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textSecondary,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="habit"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="challenge/edit/[challengeId]"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="share/[shareCode]"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="profile-settings/approve-accounts"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="profile-settings/import"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="archived-habits"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="habits"
                    options={{
                        title: t('tabs.habits'),
                        tabBarIcon: ({focused, color, size}) => (
                            <MaterialCommunityIcons
                                size={size}
                                name={focused ? 'checkbox-marked-circle-outline' : 'checkbox-blank-circle-outline'}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="challenges"
                    options={{
                        title: t('tabs.challenges'),
                        href: showChallengesTab ? undefined : null,
                        tabBarIcon: ({focused, color, size}) => (
                            <MaterialCommunityIcons
                                size={size}
                                name={focused ? 'trophy' : 'trophy-outline'}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t('tabs.profile'),
                        tabBarIcon: ({focused, color, size}) => (
                            <MaterialCommunityIcons
                                size={size}
                                name={focused ? 'account' : 'account-outline'}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </AuthGuard>
    );
}
