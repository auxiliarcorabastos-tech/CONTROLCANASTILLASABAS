// =====================================================
// ===== 📋 VARIABLES GLOBALES — UNA SOLA VEZ =====
// =====================================================
let db, auth;
let usuarioActivo = null;
let movimientos = [];
let movimientosTransp = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let donantes = [];
let anuncios = [];
let idEdicion = null;
let idEdicionTransp = null;
let filtroPendientes = false;
let filasRecogida = [];
let idsCreadosPorPrueba = [];
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };
let escuchasActivas = [];
let menuAbierto = true;

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "JAVIER GARNICA" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "DANIEL FIGUEROA" },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "JULIETH LOPEZ" },
    { usuario: "estudiante", clave: "123456", rol: "prueba", nombre: "Estudiante Prueba" },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "J Nonato" }
];

// =====================================================
// ===== 🔑 CONEXIÓN FIREBASE =====
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

firebase.initializeApp(firebaseConfig);
db = firebase.firestore();
auth = firebase.auth();
console.log("✅ Firebase conectado correctamente");

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
function iniciarSesion() {
    const usu = document.getElementById('usuario').value.trim();
    const cla = document.getElementById('clave').value.trim();

    const encontrado = usuariosFijos.find(u => u.usuario === usu && u.clave === cla);
    if (encontrado) {
        usuarioActivo = encontrado;
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioActivo));
        document.getElementById('pantallaLogin').classList.add('oculto');
        document.getElementById('pantallaPrincipal').classList.remove('oculto');
        document.getElementById('nombreUsuario').innerHTML = `${encontrado.nombre}<br><small>${encontrado.rol.toUpperCase()}</small>`;
        cargarDatosGenerales();
        return;
    }
    alert("❌ Usuario o clave incorrectos");
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActivo');
    location.reload();
}

function verificarSesionGuardada() {
    const guardado = localStorage.getItem('usuarioActivo');
    if (guardado) {
        usuarioActivo = JSON.parse(guardado);
        document.getElementById('pantallaLogin').classList.add('oculto');
        document.getElementById('pantallaPrincipal').classList.remove('oculto');
        document.getElementById('nombreUsuario').innerHTML = `${usuarioActivo.nombre}<br><small>${usuarioActivo.rol.toUpperCase()}</small>`;
        cargarDatosGenerales();
    }
}

// =====================================================
// ===== 📂 CARGA DE DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosGenerales() {
    escuchasActivas.forEach(desconectar => desconectar());
    escuchasActivas = [];

    // 1. Movimientos
    escuchasActivas.push(
        db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
            movimientos = [];
            snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
            dibujarMovimientosHoy?.();
            dibujarPendientes?.();
        })
    );

    // 2. Movimientos Transportadora
    escuchasActivas.push(
        db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
            movimientosTransp = [];
            snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
            dibujarTranspHoy?.();
            dibujarTranspPendientes?.();
        })
    );

    // 3. Vehículos Transportadora
    escuchasActivas.push(
        db.collection('vehiculos_transportadora').onSnapshot(snap => {
            vehiculosTransp = [];
            snap.forEach(doc => { vehiculosTransp.push({ id: doc.id, ...doc.data() }); });
            console.log('🚗 Vehículos Transportadora:', vehiculosTransp.length);
        })
    );

    // 4. Conductores Transportadora
    escuchasActivas.push(
        db.collection('conductores_transportadora').onSnapshot(snap => {
            conductores = [];
            snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
            console.log('👤 Conductores cargados:', conductores.length);
        })
    );

    // 5. Colaboradores (Movimientos)
    escuchasActivas.push(
        db.collection('colaboradores').onSnapshot(snap => {
            colaboradores = [];
            snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
            console.log('👥 Colaboradores:', colaboradores.length);
        })
    );

    // 6. Vehículos Movimientos
    escuchasActivas.push(
        db.collection('vehiculos').onSnapshot(snap => {
            vehiculosMov = [];
            snap.forEach(doc => { vehiculosMov.push({ id: doc.id, ...doc.data() }); });
            console.log('🚙 Vehículos Movimientos:', vehiculosMov.length);
        })
    );

    // 7. Kilometraje
    escuchasActivas.push(
        db.collection('kilometraje').onSnapshot(snap => {
            kilometraje = [];
            snap.forEach(doc => { kilometraje.push({ id: doc.id, ...doc.data() }); });
        })
    );

    // 8. Tanqueo / Combustible
    escuchasActivas.push(
        db.collection('tanqueo').onSnapshot(snap => {
            tanqueo = [];
            snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
        })
    );

    // 9. Donantes
    escuchasActivas.push(
        db.collection('donantes').onSnapshot(snap => {
            donantes = [];
            snap.forEach(doc => { donantes.push({ id: doc.id, ...doc.data() }); });
            console.log('🤝 Donantes:', donantes.length);
        })
    );

    // 10. Anuncios
    escuchasActivas.push(
        db.collection('anuncios').onSnapshot(snap => {
            anuncios = [];
            snap.forEach(doc => { anuncios.push({ id: doc.id, ...doc.data() }); });
            console.log('📢 Anuncios:', anuncios.length);
        })
    );
}

