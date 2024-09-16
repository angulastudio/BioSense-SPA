import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
    apiKey: "AIzaSyBWDintcU3D6N8ocKrtxTHWkbT2A9YKsE8",
    authDomain: "biosense2-b11e8.firebaseapp.com",
    databaseURL: "https://biosense2-b11e8-default-rtdb.firebaseio.com",
    projectId: "biosense2-b11e8",
    storageBucket: "biosense2-b11e8.appspot.com",
    messagingSenderId: "636126613730",
    appId: "1:636126613730:web:ef6a75e8ceedee7cd7cebb"
  };

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };