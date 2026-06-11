import { useState, useCallback } from "react";  // Add useCallback
import { getAllDishes } from "../services/posApi";
import "./VoiceBot.css";

function VoiceBot({ onAddItem, showToast, orderType = "dine" }) {

  const [listening, setListening] = useState(false);

  const startBot = useCallback(() => {  // Wrap in useCallback

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    setListening(true);

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = () => {
      console.log("Listening Started");
      console.log("Current order type:", orderType);
    };

    recognition.onresult = async (event) => {

      const dishes = await getAllDishes();

      const text = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      console.log("Voice:", text);
      console.log("Current orderType when processing:", orderType); // Add this log

      if (
        text.includes("order complete") ||
        text.includes("done") ||
        text.includes("finish order")
      ) {
        recognition.stop();
        setListening(false);
        showToast?.("Order Completed");
        return;
      }

      let bestMatch = null;
      let bestScore = 0;

      dishes.forEach((dish) => {
        const words = dish.name.toLowerCase().split(" ");
        let score = 0;

        words.forEach((word) => {
          if (text.includes(word)) {
            score++;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestMatch = dish;
        }
      });

      if (bestMatch && bestScore > 0) {

        let quantity = 1;

        const quantityWords = {
          one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, five: 5,
          six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
          ek: 1, do: 2, teen: 3, char: 4, paanch: 5, cheh: 6,
          saat: 7, aath: 8, nau: 9, das: 10,
          bees: 20, tees: 30, chalis: 40, pachas: 50,
          saath: 60, sattar: 70, assi: 80, nabbe: 90,
          sau: 100, hundred: 100, thousand: 1000
        };

        const digitMatch = text.match(/\d+/);

        if (digitMatch) {
          quantity = parseInt(digitMatch[0]);
        } else {
          Object.keys(quantityWords).forEach((word) => {
            if (text.includes(word)) {
              quantity = quantityWords[word];
            }
          });
        }

        console.log("VOICE:", text);
        console.log("QUANTITY:", quantity);
        console.log("MATCH:", bestMatch?.name);
        console.log("ORDER TYPE:", orderType);

        // Select price based on current orderType
        let selectedPrice;
        let priceTypeText;
        
        if (orderType === "parcel") {
          selectedPrice = bestMatch.parcelPrice ?? bestMatch.dinePrice ?? bestMatch.price;
          priceTypeText = "Parcel";
          console.log("Using PARCEL price:", selectedPrice);
        } else {
          selectedPrice = bestMatch.dinePrice ?? bestMatch.parcelPrice ?? bestMatch.price;
          priceTypeText = "Dine-in";
          console.log("Using DINE-IN price:", selectedPrice);
        }

        for (let i = 0; i < quantity; i++) {
          onAddItem({
            id: bestMatch.id,
            dishId: bestMatch.id,
            name: bestMatch.name,
            price: selectedPrice,
            dinePrice: bestMatch.dinePrice,
            parcelPrice: bestMatch.parcelPrice,
            qty: 1
          });
        }

        showToast?.(`${quantity} ${bestMatch.name} (${priceTypeText}) Added`);
      } else {
        showToast?.("Dish Not Found");
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }, [orderType, onAddItem, showToast]);  // Add dependencies

  return (
    <div
      onClick={startBot}
      className={listening ? "bot-icon blink" : "bot-icon"}
      title="Order Assistant"
    >
      ✦
    </div>
  );
}

export default VoiceBot;