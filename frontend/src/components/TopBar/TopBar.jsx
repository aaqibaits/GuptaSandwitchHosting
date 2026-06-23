import { useState, useEffect, useRef, useCallback } from "react";
import { getAllDishes } from "../services/posApi";
import "./VoiceBot.css";

// --- Utility Functions ---

// Pure JS Levenshtein distance
function levenshtein(a, b) {
  const tmp = [];
  let i, j;
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

// Word match check with length-based thresholds
function isWordMatch(w1, w2) {
  const dist = levenshtein(w1, w2);
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen <= 3) return dist === 0;
  if (maxLen === 4) return dist <= 1;
  return dist <= 2; // For maxLen >= 5
}

// Split text into item segments
function splitSegments(text) {
  return text
    .split(/\b(?:and|aur|with|plus|aani)\b|[,;+]/i)
    .map(s => s.trim())
    .filter(Boolean);
}

// Constants
const QUANTITY_WORDS = {
  one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, cheh: 6,
  saat: 7, aath: 8, nau: 9, das: 10,
  bees: 20, tees: 30, chalis: 40, pachas: 50,
  saath: 60, sattar: 70, assi: 80, nabbe: 90,
  sau: 100, hundred: 100, thousand: 1000,
  
  // Marathi Transliterations
  don: 2, paach: 5, saha: 6, daha: 10,
  vis: 20, vees: 20, pannas: 50, ainshi: 80, aanshi: 80,
  navvad: 90, shambhar: 100
};

const COMMANDS = {
  STOP: [
    "complete order", "order complete", "done", "finish order", "finish", 
    "stop", "stop listening", "bas", "order done", "complete",
    // Marathi
    "zhale", "zala", "sampva", "sampava"
  ],
  CLEAR: [
    "clear cart", "clear order", "empty cart", "clear list", "khali kar do", 
    "delete order", "clear",
    // Marathi
    "rikame kara", "saaf kara"
  ],
  REMOVE: [
    "remove last item", "remove last", "delete last item", "delete last", 
    "cancel last item", "cancel last", "remove item", "ek nikal do", "nikal do", 
    "remove", "delete",
    // Marathi
    "kadh", "kadha", "kadhun taka", "shevatcha kadha", "shevatcha nikal"
  ],
  SWITCH_PARCEL: [
    "switch to parcel", "make it parcel", "parcel mode", "takeaway", 
    "switch to takeaway", "pack it", "parcel kar do",
    // Marathi
    "parcel kara", "bandha", "bandhun dya"
  ],
  SWITCH_DINE: [
    "switch to dine in", "switch to dine-in", "dine-in mode", "dine in", 
    "dine mode", "dine", "here", "eat here", "dine-in kar do",
    // Marathi
    "ithech", "ithech khayacha", "ithech basun"
  ]
};

// Classify voice input command
function classifyCommand(text) {
  const cleanText = text.toLowerCase().trim();
  
  for (const cmd of COMMANDS.STOP) {
    if (cleanText === cmd || cleanText.includes(cmd)) {
      return { type: "STOP" };
    }
  }
  
  for (const cmd of COMMANDS.CLEAR) {
    if (cleanText === cmd || cleanText.includes(cmd)) {
      return { type: "CLEAR" };
    }
  }
  
  for (const cmd of COMMANDS.REMOVE) {
    if (cleanText === cmd || cleanText.startsWith(cmd) || cleanText.endsWith(cmd)) {
      return { type: "REMOVE", text: cleanText };
    }
  }

  for (const cmd of COMMANDS.SWITCH_PARCEL) {
    if (cleanText === cmd || cleanText.includes(cmd)) {
      return { type: "SWITCH_PARCEL" };
    }
  }

  for (const cmd of COMMANDS.SWITCH_DINE) {
    if (cleanText === cmd || cleanText.includes(cmd)) {
      return { type: "SWITCH_DINE" };
    }
  }
  
  return null;
}

// Extract target dish name from remove command
function getRemoveTargetText(text) {
  let clean = text.toLowerCase().trim();
  const removePhrases = COMMANDS.REMOVE;
  
  for (const phrase of removePhrases) {
    if (clean.startsWith(phrase)) {
      clean = clean.substring(phrase.length).trim();
      break;
    } else if (clean.endsWith(phrase)) {
      clean = clean.substring(0, clean.length - phrase.length).trim();
      break;
    }
  }
  return clean;
}

