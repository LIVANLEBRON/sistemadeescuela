import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyChaMfboDMFZ2xxbdPSF2crcFz_dgZs8Vk",
  authDomain: "xdxd-9a2f9.firebaseapp.com",
  projectId: "xdxd-9a2f9",
  storageBucket: "xdxd-9a2f9.appspot.com",
  messagingSenderId: "783836498374",
  appId: "1:783836498374:web:686b5ee13dbd6f0a69cac7",
  measurementId: "G-FQ4P0YYDWT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
