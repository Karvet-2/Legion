// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTtar4GY1kgVSM4pvJtmohK8zWbSAfU9M",
  authDomain: "legion-1f3a5.firebaseapp.com",
  projectId: "legion-1f3a5",
  storageBucket: "legion-1f3a5.firebasestorage.app",
  messagingSenderId: "925260753671",
  appId: "1:925260753671:web:0c392cfb7cada1fedcf3a2",
  measurementId: "G-FBFM45TRQ7"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Опционально: включить оффлайн поддержку Firestore (для постоянства данных)
// firebase.firestore().enablePersistence()
//   .catch((err) => {
//       if (err.code == 'failed-precondition') {
//           // Multiple tabs open, persistence can only be enabled in one tab at a a time.
//           // Handle the case where there are multiple tabs open in the browser.
//           console.warn('Firestore persistence failed: Multiple tabs open');
//       } else if (err.code == 'unimplemented') {
//           // The current browser does not support all of the features required to enable persistence
//           // Handle the case where the browser does not support persistence.
//            console.warn('Firestore persistence failed: Browser not supported');
//       }
//   });

console.log("Firebase Initialized"); 