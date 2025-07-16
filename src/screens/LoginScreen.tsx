import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants/theme';
import { validateEmail, getRandomAvatar } from '../utils/helpers';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    if (!isLogin && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const user = await database.login(username, password);
        if (user) {
          navigation.replace('Main');
        }
      } else {
        // Register
        const user = await database.register(username, email, password, displayName);
        if (user) {
          navigation.replace('Main');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const message = error.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLogin) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>😊</Text>
              <Text style={styles.logoText}>FriendLines</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.light.secondaryText}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.light.secondaryText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging In...' : 'Log In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => setIsLogin(false)}
              >
                <Text style={styles.signupLinkText}>
                  Don't have an account? Sign up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo Info */}
            <View style={styles.demoInfo}>
              <Text style={styles.demoText}>Demo accounts:</Text>
              <Text style={styles.demoAccount}>Username: noa</Text>
              <Text style={styles.demoAccount}>Username: amir</Text>
              <Text style={styles.demoAccount}>Username: maya</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Registration Screen
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.registerContainer}>
          {/* Header */}
          <View style={styles.registerHeader}>
            <Text style={styles.registerTitle}>Create Your Account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={Colors.light.secondaryText}
                value={displayName}
                onChangeText={setDisplayName}
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.light.secondaryText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.light.secondaryText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.light.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* What makes a great friend section */}
            <View style={styles.friendQualities}>
              <Text style={styles.friendQualitiesTitle}>What makes a great friend?</Text>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityText}>✓ Always there for you</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityText}>✓ Makes you laugh</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityText}>✓ Supports your dreams</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityText}>✓ Shares your interests</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Submit Registration'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => setIsLogin(true)}
            >
              <Text style={styles.backToLoginText}>
                Already have an account? Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  logoText: {
    ...Typography.h1,
    color: Colors.light.text,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 16,
    color: Colors.light.text,
    ...Shadow.small,
  },
  loginButton: {
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    alignItems: 'center',
  },
  signupLinkText: {
    color: Colors.light.accent,
    fontSize: 16,
    fontWeight: '500',
  },
  demoInfo: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  demoText: {
    ...Typography.captionMedium,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  demoAccount: {
    ...Typography.caption,
    color: Colors.light.secondaryText,
    marginBottom: Spacing.xs,
  },
  // Registration styles
  registerContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl * 2,
  },
  registerHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  registerTitle: {
    ...Typography.h2,
    color: Colors.light.text,
    textAlign: 'center',
  },
  friendQualities: {
    backgroundColor: Colors.light.cardBackground,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
  },
  friendQualitiesTitle: {
    ...Typography.h4,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  qualityItem: {
    marginBottom: Spacing.sm,
  },
  qualityText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  registerButton: {
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.medium,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLogin: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  backToLoginText: {
    color: Colors.light.accent,
    fontSize: 16,
    fontWeight: '500',
  },
}); 