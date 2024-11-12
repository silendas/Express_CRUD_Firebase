import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://uts-yasmin-default-rtdb.firebaseio.com/",
  apiKey: "AIzaSyDaMmyi_j3_vpqw5_oGQL-6UYoV11nWR-k",
  authDomain: "wst-test-626d9.firebaseapp.com",
  projectId: "wst-test-626d9",
  storageBucket: "wst-test-626d9.appspot.com",
  messagingSenderId: "821621404841",
  appId: "1:821621404841:web:5afd91558b1fbc056da5b8",
  measurementId: "G-DH9GZSWBEY",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db; // Ekspor db