// Find best matching dish using Levenshtein distance
function findBestDish(segmentText, dishes) {
  const segWords = segmentText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (segWords.length === 0) return null;
  
  let bestMatch = null;
  let bestScore = { matchPercent: 0, matchedCount: 0 };
  
  for (const dish of dishes) {
    const dishWords = dish.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (dishWords.length === 0) continue;
    
    let matchedCount = 0;
    const matchedSegIndices = new Set();
    
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

// Parse quantity from text, skipping digits or words that are part of the dish name
function parseQuantity(segmentText, matchedDishName) {
  // Normalize word boundaries for digits (e.g. "5burger" -> "5 burger")
  const cleanSegment = segmentText
    .toLowerCase()
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');

  // 1. Look for explicit digits
  const digitMatches = cleanSegment.match(/\b\d+\b/g);
  if (digitMatches) {
    for (const dm of digitMatches) {
      // If this digit is not part of the dish name (e.g., dish is "7 Up" and digit is "7")
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
      // Check if this quantity word is part of the dish name (e.g., "Three Cheese Pizza")
      const dishHasWord = matchedDishName && new RegExp(`\\b${word}\\b`, 'i').test(matchedDishName.toLowerCase());
      if (!dishHasWord) {
        return QUANTITY_WORDS[word];
      }
    }
  }
  
  return 1;
}

// --- Component ---

function VoiceBot({ onAddItem, showToast, orderType = "dine", onRemoveItem, onClearCart, onOrderTypeChange, isConfirmationOpen, onConfirm, onCancel }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const dishesRef = useRef([]);

  // Refs for tracking properties to avoid stale closures in event listeners
  const orderTypeRef = useRef(orderType);
  const isConfirmationOpenRef = useRef(isConfirmationOpen);
  const onAddItemRef = useRef(onAddItem);
  const onRemoveItemRef = useRef(onRemoveItem);
  const onClearCartRef = useRef(onClearCart);
  const onOrderTypeChangeRef = useRef(onOrderTypeChange);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);
  const showToastRef = useRef(showToast);

  // Sync refs on each render
  orderTypeRef.current = orderType;
  isConfirmationOpenRef.current = isConfirmationOpen;
  onAddItemRef.current = onAddItem;
  onRemoveItemRef.current = onRemoveItem;
  onClearCartRef.current = onClearCart;
  onOrderTypeChangeRef.current = onOrderTypeChange;
  onConfirmRef.current = onConfirm;
  onCancelRef.current = onCancel;
  showToastRef.current = showToast;

  // Fetch dishes once on mount to cache them
  useEffect(() => {
    let active = true;
    async function loadDishes() {
      try {
        const data = await getAllDishes();
        if (active) {
          dishesRef.current = data;
        }
      } catch (err) {
        console.error("Failed to load dishes for voice bot:", err);
      }
    }
    loadDishes();
    return () => {
      active = false;
    };
  }, []);

  const processVoiceInput = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    
    // Normalize word boundaries for digits (e.g. "5burger" -> "5 burger")
    const cleanText = text
      .toLowerCase()
      .trim()
      .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
      .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
    
    // If confirmation is open, restrict voice commands to confirm/cancel only
    if (isConfirmationOpenRef.current) {
      showToastRef.current?.(`🎙️ Heard: "${cleanText}"`);
      const confirmPhrases = ["confirm", "yes", "okay", "yes please", "haan", "confirm order", "ok", "please confirm", "ho", "barobar"];
      const cancelPhrases = ["cancel", "no", "close", "back", "nahin", "cancel order", "no thanks", "dont switch", "nako", "radd kara"];
      
      const isConfirm = confirmPhrases.some(phrase => cleanText === phrase || cleanText.includes(phrase));
      const isCancel = cancelPhrases.some(phrase => cleanText === phrase || cleanText.includes(phrase));
      
      if (isConfirm) {
        if (onConfirmRef.current) onConfirmRef.current();
      } else if (isCancel) {
        if (onCancelRef.current) onCancelRef.current();
      } else {
        showToastRef.current?.("⚠️ Please say 'confirm' or 'cancel'");
      }
      return;
    }
    
    // 1. Classify command
    const cmd = classifyCommand(cleanText);
    if (cmd) {
      if (cmd.type === "STOP") {
        isListeningRef.current = false;
        setListening(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        showToastRef.current?.("Order Completed");
        return;
      }
      
      if (cmd.type === "CLEAR") {
        if (onClearCartRef.current) {
          onClearCartRef.current();
        } else {
          showToastRef.current?.("Clear cart not supported");
        }
        return;
      }
      
      if (cmd.type === "REMOVE") {
        const targetText = getRemoveTargetText(cmd.text);
        if (!targetText) {
          if (onRemoveItemRef.current) {
            onRemoveItemRef.current(null, 1);
          } else {
            showToastRef.current?.("Remove item not supported");
          }
        } else {
          const matchedDish = findBestDish(targetText, dishesRef.current);
          const removeQty = parseQuantity(targetText, matchedDish ? matchedDish.name : null);
          
          if (matchedDish) {
            if (onRemoveItemRef.current) {
              onRemoveItemRef.current(matchedDish.id, removeQty);
            } else {
              showToastRef.current?.("Remove item not supported");
            }
          } else {
            // No matched dish found, check if it was just a quantity to remove from the last item
            if (onRemoveItemRef.current) {
              onRemoveItemRef.current(null, removeQty);
            } else {
              showToastRef.current?.("Remove item not supported");
            }
          }
        }
        return;
      }

      if (cmd.type === "SWITCH_PARCEL") {
        if (onOrderTypeChangeRef.current) {
          onOrderTypeChangeRef.current("parcel");
        } else {
          showToastRef.current?.("Order type switch not supported");
        }
        return;
      }

      if (cmd.type === "SWITCH_DINE") {
        if (onOrderTypeChangeRef.current) {
          onOrderTypeChangeRef.current("dine");
        } else {
          showToastRef.current?.("Order type switch not supported");
        }
        return;
      }
    }
    
    // 2. Process as order items
    const segments = splitSegments(cleanText);
    let matchedAny = false;
    
    showToastRef.current?.(`🎙️ Heard: "${cleanText}"`);
    
    for (const segment of segments) {
      const bestMatch = findBestDish(segment, dishesRef.current);
      if (bestMatch) {
        matchedAny = true;
        const qty = parseQuantity(segment, bestMatch.name);
        
        console.log("VOICE SEGMENT:", segment);
        console.log("MATCHED DISH:", bestMatch.name);
        console.log("PARSED QTY:", qty);
        
        let selectedPrice;
        if (orderTypeRef.current === "parcel") {
          selectedPrice = bestMatch.parcelPrice ?? bestMatch.dinePrice ?? bestMatch.price;
        } else {
          selectedPrice = bestMatch.dinePrice ?? bestMatch.parcelPrice ?? bestMatch.price;
        }
        
        onAddItemRef.current({
          id: bestMatch.id,
          dishId: bestMatch.id,
          name: bestMatch.name,
          price: selectedPrice,
          dinePrice: bestMatch.dinePrice,
          parcelPrice: bestMatch.parcelPrice,
          qty: qty
        });
      }
    }
    
    if (!matchedAny) {
      showToastRef.current?.("Dish Not Found");
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    isListeningRef.current = true;
    setListening(true);

    recognition.onstart = () => {
      console.log("Voice Recognition: Started");
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      console.log("Voice Input:", text);
      setProcessing(true);
      
      try {
        await processVoiceInput(text);
      } catch (err) {
        console.error("Error processing voice input:", err);
      } finally {
        setProcessing(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Voice Recognition Error:", event.error);
      if (event.error === "not-allowed") {
        showToastRef.current?.("🎙️ Microphone access denied");
        isListeningRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      console.log("Voice Recognition: Ended");
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      } else {
        setListening(false);
      }
    };

    try {
      recognition.start();
      showToastRef.current?.("🎙️ Voice Assistant Active");
    } catch (e) {
      console.error("Error starting speech recognition:", e);
    }
  }, [processVoiceInput]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    showToastRef.current?.("🎙️ Voice Assistant Deactivated");
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        left: '12px', 
        bottom: '150px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '6px', 
        zIndex: 9999 
      }}
    >
      <div
        onClick={toggleListening}
        className={listening ? "bot-icon blink" : "bot-icon"}
        title="Order Assistant"
        style={{ position: 'static' }}
      >
        ✦
      </div>
      <div 
        style={{
          fontSize: '10px',
          fontWeight: '600',
          color: listening ? (processing ? '#fbbf24' : '#10b981') : '#9ca3af',
          background: 'rgba(31, 41, 55, 0.85)',
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }}
      >
        {listening ? (processing ? "Processing" : "Listening") : "Offline"}
      </div>
    </div>
  );
}

export default VoiceBot;