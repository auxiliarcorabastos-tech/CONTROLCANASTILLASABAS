// =====================================================
// ===== 📦 VARIABLES GLOBALES — ÚNICA DECLARACIÓN =====
// =====================================================
// =====================================================
// ===== 📦 VARIABLES GLOBALES — ÚNICA DECLARACIÓN =====
// =====================================================
let db, auth;
let usuarioActivo = null;
let movimientos = [];
let movimientosTransp = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];  // ✅ FALTABA ESTA — la agregué
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let idEdicion = null;
let idEdicionTransp = null;
let filtroPendientes = false;
let filasRecogida = [];
let listaRoles = [];
let menuAbierto = window.innerWidth > 768;

const usuariosFijos = [
    { usuario: "jfigueroa", clave: "3134630773", nombre: "DANIEL FIGUEROA", rol: "admin", activo: true },
    { usuario: "jgarnica", clave: "123456", nombre: "JAVIER GARNICA", rol: "admin", activo: true },
    { usuario: "jlopez", clave: "123456", nombre: "JULIETH LOPEZ", rol: "usuario", activo: true },
    { usuario: "estudiante", clave: "123456", nombre: "ESTUDIANTE PRUEBA", rol: "usuario", activo: true },
    { usuario: "jnonato", clave: "123456", nombre: "J NONATO", rol: "usuario", activo: true }
];

// =====================================================
// ===== 🔑 INICIALIZAR DESPUÉS DE FIREBASE =====
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        db = firebase.firestore();
        auth = firebase.auth();
        console.log('✅ db y auth listos');
        cargarDatosGenerales();
    } else {
        console.error('❌ Firebase NO cargado — verifica que firebase.js esté primero');
    }
});

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
function iniciarSesion() {
    const usu = document.getElementById('usuario').value.trim();
    const cla = document.getElementById('clave').value;
    
    if (typeof db === 'undefined' || !db) {
        alert('⏳ Conectando... espere y vuelva a intentar');
        return;
    }

    const usuarioEncontrado = usuariosFijos.find(u => 
        u.usuario === usu && u.clave === cla && u.activo
    );

    if (usuarioEncontrado) {
        usuarioActivo = usuarioEncontrado;
        document.getElementById('pantallaLogin').classList.add('oculto');
        document.getElementById('pantallaPrincipal').classList.remove('oculto');
        document.getElementById('nombreUsuario').textContent = usuarioActivo.nombre;
        actualizarVisibilidadModulos();
        return;
    }

    db.collection('colaboradores').where('usuario', '==', usu).get()
        .then(snap => {
            let encontrado = null;
            snap.forEach(doc => {
                const d = doc.data();
                if (d.clave === cla && d.activo !== false) {
                    encontrado = { id: doc.id, ...d, rol: d.rol || 'usuario' };
                }
            });
            if (encontrado) {
                usuarioActivo = encontrado;
                document.getElementById('pantallaLogin').classList.add('oculto');
                document.getElementById('pantallaPrincipal').classList.remove('oculto');
                document.getElementById('nombreUsuario').textContent = usuarioActivo.nombre || usuarioActivo.usuario;
                actualizarVisibilidadModulos();
            } else {
                alert('❌ Usuario o contraseña incorrectos');
            }
        })
        .catch(err => {
            console.error(err);
            alert('❌ Error de conexión');
        });
}

function cerrarSesion() {
    usuarioActivo = null;
    document.getElementById('pantallaLogin').classList.remove('oculto');
    document.getElementById('pantallaPrincipal').classList.add('oculto');
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';
}

// =====================================================
// ===== 📂 MENÚ Y NAVEGACIÓN =====
// =====================================================
function toggleMenu() {
    menuAbierto = !menuAbierto;
    const menu = document.getElementById('menuLateral');
    if (menuAbierto) {
        menu.classList.remove('oculto');
    } else {
        if (window.innerWidth <= 768) menu.classList.add('oculto');
    }
}

