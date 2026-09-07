// ===== CONFIGURACIÓN FIREBASE =====
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
const auth = firebase.auth();
const db = firebase.firestore();

// ===== USUARIOS PREDETERMINADOS =====
const usuariosFijos = {
    "jgarnica@correo.com": { pass: "123456", rol: "admin", nombre: "jgarnica" },
    "jfigueroa@correo.com": { pass: "3134630773", rol: "admin", nombre: "jfigueroa" },
    "estudiante@correo.com": { pass: "123456", rol: "usuario", nombre: "estudiante" }
};

// ===== VARIABLES GLOBALES =====
let usuarioConectado = null;
let idEdicion = null;
let movimientos = [];
let conductores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let colaboradores = [];
let tiempoSesion = null;
let filasRecogida = [];

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = document.getElementById('fecha');
    const fechaTransp = document.getElementById('fechaTransp');
    if (fecha) fecha.value = hoy;
    if (fechaTransp) fechaTransp.value = hoy;
    agregarFilaRecogida();
});

// ===== MENÚ Y PESTAÑAS =====
function alternarMenu() {
    document.getElementById('sidebar').classList.toggle('mostrar');
}

function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.pestaña').forEach(p => p.classList.remove('activa'));
    document.getElementById('pest-' + nombre).classList.add('activa');
    document.getElementById('tituloPestaña').textContent = event.target.textContent.trim();
    if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('mostrar');
    if (nombre === 'admin') cargarListasAdmin();
}

function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    document.getElementById('sub-admin-' + nombre).classList.remove('oculto');
    cargarListasAdmin();
}

// ===== INICIO DE SESIÓN =====
async function ingresar() {
    let correo = document.getElementById('correoLogin').value.trim();
    const pass = document.getElementById('passLogin').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    if (!correo.includes('@')) correo += '@correo.com';

    try {
        if (usuariosFijos[correo]) {
            if (usuariosFijos[correo].pass === pass) {
                usuarioConectado = { email: correo, ...usuariosFijos[correo] };
                await finalizarLogin();
                return;
            } else {
                error.textContent = '🔒 Contraseña errada';
                return;
            }
        }

        const cred = await auth.signInWithEmailAndPassword(correo, pass);
        const doc = await db.doc(`usuarios/${cred.user.uid}`).get();
        if (doc.exists) {
            usuarioConectado = { email: cred.user.email, uid: cred.user.uid, ...doc.data() };
            await finalizarLogin();
        } else {
            error.textContent = '❌ Usuario no registrado';
            await auth.signOut();
        }
    } catch (e) {
        if (e.code === 'auth/user-not-found') error.textContent = '❌ Usuario no registrado';
        else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') error.textContent = '🔒 Contraseña errada';
        else error.textContent = '⚠️ ' + e.message;
    }
}

async function finalizarLogin() {
    document.getElementById('modalLogin').style.display = 'none';
    document.querySelector('.btn-salir').style.display = 'block';
    if (usuarioConectado.rol === 'admin') document.getElementById('btnAdmin').classList.remove('oculto');
    await cargarDatos();
    iniciarTiempoSesion();
    registrarAccion('Inicio de Sesión', 'Sistema', '');
}

function cerrarSesion() {
    auth.signOut();
    location.reload();
}

function recuperarClave() {
    alert('Solicita recuperación desde tu consola de Firebase o contacta al administrador');
}

function iniciarTiempoSesion() {
    reiniciarTiempoSesion();
    window.onmousemove = reiniciarTiempoSesion;
    window.onkeypress = reiniciarTiempoSesion;
}
function reiniciarTiempoSesion() {
    clearTimeout(tiempoSesion);
    tiempoSesion = setTimeout(() => {
        alert('⏰ Cierre de sesión por inactividad');
        cerrarSesion();
    }, 60 * 60 * 1000);
}

