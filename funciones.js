// =====================================================
// ===== 📋 VARIABLES GLOBALES =====
// =====================================================
// ⚠️ NO DECLARAR db ni auth AQUÍ → están en firebase.js
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
let listaRoles = [];

// ✅ Menú FIJO en escritorio, cerrado en móvil
const ES_PANTALLA_GRANDE = window.innerWidth > 768;
let menuAbierto = ES_PANTALLA_GRANDE;

// ✅ ADMINISTRADORES CON ACCESO TOTAL A TODO EL SISTEMA
const ADMIN_TOTAL = ['jgarnica', 'jfigueroa'];

// ✅ TODOS LOS MÓDULOS DEL SISTEMA
const MODULOS_SISTEMA = [
  { id: 'movimientos', nombre: '📦 Movimientos' },
  { id: 'misCanastillas', nombre: '🧺 Mis Canastillas' },
  { id: 'recoleccion', nombre: '🚚 Recolección' },
  { id: 'transportadora', nombre: '🚛 Transportadora' },
  { id: 'combustible', nombre: '⛽ Combustible' },
  { id: 'mantenimiento', nombre: '🔧 Mantenimiento' },
  { id: 'informes', nombre: '📊 Informes' },
  { id: 'anuncios', nombre: '📢 Anuncios' },
  { id: 'donantes', nombre: '🤝 Donantes' },
  { id: 'usuarios', nombre: '👤 Gestión de Usuarios' },
  { id: 'admin', nombre: '⚙️ Administración' }
];

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "JAVIER GARNICA", activo: true },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "DANIEL FIGUEROA", activo: true },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "Julieth López", activo: true },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", activo: true },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "J. Nonato", activo: true },
    { usuario: "prueba", clave: "prueba123", rol: "prueba", nombre: "Usuario de Prueba", activo: true }
];

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usuario = document.getElementById('usuario').value.trim().toLowerCase();
    const clave = document.getElementById('clave').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    if (!usuario || !clave) return error.textContent = '⚠️ Complete usuario y contraseña';

    let encontrado = usuariosFijos.find(u => u.usuario === usuario && u.clave === clave && u.activo !== false);
    
    if (!encontrado && typeof db !== 'undefined') {
        try {
            const doc = await db.collection('usuarios').doc(usuario).get();
            if (doc.exists) {
                const datos = doc.data();
                if (datos.clave === clave && datos.activo !== false) {
                    encontrado = { ...datos };
                } else if (datos.clave === clave && datos.activo === false) {
                    return error.textContent = '❌ Usuario INACTIVO — comuníquese con administración';
                }
            }
        } catch (e) {
            console.log('Sin usuarios en Firebase aún:', e.message);
        }
    }

    if (!encontrado) {
        return error.textContent = '❌ Usuario o contraseña incorrectos';
    }

    usuarioActivo = { ...encontrado };
    await finalizarLogin();
}

