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
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
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
        const user = await database.getUserByUsername(username);
        if (user) {
          await database.setCurrentUser(user);
          navigation.replace('Main');
        } else {
          Alert.alert('Error', 'User not found');
        }
      } else {
        // Register
        const existingUser = await database.getUserByUsername(username);
        if (existingUser) {
          Alert.alert('Error', 'Username already taken');
          return;
        }

        const existingEmail = await database.getUserByEmail(email);
        if (existingEmail) {
          Alert.alert('Error', 'Email already registered');
          return;
        }

        const newUser = await database.createUser({
          username,
          email,
          name: displayName,
          avatar: getRandomAvatar(),
          bio: '',
          groups: [],
          friends: [],
        });

        await database.setCurrentUser(newUser);
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.logo}>Friendlines</Text>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
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
                  placeholder="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCorrect={false}
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Login' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleLink}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <View style={styles.demoInfo}>
              <Text style={styles.demoText}>Demo accounts:</Text>
              <Text style={styles.demoAccount}>Username: noa</Text>
              <Text style={styles.demoAccount}>Username: amir</Text>
              <Text style={styles.demoAccount}>Username: maya</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.muted,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: Colors.light.secondary,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    ...Typography.h1,
    color: Colors.light.accent,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: Colors.light.text,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.light.muted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    fontSize: 16,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  toggleText: {
    color: Colors.light.accent,
    textDecorationLine: 'underline',
  },
  demoInfo: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.muted,
    borderRadius: BorderRadius.small,
  },
  demoText: {
    ...Typography.caption,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  demoAccount: {
    ...Typography.caption,
    color: Colors.light.text,
    opacity: 0.7,
  },
}); 