// =====================================================
// ===== 📱 MENÚ LATERAL =====
// =====================================================
function toggleMenu() {
    menuAbierto = !menuAbierto;
    const lateral = document.getElementById('menuLateral');
    if (lateral) {
        if (menuAbierto) {
            lateral.classList.remove('oculto');
        } else {
            lateral.classList.add('oculto');
        }
    }
}

// =====================================================
// ===== 🔄 CAMBIAR DE MÓDULO — TODOS TUS ARCHIVOS =====
// =====================================================
async function cambiarPestaña(nombre) {
    if (window.innerWidth < 768) {
        const lateral = document.getElementById('menuLateral');
        if (lateral) lateral.classList.add('oculto');
        menuAbierto = false;
    }

    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    if (event?.target) event.target.classList.add('activa');

    const moduloActivo = document.getElementById('moduloActivo');
    if (moduloActivo) {
        const nombres = {
            movimientos: 'Movimientos',
            transportadora: 'Transportadora',
            misCanastillas: 'Mis Canastillas',
            recoleccion: 'Recolección',
            anuncios: 'Anuncios',
            donantes: 'Donantes',
            combustible: 'Combustible',
            mantenimiento: 'Mantenimiento',
            informes: 'Informes',
            usuarios: 'Gestión de Usuarios',
            admin: 'Administración'
        };
        moduloActivo.textContent = nombres[nombre] || nombre;
    }

    const c = document.getElementById('contenido');
    if (!c) return;

    switch (nombre) {
        case 'movimientos':
            if (window.cargarModulo_movimientos) cargarModulo_movimientos();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo movimientos no disponible</div>`;
            break;
        case 'transportadora':
            if (window.cargarModulo_transportadora) cargarModulo_transportadora();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo transportadora no disponible</div>`;
            break;
        case 'misCanastillas':
            if (window.cargarModulo_misCanastillas) cargarModulo_misCanastillas();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Mis Canastillas no disponible</div>`;
            break;
        case 'recoleccion':
            if (window.cargarModulo_recoleccion) cargarModulo_recoleccion();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Recolección no disponible</div>`;
            break;
        case 'anuncios':
            if (window.cargarModulo_anuncios) cargarModulo_anuncios();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Anuncios no disponible</div>`;
            break;
        case 'donantes':
            if (window.cargarModulo_donantes) cargarModulo_donantes();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Donantes no disponible</div>`;
            break;
        case 'combustible':
            if (window.cargarModulo_combustible) cargarModulo_combustible();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Combustible no disponible</div>`;
            break;
        case 'mantenimiento':
            if (window.cargarModulo_mantenimiento) cargarModulo_mantenimiento();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Mantenimiento no disponible</div>`;
            break;
        case 'informes':
            if (window.cargarModulo_informes) cargarModulo_informes();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Informes no disponible</div>`;
            break;
        case 'usuarios':
            if (window.cargarModulo_usuarios) cargarModulo_usuarios();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Usuarios no disponible</div>`;
            break;
        case 'admin':
            if (window.cargarModulo_admin) cargarModulo_admin();
            else c.innerHTML = `<div class="tarjeta">⚠️ Módulo Administración no disponible</div>`;
            break;
    }
}

// =====================================================
// ===== 📥 INICIO AUTOMÁTICO =====
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    verificarSesionGuardada();
});