async function finalizarLogin() {
    document.getElementById('pantallaLogin').classList.add('oculto');
    document.getElementById('appCompleta').classList.remove('oculto');
    document.getElementById('nombreUsuario').textContent = usuarioActivo.nombre;

    if (ADMIN_TOTAL.includes(usuarioActivo?.usuario) || usuarioActivo?.rol === 'admin') {
        document.querySelectorAll('#btnAdmin, #btnAdmin2').forEach(b => b.classList.remove('oculto'));
    }

    if (usuarioActivo?.rol === 'prueba') {
        const encabezado = document.querySelector('.encabezado');
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
    await cargarListaRoles();
    aplicarEstadoMenu();
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
    document.getElementById('appCompleta').classList.add('oculto');
    document.querySelectorAll('#btnAdmin, #btnAdmin2').forEach(b => b.classList.add('oculto'));
    
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';
    
    menuAbierto = ES_PANTALLA_GRANDE;
    aplicarEstadoMenu();
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
// ===== 🔒 SISTEMA DE PERMISOS =====
// =====================================================
function tienePermiso(modulo, accion = 'ver') {
  if (!usuarioActivo) return false;
  
  if (ADMIN_TOTAL.includes(usuarioActivo.usuario)) return true;
  if (usuarioActivo.rol === 'admin' || usuarioActivo.rol === 'rol_admin') return true;
  
  const rolAsignado = listaRoles?.find(r => r.clave === usuarioActivo.rol);
  if (!rolAsignado) {
    if (usuarioActivo.rol === 'usuario') {
      const base = {
        movimientos: { ver: true, editar: true },
        misCanastillas: { ver: true, editar: true },
        recoleccion: { ver: true, editar: true },
        transportadora: { ver: true, editar: true },
        combustible: { ver: true, editar: true },
        mantenimiento: { ver: true, editar: false },
        informes: { ver: true, editar: false },
        anuncios: { ver: true, editar: false },
        donantes: { ver: true, editar: false },
        usuarios: { ver: false, editar: false },
        admin: { ver: false, editar: false }
      };
      const p = base[modulo];
      return p ? (accion === 'ver' ? p.ver : p.editar) : false;
    }
    return false;
  }
  
  const permiso = rolAsignado.permisos?.[modulo];
  if (!permiso) return false;
  return accion === 'ver' ? permiso.ver : permiso.editar;
}

// =====================================================
// ===== 📂 CARGA DE ROLES =====
// =====================================================
async function cargarListaRoles() {
  if (typeof db === 'undefined') return;
  try {
    const snap = await db.collection('roles').get();
    listaRoles = [];
    snap.forEach(doc => { listaRoles.push({ id: doc.id, ...doc.data() }); });
  } catch (e) {
    console.log('Sin roles en Firebase');
  }
  
  if (!listaRoles.find(r => r.clave === 'admin')) {
    listaRoles.unshift({
      id: 'rol_admin', clave: 'admin', nombre: '⚙️ Administrador',
      permisos: MODULOS_SISTEMA.reduce((a, m) => (a[m.id] = { ver: true, editar: true }, a), {})
    });
  }
  if (!listaRoles.find(r => r.clave === 'usuario')) {
    listaRoles.push({
      id: 'rol_usuario', clave: 'usuario', nombre: '👤 Usuario Estándar',
      permisos: {
        movimientos: { ver: true, editar: true },
        misCanastillas: { ver: true, editar: true },
        recoleccion: { ver: true, editar: true },
        transportadora: { ver: true, editar: true },
        combustible: { ver: true, editar: true },
        mantenimiento: { ver: true, editar: false },
        informes: { ver: true, editar: false },
        anuncios: { ver: true, editar: false },
        donantes: { ver: true, editar: false },
        usuarios: { ver: false, editar: false },
        admin: { ver: false, editar: false }
      }
    });
  }
}

// =====================================================
// ===== 📂 CARGA DE DATOS DESDE FIREBASE =====
// =====================================================
function detenerEscuchas() {
    escuchasActivas.forEach(desconectar => {
        if (typeof desconectar === 'function') desconectar();
    });
    escuchasActivas = [];
}

async function cargarDatosGenerales() {
    if (typeof db === 'undefined') return;
    detenerEscuchas();

    db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientos = [];
        snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
        if (typeof dibujarMovimientosHoy === 'function') dibujarMovimientosHoy();
        if (typeof dibujarPendientes === 'function') dibujarPendientes();
    });

    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
        if (typeof dibujarTransp === 'function') dibujarTransp();
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
        if (typeof dibujarKilometraje === 'function') dibujarKilometraje();
    });

    db.collection('tanqueo').orderBy('fecha', 'desc').onSnapshot(snap => {
        tanqueo = [];
        snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
        if (typeof dibujarTanqueo === 'function') dibujarTanqueo();
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
    await cargarListaRoles();
    
    if (typeof dibujarMovimientosHoy === 'function') dibujarMovimientosHoy();
    if (typeof dibujarPendientes === 'function') dibujarPendientes();
    if (typeof dibujarTransp === 'function') dibujarTransp();
    if (typeof dibujarKilometraje === 'function') dibujarKilometraje();
    if (typeof dibujarTanqueo === 'function') dibujarTanqueo();
    if (typeof dibujarMantenimiento === 'function') dibujarMantenimiento();
    if (typeof dibujarAnuncios === 'function') dibujarAnuncios();
    if (typeof dibujarDonantes === 'function') dibujarDonantes();

    setTimeout(() => {
        if (btn) {
            btn.textContent = '🔄 Actualizar';
            btn.disabled = false;
        }
        alert('✅ Datos actualizados');
    }, 500);
}

// =====================================================
// ===== 📂 FUNCIONES DEL MENÚ =====
// =====================================================
function aplicarEstadoMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');
    if (!sidebar || !overlay) return;

    if (menuAbierto) {
        sidebar.classList.add('abierto');
        overlay.classList.add('activo');
    } else {
        sidebar.classList.remove('abierto');
        overlay.classList.remove('activo');
    }

    if (ES_PANTALLA_GRANDE) {
        overlay.classList.remove('activo');
        overlay.style.display = 'none';
    } else {
        overlay.style.display = '';
    }
}

