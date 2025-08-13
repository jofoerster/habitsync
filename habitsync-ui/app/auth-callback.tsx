import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.text}>Completing sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});
