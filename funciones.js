// =====================================================
// ===== CONFIGURACIÓN FIREBASE =====
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
const db = firebase.firestore();
const auth = firebase.auth();

// =====================================================
// ===== VARIABLES GLOBALES =====
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
let datosVehiculos = [];
let historialMantenimientos = [];
let idEdicion = null;
let idEdicionTransp = null;
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", modulos: ["movimientos"] }
];

// =====================================================
// ===== INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usu = document.getElementById('correoLogin').value.trim();
    const clave = document.getElementById('passLogin').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    const fijo = usuariosFijos.find(u => u.usuario === usu && u.clave === clave);
    if (fijo) {
        usuarioActivo = { ...fijo, uid: "FIJO_" + fijo.usuario };
        await finalizarLogin();
        return;
    }

    try {
        const snap = await db.collection('usuarios').where('usuario', '==', usu).get();
        let enc = null;
        snap.forEach(doc => {
            const d = doc.data();
            if (d.clave === clave) enc = { id: doc.id, ...d };
        });
        if (enc) {
            usuarioActivo = { uid: enc.id, ...enc };
            await finalizarLogin();
            return;
        }
        error.textContent = "⚠️ Usuario o contraseña incorrectos";
    } catch (e) {
        error.textContent = "Error: " + e.message;
    }
}

async function finalizarLogin() {
    document.getElementById('modalLogin').style.display = 'none';
    document.getElementById('nombreUsuarioActivo').textContent = "Conectado: " + usuarioActivo.nombre;
    if (usuarioActivo.rol === 'admin') document.getElementById('btnAdmin').classList.remove('oculto');
    await cargarDatosGenerales();
    cambiarPestaña('movimientos');
    setInterval(actualizarInformacion, 10000);
}

function cerrarSesion() {
    usuarioActivo = null;
    movimientos = [];
    movimientosTransp = [];
    colaboradores = [];
    document.getElementById('modalLogin').style.display = 'flex';
    document.getElementById('correoLogin').value = '';
    document.getElementById('passLogin').value = '';
}

// =====================================================
// ===== CARGA DE DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosGenerales() {
    const hoy = new Date().toISOString().split('T')[0];

    db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientos = [];
        snap.forEach(doc => { movimientos.push({ id: doc.id, ...doc.data() }); });
        dibujarMovimientosHoy();
        dibujarMovimientosPendientes();
    });

    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
        dibujarMovimientosTranspPendientes();
        dibujarMovimientosTranspHoy();
    });

    db.collection('colaboradores').orderBy('nombre').onSnapshot(snap => {
        colaboradores = [];
        snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
        llenarSelectoresColaboradores();
    });

    db.collection('vehiculos_movimientos').orderBy('placa').onSnapshot(snap => {
        vehiculosMov = [];
        snap.forEach(doc => { vehiculosMov.push({ id: doc.id, ...doc.data() }); });
        llenarSelectoresVehiculos();
    });

    db.collection('vehiculos_transportadora').orderBy('placa').onSnapshot(snap => {
        vehiculosTransp = [];
        snap.forEach(doc => { vehiculosTransp.push({ id: doc.id, ...doc.data() }); });
        llenarSelectoresVehiculosTransp();
    });

    db.collection('conductores_transportadora').orderBy('nombre').onSnapshot(snap => {
        conductores = [];
        snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
        dibujarConductoresTransp();
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

async function actualizarInformacion() {
    await cargarDatosGenerales();
}

// =====================================================
// ===== CAMBIO DE PESTAÑAS Y SUBPESTAÑAS =====
// =====================================================
function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    document.getElementById('sidebar').classList.remove('mostrar');
}

function cambiarSubpestañaMov(nombre) {
    document.querySelectorAll('.btn-submov').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-mov').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`submov-${nombre}`).classList.remove('oculto');
    idEdicion = null;
    limpiarFormularioMovimiento();
}

function cambiarSubpestañaTransp(nombre) {
    document.querySelectorAll('.btn-subtransp').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-transp').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subtransp-${nombre}`).classList.remove('oculto');
    idEdicionTransp = null;
    limpiarFormularioMovimientoTransp();
}

// =====================================================
// ===== MOVIMIENTOS - FUNCIONES DE APOYO =====
// =====================================================
function llenarSelectoresVehiculos() {
    const sel = document.getElementById('vehiculoMov');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione...</option>';
    vehiculosMov.forEach(v => sel.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`);
}

function llenarSelectoresColaboradores() {
    const sel = document.getElementById('conductorMov');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione...</option>';
    colaboradores.filter(c => (c.estado || 'activo') === 'activo').forEach(c => {
        sel.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
    });
}

function llenarSelectoresVehiculosTransp() {
    const sel = document.getElementById('vehiculoTranspMov');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione...</option>';
    vehiculosTransp.forEach(v => sel.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`);
}

function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const caja = document.getElementById('listaMovTodos');
    if (!caja) return;
    const filtro = movimientos.filter(m => m.fecha === hoy);
    if (filtro.length === 0) {
        caja.innerHTML = '<p class="p-3 text-sm">📭 Sin movimientos hoy</p>';
        return;
    }
    caja.innerHTML = filtro.map(m => filaMovHtml(m)).join('');
}

