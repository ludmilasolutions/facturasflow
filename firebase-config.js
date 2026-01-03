// Configuración de Firebase - Reemplazar con tus datos
const firebaseConfig = {
  apiKey: "AIzaSyDq4uVtgwIZ8O_necn4nYXDH9N4R5L7s3M",
  authDomain: "factuflow-f8314.firebaseapp.com",
  projectId: "factuflow-f8314",
  storageBucket: "factuflow-f8314.firebasestorage.app",
  messagingSenderId: "457586433956",
  appId: "1:457586433956:web:157a471ed7501eebf0eb31"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
