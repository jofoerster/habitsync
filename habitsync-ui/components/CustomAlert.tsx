import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onDismiss();
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return {
          backgroundColor: theme.surfaceSecondary,
          color: theme.text,
        };
      case 'destructive':
        return {
          backgroundColor: theme.error,
          color: theme.textInverse,
        };
      default:
        return {
          backgroundColor: theme.primary,
          color: theme.textInverse,
        };
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    alertContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 24,
      paddingHorizontal: 24,
      minWidth: 280,
      maxWidth: Dimensions.get('window').width - 60,
      shadowColor: theme.shadow,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: theme.shadowOpacity * 2,
      shadowRadius: 16,
      elevation: theme.elevation.level3,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: message ? 12 : 0,
    },
    message: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonsContainer: {
      flexDirection: buttons.length > 2 ? 'column' : 'row',
      gap: 12,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      flex: buttons.length <= 2 ? 1 : undefined,
      minHeight: 44,
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : null}

        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    { backgroundColor: buttonStyle.backgroundColor },
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: buttonStyle.color },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CustomAlert;