function cambiarPestaña(nombreModulo) {
    if (window.innerWidth <= 768) {
        document.getElementById('menuLateral').classList.add('oculto');
        menuAbierto = false;
    }
    
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.getElementById('moduloActivo').textContent = nombreModulo.toUpperCase();
    
    if (window[`cargarModulo_${nombreModulo}`]) {
        window[`cargarModulo_${nombreModulo}`]();
    }
}

function actualizarVisibilidadModulos() {
    if (!usuarioActivo) return;
    
    const esAdmin = usuarioActivo.rol === 'admin' || 
                    usuarioActivo.usuario === 'jfigueroa' || 
                    usuarioActivo.usuario === 'jgarnica';
    
    console.log('👤 Usuario:', usuarioActivo.usuario, '| Es Admin:', esAdmin);
    
    document.querySelectorAll('.btn-pestaña').forEach(btn => {
        const texto = btn.textContent.toLowerCase();
        if (texto.includes('administración') || texto.includes('gestión usuario')) {
            btn.style.display = esAdmin ? 'block' : 'none';
        }
    });
}

// =====================================================
// ===== 📥 CARGA DE DATOS DESDE FIREBASE =====
// =====================================================
function cargarDatosGenerales() {
    if (!db) {
        console.log('❌ db no disponible');
        return;
    }

    db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientos = [];
        snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
        console.log('📋 Movimientos totales:', movimientos.length);
        if (window.dibujarMovimientosHoy) dibujarMovimientosHoy();
        if (window.dibujarMovimientosPendientes) dibujarMovimientosPendientes();
        setTimeout(() => actualizarSelectoresVehiculos(), 100);
    });

    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('colaboradores').orderBy('nombre', 'asc').onSnapshot(snap => {
        colaboradores = [];
        snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
        console.log('👤 Colaboradores:', colaboradores.length);
        if (window.actualizarSelectoresMov) actualizarSelectoresMov();
    });

    db.collection('vehiculos').orderBy('placa', 'asc').onSnapshot(snap => {
        vehiculosMov = [];
        snap.forEach(doc => { 
            vehiculosMov.push({ id: doc.id, ...doc.data() }); 
        });
        console.log('✅ Vehículos cargados:', vehiculosMov.length, vehiculosMov);
        setTimeout(() => actualizarSelectoresVehiculos(), 50);
        setTimeout(() => actualizarSelectoresVehiculos(), 200);
    });

    db.collection('conductores').orderBy('nombre', 'asc').onSnapshot(snap => {
        conductores = [];
        snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
        console.log('🚛 Conductores:', conductores.length);
    });

    db.collection('kilometraje').onSnapshot(snap => {
        kilometraje = [];
        snap.forEach(doc => { kilometraje.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('tanqueo').onSnapshot(snap => {
        tanqueo = [];
        snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
    });
}

// =====================================================
// ===== 🔄 ACTUALIZAR SELECTORES =====
// =====================================================
function actualizarSelectoresVehiculos() {
    const sel = document.getElementById('placa');
    if (!sel) {
        console.log('⚠️ Campo placa no encontrado en este momento');
        return;
    }
    
    const valorActual = sel.value;
    
    const placasRegistradas = vehiculosMov.map(v => v.placa).filter(p => p);
    const placasUsadas = [...new Set(movimientos.map(m => m.placa).filter(p => p))];
    
    // ✅ [...new Set(...)] = ELIMINA DUPLICADOS AUTOMÁTICAMENTE
    const todasLasPlacas = [...new Set([...placasRegistradas, ...placasUsadas])].sort();
    
    console.log('🚗 Placas registradas:', placasRegistradas);
    console.log('📋 Placas usadas en movimientos:', placasUsadas);
    console.log('✅ TOTAL A MOSTRAR:', todasLasPlacas);
    
    sel.innerHTML = `<option value="">-- Seleccione --</option>` +
        todasLasPlacas.map(p => `<option value="${p}">${p}</option>`).join('');
    
    sel.value = valorActual;
}

function actualizarSelectoresColaboradores() {
    const sel = document.getElementById('colaborador');
    if (!sel) return;
    const valorActual = sel.value;
    sel.innerHTML = `<option value="">-- Seleccionar --</option>` +
        colaboradores.map(c => `<option value="${c.nombre || c.nombreCompleto}">${c.nombre || c.nombreCompleto}</option>`).join('') +
        conductores.map(c => `<option value="${c.nombre || c.nombreCompleto}">${c.nombre || c.nombreCompleto}</option>`).join('');
    sel.value = valorActual;
}

function actualizarSelectoresMov() {
    actualizarSelectoresVehiculos();
    actualizarSelectoresColaboradores();
}

// =====================================================
// ===== 💾 GUARDAR / EDITAR MOVIMIENTO =====
// =====================================================
async function guardarMovimiento(datos) {
    if (!db) return alert('❌ Sin conexión');
    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(datos);
            alert('✅ Movimiento guardado');
        }
        idEdicion = null;
        filasRecogida = [];
        if (window.cargarModulo_movimientos) cargarModulo_movimientos();
    } catch (err) {
        console.error(err);
        alert('❌ Error al guardar');
    }
}

async function editarMovimiento(id) {
    idEdicion = id;
    if (window.cambiarSubpestañaMov) cambiarSubpestañaMov('crear');
    setTimeout(() => {
        const m = movimientos.find(x => x.id === id);
        if (!m) return;
        if (document.getElementById('fechaMov')) document.getElementById('fechaMov').value = m.fecha || '';
        if (document.getElementById('placa')) document.getElementById('placa').value = m.placa || '';
        if (document.getElementById('colaborador')) document.getElementById('colaborador').value = m.colaborador || '';
        if (document.getElementById('horaSalida')) document.getElementById('horaSalida').value = m.horaSalida || '';
        if (document.getElementById('canastillasSalida')) document.getElementById('canastillasSalida').value = m.canastillasSalida || '';
        if (document.getElementById('horaLlegada')) document.getElementById('horaLlegada').value = m.horaLlegada || '';
        if (document.getElementById('canastillasLlegada')) document.getElementById('canastillasLlegada').value = m.canastillasLlegada || '';
        if (document.getElementById('totalKilos')) document.getElementById('totalKilos').value = m.totalKilos || '';
        if (document.getElementById('observaciones')) document.getElementById('observaciones').value = m.observaciones || '';
        filasRecogida = m.recogidas || [];
        if (window.dibujarTablaRecogidas) dibujarTablaRecogidas();
    }, 100);
}

async function eliminarMovimiento(id) {
    if (!confirm('¿Seguro de eliminar este movimiento?')) return;
    if (!db) return;
    try {
        await db.collection('movimientos').doc(id).delete();
        alert('✅ Eliminado');
        idEdicion = null;
        if (window.cargarModulo_movimientos) cargarModulo_movimientos();
    } catch (err) {
        console.error(err);
        alert('❌ Error al eliminar');
    }
}

async function completarMovimientoDirecto(id) {
    if (!db) return alert('❌ Sin conexión');
    const ahora = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    try {
        await db.collection('movimientos').doc(id).update({
            horaLlegada: ahora
        });
        alert('✅ Movimiento completado');
    } catch (err) {
        console.error(err);
        alert('❌ Error al completar');
    }
}

// =====================================================
// ===== 📊 EXPORTAR EXCEL =====
// =====================================================
function exportarExcel() {
    if (movimientos.length === 0) return alert('📭 Sin datos para exportar');
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Colaborador: m.colaborador,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || '—',
        CanastillasSalida: m.canastillasSalida || 0,
        CanastillasLlegada: m.canastillasLlegada || 0,
        TotalKilos: m.totalKilos || 0,
        Observaciones: m.observaciones || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

console.log('✅ funciones.js cargado completo');
