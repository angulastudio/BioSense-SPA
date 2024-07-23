import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCY2lc-69qqeVIHvvtn8KLN5L4C0fOOmgw",
    authDomain: "biosense-a2395.firebaseapp.com",
    databaseURL: "https://biosense-a2395-default-rtdb.firebaseio.com",
    projectId: "biosense-a2395",
    storageBucket: "biosense-a2395.appspot.com",
    messagingSenderId: "223386385264",
    appId: "1:223386385264:web:5b99544e5528d3160c2db5",
    measurementId: "G-QQ8G92S1BY"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };