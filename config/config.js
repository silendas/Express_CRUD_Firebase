import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaMmyi_j3_vpqw5_oGQL-6UYoV11nWR-k",
  authDomain: "wst-test-626d9.firebaseapp.com",
  databaseURL: "https://wst-test-626d9-default-rtdb.firebaseio.com",
  projectId: "wst-test-626d9",
  storageBucket: "wst-test-626d9.appspot.com",
  messagingSenderId: "821621404841",
  appId: "1:821621404841:web:5afd91558b1fbc056da5b8",
  measurementId: "G-DH9GZSWBEY",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db; // Ekspor db
