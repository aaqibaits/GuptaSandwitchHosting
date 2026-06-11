import React, { useRef, useState, useCallback } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated, View, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VoiceBotDish {
  id: number;
  name: string;
  price: number;
  dine_price?: number;
  parcel_price?: number;
}

interface VoiceBotProps {
  onAddItem: (item: {
    id: number;
    name: string;
    price: number;
    dine_price?: number;
    parcel_price?: number;
    qty: number;
  }) => void;
  showToast: (msg: string) => void;
  dishes: VoiceBotDish[];
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
  
  // Hindi numbers
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5,
  cheh: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  solah: 16, satrah: 17, atharah: 18, unnees: 19, bees: 20,
  tees: 30, chalis: 40, pachas: 50, saath: 60, sattar: 70,
  assi: 80, nabbe: 90, sau: 100, hazaar: 1000,
  
  // Common variations
  'twnty': 20, 'thrity': 30, 'fourty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundered': 100, 'hundread': 100, 'thousnad': 1000,
};

// ── Stop commands ─────────────────────────────────────────────────────────────
const STOP_PHRASES = ['order complete', 'done', 'finish order', 'complete order', 'order done'];

// ── Fuzzy dish match (same algorithm as web VoiceBot.jsx) ─────────────────────
function findBestDish(text: string, dishes: VoiceBotDish[]) {
  let bestMatch: VoiceBotDish | null = null;
  let bestScore = 0;
  
  dishes.forEach(dish => {
    const words = dish.name.toLowerCase().split(' ');
    let score = 0;
    words.forEach(w => { 
      if (text.includes(w)) score++; 
    });
    // Extra score for exact match bonus
    if (text.includes(dish.name.toLowerCase())) {
      score += 2;
    }
    if (score > bestScore) { 
      bestScore = score; 
      bestMatch = dish; 
    }
  });
  
  return bestScore > 0 ? bestMatch : null;
}

// ── Advanced Quantity extraction (supports multiple number formats) ───────────
function extractQuantity(text: string): number {
  // Match ALL digit sequences and take the largest one
  // e.g. "1000 ice cream" → ["1000"] → 1000
  const allDigits = text.match(/\d+/g);
  if (allDigits && allDigits.length > 0) {
    return Math.max(...allDigits.map(d => parseInt(d, 10)));
  }

  // Compound spoken numbers: "one thousand", "ek hazar", "two hundred" etc.
  let multiplier = 1;
  if (/thousand|hazar|hazaar/.test(text)) multiplier = 1000;
  else if (/hundred|sau|hundered|hundread/.test(text)) multiplier = 100;

  if (multiplier > 1) {
    const baseWords = Object.keys(QUANTITY_WORDS)
      .filter(w => QUANTITY_WORDS[w] < 100)
      .sort((a, b) => b.length - a.length);
    for (const word of baseWords) {
      if (text.includes(word)) return QUANTITY_WORDS[word] * multiplier;
    }
    return multiplier; // "thousand" alone = 1000, "hundred" alone = 100
  }

  // Simple word match (longest first to avoid partial matches)
  const sortedWords = Object.keys(QUANTITY_WORDS).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    if (text.includes(word)) return QUANTITY_WORDS[word];
  }

  return 1;
}

// ── Extract dish name by removing quantity words ──────────────────────────────
function cleanDishName(text: string): string {
  let cleaned = text.toLowerCase();
  
  // Remove digits
  cleaned = cleaned.replace(/\d+/g, '');
  
  // Remove quantity words
  const quantityWordsList = Object.keys(QUANTITY_WORDS);
  for (const word of quantityWordsList) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  }
  
  // Remove common filler words
  const fillerWords = ['please', 'pls', 'want', 'need', 'order', 'get', 'give', 'me', 'a', 'an', 'the', 'and'];
  for (const word of fillerWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  }
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VoiceBot({ onAddItem, showToast, dishes }: VoiceBotProps) {
  const [listening, setListening] = useState(false);

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

  const handlePress = useCallback(async () => {
    if (Platform.OS !== 'android') {
      showToast('Voice ordering only works on Android');
      return;
    }
    if (listening) return;

    try {
      setListening(true);
      startPulse();

      const result = await IntentLauncher.startActivityAsync(
        'android.speech.action.RECOGNIZE_SPEECH' as any,
        {
          extra: {
            'android.speech.extra.LANGUAGE_MODEL': 'free_form',
            'android.speech.extra.LANGUAGE': 'en-IN',
            'android.speech.extra.PROMPT': 'Say dish name and quantity (e.g., 2 Paneer Pizza)…',
            'android.speech.extra.MAX_RESULTS': 5,
          },
        } as any
      );

      if (result.resultCode === -1 && result.extra) {
        const results = (result.extra as any)['android.speech.extra.RESULTS'] as string[];
        const text = (results?.[0] ?? '').toLowerCase().trim();
        console.log('[VoiceBot] Heard:', text);
        console.log('[VoiceBot] Cleaned:', cleanDishName(text));

        if (!text) return;

        // Check for stop/complete commands
        if (STOP_PHRASES.some(p => text.includes(p))) {
          showToast('Order Completed');
          return;
        }

        // Extract quantity first
        const qty = extractQuantity(text);
        console.log('[VoiceBot] Quantity:', qty);

        // Clean the text to get dish name
        const cleanedText = cleanDishName(text);
        
        // Try to find best matching dish
        let match = findBestDish(cleanedText, dishes);
        
        // If no match with cleaned text, try with original text
        if (!match) {
          match = findBestDish(text, dishes);
        }
        
        if (!match) {
          showToast('Dish not found. Try saying the exact name.');
          console.log('[VoiceBot] No match for:', cleanedText);
          return;
        }

        console.log('[VoiceBot] Matched dish:', match.name);
        
        // Add items to cart
        for (let i = 0; i < qty; i++) {
          onAddItem({
            id: match.id,
            name: match.name,
            price: match.dine_price ?? match.price,
            dine_price: match.dine_price,
            parcel_price: match.parcel_price,
            qty: 1,
          });
        }
        
        // Show success toast with quantity and dish name
        const quantityWord = qty === 1 ? '' : `${qty} × `;
        showToast(`${quantityWord}${match.name} added`);
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (!msg.includes('cancel') && !msg.includes('CANCEL')) {
        showToast('Voice recognition failed. Try again.');
        console.error('[VoiceBot] Error:', err);
      }
    } finally {
      setListening(false);
      stopPulse();
    }
  }, [listening, dishes, onAddItem, showToast, startPulse, stopPulse]);

  // Android only
  if (Platform.OS === 'ios') return null;

  return (
    <View style={styles.fab} pointerEvents="box-none">
      {/* Outer ripple ring when listening */}
      {listening && <Animated.View style={[styles.ripple, { transform: [{ scale: pulseAnim }] }]} />}

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[styles.btn, listening && styles.btnActive]}
        disabled={listening}
      >
        <Ionicons 
          name="mic-outline" 
          size={28} 
          color="#fff" 
        />
      </TouchableOpacity>

      <Text style={[styles.label, listening && styles.labelActive]}>
        {listening ? 'Listening...' : 'Voice'}
      </Text>
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
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
    top: -13,
    left: -13,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  btnActive: {
    backgroundColor: '#15803D',
    elevation: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: '#15803D',
  },
});