function dibujarMovimientosPendientes() {
    const caja = document.getElementById('listaMovPendientes');
    if (!caja) return;
    const pend = movimientos.filter(m => !m.horaLlegada);
    if (pend.length === 0) {
        caja.innerHTML = '<p class="p-3 text-sm">✅ Sin movimientos pendientes</p>';
        return;
    }
    caja.innerHTML = pend.map(m => filaMovHtml(m)).join('');
}

function filaMovHtml(m) {
    return `
    <div class="tarjeta">
        <div class="flex flex-wrap gap-2">
            <strong>📅 ${m.fecha}</strong> |
            <strong>🚗 ${m.placa || '—'}</strong> |
            <strong>👤 ${m.conductor || '—'}</strong> |
            Salida: ${m.horaSalida || '—'} |
            Llegada: ${m.horaLlegada || '⏳ Pendiente'} |
            📦 Salida: ${m.canastillasSalida || 0} / Llegada: ${m.canastillasLlegada || 0}
            <div class="mt-2">
                <button class="btn-editar" style="padding:0.3rem 0.6rem;font-size:0.85rem;" onclick="cargarMovimientoEditar('${m.id}')">✏️ Editar</button>
                ${!m.horaLlegada ? `<button class="btn-exito" style="padding:0.3rem 0.6rem;font-size:0.85rem;" onclick="cargarMovimientoEditar('${m.id}')">✅ Registrar Llegada</button>` : ''}
                ${usuarioActivo?.rol==='admin' ? `<button class="btn-peligro" style="padding:0.3rem 0.6rem;font-size:0.85rem;" onclick="eliminarMovimiento('${m.id}')">🗑️ Eliminar</button>` : ''}
            </div>
        </div>
    </div>`;
}

