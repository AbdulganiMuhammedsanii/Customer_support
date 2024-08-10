// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFq6neoL2HTfTZ_O8X8AG7WzQad5Gg_AM",
  authDomain: "chat-app-590d2.firebaseapp.com",
  projectId: "chat-app-590d2",
  storageBucket: "chat-app-590d2.appspot.com",
  messagingSenderId: "99369629838",
  appId: "1:99369629838:web:47029385aaf8c17b21f1df",
  measurementId: "G-TJVT1C5SDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);

export { auth, provider, signInWithPopup, signOut, db, collection, query, where, getDocs, addDoc, doc, setDoc, getDoc };