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
let idsCreadosPorPrueba = [];
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };
let escuchasActivas = [];
// ✅ Alineado con el index: declaramos menuAbierto
let menuAbierto = window.innerWidth > 768;

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "Julieth López" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "J. Nonato" },
    { usuario: "prueba", clave: "prueba123", rol: "prueba", nombre: "Usuario de Prueba" }
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

    if (usuarioActivo.rol === 'prueba') {
        const encabezado = document.getElementById('encabezadoApp');
        const aviso = document.createElement('div');
        aviso.id = 'avisoPrueba';
        aviso.style.cssText = `
            background: #fef3c7; color: #92400e; padding: 6px 12px; 
            font-size: 13px; font-weight: 600; text-align: center;
            border-bottom: 2px solid #f59e0b;
            position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
        `;
        aviso.textContent = '⚠️ MODO PRUEBA — Todo se BORRARÁ al cerrar sesión';
        encabezado.parentNode.insertBefore(aviso, encabezado.nextSibling);
    }

    await cargarDatosGenerales();

    // ✅ Sincronizar menú al entrar
    if (window.innerWidth > 768) {
        menuAbierto = true;
        if (typeof actualizarMenu === 'function') actualizarMenu();
    }

    cambiarPestaña('movimientos');
}

async function cerrarSesion() {
    if (usuarioActivo?.rol === 'prueba') {
        if (!confirm('⚠️ MODO PRUEBA\n\n¿Salir? Se BORRARÁN TODOS los datos que creaste.')) return;
        await borrarDatosPrueba();
        alert('🧹 Datos de prueba eliminados. ¡Hasta luego!');
    } else {
        if (!confirm('¿Cerrar sesión?')) return;
    }

    usuarioActivo = null;
    detenerEscuchas();

    const aviso = document.getElementById('avisoPrueba');
    if (aviso) aviso.remove();

    document.getElementById('pantallaLogin').classList.remove('oculto');
    document.getElementById('encabezadoApp').classList.add('oculto');
    document.getElementById('sidebar').classList.add('oculto');
    document.getElementById('contenido').classList.add('oculto');
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';

    menuAbierto = false;
}

// =====================================================
// ===== 🧹 BORRADO DATOS DE PRUEBA =====
// =====================================================
async function borrarDatosPrueba() {
    if (!idsCreadosPorPrueba.length) return;
    let borrados = 0;
    for (const item of idsCreadosPorPrueba) {
        try {
            await db.collection(item.coleccion).doc(item.id).delete();
            borrados++;
        } catch (e) {
            console.log('No se pudo borrar:', item.id);
        }
    }
    idsCreadosPorPrueba = [];
    console.log(`🧹 Se borraron ${borrados} registros de prueba`);
}

// =====================================================
// ===== 📂 CARGA DE DATOS =====
// =====================================================
function detenerEscuchas() {
    escuchasActivas.forEach(desconectar => {
        if (typeof desconectar === 'function') desconectar();
    });
    escuchasActivas = [];
}

async function cargarDatosGenerales() {
    detenerEscuchas();

    const descMov = db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientos = [];
        snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
        if (typeof dibujarMovimientosHoy === 'function') dibujarMovimientosHoy();
        if (typeof dibujarPendientes === 'function') dibujarPendientes();
    });
    escuchasActivas.push(descMov);

    const descTransp = db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
    });
    escuchasActivas.push(descTransp);

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
// ===== 🔄 BOTÓN ACTUALIZAR =====
// =====================================================
async function refrescarTodo() {
    const btn = event?.target;
    if (btn) {
        btn.textContent = '🔄 Cargando...';
        btn.disabled = true;
    }

    await cargarDatosGenerales();

    if (typeof dibujarMovimientosHoy === 'function') dibujarMovimientosHoy();
    if (typeof dibujarPendientes === 'function') dibujarPendientes();
    if (typeof dibujarTransp === 'function') dibujarTransp();
    if (typeof dibujarKilometraje === 'function') dibujarKilometraje();
    if (typeof dibujarTanqueo === 'function') dibujarTanqueo();
    if (typeof dibujarMantenimiento === 'function') dibujarMantenimiento();

    setTimeout(() => {
        if (btn) {
            btn.textContent = '🔄 Actualizar';
            btn.disabled = false;
        }
        alert('✅ Datos actualizados');
    }, 500);
}

// =====================================================
// ===== 🔄 CAMBIAR PESTAÑA =====
// =====================================================
function cambiarPestaña(nombre) {
    const btn = event?.target;
    if (btn) {
        document.querySelectorAll('#sidebar .btn-pestaña').forEach(b => b.classList.remove('activa'));
        btn.classList.add('activa');
    }

    const contenido = document.getElementById('contenido');
    if (!contenido) return;
    contenido.innerHTML = '';

    switch(nombre) {
        case 'movimientos':
            if (typeof cargarModulo_movimientos === 'function') {
                cargarModulo_movimientos();
            } else {
                contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de movimientos no cargado</p>';
            }
            break;
        case 'transportadora':
            if (typeof cargarModulo_transportadora === 'function') {
                cargarModulo_transportadora();
            }
            break;
        case 'combustible':
            if (typeof cargarModulo_combustible === 'function') {
                cargarModulo_combustible();
            }
            break;
        case 'mantenimiento':
            if (typeof cargarModulo_mantenimiento === 'function') {
                cargarModulo_mantenimiento();
            }
            break;
        case 'informes':
            if (typeof cargarModulo_informes === 'function') {
                cargarModulo_informes();
            }
            break;
        case 'administracion':
            if (usuarioActivo?.rol === 'admin' && typeof cargarModulo_administracion === 'function') {
                cargarModulo_administracion();
            } else {
                contenido.innerHTML = '<p class="text-center mt-4">⛔ No tiene permisos para esta sección</p>';
            }
            break;
    }

    // ✅ Cerrar menú automáticamente en móvil
    if (window.innerWidth <= 768) {
        menuAbierto = false;
        if (typeof actualizarMenu === 'function') actualizarMenu();
    }
}

// =====================================================
// ===== 📅 UTILIDADES =====
// =====================================================
function formatearFechaHoy() {
    return new Date().toISOString().split('T')[0];
}

// ✅ Función auxiliar para cerrar menú desde el index
function cerrarMenuEnMovil() {
    if (window.innerWidth <= 768) {
        menuAbierto = false;
        if (typeof actualizarMenu === 'function') actualizarMenu();
    }
}