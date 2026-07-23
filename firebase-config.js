const firebaseConfig = {
  apiKey: "AIzaSyD_u0XNOSUnLFXQOavArUqwUUbMNfAWFLk",
  authDomain: "landing-novara.firebaseapp.com",
  projectId: "landing-novara",
  storageBucket: "landing-novara.firebasestorage.app",
  messagingSenderId: "682762162301",
  appId: "1:682762162301:web:96a0d8cd5a1eebec8fe114"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