// =====================================================
// ===== RECOGIDAS: AGREGAR, CALCULAR TOTALES =====
// =====================================================
function agregarRecogida() {
    const lista = document.getElementById('listaRecogidas');
    const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const div = document.createElement('div');
    div.className = 'fila-recogida';
    div.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;padding:8px;background:#f9fafb;border-radius:6px;">
            <label>Recoge a:</label>
            <select name="recogeA" style="flex:1;min-width:150px;"><option value="">Seleccione colaborador...</option>${opciones}</select>
            <label>Tipo:</label>
            <select name="tipoUnidad" style="width:130px;" onchange="actualizarTotalesRecogidas()">
                <option value="canastilla">📦 Canastilla</option>
                <option value="bulto">📥 Bulto</option>
            </select>
            <label>Cantidad:</label>
            <input type="number" name="cantidad" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <label>Kilos:</label>
            <input type="number" name="kilos" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <button type="button" class="btn-peligro" onclick="this.parentElement.remove();actualizarTotalesRecogidas()">✕</button>
        </div>`;
    lista.appendChild(div);
}

function actualizarTotalesRecogidas() {
    let totalCan = 0, totalBul = 0, totalKg = 0;
    document.querySelectorAll('#listaRecogidas .fila-recogida').forEach(fila => {
        const tipo = fila.querySelector('[name="tipoUnidad"]')?.value;
        const cant = parseInt(fila.querySelector('[name="cantidad"]')?.value) || 0;
        const kg = parseFloat(fila.querySelector('[name="kilos"]')?.value) || 0;
        if (tipo === 'canastilla') totalCan += cant;
        if (tipo === 'bulto') totalBul += cant;
        totalKg += kg;
    });
    document.getElementById('totalCanastillas').textContent = totalCan;
    document.getElementById('totalBultos').textContent = totalBul;
    document.getElementById('kilosTotal').value = totalKg || '';
}

function obtenerRecogidasActuales() {
    const conductorPrincipal = document.getElementById('conductorMov')?.value || '';
    const lista = [];
    document.querySelectorAll('#listaRecogidas .fila-recogida').forEach(fila => {
        const recogeA = fila.querySelector('[name="recogeA"]')?.value || '';
        const tipo = fila.querySelector('[name="tipoUnidad"]')?.value || 'canastilla';
        const cantidad = parseInt(fila.querySelector('[name="cantidad"]')?.value) || 0;
        const kilos = parseFloat(fila.querySelector('[name="kilos"]')?.value) || 0;
        if (recogeA || cantidad || kilos) {
            lista.push({ recogio: conductorPrincipal, recogeA, tipo, cantidad, kilos });
        }
    });
    return lista;
}

function limpiarFormularioMovimiento() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaMov').value = hoy;
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('conductorMov').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('listaRecogidas').innerHTML = '';
    document.getElementById('totalCanastillas').textContent = '0';
    document.getElementById('totalBultos').textContent = '0';
    document.getElementById('kilosTotal').value = '';
    document.getElementById('observacionesMov').value = '';
    idEdicion = null;
}

async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('conductorMov').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canastillasSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value;
    const recogidas = obtenerRecogidasActuales();

    if (!placa || !conductor || !horaSalida) return alert('⚠️ Complete Placa, Conductor y Hora de Salida');

    const datos = {
        fecha, placa, conductor, horaSalida, horaLlegada,
        canastillasSalida, canastillasLlegada,
        recogidas, observaciones,
        usuarioEdicion: usuarioActivo?.nombre || 'Desconocido',
        horaEdicion: new Date().toISOString()
    };

    if (idEdicion) {
        await db.collection('movimientos').doc(idEdicion).update(datos);
        alert('✅ Movimiento actualizado');
    } else {
        await db.collection('movimientos').add(datos);
        alert('✅ Movimiento guardado');
    }
    limpiarFormularioMovimiento();
}

async function cargarMovimientoEditar(id) {
    idEdicion = id;
    const m = movimientos.find(x => x.id === id);
    if (!m) return;

    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('conductorMov').value = m.conductor;
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.canastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';

    // Cargar recogidas guardadas
    document.getElementById('listaRecogidas').innerHTML = '';
    const recogidas = m.recogidas || [];
    let totalCan = 0, totalBul = 0, totalKg = 0;
    recogidas.forEach(r => {
        if (r.tipo === 'canastilla') totalCan += r.cantidad || 0;
        if (r.tipo === 'bulto') totalBul += r.cantidad || 0;
        totalKg += r.kilos || 0;
        const lista = document.getElementById('listaRecogidas');
        const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}" ${c.nombre===r.recogeA?'selected':''}>${c.nombre}</option>`).join('');
        const div = document.createElement('div');
        div.className = 'fila-recogida';
        div.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;padding:8px;background:#f9fafb;border-radius:6px;">
            <label>Recoge a:</label>
            <select name="recogeA" style="flex:1;min-width:150px;"><option value="">Seleccione colaborador...</option>${opciones}</select>
            <label>Tipo:</label>
            <select name="tipoUnidad" style="width:130px;" onchange="actualizarTotalesRecogidas()">
                <option value="canastilla" ${r.tipo==='canastilla'?'selected':''}>📦 Canastilla</option>
                <option value="bulto" ${r.tipo==='bulto'?'selected':''}>📥 Bulto</option>
            </select>
            <label>Cantidad:</label>
            <input type="number" name="cantidad" value="${r.cantidad||0}" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <label>Kilos:</label>
            <input type="number" name="kilos" value="${r.kilos||0}" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <button type="button" class="btn-peligro" onclick="this.parentElement.remove();actualizarTotalesRecogidas()">✕</button>
        </div>`;
        lista.appendChild(div);
    });
    document.getElementById('totalCanastillas').textContent = totalCan;
    document.getElementById('totalBultos').textContent = totalBul;
    document.getElementById('kilosTotal').value = totalKg || '';

    cambiarSubpestañaMov('registro');
}

async function completarMovimiento() {
    if (!idEdicion) return alert('⚠️ Primero busque y seleccione un movimiento pendiente');
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    if (!horaLlegada) return alert('⚠️ Debe registrar la Hora de Llegada');

    await db.collection('movimientos').doc(idEdicion).update({
        horaLlegada,
        canastillasLlegada: canLlegada,
        usuarioEdicion: usuarioActivo?.nombre || 'Desconocido',
        horaEdicion: new Date().toISOString()
    });
    alert('✅ Movimiento completado');
    limpiarFormularioMovimiento();
}

async function eliminarMovimiento(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administrador puede eliminar');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
}

// =====================================================
// ===== BÚSQUEDA DE MOVIMIENTOS =====
// =====================================================
function filtrarMovimientos() {
    const placa = document.getElementById('buscarPlaca').value.trim().toUpperCase();
    const conductor = document.getElementById('buscarConductor').value.trim().toUpperCase();
    const fecha = document.getElementById('buscarFecha').value;

    const pend = movimientos.filter(m => {
        const okPlaca = !placa || (m.placa||'').toUpperCase().includes(placa);
        const okCond = !conductor || (m.conductor||'').toUpperCase().includes(conductor);
        const okFecha = !fecha || m.fecha === fecha;
        return okPlaca && okCond && okFecha && !m.horaLlegada;
    });
    const todos = movimientos.filter(m => {
        const okPlaca = !placa || (m.placa||'').toUpperCase().includes(placa);
        const okCond = !conductor || (m.conductor||'').toUpperCase().includes(conductor);
        const okFecha = !fecha || m.fecha === fecha;
        return okPlaca && okCond && okFecha;
    });

    const cajaP = document.getElementById('listaMovPendientes');
    const cajaT = document.getElementById('listaMovTodos');
    if (cajaP) cajaP.innerHTML = pend.length ? pend.map(m => filaMovHtml(m)).join('') : '<p class="p-3">📭 Sin resultados</p>';
    if (cajaT) cajaT.innerHTML = todos.length ? todos.map(m => filaMovHtml(m)).join('') : '<p class="p-3">📭 Sin resultados</p>';
}

function limpiarBusqueda() {
    document.getElementById('buscarPlaca').value = '';
    document.getElementById('buscarConductor').value = '';
    document.getElementById('buscarFecha').value = '';
    dibujarMovimientosHoy();
    dibujarMovimientosPendientes();
}
// =====================================================
// ===== TRANSPORTADORA - CONDUCTORES =====
// =====================================================
function cambiarSubpestañaTransp(nombre) {
    document.querySelectorAll('.btn-subtransp').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-transp').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subtransp-${nombre}`).classList.remove('oculto');
    idEdicionTransp = null;
    limpiarFormularioMovimientoTransp();
}

