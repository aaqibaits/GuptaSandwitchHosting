import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated, View, Platform, TextInput, Modal, PermissionsAndroid, NativeModules,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import Voice from '@react-native-voice/voice';
import { Colors } from '../../constants/colors';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Voice Bot needs access to your microphone to take voice orders.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[VoiceBot] Permission request error:', err);
      return false;
    }
  }
  return true;
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VoiceBotDish {
  id: number;
  name: string;
  price: number;
  dine_price?: number;
  parcel_price?: number;
  emoji?: string;
}

interface VoiceBotProps {
  onAddItem: (item: {
    id: number;
    name: string;
    price: number;
    dine_price?: number;
    parcel_price?: number;
    qty: number;
    emoji?: string;
  }) => void;
  onChangeOrderType: (type: 'dine-in' | 'parcel') => void;
  showToast: (msg: string) => void;
  dishes: VoiceBotDish[];
  cartActive?: boolean;
}

// ── Complete Quantity word map (same as web VoiceBot.jsx) ──────────────────────────────
const QUANTITY_WORDS: Record<string, number> = {
  // English numbers
  one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000,
  
  // Hindi & Marathi numbers
  ek: 1, do: 2, don: 2, teen: 3, char: 4, paanch: 5, paach: 5,
  cheh: 6, saha: 6, saat: 7, aath: 8, nau: 9, nauv: 9, das: 10, daha: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  solah: 16, satrah: 17, atharah: 18, unnees: 19, bees: 20,
  tees: 30, chalis: 40, pachas: 50, saath: 60, sattar: 70,
  assi: 80, nabbe: 90, sau: 100, hazaar: 1000,
  
  // Common variations
  'twnty': 20, 'thrity': 30, 'fourty': 40,
  'hundered': 100, 'hundread': 100, 'thousnad': 1000,
};

// ── Stop commands ─────────────────────────────────────────────────────────────
const STOP_PHRASES = ['order complete', 'done', 'finish order', 'complete order', 'order done'];

// ── Pure JS Levenshtein distance (same as web VoiceBot) ───────────────────────
function levenshtein(a: string, b: string): number {
  const tmp: number[][] = [];
  let i: number, j: number;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

// ── Word match check with length-based thresholds ───────────────────────────
function isWordMatch(w1: string, w2: string): boolean {
  const dist = levenshtein(w1, w2);
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen <= 3) return dist === 0;
  if (maxLen === 4) return dist <= 1;
  return dist <= 2; // For maxLen >= 5
}

// ── Split text into item segments ─────────────────────────────────────────────
function splitSegments(text: string): string[] {
  return text
    .split(/\b(?:and|aur|with|plus|aani)\b|[,;+]/i)
    .map(s => s.trim())
    .filter(Boolean);
}

// ── Find best matching dish using Levenshtein distance ───────────────────────
function findBestDish(segmentText: string, dishes: VoiceBotDish[]): VoiceBotDish | null {
  const segWords = segmentText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (segWords.length === 0) return null;
  
  let bestMatch: VoiceBotDish | null = null;
  let bestScore = { matchPercent: 0, matchedCount: 0 };
  
  for (const dish of dishes) {
    const dishWords = dish.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (dishWords.length === 0) continue;
    
    let matchedCount = 0;
    const matchedSegIndices = new Set<number>();
    
    for (const dw of dishWords) {
      for (let i = 0; i < segWords.length; i++) {
        if (matchedSegIndices.has(i)) continue;
        if (isWordMatch(dw, segWords[i])) {
          matchedCount++;
          matchedSegIndices.add(i);
          break;
        }
      }
    }
    
    if (matchedCount === 0) continue;
    
    const matchPercent = matchedCount / dishWords.length;
    
    let isBetter = false;
    if (matchPercent > bestScore.matchPercent) {
      isBetter = true;
    } else if (matchPercent === bestScore.matchPercent) {
      if (matchedCount > bestScore.matchedCount) {
        isBetter = true;
      }
    }
    
    if (isBetter) {
      bestScore = { matchPercent, matchedCount };
      bestMatch = dish;
    }
  }
  
  if (bestScore.matchPercent >= 0.5) {
    return bestMatch;
  }
  
  return null;
}

