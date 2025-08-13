import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

interface UsernamePasswordModalProps {
    visible: boolean;
    onClose: () => void;
    onLogin: (username: string, password: string) => Promise<void>;
    loading?: boolean;
}

const UsernamePasswordModal: React.FC<UsernamePasswordModalProps> = ({
                                                                         visible,
                                                                         onClose,
                                                                         onLogin,
                                                                         loading = false,
                                                                     }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            alert('Error', 'Please enter both username and password');
            return;
        }

        try {
            setIsSubmitting(true);
            await onLogin(username.trim(), password);
            setUsername('');
            setPassword('');
            setShowPassword(false);
        } catch (error) {
            console.error('Login submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting && !loading) {
            setUsername('');
            setPassword('');
            setShowPassword(false);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleClose}
                                    disabled={isSubmitting || loading}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color="#666"/>
                                </TouchableOpacity>
                                <Text style={styles.title}>Sign In</Text>
                                <View style={styles.placeholder}/>
                            </View>

                            <View style={styles.content}>
                                <View style={styles.logoContainer}>
                                    <MaterialCommunityIcons
                                        name="checkbox-marked-circle-outline"
                                        size={60}
                                        color="#2196F3"
                                    />
                                    <Text style={styles.appName}>HabitSync</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Username</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={username}
                                            onChangeText={setUsername}
                                            placeholder="Enter your username"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            autoComplete="username"
                                            editable={!isSubmitting && !loading}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                style={styles.passwordInput}
                                                value={password}
                                                onChangeText={setPassword}
                                                placeholder="Enter your password"
                                                secureTextEntry={!showPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                autoComplete="current-password"
                                                editable={!isSubmitting && !loading}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeButton}
                                                onPress={() => setShowPassword(!showPassword)}
                                                disabled={isSubmitting || loading}
                                            >
                                                <MaterialCommunityIcons
                                                    name={showPassword ? 'eye-off' : 'eye'}
                                                    size={20}
                                                    color="#666"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.loginButton,
                                            (isSubmitting || loading) && styles.buttonDisabled,
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={isSubmitting || loading}
                                    >
                                        {isSubmitting || loading ? (
                                            <ActivityIndicator size="small" color="#fff"/>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="login" size={20} color="#fff"/>
                                                <Text style={styles.loginButtonText}>Sign In</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoContainer}>
                                    <Text style={styles.infoText}>
                                        Use your account credentials to sign in to HabitSync.
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 20,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2196F3',
        marginTop: 8,
    },
    formContainer: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
    },
    eyeButton: {
        padding: 16,
    },
    loginButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default UsernamePasswordModal;