async function agregarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if (!nombre) return alert('Escriba el nombre del conductor');
    await db.collection('conductores_transportadora').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
}

function dibujarConductoresTransp() {
    const caja = document.getElementById('listaConductoresTransp');
    if (!caja) return;
    if (conductores.length === 0) {
        caja.innerHTML = '<p class="p-3 text-sm">📭 Sin conductores registrados</p>';
        return;
    }
    caja.innerHTML = conductores.map(c => `
    <div class="tarjeta flex justify-between items-center">
        <span>👤 ${c.nombre}</span>
        <div>
            ${usuarioActivo?.rol==='admin' ? `<button class="btn-peligro" style="padding:0.3rem 0.5rem;font-size:0.8rem;" onclick="db.collection('conductores_transportadora').doc('${c.id}').delete();alert('Eliminado')">🗑️</button>` : ''}
        </div>
    </div>`).join('');
}

// =====================================================
// ===== TRANSPORTADORA - VEHÍCULOS =====
// =====================================================
async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
}

function llenarSelectoresVehiculosTransp() {
    const selVeh = document.getElementById('vehiculoTranspMov');
    const selCond = document.getElementById('conductorTranspMov');
    if (selVeh) {
        selVeh.innerHTML = '<option value="">Seleccione...</option>';
        vehiculosTransp.forEach(v => selVeh.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`);
    }
    if (selCond) {
        selCond.innerHTML = '<option value="">Seleccione...</option>';
        conductores.forEach(c => selCond.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
    }
}

// =====================================================
// ===== TRANSPORTADORA - MOVIMIENTOS =====
// =====================================================
function limpiarFormularioMovimientoTransp() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaMovTransp').value = hoy;
    document.getElementById('vehiculoTranspMov').value = '';
    document.getElementById('conductorTranspMov').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('obsTransp').value = '';
    idEdicionTransp = null;
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaMovTransp').value;
    const placa = document.getElementById('vehiculoTranspMov').value;
    const conductor = document.getElementById('conductorTranspMov').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    const observaciones = document.getElementById('obsTransp').value;

    if (!placa || !conductor || !horaSalida) return alert('⚠️ Complete placa, conductor y hora de salida');

    const datos = {
        fecha, placa, conductor, horaSalida, horaLlegada,
        canastillasSalida: canSalida, canastillasLlegada: canLlegada,
        observaciones,
        usuarioEdicion: usuarioActivo?.nombre || 'Desconocido',
        horaEdicion: new Date().toISOString()
    };

    if (idEdicionTransp) {
        await db.collection('movimientos_transportadora').doc(idEdicionTransp).update(datos);
        alert('✅ Movimiento actualizado');
    } else {
        await db.collection('movimientos_transportadora').add(datos);
        alert('✅ Movimiento guardado');
    }
    limpiarFormularioMovimientoTransp();
}

function dibujarMovimientosTranspHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const caja = document.getElementById('listaMovTranspTodos');
    if (!caja) return;
    const filtro = movimientosTransp.filter(m => m.fecha === hoy);
    if (filtro.length === 0) {
        caja.innerHTML = '<p class="p-3 text-sm">📭 Sin movimientos hoy</p>';
        return;
    }
    caja.innerHTML = filtro.map(m => filaMovTranspHtml(m)).join('');
}

function dibujarMovimientosTranspPendientes() {
    const caja = document.getElementById('listaMovTranspPendientes');
    if (!caja) return;
    const pend = movimientosTransp.filter(m => !m.horaLlegada);
    if (pend.length === 0) {
        caja.innerHTML = '<p class="p-3 text-sm">✅ Sin movimientos pendientes</p>';
        return;
    }
    caja.innerHTML = pend.map(m => filaMovTranspHtml(m)).join('');
}

function filaMovTranspHtml(m) {
    return `
    <div class="tarjeta">
        <div class="flex flex-wrap gap-2">
            <strong>📅 ${m.fecha}</strong> |
            <strong>🚗 ${m.placa || '—'}</strong> |
            <strong>👤 ${m.conductor || '—'}</strong> |
            Salida: ${m.horaSalida || '—'} |
            Llegada: ${m.horaLlegada || '⏳ Pendiente'} |
            📦 Salida: ${m.canastillasSalida || 0} / Llegada: ${m.canastillasLlegada || 0}
        </div>
    </div>`;
}

async function completarMovimientoTransp() {
    if (!idEdicionTransp) return alert('⚠️ Primero seleccione un movimiento pendiente');
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    if (!horaLlegada) return alert('⚠️ Registre la hora de llegada');

    await db.collection('movimientos_transportadora').doc(idEdicionTransp).update({
        horaLlegada, canastillasLlegada: canLlegada
    });
    alert('✅ Movimiento completado');
    limpiarFormularioMovimientoTransp();
}

// =====================================================
// ===== COMBUSTIBLE - KILOMETRAJE =====
// =====================================================
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;
    const colaborador = document.getElementById('quienRegistraKm').value;

    if (!fecha || !placa || !kmManana || !colaborador) {
        return alert('⚠️ Complete Fecha, Vehículo, Km Mañana y Quién Registra');
    }

    const kmRecorridos = (kmManana && kmTarde) ? (kmTarde - kmManana).toFixed(2) : null;

    await db.collection('kilometraje').add({
        fecha, placa, kmManana, kmTarde, kmRecorridos, colaborador,
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaRegistro: new Date()
    });
    alert('✅ Kilometraje guardado');
    document.getElementById('fechaKm').value = '';
    document.getElementById('vehiculoKm').value = '';
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
    document.getElementById('quienRegistraKm').value = '';
}

// =====================================================
// ===== COMBUSTIBLE - TANQUEO =====
// =====================================================
async function guardarRegistroTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = parseFloat(document.getElementById('galonesTanqueo').value) || 0;
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const quienTanquea = document.getElementById('quienTanquea').value;

    if (!fecha || !placa || !galones || !quienTanquea) {
        return alert('⚠️ Complete Fecha, Vehículo, Galones y Quién Tanquea');
    }

    await db.collection('tanqueo').add({
        fecha, placa, galones, estado, porcentaje, quienTanquea,
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaRegistro: new Date()
    });
    alert('✅ Tanqueo guardado');
    document.getElementById('fechaTanqueo').value = '';
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('quienTanquea').value = '';
}

// =====================================================
// ===== INFORMES =====
// =====================================================
function generarInformeMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');

    const resultados = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    const caja = document.getElementById('resultadoInformeMov');
    if (!caja) return;
    if (resultados.length === 0) {
        caja.innerHTML = '<p class="p-3">📭 Sin movimientos en este período</p>';
        return;
    }

    let totalCanSalida = 0, totalCanLlegada = 0;
    resultados.forEach(m => {
        totalCanSalida += m.canastillasSalida || 0;
        totalCanLlegada += m.canastillasLlegada || 0;
    });

    caja.innerHTML = `
    <div class="tarjeta">
        <p class="mb-2"><strong>Total Movimientos:</strong> ${resultados.length}</p>
        <p class="mb-2">📦 <strong>Canastillas Salida:</strong> ${totalCanSalida}</p>
        <p class="mb-2">📦 <strong>Canastillas Llegada:</strong> ${totalCanLlegada}</p>
        <table class="tabla-datos" style="width:100%;border-collapse:collapse;margin-top:0.5rem;">
            <thead><tr style="background:#e2e8f0;">
                <th>Fecha</th><th>Placa</th><th>Conductor</th><th>Hora Salida</th><th>Hora Llegada</th><th>Can. Salida</th><th>Can. Llegada</th>
            </tr></thead>
            <tbody>
                ${resultados.map(m => `
                <tr>
                    <td style="border:1px solid #ccc;padding:4px;">${m.fecha}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.placa}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.conductor}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.horaSalida||'—'}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.horaLlegada||'Pendiente'}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.canastillasSalida||0}</td>
                    <td style="border:1px solid #ccc;padding:4px;">${m.canastillasLlegada||0}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>`;
}

// =====================================================
// ===== ADMINISTRACIÓN - USUARIOS =====
// =====================================================
async function guardarUsuarioSistema() {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administrador');
    const usuario = document.getElementById('usuarioNuevo').value.trim();
    const clave = document.getElementById('claveNuevo').value;
    const nombre = document.getElementById('nombreCompletoUsuario').value.trim();
    const rol = document.getElementById('rolUsuario').value;

    if (!usuario || !clave || !nombre) return alert('Complete todos los campos');

    await db.collection('usuarios').add({ usuario, clave, nombre, rol, fechaCreacion: new Date() });
    alert('✅ Usuario creado');
    document.getElementById('usuarioNuevo').value = '';
    document.getElementById('claveNuevo').value = '';
    document.getElementById('nombreCompletoUsuario').value = '';
}

async function cambiarContrasena() {
    const actual = document.getElementById('claveActual').value;
    const nueva1 = document.getElementById('claveNueva1').value;
    const nueva2 = document.getElementById('claveNueva2').value;

    if (usuarioActivo?.clave && usuarioActivo.clave !== actual) return alert('⚠️ Contraseña actual incorrecta');
    if (nueva1 !== nueva2) return alert('⚠️ Las contraseñas nuevas no coinciden');
    if (!nueva1) return alert('Escriba la nueva contraseña');

    alert('✅ Contraseña cambiada correctamente');
    document.getElementById('claveActual').value = '';
    document.getElementById('claveNueva1').value = '';
    document.getElementById('claveNueva2').value = '';
}

// =====================================================
// ===== MANTENIMIENTO =====
// =====================================================
function cambiarSubpestañaMant(nombre) {
    document.querySelectorAll('.btn-submant').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-mant').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`submant-${nombre}`).classList.remove('oculto');
}

// =====================================================
// ===== FIN DEL ARCHIVO =====
// =====================================================
// =====================================================
// ===== ===== MANTENIMIENTO ===== =====
// =====================================================
let placaActivaMant = null;

// Cargar lista de placas al entrar a la pestaña
async function cargarListaPlacasMantenimiento() {
    const caja = document.getElementById('listaPlacasMant');
    if (!caja) return;
    
    // Unir placas de movimientos + transportadora
    const todasPlacas = [];
    vehiculosMov.forEach(v => { if (v.placa) todasPlacas.push(v.placa); });
    vehiculosTransp.forEach(v => { if (v.placa) todasPlacas.push(v.placa); });
    
    // Quitar duplicados y ordenar
    const placasUnicas = [...new Set(todasPlacas)].sort();
    
    if (placasUnicas.length === 0) {
        caja.innerHTML = '<p class="text-sm text-gray-500">📭 No hay vehículos registrados</p>';
        document.getElementById('formMantenimiento').classList.add('oculto');
        return;
    }
    
    caja.innerHTML = placasUnicas.map(p => 
        `<button class="btn-placa ${placaActivaMant === p ? 'activa' : ''}" 
         onclick="seleccionarPlacaMantenimiento('${p}')">🚗 ${p}</button>`
    ).join('');
}

// Seleccionar placa y mostrar formulario
async function seleccionarPlacaMantenimiento(placa) {
    placaActivaMant = placa;
    document.getElementById('placaSeleccionada').textContent = placa;
    document.getElementById('formMantenimiento').classList.remove('oculto');
    cargarListaPlacasMantenimiento(); // Resaltar placa activa
    
    // Cargar historial de esta placa
    cargarHistorialTaller(placa);
    cargarHistorialDocumentos(placa);
    mostrarInfoGeneralVehiculo(placa);
    
    // Llenar selectores de persona
    llenarSelectoresPersonaTaller();
}

// Mostrar información general del vehículo
function mostrarInfoGeneralVehiculo(placa) {
    const caja = document.getElementById('infoGeneralVehiculo');
    const vehMov = vehiculosMov.find(v => v.placa === placa);
    const vehTransp = vehiculosTransp.find(v => v.placa === placa);
    const veh = vehMov || vehTransp;
    
    if (!veh) {
        caja.innerHTML = '<p class="text-sm">Sin datos registrados</p>';
        return;
    }
    
    caja.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><strong>Placa:</strong> ${placa}</div>
        <div><strong>Tipo:</strong> ${veh.tipo || 'No especificado'}</div>
        <div><strong>Origen:</strong> ${vehMov ? 'Movimientos' : 'Transportadora'}</div>
    </div>`;
}

// Llenar selectores con colaboradores
function llenarSelectoresPersonaTaller() {
    const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    
    const selEntrega = document.getElementById('quienEntregaVehiculo');
    const selRecoge = document.getElementById('quienRecogeVehiculo');
    
    if (selEntrega) selEntrega.innerHTML = `<option value="">Seleccione...</option>${opciones}`;
    if (selRecoge) selRecoge.innerHTML = `<option value="">Seleccione...</option>${opciones}`;
}

// Registrar ingreso al taller
async function registrarIngresoTaller() {
    if (!placaActivaMant) return alert('Seleccione una placa primero');
    
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienEntrega = document.getElementById('quienEntregaVehiculo').value;
    
    if (!fechaIngreso || !quienEntrega) {
        return alert('⚠️ Complete Fecha de Ingreso y Quién Entrega');
    }
    
    await db.collection('mantenimiento_taller').add({
        placa: placaActivaMant,
        tipo: 'INGRESO_TALLER',
        fechaIngreso,
        quienEntrega,
        estado: 'EN_TALLER',
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaRegistro: new Date()
    });
    
    alert('✅ Ingreso a taller registrado');
    document.getElementById('fechaIngresoTaller').value = '';
    document.getElementById('quienEntregaVehiculo').value = '';
    cargarHistorialTaller(placaActivaMant);
}

// Registrar recogida del vehículo
async function recogerVehiculo() {
    if (!placaActivaMant) return alert('Seleccione una placa primero');
    
    const quienRecoge = document.getElementById('quienRecogeVehiculo').value;
    const diagnostico = document.getElementById('diagnosticoTaller').value.trim();
    const costo = parseFloat(document.getElementById('costoTaller').value) || 0;
    
    if (!quienRecoge || !diagnostico) {
        return alert('⚠️ Complete Quién Recoge y Diagnóstico');
    }
    
    await db.collection('mantenimiento_taller').add({
        placa: placaActivaMant,
        tipo: 'RECOGIDA_VEHICULO',
        fechaRecogida: new Date().toISOString().split('T')[0],
        quienRecoge,
        diagnostico,
        costo,
        estado: 'EN_OPERACION',
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaRegistro: new Date()
    });
    
    alert('✅ Recogida registrada. Vehículo en operación.');
    document.getElementById('quienRecogeVehiculo').value = '';
    document.getElementById('diagnosticoTaller').value = '';
    document.getElementById('costoTaller').value = '';
    cargarHistorialTaller(placaActivaMant);
}

// Cargar historial de taller
async function cargarHistorialTaller(placa) {
    const caja = document.getElementById('historialTaller');
    if (!caja) return;
    
    const snap = await db.collection('mantenimiento_taller')
        .where('placa', '==', placa)
        .orderBy('fechaRegistro', 'desc')
        .limit(20)
        .get();
    
    const historial = [];
    snap.forEach(doc => historial.push({ id: doc.id, ...doc.data() }));
    
    if (historial.length === 0) {
        caja.innerHTML = '<p class="text-sm text-gray-500">📭 Sin historial de taller</p>';
        return;
    }
    
    caja.innerHTML = historial.map(h => `
    <div class="p-2 mb-2 border rounded bg-gray-50 text-sm">
        ${h.tipo === 'INGRESO_TALLER' 
            ? `🔧 <strong>Ingreso a Taller</strong> — ${h.fechaIngreso}<br>Entregó: ${h.quienEntrega}` 
            : `✅ <strong>Recogida del Taller</strong> — ${h.fechaRecogida || '—'}<br>Recogió: ${h.quienRecoge || '—'}<br>Diagnóstico: ${h.diagnostico || '—'}<br>Costo: $${h.costo || 0}`}
    </div>`).join('');
}

// Registrar documento (SOAT, Tecno-mecánica, Seguro)
async function registrarDocumentoSeguro() {
    if (!placaActivaMant) return alert('Seleccione una placa primero');
    
    const tipo = document.getElementById('tipoDocumentoSeguro').value;
    const emision = document.getElementById('fechaEmisionDoc').value;
    const vencimiento = document.getElementById('fechaVencimientoDoc').value;
    
    if (!emision || !vencimiento) {
        return alert('⚠️ Complete Fecha de Emisión y Vencimiento');
    }
    
    await db.collection('mantenimiento_documentos').add({
        placa: placaActivaMant,
        tipo,
        fechaEmision: emision,
        fechaVencimiento: vencimiento,
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaRegistro: new Date()
    });
    
    alert(`✅ ${tipo} registrado correctamente`);
    document.getElementById('fechaEmisionDoc').value = '';
    document.getElementById('fechaVencimientoDoc').value = '';
    cargarHistorialDocumentos(placaActivaMant);
}

// Cargar historial de documentos
async function cargarHistorialDocumentos(placa) {
    const caja = document.getElementById('historialSeguros');
    if (!caja) return;
    
    const snap = await db.collection('mantenimiento_documentos')
        .where('placa', '==', placa)
        .orderBy('fechaRegistro', 'desc')
        .limit(20)
        .get();
    
    const docs = [];
    snap.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    
    if (docs.length === 0) {
        caja.innerHTML = '<p class="text-sm text-gray-500">📭 Sin documentos registrados</p>';
        return;
    }
    
    caja.innerHTML = docs.map(d => {
        const hoy = new Date();
        const ven = new Date(d.fechaVencimiento);
        const dias = Math.ceil((ven - hoy) / (1000*60*60*24));
        const alerta = dias <= 30 ? '🔴' : dias <= 90 ? '🟡' : '🟢';
        return `
        <div class="p-2 mb-2 border rounded text-sm">
            ${alerta} <strong>${d.tipo}</strong><br>
            Emisión: ${d.fechaEmision} | Vencimiento: ${d.fechaVencimiento}
            ${dias <= 0 ? '<br>⚠️ Vencido' : dias <= 30 ? `<br>⚠️ Vence en ${dias} días` : ''}
        </div>`;
    }).join('');
}

// =====================================================
// ===== CORRECCIÓN: CARGAR MOVIMIENTO SIN BORRAR FECHA =====
// =====================================================
async function cargarMovimientoEditar(id) {
    idEdicion = id;
    const m = movimientos.find(x => x.id === id);
    if (!m) return;

    // ✅ MANTENER LA FECHA ORIGINAL — NO se sobreescribe con hoy
    document.getElementById('fechaMov').value = m.fecha; // 👈 ESTA ES LA CORRECCIÓN
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('conductorMov').value = m.conductor;
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.canastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';

    // ✅ Cargar recogidas guardadas sin perder los datos
    document.getElementById('listaRecogidas').innerHTML = '';
    const recogidas = m.recogidas || [];
    let totalCan = 0, totalBul = 0, totalKg = 0;
    recogidas.forEach(r => {
        if (r.tipo === 'canastilla') totalCan += r.cantidad || 0;
        if (r.tipo === 'bulto') totalBul += r.cantidad || 0;
        totalKg += r.kilos || 0;
        const lista = document.getElementById('listaRecogidas');
        const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}" ${c.nombre===r.recogeA?'selected':''}>${c.nombre}</option>`).join('');
        const div = document.createElement('div');
        div.className = 'fila-recogida';
        div.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;padding:8px;background:#f9fafb;border-radius:6px;">
            <label>Recoge a:</label>
            <select name="recogeA" style="flex:1;min-width:150px;"><option value="">Seleccione colaborador...</option>${opciones}</select>
            <label>Tipo:</label>
            <select name="tipoUnidad" style="width:130px;" onchange="actualizarTotalesRecogidas()">
                <option value="canastilla" ${r.tipo==='canastilla'?'selected':''}>📦 Canastilla</option>
                <option value="bulto" ${r.tipo==='bulto'?'selected':''}>📥 Bulto</option>
            </select>
            <label>Cantidad:</label>
            <input type="number" name="cantidad" value="${r.cantidad||0}" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <label>Kilos:</label>
            <input type="number" name="kilos" value="${r.kilos||0}" placeholder="0" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <button type="button" class="btn-peligro" onclick="this.parentElement.remove();actualizarTotalesRecogidas()">✕</button>
        </div>`;
        lista.appendChild(div);
    });
    document.getElementById('totalCanastillas').textContent = totalCan;
    document.getElementById('totalBultos').textContent = totalBul;
    document.getElementById('kilosTotal').value = totalKg || '';

    cambiarSubpestañaMov('registro');
}

// =====================================================
// ===== CARGAR PLACAS AL ENTRAR A MANTENIMIENTO =====
// =====================================================
// Reemplaza la función cambiarPestaña existente por esta:
const cambiarPestañaOriginal = cambiarPestaña;
function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    document.getElementById('sidebar').classList.remove('mostrar');
    
    // ✅ Si entra a Mantenimiento → cargar lista de placas
    if (nombre === 'mantenimiento') {
        cargarListaPlacasMantenimiento();
        placaActivaMant = null;
        document.getElementById('formMantenimiento').classList.add('oculto');
    }
}
// =====================================================
// ✅ EDITAR MOVIMIENTO SIN BORRAR NINGÚN DATO
// =====================================================
async function cargarMovimientoEditar(id) {
    idEdicion = id;
    const m = movimientos.find(x => x.id === id);
    if (!m) {
        alert('⚠️ Movimiento no encontrado');
        return;
    }

    // ✅ SE MANTIENE LA FECHA ORIGINAL DEL MOVIMIENTO — NO SE CAMBIA
    document.getElementById('fechaMov').value = m.fecha;

    // ✅ CARGAMOS TODOS LOS DATOS EXACTAMENTE COMO ESTÁN GUARDADOS
    document.getElementById('vehiculoMov').value = m.placa || '';
    document.getElementById('conductorMov').value = m.conductor || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.canastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';

    // ✅ CARGAMOS LAS RECOGIDAS SIN PERDER NINGÚN DATO
    document.getElementById('listaRecogidas').innerHTML = '';
    const recogidas = m.recogidas || [];
    let totalCan = 0, totalBul = 0, totalKg = 0;

    recogidas.forEach(r => {
        // Sumar totales
        if (r.tipo === 'canastilla') totalCan += r.cantidad || 0;
        if (r.tipo === 'bulto') totalBul += r.cantidad || 0;
        totalKg += r.kilos || 0;

        // Crear fila con los datos guardados
        const lista = document.getElementById('listaRecogidas');
        const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo')
            .map(c => `<option value="${c.nombre}" ${c.nombre === r.recogeA ? 'selected' : ''}>${c.nombre}</option>`).join('');

        const fila = document.createElement('div');
        fila.className = 'fila-recogida';
        fila.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;padding:8px;background:#f9fafb;border-radius:6px;">
            <label>Recoge a:</label>
            <select name="recogeA" style="flex:1;min-width:150px;">
                <option value="">Seleccione colaborador...</option>${opciones}
            </select>
            <label>Tipo:</label>
            <select name="tipoUnidad" style="width:130px;" onchange="actualizarTotalesRecogidas()">
                <option value="canastilla" ${r.tipo === 'canastilla' ? 'selected' : ''}>📦 Canastilla</option>
                <option value="bulto" ${r.tipo === 'bulto' ? 'selected' : ''}>📥 Bulto</option>
            </select>
            <label>Cantidad:</label>
            <input type="number" name="cantidad" value="${r.cantidad || 0}" placeholder="0" 
                   style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <label>Kilos:</label>
            <input type="number" name="kilos" value="${r.kilos || 0}" placeholder="0" 
                   style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <button type="button" class="btn-peligro" onclick="this.parentElement.remove();actualizarTotalesRecogidas()">✕</button>
        </div>`;
        lista.appendChild(fila);
    });

    // ✅ ACTUALIZAMOS LOS TOTALES EN PANTALLA
    document.getElementById('totalCanastillas').textContent = totalCan;
    document.getElementById('totalBultos').textContent = totalBul;
    const campoKilos = document.getElementById('kilosTotal');
    if (campoKilos) campoKilos.value = totalKg || '';

    // ✅ CAMBIAMOS A LA PESTAÑA DE EDICIÓN
    cambiarSubpestañaMov('registro');
}

// =====================================================
// ✅ GUARDAR CAMBIOS SIN BORRAR NADA
// =====================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('conductorMov').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canastillasSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value;
    const recogidas = obtenerRecogidasActuales();

    if (!placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Placa, Conductor y Hora de Salida');
    }

    const datos = {
        fecha,
        placa,
        conductor,
        horaSalida,
        horaLlegada,
        canastillasSalida,
        canastillasLlegada,
        recogidas,
        observaciones,
        usuarioEdicion: usuarioActivo?.nombre || 'Desconocido',
        horaEdicion: new Date().toISOString()
    };

    if (idEdicion) {
        // ✅ ACTUALIZAMOS SIN BORRAR LO DEMÁS
        await db.collection('movimientos').doc(idEdicion).update(datos);
        alert('✅ Movimiento ACTUALIZADO correctamente');
    } else {
        // ✅ CREAMOS NUEVO MOVIMIENTO
        await db.collection('movimientos').add(datos);
        alert('✅ Movimiento GUARDADO correctamente');
    }

    // ✅ LIMPIAMOS EL FORMULARIO SOLO DESPUÉS DE GUARDAR
    limpiarFormularioMovimiento();
}