// ── Parse quantity from text, skipping digits or words that are part of the dish name ──
function parseQuantity(segmentText: string, matchedDishName?: string): number {
  // Normalize word boundaries for digits (e.g. "5burger" -> "5 burger")
  const cleanSegment = segmentText
    .toLowerCase()
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');

  // 1. Look for explicit digits
  const digitMatches = cleanSegment.match(/\b\d+\b/g);
  if (digitMatches) {
    for (const dm of digitMatches) {
      const dishHasDigit = matchedDishName && new RegExp(`\\b${dm}\\b`).test(matchedDishName.toLowerCase());
      if (!dishHasDigit) {
        return parseInt(dm, 10);
      }
    }
  }
  
  // 2. Look for quantity words
  const words = cleanSegment.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (QUANTITY_WORDS[word] !== undefined) {
      const dishHasWord = matchedDishName && new RegExp(`\\b${word}\\b`, 'i').test(matchedDishName.toLowerCase());
      if (!dishHasWord) {
        return QUANTITY_WORDS[word];
      }
    }
  }
  
  return 1;
}

// ── Clean dish name by removing English/Hindi/Marathi filler words ──────────
function cleanDishName(text: string): string {
  let cleaned = text.toLowerCase();
  
  const fillerWords = [
    'please', 'pls', 'want', 'need', 'order', 'get', 'give', 'me', 'a', 'an', 'the', 'and',
    'chahiye', 'pahije', 'mala', 'malaa', 'paahije', 'mujhe', 'mujhko', 'de', 'do', 'lo', 'le',
    'pahijea', 'hava', 'havay', 'havaye', 'kar', 'karo', 'chahie', 'chahiy', 'malah', 'pahije'
  ];
  
  for (const word of fillerWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

export default function VoiceBot({ onAddItem, onChangeOrderType, showToast, dishes, cartActive }: VoiceBotProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = cartActive ? (144 + insets.bottom) : (76 + insets.bottom);
  
  const [listening, setListening] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const processSpeechText = useCallback((text: string): boolean => {
    const cleanedText = text.toLowerCase().trim();
    if (!cleanedText) return false;

    // 1. Check for Order Mode switching commands (English & Hindi/Marathi)
    const isParcelCommand = [
      'switch to parcel', 'parcel mode', 'change to parcel',
      'takeaway', 'take away', 'parcel kar do', 'parcel karo',
      'parcel lava', 'parcel lav', 'pack it', 'parcel'
    ].some(phrase => cleanedText.includes(phrase));

    const isDineInCommand = [
      'switch to dine in', 'dine in mode', 'dine-in', 'dine in',
      'change to dine in', 'table mode', 'dine in kar do', 'dine-in kar do',
      'dine in karo', 'dine-in karo', 'dine mode', 'dine', 'eat here', 'here'
    ].some(phrase => cleanedText.includes(phrase));

    if (isParcelCommand) {
      onChangeOrderType('parcel');
      showToast('Switched to Parcel mode');
      return true;
    }

    if (isDineInCommand) {
      onChangeOrderType('dine-in');
      showToast('Switched to Dine-in mode');
      return true;
    }

    // 2. Check for stop/complete commands
    if (STOP_PHRASES.some(p => cleanedText.includes(p))) {
      showToast('Order Completed');
      return true;
    }

    // 3. Replicate the web app segment parsing and fuzzy Levenshtein matching
    const segments = splitSegments(cleanedText);
    let matchedAny = false;

    console.log('[VoiceBot] Spoken input segments:', segments);

    for (const segment of segments) {
      const cleanedSeg = cleanDishName(segment);
      let match = findBestDish(cleanedSeg, dishes);

      if (!match) {
        match = findBestDish(segment, dishes);
      }

      if (match) {
        matchedAny = true;
        const qty = parseQuantity(segment, match.name);
        console.log('[VoiceBot] Segment:', segment, 'Matched:', match.name, 'Quantity:', qty);

        // Add items to cart
        for (let i = 0; i < qty; i++) {
          onAddItem({
            id: match.id,
            name: match.name,
            price: match.dine_price ?? match.price,
            dine_price: match.dine_price,
            parcel_price: match.parcel_price,
            qty: 1,
            emoji: match.emoji,
          });
        }

        const quantityWord = qty === 1 ? '' : `${qty} × `;
        showToast(`${quantityWord}${match.name} added`);
      }
    }

    return matchedAny;
  }, [dishes, onAddItem, onChangeOrderType, showToast]);

  const showFallbackInput = () => {
    setFallbackText('');
    setShowFallback(true);
  };

  const handleFallbackSubmit = () => {
    if (fallbackText.trim()) {
      const matched = processSpeechText(fallbackText);
      if (!matched) {
        showToast('Dish not found. Try saying the exact name.');
      }
    }
    setShowFallback(false);
  };

  useEffect(() => {
    // Check if native Voice module is available to prevent crash in Expo Go
    const isVoiceAvailable = Voice && typeof Voice.start === 'function' && (NativeModules.Voice || NativeModules.RCTVoice);
    if (!isVoiceAvailable) return;

    Voice.onSpeechStart = () => {
      setListening(true);
      startPulse();
    };
    Voice.onSpeechResults = (e: any) => {
      const alternatives = e.value || [];
      console.log('[VoiceBot] Heard (Voice) alternatives:', alternatives);
      
      let matched = false;
      for (const heardText of alternatives) {
        if (processSpeechText(heardText)) {
          matched = true;
          break;
        }
      }
      
      if (!matched && alternatives.length > 0) {
        showToast('Dish not found. Try saying the exact name.');
      }
      setListening(false);
      stopPulse();
    };
    Voice.onSpeechError = (e: any) => {
      console.error('[VoiceBot] Speech error:', e);
      const errorMsg = String(e.error?.message ?? '');
      if (!errorMsg.includes('No speech input') && !errorMsg.includes('No match')) {
        showToast('Voice recognition failed. Try again.');
      }
      setListening(false);
      stopPulse();
    };
    Voice.onSpeechEnd = () => {
      setListening(false);
      stopPulse();
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [processSpeechText, startPulse, stopPulse, showToast]);

  const handlePress = useCallback(async () => {
    const isVoiceAvailable = Voice && typeof Voice.start === 'function' && (NativeModules.Voice || NativeModules.RCTVoice);
    if (!isVoiceAvailable) {
      showFallbackInput();
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      showToast('Microphone permission denied');
      return;
    }

    if (listening) {
      try {
        await Voice.stop();
      } catch (err) {
        console.error('[VoiceBot] Stop error:', err);
      }
      setListening(false);
      stopPulse();
    } else {
      try {
        setListening(true);
        startPulse();
        await Voice.start('en-IN');
      } catch (err) {
        console.error('[VoiceBot] Start error:', err);
        setListening(false);
        stopPulse();
        showFallbackInput();
      }
    }
  }, [listening, startPulse, stopPulse, showToast]);

  return (
    <View style={styles.fab} pointerEvents="box-none">
      {/* Outer ripple ring when listening */}
      {listening && <Animated.View style={[styles.ripple, { transform: [{ scale: pulseAnim }] }]} />}

      <Animated.View style={listening ? { transform: [{ scale: pulseAnim }] } : undefined}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={[styles.btn, listening && styles.btnActive]}
        >
          <Ionicons 
            name="mic-outline" 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.label, listening && styles.labelActive]}>
        {listening ? 'Listening...' : 'Voice'}
      </Text>

      {/* Fallback Simulator Modal */}
      <Modal
        visible={showFallback}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFallback(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Voice Simulator</Text>
            <Text style={styles.modalDesc}>
              Native voice engine is not available in Expo Go. Type your command below to test the parser:
            </Text>
            <TextInput
              style={styles.textInput}
              value={fallbackText}
              onChangeText={setFallbackText}
              placeholder="e.g. 2 Paneer Pizza"
              placeholderTextColor="#999"
              autoFocus
              onSubmitEditing={handleFallbackSubmit}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowFallback(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={handleFallbackSubmit}
              >
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Floating position — bottom-right, above the cart FAB row
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  ripple: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(232, 89, 12, 0.18)',
    top: -7,
    left: -7,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  btnActive: {
    backgroundColor: Colors.primaryMid,
    elevation: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: Colors.primaryMid,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#333',
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#ccc',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});