// ===== ÚNICA LISTA DE COLABORADORES =====
function obtenerOpcionesColaboradoresActivos(valorSeleccionado = '') {
    const activos = colaboradores.filter(c => c.activo !== false);
    return '<option value="">Seleccione colaborador</option>' +
        activos.map(c => `<option value="${c.nombre}" ${valorSeleccionado === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('');
}

function actualizarSelectColaboradoresConductores() {
    const sel = document.getElementById('colaboradorConductor');
    if (sel) sel.innerHTML = obtenerOpcionesColaboradoresActivos();
}

// ===== GESTIÓN DE RECOGIDAS =====
function agregarFilaRecogida(datos = null) {
    filasRecogida.push({
        id: Date.now() + Math.random(),
        recogio: datos?.recogio || '',
        kilos: datos?.kilos || 0,
        canastillas: datos?.canastillas || 0
    });
    renderizarFilasRecogida();
}

function quitarFilaRecogida(id) {
    filasRecogida = filasRecogida.filter(f => f.id !== id);
    renderizarFilasRecogida();
}

function actualizarFilaRecogida(id, campo, valor) {
    const fila = filasRecogida.find(f => f.id === id);
    if (fila) {
        fila[campo] = (campo === 'kilos' || campo === 'canastillas') ? Number(valor) || 0 : valor;
        calcularTotalesAutomaticos();
    }
}

// ===== ✅ SUMA AUTOMÁTICA DE KILOS Y CANASTILLAS DE LLEGADA =====
function calcularTotalesAutomaticos() {
    let totalKilos = 0;
    let totalCanastillas = 0;
    filasRecogida.forEach(f => {
        totalKilos += Number(f.kilos) || 0;
        totalCanastillas += Number(f.canastillas) || 0;
    });

    const kilosTotal = document.getElementById('kilosTotales');
    if (kilosTotal) kilosTotal.value = totalKilos || '';

    const llegada = document.getElementById('canLlegadaTotal');
    if (llegada) llegada.value = totalCanastillas || '';
}

function renderizarFilasRecogida() {
    const cont = document.getElementById('listaRecogidas');
    if (!cont) return;
    cont.innerHTML = filasRecogida.map(f => `
        <div class="fila-recogida">
            <select onchange="actualizarFilaRecogida(${f.id}, 'recogio', this.value)">
                ${obtenerOpcionesColaboradoresActivos(f.recogio)}
            </select>
            <input type="number" placeholder="Kilos" value="${f.kilos || ''}"
                   oninput="actualizarFilaRecogida(${f.id}, 'kilos', this.value)">
            <input type="number" placeholder="Canastillas" value="${f.canastillas || ''}"
                   oninput="actualizarFilaRecogida(${f.id}, 'canastillas', this.value)">
            <button class="btn-quitar" onclick="quitarFilaRecogida(${f.id})">✕</button>
        </div>`).join('');
    calcularTotalesAutomaticos();
}

// ===== CARGA DE DATOS DESDE FIREBASE =====
async function cargarDatos() {
    try {
        const cl = await db.collection('colaboradores').orderBy('nombre').get();
        colaboradores = cl.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectColaboradoresConductores();
        renderizarFilasRecogida();

        const vm = await db.collection('vehiculos_movimientos').orderBy('placa').get();
        vehiculosMov = vm.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosMov();

        const vt = await db.collection('vehiculos_transportadora').orderBy('placa').get();
        vehiculosTransp = vt.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosTransp();

        const cd = await db.collection('conductores').orderBy('nombre').get();
        conductores = cd.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectConductores();

        const mv = await db.collection('movimientos').orderBy('fecha', 'desc').limit(50).get();
        movimientos = mv.docs.map(d => ({ id: d.id, ...d.data() }));
        dibujarMovimientos();
    } catch (e) {
        console.log('Error cargando datos:', e.message);
    }
}

// ===== VEHÍCULOS MOVIMIENTOS =====
function actualizarSelectVehiculosMov() {
    const sel = document.getElementById('vehiculoMov');
    const sel2 = document.getElementById('vehiculoComb');
    const opts = '<option value="">Seleccione vehículo</option>' +
        vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
    if (sel) sel.innerHTML = opts;
    if (sel2) sel2.innerHTML = opts;
}

// ===== VEHÍCULOS TRANSPORTADORA =====
function actualizarSelectVehiculosTransp() {
    const sel = document.getElementById('vehiculoTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione vehículo</option>' +
        vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
}

// ===== CONDUCTORES =====
function actualizarSelectConductores() {
    const sel = document.getElementById('conductorTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione conductor</option>' +
        conductores.filter(c => c.activo !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// ===== ✅ GUARDAR MOVIMIENTO CORREGIDO =====
async function guardarMovimiento() {
    const recogidasGuardar = filasRecogida.map(f => ({
        recogio: f.recogio,
        kilos: Number(f.kilos) || 0,
        canastillas: Number(f.canastillas) || 0
    }));

    const canSalida = Number(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = Number(document.getElementById('canLlegadaTotal').value) || 0;
    const kilosTotal = Number(document.getElementById('kilosTotales').value) || 0;

    const datos = {
        fecha: document.getElementById('fecha').value,
        placa: document.getElementById('vehiculoMov').value,
        colaboradorConductor: document.getElementById('colaboradorConductor').value,
        horaSalida: document.getElementById('horaSalida').value,
        horaLlegada: document.getElementById('horaLlegada').value,
        recogidas: recogidasGuardar,
        kilosTotales: kilosTotal,
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: canLlegada,
        observaciones: document.getElementById('observaciones').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };

    try {
        if (idEdicion) {
            // ✏️ MODIFICACIÓN: ACTUALIZA el movimiento existente
            await db.collection('movimientos').doc(idEdicion).update(datos);
            registrarAccion('Movimiento Modificado', 'Movimientos', `ID: ${idEdicion}`);
        } else {
            // 🆕 NUEVO movimiento
            await db.collection('movimientos').add(datos);
            registrarAccion('Salida Registrada', 'Movimientos', `Placa: ${datos.placa}`);
        }

        // ✅ AVISO Y LIMPIEZA DE TODOS LOS CAMPOS
        alert('✅ Movimiento guardado');

        // 🧹 LIMPIAR TODO y dejar en blanco
        idEdicion = null;
        filasRecogida = [];
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('vehiculoMov').value = '';
        document.getElementById('colaboradorConductor').value = '';
        document.getElementById('horaSalida').value = '';
        document.getElementById('horaLlegada').value = '';
        document.getElementById('canSalidaTotal').value = '';
        document.getElementById('canLlegadaTotal').value = '';
        document.getElementById('kilosTotales').value = '';
        document.getElementById('observaciones').value = '';

        // 🔄 Recargar lista y restablecer fila de recogidas
        agregarFilaRecogida();
        await cargarDatos();

    } catch (error) {
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ===== MOVIMIENTO TRANSPORTADORA =====
async function guardarMovimientoTransp() {
    const datos = {
        fecha: document.getElementById('fechaTransp').value,
        placa: document.getElementById('vehiculoTransp').value,
        conductor: document.getElementById('conductorTransp').value,
        canastillasSalida: Number(document.getElementById('canSalidaTransp').value) || 0,
        canastillasLlegada: Number(document.getElementById('canLlegadaTransp').value) || 0,
        horaSalida: document.getElementById('horaSalidaTransp').value,
        horaLlegada: document.getElementById('horaLlegadaTransp').value,
        usuario: usuarioConectado.nombre,
        horaRegistro: new Date()
    };
    await db.collection('movimientos_transportadora').add(datos);
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    alert('✅ Movimiento registrado');
    registrarAccion('Movimiento Transp', 'Transportadora', datos.placa);
}

// ===== LISTA MOVIMIENTOS =====
function dibujarMovimientos(lista = movimientos) {
    const cont = document.getElementById('listaMovimientos');
    if (!cont) return;
    cont.innerHTML = lista.map(m => {
        const rec = m.recogidas?.length ?
            m.recogidas.map(r => `• ${r.recogio || 'Sin nombre'}: ${r.kilos}kg / ${r.canastillas} can`).join('<br>')
            : 'Sin recogidas';
        return `<div style="border-bottom:1px solid #e5e7eb; padding:0.75rem 0;">
            <strong>${m.fecha}</strong> | ${m.placa} | Conductor: ${m.colaboradorConductor || 'N/D'}<br>
            Salida: ${m.horaSalida || '--'} | Llegada: ${m.horaLlegada || '--'}<br>
            📤 Salida: ${m.totalCanastillasSalida || 0} canastillas<br>
            📥 Llegada: ${m.totalCanastillasLlegada || 0} canastillas | ⚖️ ${m.kilosTotales || 0} kg<br>
            <em>Recogidas:</em><br><small>${rec}</small>
            <div style="margin-top:0.5rem;">
                <button onclick="editarMovimiento('${m.id}')" class="btn-editar">✏️ Completar Llegada</button>
                ${usuarioConectado?.rol === 'admin' ? `<button onclick="eliminarMovimiento('${m.id}')" class="btn-eliminar">🗑️ Eliminar</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function filtrarMovimientos() {
    const b = document.getElementById('buscarMov').value.toLowerCase();
    dibujarMovimientos(movimientos.filter(m =>
        (m.placa && m.placa.toLowerCase().includes(b)) ||
        (m.colaboradorConductor && m.colaboradorConductor.toLowerCase().includes(b))
    ));
}

// ===== ✏️ EDITAR = CARGAR PARA COMPLETAR LLEGADA =====
async function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    
    idEdicion = id;
    
    document.getElementById('fecha').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('colaboradorConductor').value = m.colaboradorConductor || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('canSalidaTotal').value = m.totalCanastillasSalida || '';

    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canLlegadaTotal').value = m.totalCanastillasLlegada || '';
    document.getElementById('kilosTotales').value = m.kilosTotales || '';
    document.getElementById('observaciones').value = m.observaciones || '';
    
    filasRecogida = (m.recogidas || []).map(r => ({
        id: Date.now() + Math.random(),
        recogio: r.recogio || '',
        kilos: r.kilos || 0,
        canastillas: r.canastillas || 0
    }));
    
    renderizarFilasRecogida();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Acceso denegado');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Eliminar Movimiento', 'Movimientos', `ID: ${id}`);
    await cargarDatos();
}

// ===== COMBUSTIBLE =====
async function guardarCombustible() {
    const datos = {
        fecha: new Date().toISOString().split('T')[0],
        placa: document.getElementById('vehiculoComb').value,
        kmManana: Number(document.getElementById('kma').value) || 0,
        kmTarde: Number(document.getElementById('kmt').value) || 0,
        galones: Number(document.getElementById('galones').value) || 0,
        usuario: usuarioConectado.nombre,
        horaRegistro: new Date()
    };
    await db.collection('combustible').add(datos);
    document.getElementById('kma').value = '';
    document.getElementById('kmt').value = '';
    document.getElementById('galones').value = '';
    alert('✅ Guardado');
    registrarAccion('Registro Combustible', 'Combustible', datos.placa);
}

// ===== INFORMES =====
function generarInforme() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    if (!inicio || !fin) return alert('Seleccione rango de fechas');
    
    const filtro = movimientos.filter(m => m.fecha >= inicio && m.fecha <= fin);
    const cont = document.getElementById('resultadoInforme');
    
    if (filtro.length === 0) {
        cont.innerHTML = '<p class="text-center">No hay registros en ese rango de fechas</p>';
        return;
    }

    const totalSalida = filtro.reduce((s, m) => s + (m.totalCanastillasSalida || 0), 0);
    const totalLlegada = filtro.reduce((s, m) => s + (m.totalCanastillasLlegada || 0), 0);
    const totalKilos = filtro.reduce((s, m) => s + (m.kilosTotales || 0), 0);

    cont.innerHTML = `
        <div style="background:#f1f5f9; padding:1rem; border-radius:0.5rem;">
            <p><strong>Total registros:</strong> ${filtro.length}</p>
            <p><strong>Total Canastillas Salida:</strong> ${totalSalida}</p>
            <p><strong>Total Canastillas Llegada:</strong> ${totalLlegada}</p>
            <p><strong>Total Kilos:</strong> ${totalKilos} kg</p>
        </div>`;
}

function exportarExcel() {
    if (movimientos.length === 0) return alert('Sin datos para exportar');
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida || '',
        HoraLlegada:
