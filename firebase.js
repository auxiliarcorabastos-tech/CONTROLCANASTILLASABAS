// =====================================================
// ===== 🔑 FIREBASE.JS — CONEXIÓN COMPLETA =====
// ===== NO DECLARAR db NI auth AQUÍ — SE HACE EN funciones.js =====
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyBruMDqyExColkMwy7XyqDSBsF8XcvsFoY",
    authDomain: "control-ingresos-y-canastillas.firebaseapp.com",
    projectId: "control-ingresos-y-canastillas",
    storageBucket: "control-ingresos-y-canastillas.firebasestorage.app",
    messagingSenderId: "372736670308",
    appId: "1:372736670308:web:14c2e2614c14ff3dc2bd71",
    measurementId: "G-N3YMQ2JKZM"
};

// ✅ Solo inicializamos Firebase
firebase.initializeApp(firebaseConfig);

console.log('✅ Firebase conectado correctamente');
