import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface InAppNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  isDarkMode: boolean;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  visible,
  title,
  message,
  onDismiss,
  isDarkMode,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.accent,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.medium,
  },
  title: {
    ...Typography.h3,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: '#fff',
    opacity: 0.9,
  },
}); 