function toggleMenu() {
    menuAbierto = !menuAbierto;
    aplicarEstadoMenu();
}

// =====================================================
// ===== 🔄 CAMBIAR PESTAÑA =====
// =====================================================
function cambiarPestaña(nombre) {
    const btn = event?.target;
    
    document.querySelectorAll('#sidebar .btn-pestaña').forEach(b => b.classList.remove('activa'));
    if (btn) btn.classList.add('activa');

    const contenido = document.getElementById('contenido');
    if (!contenido) return;
    contenido.innerHTML = '';

    if (!ES_PANTALLA_GRANDE) {
        menuAbierto = false;
        aplicarEstadoMenu();
    }

    const nombresModulos = {
        movimientos: 'Movimientos',
        misCanastillas: 'Mis Canastillas',
        recoleccion: 'Recolección',
        transportadora: 'Transportadora',
        combustible: 'Combustible',
        mantenimiento: 'Mantenimiento',
        informes: 'Informes',
        anuncios: 'Anuncios',
        donantes: 'Donantes',
        usuarios: 'Gestión de Usuarios',
        admin: 'Administración'
    };
    const etiquetaModulo = document.getElementById('nombreModulo');
    if (etiquetaModulo) etiquetaModulo.textContent = nombresModulos[nombre] || '';

    if (!tienePermiso(nombre)) {
        contenido.innerHTML = `<div class="tarjeta text-center mt-4">
            <h3>⛔ Acceso Restringido</h3>
            <p>No tiene permisos para ver esta sección.</p>
        </div>`;
        return;
    }

    switch(nombre) {
        case 'movimientos':
            if (typeof cargarModulo_movimientos === 'function') cargarModulo_movimientos();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de movimientos no cargado</p>';
            break;
        case 'misCanastillas':
            if (typeof cargarModulo_misCanastillas === 'function') cargarModulo_misCanastillas();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Mis Canastillas no cargado</p>';
            break;
        case 'recoleccion':
            if (typeof cargarModulo_recoleccion === 'function') cargarModulo_recoleccion();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Recolección no cargado</p>';
            break;
        case 'transportadora':
            if (typeof cargarModulo_transportadora === 'function') cargarModulo_transportadora();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Transportadora no cargado</p>';
            break;
        case 'combustible':
            if (typeof cargarModulo_combustible === 'function') cargarModulo_combustible();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Combustible no cargado</p>';
            break;
        case 'mantenimiento':
            if (typeof cargarModulo_mantenimiento === 'function') cargarModulo_mantenimiento();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Mantenimiento no cargado</p>';
            break;
        case 'informes':
            if (typeof cargarModulo_informes === 'function') cargarModulo_informes();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Informes no cargado</p>';
            break;
        case 'anuncios':
            if (typeof cargarModulo_anuncios === 'function') cargarModulo_anuncios();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Anuncios no cargado</p>';
            break;
        case 'donantes':
            if (typeof cargarModulo_donantes === 'function') cargarModulo_donantes();
            else contenido.innerHTML = '<p class="text-center mt-4">⚠️ Módulo de Donantes no cargado</p>';
            break;
        case 'usuarios':
            if ((ADMIN_TOTAL.includes(usuarioActivo?.usuario) || usuarioActivo?.rol === 'admin') && typeof cargarModulo_usuarios === 'function') cargarModulo_usuarios();
            else contenido.innerHTML = '<p class="text-center mt-4">⛔ No tiene permisos para esta sección</p>';
            break;
        case 'admin':
            if ((ADMIN_TOTAL.includes(usuarioActivo?.usuario) || usuarioActivo?.rol === 'admin') && typeof cargarModulo_admin === 'function') cargarModulo_admin();
            else contenido.innerHTML = '<p class="text-center mt-4">⛔ No tiene permisos para esta sección</p>';
            break;
    }
}

// =====================================================
// ===== 📅 UTILIDADES =====
// =====================================================
function formatearFechaHoy() {
    return new Date().toISOString().split('T')[0];
}