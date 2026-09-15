// =====================================================
// ===== 📋 VARIABLES GLOBALES =====
// =====================================================
let usuarioActivo = null;
let movimientos = [];
let movimientosTransp = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let idEdicion = null;
let idEdicionTransp = null;
let filtroPendientes = false;
let filasRecogida = [];
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "Julieth López" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "J. Nonato" }
];

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usuario = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    if (!usuario || !clave) return error.textContent = '⚠️ Complete usuario y contraseña';

    const datos = usuariosFijos.find(u => u.usuario === usuario && u.clave === clave);
    if (datos) {
        usuarioActivo = { ...datos };
        await finalizarLogin();
        return;
    }
    error.textContent = '❌ Usuario o contraseña incorrectos';
}

async function finalizarLogin() {
    document.getElementById('pantallaLogin').classList.add('oculto');
    document.getElementById('encabezadoApp').classList.remove('oculto');
    document.getElementById('sidebar').classList.remove('oculto');
    document.getElementById('contenido').classList.remove('oculto');
    document.getElementById('nombreUsuario').textContent = usuarioActivo.nombre;

    if (usuarioActivo.rol === 'admin') {
        document.getElementById('btnAdmin').classList.remove('oculto');
    }

    await cargarDatosGenerales();
    cambiarPestaña('movimientos');
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        usuarioActivo = null;
        document.getElementById('pantallaLogin').classList.remove('oculto');
        document.getElementById('encabezadoApp').classList.add('oculto');
        document.getElementById('sidebar').classList.add('oculto');
        document.getElementById('contenido').classList.add('oculto');
        document.getElementById('usuario').value = '';
        document.getElementById('clave').value = '';
    }
}

// =====================================================
// ===== 📂 CARGA DE DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosGenerales() {
    db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientos = [];
        snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
        if (document.getElementById('tituloFormMov')) {
            if (typeof dibujarMovimientosHoy === 'function') dibujarMovimientosHoy();
            if (typeof dibujarPendientes === 'function') dibujarPendientes();
        }
    });

    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('colaboradores').onSnapshot(snap => {
        colaboradores = [];
        snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('vehiculos_movimientos').onSnapshot(snap => {
        vehiculosMov = [];
        snap.forEach(doc => { vehiculosMov.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('vehiculos_transportadora').onSnapshot(snap => {
        vehiculosTransp = [];
        snap.forEach(doc => { vehiculosTransp.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('conductores_transportadora').onSnapshot(snap => {
        conductores = [];
        snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('kilometraje').orderBy('fecha', 'desc').onSnapshot(snap => {
        kilometraje = [];
        snap.forEach(doc => { kilometraje.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('tanqueo').orderBy('fecha', 'desc').onSnapshot(snap => {
        tanqueo = [];
        snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
    });
}

// =====================================================
// ===== 🔄 CAMBIO DE PESTAÑAS PRINCIPALES =====
// =====================================================
function cambiarPestaña(nombre) {
    const btn = event.target;
    document.querySelectorAll('#sidebar .btn-pestaña').forEach(b => b.classList.remove('activa'));
    btn.classList.add('activa');

    const contenido = document.getElementById('contenido');
    contenido.innerHTML = '';

    switch(nombre) {
        case 'movimientos':
            if (typeof cargarModulo_movimientos === 'function') cargarModulo_movimientos();
            break;
        case 'transportadora':
            if (typeof cargarModulo_transportadora === 'function') cargarModulo_transportadora();
            break;
        case 'combustible':
            if (typeof cargarModulo_combustible === 'function') cargarModulo_combustible();
            break;
        case 'mantenimiento':
            if (typeof cargarModulo_mantenimiento === 'function') cargarModulo_mantenimiento();
            break;
        case 'informes':
            if (typeof cargarModulo_informes === 'function') cargarModulo_informes();
            break;
        case 'administracion':
            if (usuarioActivo?.rol === 'admin' && typeof cargarModulo_administracion === 'function') {
                cargarModulo_administracion();
            } else {
                contenido.innerHTML = '<p class="text-center mt-4">⛔ No tiene permisos para esta sección</p>';
            }
            break;
    }

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('oculto');
        document.getElementById('contenido').classList.remove('sidebar-oculto');
    }
}

// =====================================================
// ===== UTILIDADES =====
// =====================================================
function formatearFechaHoy() {
    return new Date().toISOString().split('T')[0];
}