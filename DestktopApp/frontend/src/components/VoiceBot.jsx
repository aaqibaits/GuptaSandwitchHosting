import { useState } from "react";
import { getAllDishes } from "../services/posApi";
import "./VoiceBot.css";

function VoiceBot({ onAddItem, showToast }) {

  const [listening, setListening] = useState(false);

  const startBot = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    setListening(true);

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = () => {
      console.log("Listening Started");
    };

    recognition.onresult = async (event) => {

      const dishes =
        await getAllDishes();

      const text =
        event.results[
          event.results.length - 1
        ][0].transcript
          .toLowerCase()
          .trim();

      console.log("Voice:", text);
      // alert(text);

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

      const numberWords = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12,
        thirteen: 13,
        fourteen: 14,
        fifteen: 15,
        twenty: 20
      };

      let foundDish = false;
let bestMatch = null;
let bestScore = 0;

dishes.forEach((dish) => {

  const words =
    dish.name
      .toLowerCase()
      .split(" ");

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

  foundDish = true;

  let quantity = 1;

// 
// 
const quantityWords = {
  one: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,

  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  cheh: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,

  bees: 20,
  tees: 30,
  chalis: 40,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,

  sau: 100,
  hundred: 100,
  thousand: 1000
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

  // let quantity = 1;

  // const digitMatch =
  //   text.match(/\d+/);

  // if (digitMatch) {

  //   quantity =
  //     parseInt(digitMatch[0]);

  // } else {

  //   for (const word in numberWords) {

  //     if (text.includes(word)) {

  //       quantity =
  //         numberWords[word];

  //       break;

  //     }

  //   }

  // }

  for (
    let i = 0;
    i < quantity;
    i++
  ) {

    onAddItem({
      id: bestMatch.id,
      dishId: bestMatch.id,
      name: bestMatch.name,
      price:
        bestMatch.dinePrice ??
        bestMatch.price,
      dinePrice:
        bestMatch.dinePrice,
      parcelPrice:
        bestMatch.parcelPrice,
      qty: 1
    });

  }

  showToast?.(
    `${quantity} ${bestMatch.name} Added`
  );

}

      // let foundDish = false;

      // dishes.forEach((dish) => {

      //   const dishName =
      //     dish.name.toLowerCase();

      //   if (
      //     text.includes(dishName)
      //   ) {

      //     foundDish = true;

      //     let quantity = 1;

      //     const digitMatch =
      //       text.match(/\d+/);

      //     if (digitMatch) {

      //       quantity =
      //         parseInt(
      //           digitMatch[0]
      //         );

      //     } else {

      //       for (
      //         const word in numberWords
      //       ) {

      //         if (
      //           text.includes(word)
      //         ) {

      //           quantity =
      //             numberWords[word];

      //           break;
      //         }
      //       }
      //     }

      //     for (
      //       let i = 0;
      //       i < quantity;
      //       i++
      //     ) {

      //       onAddItem({
      //         id: dish.id,
      //         dishId: dish.id,
      //         name: dish.name,
      //         price:
      //           dish.dinePrice ??
      //           dish.price,
      //         dinePrice:
      //           dish.dinePrice,
      //         parcelPrice:
      //           dish.parcelPrice,
      //         qty: 1
      //       });

      //     }

      //     showToast?.(
      //       `${quantity} ${dish.name} Added`
      //     );

      //   }

      // });

      // if (!foundDish) {

      //   showToast?.(
      //     `Dish Not Found`
      //   );

      // }

    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

  };

  return (
    <div
      onClick={startBot}
      className={
        listening
          ? "bot-icon blink"
          : "bot-icon"
      }
    >
      ✦
    </div>
  );

}

export default VoiceBot;


// import { getAllDishes } from "../services/posApi";
// import { useState } from "react";
// import "./VoiceBot.css";

// function VoiceBot({ onAddItem, showToast })  {

//   const [listening, setListening] = useState(false);
//   const startBot = () => {

//   setListening(true);

//   const SpeechRecognition =
//     window.SpeechRecognition ||
//     window.webkitSpeechRecognition;

//   if (!SpeechRecognition) {

//     alert("Speech Recognition not supported");

//     return;
//   }

//   const recognition =
//     new SpeechRecognition();

//     recognition.continuous = true;
// recognition.interimResults = false;

//   // recognition.lang = "en-IN";
// recognition.lang = "en-US";

//   recognition.start();
//  recognition.onstart = () => {
//   console.log("Listening Started");
// };
//   recognition.continuous = true;
// recognition.interimResults = false;
// recognition.onresult = async (event) => {

//   const dishes = await getAllDishes();
//   console.log("DISHES:", dishes);

//   const text =
//     event.results[0][0].transcript
//       .toLowerCase();

//   console.log("Voice:", text);
  
//   console.log("Dishes:", dishes);

// dishes.forEach((dish) => {
//   console.log("Checking:", dish.name);
// });
//   showToast?.(`Voice: ${text}`);

  

//   if (
//     text.includes("order complete") ||
//     text.includes("done") ||
//     text.includes("finish order")
//   ) {
//     recognition.stop();
//     setListening(false);
//     showToast?.("Order Completed");
//     return;
//   }

//   const numberWords = {
//     one: 1,
//     two: 2,
//     three: 3,
//     four: 4,
//     five: 5,
//     six: 6,
//     seven: 7,
//     eight: 8,
//     nine: 9,
//     ten: 10,
//     eleven: 11,
//     twelve: 12,
//     thirteen: 13,
//     fourteen: 14,
//     fifteen: 15,
//     twenty: 20
//   };

//   let quantity = 1;

//   const digitMatch = text.match(/\d+/);

//   if (digitMatch) {
//     quantity = parseInt(digitMatch[0]);
//   } else {
//     for (const word in numberWords) {
//       if (text.includes(word)) {
//         quantity = numberWords[word];
//         break;
//       }
//     }
//   }

//   let dishName = text;

//   dishName = dishName.replace(/\d+/g, "");

//   const aliases = {
//   "sandwich": "chocolate sandwich",
//   "burger": "chocolate burger",
//   "pizza": "paneer pizza"
// };
//   Object.keys(numberWords).forEach((word) => {
//     dishName = dishName.replace(word, "");
//   });
//   dishName = dishName
//   .replace("to", "")
//   .replace("too", "")
//   .replace("please", "")
//   .trim();

//   dishName = dishName.trim();
//   // let foundDish = false;
// dishes.forEach((dish) => {

//   const dbDish = dish.name.toLowerCase();

//   const dbWords = dbDish.split(" ");

//   const matchedWords = dbWords.filter(word =>
//     text.includes(word)
//   );

//   if (matchedWords.length >= 2 || matchedWords.length === dbWords.length) {

//     for (let i = 0; i < quantity; i++) {

//       onAddItem({
//         id: dish.id,
//         dishId: dish.id,
//         name: dish.name,
//         price: dish.dinePrice ?? dish.price,
//         dinePrice: dish.dinePrice,
//         parcelPrice: dish.parcelPrice,
//         qty: 1
//       });

//     }

//     showToast?.(`${quantity} ${dish.name} Added`);
//   }

// });

// };
//  recognition.onerror = () => {
//     // setListening(false);
//   };

// };
// return (
//   <div
//     onClick={startBot}
//     className={
//       listening
//         ? "bot-icon blink"
//         : "bot-icon"
//     }
//   >
//     ✦
//   </div>
// );
// }

// export default VoiceBot;

//   // const matchedDish = dishes.find(
//   //   (dish) =>
//   //     dish.name.toLowerCase().includes(dishName)
//   // );
// //   const matchedDish = dishes.find(
// //   (dish) =>
// //     dishName.includes(
// //       dish.name.toLowerCase()
// //     )
// // );
// // 
// // const matchedDish = dishes.find((dish) => {

// //   const dbDish =
// //     dish.name
// //       .toLowerCase()
// //       .replace(/\s+/g, " ")
// //       .trim();

// //   const voiceDish =
// //     dishName
// //       .toLowerCase()
// //       .replace(/\s+/g, " ")
// //       .trim();

// //   return dbDish === voiceDish;

// // });

// //   if (matchedDish) {

// //     for (let i = 0; i < quantity; i++) {

// //       onAddItem({
// //         id: matchedDish.id,
// //         dishId: matchedDish.id,
// //         name: matchedDish.name,
// //         price:
// //           matchedDish.dinePrice ??
// //           matchedDish.price,
// //         dinePrice:
// //           matchedDish.dinePrice,
// //         parcelPrice:
// //           matchedDish.parcelPrice,
// //         qty: 1
// //       });

// //     }

// //     showToast?.(
// //       `${quantity} ${matchedDish.name} Added`
// //     );

// //   } 
// // let foundDish = false;

// // dishes.forEach((dish) => {

// //   const dbDish =
// //     dish.name.toLowerCase();

// //   if (
// //     text.includes(dbDish)
// //   ) {

// //     foundDish = true;

// //     for (
// //       let i = 0;
// //       i < quantity;
// //       i++
// //     ) {

// //       onAddItem({
// //         id: dish.id,
// //         dishId: dish.id,
// //         name: dish.name,
// //         price:
// //           dish.dinePrice ??
// //           dish.price,
// //         dinePrice:
// //           dish.dinePrice,
// //         parcelPrice:
// //           dish.parcelPrice,
// //         qty: 1
// //       });

// //     }

// //     showToast?.(
// //       `${quantity} ${dish.name} Added`
// //     );

// //   }

// // });

// // if (!foundDish) {

// //   showToast?.(
// //     `Dish Not Found`
// //   );

// // }
// // let foundDish = false;
// // dishes.forEach((dish) => {

// //   const dbDish = dish.name.toLowerCase();

// //   const dbWords = dbDish.split(" ");

// //   const matchedWords = dbWords.filter(word =>
// //     text.includes(word)
// //   );

// //   if (matchedWords.length >= 2 || matchedWords.length === dbWords.length) {

// //     for (let i = 0; i < quantity; i++) {

// //       onAddItem({
// //         id: dish.id,
// //         dishId: dish.id,
// //         name: dish.name,
// //         price: dish.dinePrice ?? dish.price,
// //         dinePrice: dish.dinePrice,
// //         parcelPrice: dish.parcelPrice,
// //         qty: 1
// //       });

// //     }

// //     showToast?.(`${quantity} ${dish.name} Added`);
// //   }

// // });

// // };
// //  recognition.onerror = () => {
// //     // setListening(false);
// //   };

// // };
// // return (
// //   <div
// //     onClick={startBot}
// //     className={
// //       listening
// //         ? "bot-icon blink"
// //         : "bot-icon"
// //     }
// //   >
// //     ✦
// //   </div>
// // );
// // }

// // export default VoiceBot;

// // dishes.forEach((dish) => {

// //   const dbDish =
// //     dish.name.toLowerCase();

// //   const words =
// //     dbDish.split(" ");

// //   const matched =
// //     words.every(word =>
// //       text.includes(word)
// //     );

// //   if (matched) {

// //     foundDish = true;

// //     for (
// //       let i = 0;
// //       i < quantity;
// //       i++
// //     ) {

// //       onAddItem({
// //         id: dish.id,
// //         dishId: dish.id,
// //         name: dish.name,
// //         price:
// //           dish.dinePrice ??
// //           dish.price,
// //         dinePrice:
// //           dish.dinePrice,
// //         parcelPrice:
// //           dish.parcelPrice,
// //         qty: 1
// //       });

// //     }

// //     showToast?.(
// //       `${quantity} ${dish.name} Added`
// //     );

// //   }

// // });
// // else {

// //     showToast?.(
// //       `Dish not found: ${dishName}`
// //     );

// //   }

// // };
// //  recognition.onerror = () => {
// //     // setListening(false);
// //   };

// // };
// // return (
// //   <div
// //     onClick={startBot}
// //     className={
// //       listening
// //         ? "bot-icon blink"
// //         : "bot-icon"
// //     }
// //   >
// //     ✦
// //   </div>
// // );
// // }

// // export default VoiceBot;
//   // recognition.onresult = (event) => {

//   //   const text =
//   //     event.results[0][0].transcript
//   //       .toLowerCase();

//   //   console.log("Voice:", text);

//   //   if (
//   //     text.includes("chocolate sandwich")
//   //   ) {

//   //     onAddItem({
//   //       id: 1,
//   //       dishId: 1,
//   //       name: "Chocolate Sandwich",
//   //       price: 456,
//   //       dinePrice: 456,
//   //       parcelPrice: 456,
//   //       qty: 1
//   //     });

//   //     showToast?.(
//   //       "Chocolate Sandwich Added"
//   //     );
//   //   }

//   //   setListening(false);
//   // };

// //  recognition.onresult = async (event) =>  {

// //     const dishes = await getAllDishes();

// //   const text =
// //     event.results[0][0].transcript
// //       .toLowerCase();

// //   console.log("Voice:", text);
// //   alert(text);
// //   if (
// //   text.includes("order complete") ||
// //   text.includes("done") ||
// //   text.includes("finish order")
// // ) {

// //   recognition.stop();

// //   setListening(false);

// //   showToast?.("Order Completed");

// //   return;
// // }

// //   // const numberMatch =
// //   //   text.match(/\d+/);

// //   // const quantity =
// //   //   numberMatch
// //   //     ? parseInt(numberMatch[0])
// //   //     : 1;
// //   const numberWords = {
// //   one: 1,
// //   two: 2,
// //   three: 3,
// //   four: 4,
// //   five: 5,
// //   six: 6,
// //   seven: 7,
// //   eight: 8,
// //   nine: 9,
// //   ten: 10,
// //   eleven: 11,
// //   twelve: 12,
// //   thirteen: 13,
// //   fourteen: 14,
// //   fifteen: 15,
// //   twenty: 20
// // };

// // let quantity = 1;

// // // check numeric value
// // const digitMatch = text.match(/\d+/);

// // if (digitMatch) {

// //   quantity = parseInt(digitMatch[0]);

// // } else {

// //   for (const word in numberWords) {

// //     if (text.includes(word)) {

// //       quantity = numberWords[word];

// //       break;
// //     }
// //   }
// // }

// //   const dishName =
// //     text.replace(/\d+/g, "")
// //         .trim();

// //   // if (
// //   //   dishName.includes(
// //   //     "chocolate sandwich"
// //   //   )
// //   // ) {
// //   const matchedDish = dishes.find(
// //   dish =>
// //     dish.name
// //       .toLowerCase()
// //       .includes(dishName)
// // );

// // if (matchedDish) {

// //   for (let i = 0; i < quantity; i++) {

// //     onAddItem({
// //       id: matchedDish.id,
// //       dishId: matchedDish.id,
// //       name: matchedDish.name,
// //       price: matchedDish.dinePrice,
// //       dinePrice: matchedDish.dinePrice,
// //       parcelPrice: matchedDish.parcelPrice,
// //       qty: 1
// //     });

// //   }

// //   showToast?.(
// //     `${quantity} ${matchedDish.name} Added`
// //   );
// // }

// //   //   const item = {
// //   //     id: 1,
// //   //     dishId: 1,
// //   //     name: "Chocolate Sandwich",
// //   //     price: 456,
// //   //     dinePrice: 456,
// //   //     parcelPrice: 456,
// //   //     qty: 1
// //   //   };

// //   //   for (
// //   //     let i = 0;
// //   //     i < quantity;
// //   //     i++
// //   //   ) {
// //   //     onAddItem(item);
// //   //   }

// //   //   showToast?.(
// //   //     `${quantity} Chocolate Sandwich Added`
// //   //   );
// //   // }

// //   // setListening(false);

// // };

// //   recognition.onerror = () => {
// //     // setListening(false);
// //   };

// // };
// // return (
// //   <div
// //     onClick={startBot}
// //     className={
// //       listening
// //         ? "bot-icon blink"
// //         : "bot-icon"
// //     }
// //   >
// //     ✦
// //   </div>
// // );
// // }

// // export default VoiceBot;

//   // const startBot = () => {
//   //   setListening(!listening);
//   // };
// // const startBot = () => {

// //   setListening(true);

// //   onAddItem({
// //     id: 1,
// //     dishId: 1,
// //     name: "Chocolate Sandwich",
// //     price: 456,
// //     dinePrice: 456,
// //     parcelPrice: 456,
// //     qty: 1
// //   });

// //   showToast?.("AI Added Chocolate Sandwich");

// //   setTimeout(() => {
// //     setListening(false);
// //   }, 2000);

// // };
//   // return (
//   //   <div
//   //     onClick={startBot}
//   //     className={
//   //       listening
//   //         ? "bot-icon blink"
//   //         : "bot-icon"
//   //     }
//   //   >
//   //     ⭐
//   //   </div>
//   // );

// //   return (
// //   <div
// //     onClick={startBot}
// //     className={
// //       listening
// //         ? "bot-icon blink"
// //         : "bot-icon"
// //     }
// //   >
// //     ✦
// //   </div>
// // );
// // }

// // export default VoiceBot;
// // import { useState } from "react";
// // import "./VoiceBot.css";

// // function VoiceBot() {

// //   const [open, setOpen] = useState(false);

// //   // DISH LIST

// //   const dishes = [

// //     "Pizza",
// //     "Burger",
// //     "Sandwich",
// //     "Pasta",
// //     "Cold Coffee",
// //     "French Fries",
// //     "Momos",
// //     "Paneer Pizza",
// //     "Cheese Burger",
// //     "Veg Sandwich",
// //     "White Sauce Pasta",
// //     "Chocolate Shake",
// //     "Tea",
// //     "Coffee",
// //     "Garlic Bread",
// //     "Noodles",
// //     "Manchurian",
// //     "Spring Roll",
// //     "Taco",
// //     "Nachos"

// //   ];

// //   return (

// //     <>

// //       {/* FLOATING ICON */}

// //       <div
// //         className="bot-icon"
// //         onClick={() => setOpen(!open)}
// //       >
// //         💬
// //       </div>

// //       {/* CHAT WINDOW */}

// //       {open && (

// //         <div className="bot-box">

// //           <h2>Order Dishes</h2>

// //           {/* SCROLLABLE DISH LIST */}

// //           <div className="dish-list">

// //             {dishes.map((dish, index) => (

// //               <button
// //                 key={index}
// //                 className="dish-btn"
// //               >
// //                 {dish}
// //               </button>

// //             ))}

// //           </div>

// //         </div>
// //       )}

// //     </>
// //   );
// // }

// // export default VoiceBot;

// // import { useState } from "react";

// // function VoiceBot({ onAddItem }) {

// //   const [listening, setListening] = useState(false);
  
// //   const speak = (text) => {

// //   const speech =
// //     new SpeechSynthesisUtterance(text);

// //   speech.lang = "en-IN";

// //   speech.rate = 1;

// //   speech.pitch = 1;

// //   window.speechSynthesis.speak(speech);

// // };
// //   const startListening = () => {

// //     const SpeechRecognition =
// //       window.SpeechRecognition ||
// //       window.webkitSpeechRecognition;

// //     if (!SpeechRecognition) {

// //       alert("Speech Recognition not supported");

// //       return;
// //     }

// //     const recognition =
// //       new SpeechRecognition();

// //     recognition.lang = "en-IN";

// //     recognition.start();

// //     setListening(true);

// //     recognition.onresult = (event) => {

// //       const text =
// //         event.results[0][0].transcript;

// //       console.log("Voice:", text);

// //       // if (
// //       //   text.toLowerCase().includes(
// //       //     "paneer pizza"
// //       //   )
// //       // ) {

// //       //   onAddItem({
// //       //     id: 999,
// //       //     dishId: 999,
// //       //     name: "Paneer Pizza",
// //       //     price: 200,
// //       //   });

// //       // }

// //       if (
// //   text.toLowerCase().includes(
// //     "paneer pizza"
// //   )
// // ) {

// //   onAddItem({
// //     id: 999,
// //     dishId: 999,
// //     name: "Paneer Pizza",
// //     price: 200,
// //   });

// //   speak(
// //     "Paneer Pizza added successfully"
// //   );

// // }

// //       setListening(false);
// //     };

// //     recognition.onerror = () => {

// //       setListening(false);

// //     };
// //   };

// //   return (

// //     <div
// //       onClick={startListening}
// //       style={{
// //         position: "fixed",
// //         bottom: "20px",
// //         right: "20px",
// //         width: "65px",
// //         height: "65px",
// //         borderRadius: "50%",
// //         background:
// //           listening
// //             ? "#ff4444"
// //             : "#6c63ff",
// //         color: "white",
// //         display: "flex",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         fontSize: "30px",
// //         cursor: "pointer",
// //         zIndex: 9999,
// //         boxShadow:
// //           "0px 5px 15px rgba(0,0,0,0.3)"
// //       }}
// //     >
// //       ✨
// //     </div>

// //   );
// // }

// // export default VoiceBot;
// // import "./VoiceBot.css";

// // import { useState } from "react";

// // function VoiceBot() {

// //   const [listening, setListening] = useState(false);

// //   const startBot = () => {

// //     setListening(true);

// //     const speech =
// //       new SpeechSynthesisUtterance(
// //         "What would you like to order?"
// //       );

// //     speech.lang = "en-IN";

// //     window.speechSynthesis.speak(speech);

// //     speech.onend = () => {

// //       const SpeechRecognition =
// //         window.SpeechRecognition ||
// //         window.webkitSpeechRecognition;

// //       const recognition =
// //         new SpeechRecognition();

// //       recognition.lang = "en-IN";

// //       recognition.start();

// //       recognition.onresult = (event) => {

// //         const text =
// //           event.results[0][0].transcript;

// //         alert(
// //           "You said: " + text
// //         );

// //         const reply =
// //           new SpeechSynthesisUtterance(
// //             text +
// //             " added successfully"
// //           );

// //         window.speechSynthesis.speak(reply);

// //         setListening(false);
// //       };
// //     };
// //   };

// //   // return (

// //     // <div>
// //   //     onClick={startBot}
// //   //     style={{
// //   //       position: "fixed",
// //   //       bottom: "20px",
// //   //       right: "20px",
// //   //       width: "70px",
// //   //       height: "70px",
// //   //       borderRadius: "50%",
// //   //       background:
// //   //         listening
// //   //           ? "red"
// //   //           : "#6366F1",
// //   //       color: "white",
// //   //       display: "flex",
// //   //       justifyContent: "center",
// //   //       alignItems: "center",
// //   //       fontSize: "30px",
// //   //       cursor: "pointer",
// //   //       zIndex: "9999"
// //   //     }}

// //     //   ✨
// //     // </div>

// //   // );
  
// // //   return (

// // //   <div
// // //     onClick={startBot}
// // //     className={
// // //       listening
// // //         ? "bot-icon blink"
// // //         : "bot-icon"
// // //     }
// // //   >
// // //     ✦
// // //   </div>

// // // );
// // }

// // return (

// //   <div
// //     onClick={startBot}
// //     className={
// //       listening
// //         ? "bot-icon blink"
// //         : "bot-icon"
// //     }
// //   >
// //     ⭐
// //   </div>

// // );

// // export default VoiceBot;


