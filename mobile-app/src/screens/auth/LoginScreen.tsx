/**
 * LoginScreen.tsx
 * ───────────────
 * Redesigned to match the reference UI exactly:
 *
 *  ┌─────────────────────────────┐
 *  │  🔴 Red diagonal header      │
 *  │     [Logo image]             │
 *  │  Gupta                       │
 *  │  Sandwich  (gold)            │
 *  │  FRESH · TASTY · ALWAYS      │
 *  │  [🥪 ORDER. ENJOY. REPEAT.]  │
 *  ├────────── wave ──────────────┤
 *  │  [ADMIN PANEL]  pill         │
 *  │  Welcome Back!               │
 *  │  Sign in to access admin     │
 *  │  EMAIL ADDRESS               │
 *  │  [✉️  you@guptasandwich.com] │
 *  │  PASSWORD                    │
 *  │  [🔒  ••••••••••]     👁️   │
 *  │  [      Sign In      ]       │
 *  └─────────────────────────────┘
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Dimensions,
  KeyboardAvoidingView, Platform, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { loginAdmin, loginUser } from '../../services/authApi';
import { ApiError, BASE_URL } from '../../services/api';
import { AuthUser } from '../../../App';

const { width: W } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      // Try admin login first; fall back to staff/user login on 401/403
      let response;
      try {
        response = await loginAdmin(trimmedEmail, password);
      } catch (adminErr) {
        if (
          adminErr instanceof ApiError &&
          (adminErr.status === 401 || adminErr.status === 403)
        ) {
          // Not an admin account — try staff/user login
          response = await loginUser(trimmedEmail, password);
        } else {
          throw adminErr;
        }
      }

      const serverUser = response.user as any;

      // Determine role: super admin and admins have no outlet_id
      // is_super_admin flag takes priority
      const role: 'Admin' | 'Staff' =
        serverUser.is_super_admin === true || !serverUser.outlet_id
          ? 'Admin'
          : 'Staff';

      // Extract screen permissions sent by the backend
      // Shape: { admin: string[], staff: string[] }
      const permissions: { admin: string[]; staff: string[] } =
        serverUser.permissions ?? { admin: [], staff: [] };

      onLogin({
        email: serverUser.email ?? trimmedEmail,
        name: serverUser.name ?? trimmedEmail,
        role,
        token: response.token,
        outletName: serverUser.outlet_name ?? undefined,
        outletId: serverUser.outlet_id ? Number(serverUser.outlet_id) : undefined,
        permissions,
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        // Server responded with an error (wrong password, account disabled, etc.)
        const msg = err.data?.message ?? err.data?.error ?? err.message;
        setError(msg || `Server error (${err.status})`);
      } else {
        // Network-level failure (wrong IP, server down, no WiFi)
        setError(
          `Cannot reach server at ${BASE_URL}.\n\nMake sure:\n• Your phone & PC are on the same Wi-Fi\n• The backend server is running`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#C0392B" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Red header with diagonal stripes ────────────────────────── */}
        <LinearGradient
          colors={['#E8342A', '#C0392B', '#A93226']}
          style={[styles.hero, { paddingTop: insets.top + 28 }]}
        >
          {/* Diagonal stripe overlay */}
          <View style={styles.stripeOverlay} pointerEvents="none">
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stripe,
                  { top: i * 48 - 40, left: -60 + i * 20, width: W * 1.8 },
                ]}
              />
            ))}
          </View>

          {/* Logo image */}
          <Image
            source={require('../../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Brand name */}
          <Text style={styles.brandGupta}>Gupta</Text>
          <Text style={styles.brandSandwich}>Sandwich</Text>

          {/* Tagline */}
          <Text style={styles.tagline}>FRESH  ·  TASTY  ·  ALWAYS</Text>

          {/* CTA pill */}
          <View style={styles.ctaPill}>
            <View style={styles.ctaInner}>
              <MaterialCommunityIcons name="food" size={16} color="#F5C842" />
              <Text style={styles.ctaText}>  ORDER. ENJOY. REPEAT.</Text>
            </View>
          </View>

        </LinearGradient>

        {/* ── Sharp downward V chevron using SVG ─────────────────────── */}
        <Svg
          height={58}
          width={W}
          style={{ marginTop: -1, backgroundColor: '#F5F0E8' }}
        >
          {/* Red downward-pointing triangle = the V shape */}
          <Polygon
            points={`0,0 ${W},0 ${W / 2},58`}
            fill="#A93226"
          />
        </Svg>

        {/* ── Cream / white form area ──────────────────────────────────── */}
        <View style={styles.formArea}>

          {/* Admin panel pill */}


          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          {/* <Text style={styles.welcomeSub}>Sign in to access the admin dashboard</Text> */}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <View style={styles.errorRow}>
                <Ionicons name="warning" size={16} color="#B91C1C" style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={[styles.errorText, { flex: 1 }]}>{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Email field */}
          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#C0392B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@guptasandwich.com"
              placeholderTextColor="#B0A898"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password field */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>PASSWORD</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#C0392B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor="#B0A898"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#7A6E60"
              />
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.signInBtnText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0E8' },

  // ── Hero / Red header ────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingBottom: 24,
    position: 'relative',
  },
  stripeOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ rotate: '-20deg' }],
  },

  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
    borderRadius: 12,
  },
  brandGupta: {
    fontSize: 42,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
    lineHeight: 46,
  },
  brandSandwich: {
    fontSize: 42,
    fontWeight: FontWeight.bold,
    color: '#F5C842',
    letterSpacing: 1,
    lineHeight: 48,
    marginBottom: 10,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 3,
    fontWeight: FontWeight.semibold,
    marginBottom: 18,
  },
  ctaPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaText: {
    color: '#F5C842',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },

  // ── Form area ────────────────────────────────────────────────────────────
  formArea: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  portalPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5C842',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D4A800',
  },
  portalText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#5A3E00',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: '#1C1C1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: FontSize.sm,
    color: '#7A6E60',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#C0392B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: '#1C1C1A',
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  signInBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
});
