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
let placaActivaMant = null;
let filasRecogida = [];
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
    if (nombre === 'mantenimiento') {
        cargarListaPlacasMantenimiento();
        placaActivaMant = null;
        const formMant = document.getElementById('formMantenimiento');
        if (formMant) formMant.classList.add('oculto');
    }
}
function cambiarSubpestañaMov(nombre) {
    document.querySelectorAll('.btn-submov').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-mov').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`submov-${nombre}`).classList.remove('oculto');
    if (!idEdicion) limpiarFormularioMovimiento();
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
// ===== MOVIMIENTOS DE CANASTILLAS =====
// =====================================================
function limpiarFormularioMovimiento() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaMov = document.getElementById('fechaMov');
    if (fechaMov) fechaMov.value = hoy;
    const colaboradorMov = document.getElementById('colaboradorMov');
    if (colaboradorMov) colaboradorMov.value = '';
    const vehiculoMov = document.getElementById('vehiculoMov');
    if (vehiculoMov) vehiculoMov.value = '';
    const horaSalidaMov = document.getElementById('horaSalidaMov');
    if (horaSalidaMov) horaSalidaMov.value = '';
    const horaLlegadaMov = document.getElementById('horaLlegadaMov');
    if (horaLlegadaMov) horaLlegadaMov.value = '';
    const canastillasSalidaMov = document.getElementById('canastillasSalidaMov');
    if (canastillasSalidaMov) canastillasSalidaMov.value = '';
    const canastillasLlegadaMov = document.getElementById('canastillasLlegadaMov');
    if (canastillasLlegadaMov) canastillasLlegadaMov.value = '';
    const observacionesMov = document.getElementById('observacionesMov');
    if (observacionesMov) observacionesMov.value = '';
    const totalKilos = document.getElementById('totalKilos');
    if (totalKilos) totalKilos.value = '';
    const totalCanastillasLlegada = document.getElementById('totalCanastillasLlegada');
    if (totalCanastillasLlegada) totalCanastillasLlegada.value = '';
    idEdicion = null;
    const btnGuardarMov = document.getElementById('btnGuardarMov');
    if (btnGuardarMov) btnGuardarMov.textContent = '✅ Guardar Salida';
    const btnCompletarMov = document.getElementById('btnCompletarMov');
    if (btnCompletarMov) btnCompletarMov.classList.add('oculto');
    limpiarTablaRecogidas();
}
function limpiarTablaRecogidas() {
    filasRecogida = [];
    document.getElementById('tablaRecogidasCuerpo').innerHTML = '';
    recalcularTotalesRecogida();
}
function agregarFilaRecogida() {
    const cuerpo = document.getElementById('tablaRecogidasCuerpo');
    const idx = filasRecogida.length;
    filasRecogida.push({ colaborador: '', kilos: 0, canastillas: 0 });
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>
            <select class="form-input" id="rec-col-${idx}" onchange="actualizarRecogida(${idx}, 'colaborador', this.value)">
                <option value="">-- Seleccione --</option>
                ${colaboradores.filter(c => c.estado !== 'inactivo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
            </select>
        </td>
        <td><input type="number" step="0.01" class="form-input" id="rec-kg-${idx}" oninput="actualizarRecogida(${idx}, 'kilos', this.value)"></td>
        <td><input type="number" class="form-input" id="rec-cn-${idx}" oninput="actualizarRecogida(${idx}, 'canastillas', this.value)"></td>
        <td><button class="btn-peligro" onclick="eliminarFilaRecogida(${idx})">🗑️</button></td>
    `;
    cuerpo.appendChild(fila);
}
function actualizarRecogida(idx, campo, valor) {
    if (campo === 'kilos') valor = parseFloat(valor) || 0;
    if (campo === 'canastillas') valor = parseInt(valor) || 0;
    filasRecogida[idx][campo] = valor;
    recalcularTotalesRecogida();
}
function eliminarFilaRecogida(idx) {
    filasRecogida.splice(idx, 1);
    dibujarTablaRecogidaCompleta();
}
function dibujarTablaRecogidaCompleta() {
    const cuerpo = document.getElementById('tablaRecogidasCuerpo');
    cuerpo.innerHTML = '';
    filasRecogida.forEach((f, i) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>
                <select class="form-input" id="rec-col-${i}" onchange="actualizarRecogida(${i}, 'colaborador', this.value)">
                    <option value="">-- Seleccione --</option>
                    ${colaboradores.filter(c => c.estado !== 'inactivo').map(c => `<option value="${c.nombre}" ${f.colaborador === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                </select>
            </td>
            <td><input type="number" step="0.01" class="form-input" value="${f.kilos || 0}" oninput="actualizarRecogida(${i}, 'kilos', this.value)"></td>
            <td><input type="number" class="form-input" value="${f.canastillas || 0}" oninput="actualizarRecogida(${i}, 'canastillas', this.value)"></td>
            <td><button class="btn-peligro" onclick="eliminarFilaRecogida(${i})">🗑️</button></td>
        `;
        cuerpo.appendChild(fila);
    });
    recalcularTotalesRecogida();
}
function recalcularTotalesRecogida() {
    const totalKg = filasRecogida.reduce((s, f) => s + (parseFloat(f.kilos) || 0), 0);
    const totalCn = filasRecogida.reduce((s, f) => s + (parseInt(f.canastillas) || 0), 0);
    const totalKilos = document.getElementById('totalKilos');
    const totalCanastillasLlegada = document.getElementById('totalCanastillasLlegada');
    if (totalKilos) totalKilos.value = totalKg.toFixed(2);
    if (totalCanastillasLlegada) totalCanastillasLlegada.value = totalCn;
}
async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const colaborador = document.getElementById('colaboradorMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const horaSalida = document.getElementById('horaSalidaMov').value;
    const horaLlegada = document.getElementById('horaLlegadaMov').value;
    const canSalida = parseInt(document.getElementById('canastillasSalidaMov').value) || 0;
    const canLlegada = parseInt(document.getElementById('canastillasLlegadaMov').value) || 0;
    const obs = document.getElementById('observacionesMov').value;
    const totalKg = parseFloat(document.getElementById('totalKilos').value) || 0;
    if (!fecha || !colaborador || !placa || !horaSalida) {
        return alert('⚠️ Complete Fecha, Colaborador, Vehículo y Hora de Salida');
    }
    const datos = {
        fecha, colaborador, placa,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        totalKilos: totalKg,
        recogidas: filasRecogida,
        observaciones: obs,
        usuarioRegistro: usuarioActivo.usuario,
        fechaRegistro: new Date(),
        completado: (!!horaLlegada || canLlegada > 0)
    };
    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(datos);
            alert('✅ Salida registrada');
        }
        limpiarFormularioMovimiento();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}
async function completarMovimiento() {
    if (!idEdicion) return alert('⚠️ Primero seleccione un movimiento');
    await guardarMovimiento();
}
// =====================================================
// ===== IR A EDITAR DESDE PENDIENTES =====
// =====================================================
function irAEditarMovimiento(id) {
    cambiarPestaña('movimientos');
    cambiarSubpestañaMov('crear');
    setTimeout(() => {
        editarMovimiento(id);
        document.getElementById('form-movimiento').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}
function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('colaboradorMov').value = m.colaborador || m.conductor || '';
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('horaSalidaMov').value = m.horaSalida;
    document.getElementById('horaLlegadaMov').value = m.horaLlegada || '';
    document.getElementById('canastillasSalidaMov').value = m.canastillasSalida || '';
    document.getElementById('canastillasLlegadaMov').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';
    filasRecogida = m.recogidas ? [...m.recogidas] : [];
    dibujarTablaRecogidaCompleta();
    document.getElementById('btnGuardarMov').textContent = '💾 Guardar Cambios';
    const btnCompletarMov = document.getElementById('btnCompletarMov');
    if (btnCompletarMov) btnCompletarMov.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function eliminarMovimiento(id) {
    if (usuarioActivo.rol !== 'admin') return alert('🔒 Solo administrador puede eliminar');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
}
function dibujarMovimientosPendientes() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaPendientesCuerpo');
    if (!tb) return;
    const pend = movimientos.filter(m => !m.completado && m.fecha === hoy);
    tb.innerHTML = pend.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador || m.conductor || '—'}</td>
            <td>${m.horaSalida}</td>
            <td>⏳ Pendiente</td>
            <td>${m.canastillasSalida}</td>
            <td>
                <button class="btn-exito" onclick="irAEditarMovimiento('${m.id}')">✅ Completar</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">✅ Sin movimientos pendientes hoy</td></tr>';
}
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaMovimientosHoyCuerpo');
    if (!tb) return;
    const filtro = movimientos.filter(m => m.fecha === hoy);
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador || m.conductor || '—'}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '⏳ Pendiente'}</td>
            <td>${m.canastillasSalida || 0}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${m.totalKilos || 0}</td>
            <td>
                <button class="btn-primario" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button>
                ${usuarioActivo.rol==='admin'?`<button class="btn-peligro" onclick="eliminarMovimiento('${m.id}')">🗑️</button>`:''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="9" class="text-center">📭 Sin movimientos hoy</td></tr>';
}
// =====================================================
// ===== TRANSPORTADORA =====
// =====================================================
function limpiarFormularioMovimientoTransp() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaTransp = document.getElementById('fechaTransp');
    const conductorTransp = document.getElementById('conductorTransp');
    const vehiculoTransp = document.getElementById('vehiculoTransp');
    const horaSalidaTransp = document.getElementById('horaSalidaTransp');
    const horaLlegadaTransp = document.getElementById('horaLlegadaTransp');
    const canastillasSalidaTransp = document.getElementById('canastillasSalidaTransp');
    const canastillasLlegadaTransp = document.getElementById('canastillasLlegadaTransp');
    if (fechaTransp) fechaTransp.value = hoy;
    if (conductorTransp) conductorTransp.value = '';
    if (vehiculoTransp) vehiculoTransp.value = '';
    if (horaSalidaTransp) horaSalidaTransp.value = '';
    if (horaLlegadaTransp) horaLlegadaTransp.value = '';
    if (canastillasSalidaTransp) canastillasSalidaTransp.value = '';
    if (canastillasLlegadaTransp) canastillasLlegadaTransp.value = '';
    idEdicionTransp = null;
}
async function agregarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if (!nombre) return alert('Ingrese nombre del conductor');
    await db.collection('conductores_transportadora').add({ nombre, estado: 'activo', fechaRegistro: new Date() });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
}
async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaRegistro: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo transportadora agregado');
}
async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canSalida = parseInt(document.getElementById('canastillasSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canastillasLlegadaTransp').value) || 0;
    if (!fecha || !conductor || !placa || !horaSalida) {
        return alert('⚠️ Complete Fecha, Conductor, Vehículo y Hora de Salida');
    }
    const datos = {
        fecha, conductor, placa,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        usuarioRegistro: usuarioActivo.usuario,
        completado: (!!horaLlegada || canLlegada > 0)
    };
    if (idEdicionTransp) {
        await db.collection('movimientos_transportadora').doc(idEdicionTransp).update(datos);
        alert('✅ Movimiento Transp actualizado');
    } else {
        await db.collection('movimientos_transportadora').add(datos);
        alert('✅ Salida Transp registrada');
    }
    limpiarFormularioMovimientoTransp();
}
function dibujarConductoresTransp() {
    const tb = document.getElementById('tablaConductoresTranspCuerpo');
    if (!tb) return;
    tb.innerHTML = conductores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.estado === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
        </tr>
    `).join('');
}
function dibujarMovimientosTranspHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaMovTranspHoyCuerpo');
    if (!tb) return;
    const filtro = movimientosTransp.filter(m => m.fecha === hoy);
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.conductor}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '—'}</td>
            <td>${m.canastillasSalida}</td>
            <td>${m.canastillasLlegada || 0}</td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">📭 Sin movimientos de transportadora hoy</td></tr>';
}
function dibujarMovimientosTranspPendientes() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaPendientesTranspCuerpo');
    if (!tb) return;
    const pend = movimientosTransp.filter(m => !m.completado && m.fecha === hoy);
    tb.innerHTML = pend.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.conductor}</td>
            <td>${m.horaSalida}</td>
            <td>${m.canastillasSalida}</td>
            <td><button class="btn-exito">✅ Completar</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">✅ Sin pendientes de transportadora hoy</td></tr>';
}
// =====================================================
// ===== COMBUSTIBLE: KILOMETRAJE Y TANQUEO =====
// =====================================================
async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;
    if (!fecha || !placa || kmManana === null) {
        return alert('⚠️ Complete Fecha, Vehículo y Kilometraje de la Mañana');
    }
    const kmRecorridos = (kmManana !== null && kmTarde !== null) ? (kmTarde - kmManana).toFixed(2) : null;
    await db.collection('kilometraje').add({
        fecha, placa,
        kmManana, kmTarde,
        kmRecorridos,
        colaborador: usuarioActivo.nombre,
        fechaRegistro: new Date()
    });
    alert('✅ Kilometraje guardado');
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
}
async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const cantidad = parseFloat(document.getElementById('cantidadTanqueo').value) || 0;
    const estado = document.getElementById('estadoTanqueo').value;
    if (!fecha || !placa || !cantidad) {
        return alert('⚠️ Complete Fecha, Vehículo y Cantidad');
    }
    await db.collection('tanqueo').add({
        fecha, placa, cantidad, estado,
        colaborador: usuarioActivo.nombre,
        fechaRegistro: new Date()
    });
    alert('✅ Tanqueo registrado');
    document.getElementById('cantidadTanqueo').value = '';
}
// =====================================================
// ===== MANTENIMIENTO VEHICULAR =====
// =====================================================
function cargarListaPlacasMantenimiento() {
    const tb = document.getElementById('listaPlacasMantCuerpo');
    if (!tb) return;
    const todasPlacas = [...new Set([...vehiculosMov.map(v => v.placa), ...vehiculosTransp.map(v => v.placa)])].sort();
    tb.innerHTML = todasPlacas.map(p => {
        const mant = historialMantenimientos.find(h => h.placa === p && h.estado === 'en-taller');
        const estado = mant ? '🔧 En Taller' : '✅ Activo';
        return `<tr><td>${p}</td><td>${estado}</td><td><button class="btn-primario" onclick="cargarFichaVehiculoMant('${p}')">📋 Ver / Editar</button></td></tr>`;
    }).join('');
}
async function cargarFichaVehiculoMant(placa) {
    placaActivaMant = placa;
    document.getElementById('formMantenimiento').classList.remove('oculto');
    document.getElementById('placaMantenimiento').value = placa;
    const snap = await db.collection('mantenimientos').where('placa', '==', placa).orderBy('fechaRegistro', 'desc').get();
    historialMantenimientos = [];
    snap.forEach(d => { historialMantenimientos.push({ id: d.id, ...d.data() }); });
    const ultimo = historialMantenimientos[0] || {};
    document.getElementById('vencimientoSoat').value = ultimo.vencimientoSoat || '';
    document.getElementById('vencimientoTecno').value = ultimo.vencimientoTecnoMecanica || '';
    document.getElementById('ultimoKm').value = ultimo.ultimoKilometraje || '';
    dibujarHistorialMantenimiento();
}
async function guardarDatosVehiculoMant() {
    if (!placaActivaMant) return alert('Seleccione una placa primero');
    const datos = {
        placa: placaActivaMant,
        vencimientoSoat: document.getElementById('vencimientoSoat').value,
        vencimientoTecnoMecanica: document.getElementById('vencimientoTecno').value,
        ultimoKilometraje: parseFloat(document.getElementById('ultimoKm').value) || 0,
        fechaRegistro: new Date(),
        usuarioRegistro: usuarioActivo.usuario
    };
    await db.collection('mantenimientos').add(datos);
    alert('✅ Datos del vehículo guardados');
    cargarFichaVehiculoMant(placaActivaMant);
}
async function enviarVehiculoTaller() {
    if (!placaActivaMant) return alert('Seleccione una placa');
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienLlevo = document.getElementById('quienLlevoVehiculo').value.trim();
    const diagnostico = document.getElementById('diagnosticoTaller').value.trim();
    const costo = parseFloat(document.getElementById('costoReparacion').value) || 0;
    if (!fechaIngreso || !quienLlevo) return alert('⚠️ Complete Fecha y Quien llevó el vehículo');
    await db.collection('mantenimientos').add({
        placa: placaActivaMant,
        tipo: 'ingreso-taller',
        fechaIngreso, quienLlevo, diagnostico, costo,
        estado: 'en-taller',
        fechaRegistro: new Date(),
        usuarioRegistro: usuarioActivo.usuario
    });
    alert('✅ Vehículo enviado a taller — queda inactivo');
    cargarFichaVehiculoMant(placaActivaMant);
}
async function recibirVehiculoTaller() {
    if (!placaActivaMant) return alert('Seleccione una placa');
    const fechaEntrega = document.getElementById('fechaEntregaTaller').value;
    const quienRecibio = document.getElementById('quienRecibioVehiculo').value.trim();
    const observaciones = document.getElementById('obsFinalesTaller').value.trim();
    if (!fechaEntrega || !quienRecibio) return alert('⚠️ Complete Fecha de entrega y Quien recibe');
    await db.collection('mantenimientos').add({
        placa: placaActivaMant,
        tipo: 'salida-taller',
        fechaEntrega, quienRecibio, observaciones,
        estado: 'activo',
        fechaRegistro: new Date(),
        usuarioRegistro: usuarioActivo.usuario
    });
    alert('✅ Vehículo regresó a servicio');
    cargarFichaVehiculoMant(placaActivaMant);
}
function dibujarHistorialMantenimiento() {
    const tb = document.getElementById('historialMantCuerpo');
    if (!tb) return;
    tb.innerHTML = historialMantenimientos.map(h => `
        <tr>
            <td>${h.fechaIngreso || h.fechaEntrega || (h.fechaRegistro?.toDate ? h.fechaRegistro.toDate().toLocaleDateString() : '—')}</td>
            <td>${h.tipo || 'Datos Generales'}</td>
            <td>${h.diagnostico || h.observaciones || '—'}</td>
            <td>${h.costo ? '$' + h.costo.toFixed(2) : '—'}</td>
            <td>${h.estado === 'en-taller' ? '🔧 En Taller' : '✅ Activo'}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">📭 Sin historial</td></tr>';
}
// =====================================================
// ===== LLENADO DE SELECTORES =====
// =====================================================
function llenarSelectoresColaboradores() {
    const activos = colaboradores.filter(c => c.estado !== 'inactivo');
    document.querySelectorAll('select[id^="colaboradorMov"], select[id^="rec-col-"]').forEach(s => {
        const sel = s.value;
        s.innerHTML = '<option value="">-- Seleccione --</option>' + activos.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
        s.value = sel;
    });
}
function llenarSelectoresVehiculos() {
    document.querySelectorAll('#vehiculoMov, #vehiculoKm, #vehiculoTanqueo').forEach(s => {
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">-- Seleccione --</option>' + vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo || 'Sin tipo'}</option>`).join('');
        s.value = sel;
    });
}
function llenarSelectoresVehiculosTransp() {
    const s = document.getElementById('vehiculoTransp');
    if (!s) return;
    const sel = s.value;
    s.innerHTML = '<option value="">-- Seleccione --</option>' + vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    s.value = sel;
}
// =====================================================
// ===== EXPORTAR EXCEL =====
// =====================================================
function exportarExcel() {
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Colaborador: m.colaborador || m.conductor || '—',
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || '',
        CanastillasSalida: m.canastillasSalida,
        CanastillasLlegada: m.canastillasLlegada || 0,
        KilosTotales: m.totalKilos || 0,
        Observaciones: m.observaciones || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, "Movimientos_Canastillas_" + new Date().toLocaleDateString().replaceAll('/', '-') + ".xlsx");
}
// =====================================================
// ===== INICIO AUTOMÁTICO =====
// =====================================================
window.onload = function() {
    const fMov = document.getElementById('fechaMov');
    const fKm = document.getElementById('fechaKm');
    const fTanq = document.getElementById('fechaTanqueo');
    const fTransp = document.getElementById('fechaTransp');
    if (fMov) fMov.valueAsDate = new Date();
    if (fKm) fKm.valueAsDate = new Date();
    if (fTanq) fTanq.valueAsDate = new Date();
    if (fTransp) fTransp.valueAsDate = new Date();
};
// =====================================================
// ===== ADMINISTRACIÓN: USUARIOS Y PERMISOS =====
// =====================================================
async function cargarUsuariosSistema() {
    const tb = document.getElementById('tablaUsuariosAdminCuerpo');
    if (!tb) return;
    const snap = await db.collection('usuarios').get();
    let lista = [];
    snap.forEach(doc => { lista.push({ id: doc.id, ...doc.data() }); });
    usuariosFijos.forEach(u => {
        lista.push({
            id: "FIJO_" + u.usuario,
            usuario: u.usuario,
            nombre: u.nombre,
            rol: u.rol,
            modulos: u.modulos || ['movimientos'],
            esFijo: true
        });
    });
    tb.innerHTML = lista.map(u => `
        <tr>
            <td>${u.usuario}</td>
            <td>${u.nombre || '—'}</td>
            <td>${u.rol === 'admin' ? '👑 Administrador' : '👤 Usuario'}</td>
            <td>${Array.isArray(u.modulos) ? u.modulos.join(', ') : 'Todos'}</td>
            <td>
                ${u.esFijo ? '<span class="text-xs">🔒 Fijo</span>' : `
                    <button class="btn-primario" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editarUsuarioSistema('${u.id}')">✏️ Editar</button>
                    <button class="btn-peligro" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="eliminarUsuarioSistema('${u.id}')">🗑️</button>
                `}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">📭 Sin usuarios registrados</td></tr>';
}
async function crearUsuarioSistema() {
    if (usuarioActivo.rol !== 'admin') return alert('🔒 Solo administrador');
    const usuario = document.getElementById('nuevoUsuario').value.trim().toLowerCase();
    const clave = document.getElementById('nuevaClave').value;
    const nombre = document.getElementById('nombreCompletoUsuario').value.trim();
    const rol = document.getElementById('rolNuevoUsuario').value;
    const modulosSeleccionados = [];
    if (document.getElementById('perm_movimientos')?.checked) modulosSeleccionados.push('movimientos');
    if (document.getElementById('perm_transportadora')?.checked) modulosSeleccionados.push('transportadora');
    if (document.getElementById('perm_combustible')?.checked) modulosSeleccionados.push('combustible');
    if (document.getElementById('perm_mantenimiento')?.checked) modulosSeleccionados.push('mantenimiento');
    if (document.getElementById('perm_informes')?.checked) modulosSeleccionados.push('informes');
    if (document.getElementById('perm_admin')?.checked) modulosSeleccionados.push('administracion');
    if (!usuario || !clave || !nombre) return alert('⚠️ Complete todos los campos obligatorios');
    if (clave.length < 6) return alert('⚠️ La contraseña debe tener al menos 6 caracteres');
    if (modulosSeleccionados.length === 0) return alert('⚠️ Seleccione al menos un módulo permitido');
    try {
        await db.collection('usuarios').add({
            usuario, clave, nombre, rol,
            modulos: modulosSeleccionados,
            fechaCreacion: new Date(),
            creadoPor: usuarioActivo.usuario
        });
        alert('✅ Usuario creado exitosamente');
        document.getElementById('nuevoUsuario').value = '';
        document.getElementById('nuevaClave').value = '';
        document.getElementById('nombreCompletoUsuario').value = '';
        cargarUsuariosSistema();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}
async function editarUsuarioSistema(uid) {
    const nuevoRol = prompt('Ingrese nuevo rol: admin / usuario');
    if (!nuevoRol) return;
    const nuevaClave = prompt('Ingrese nueva contraseña (deje vacío para no cambiar):');
    const nuevosModulos = prompt('Módulos permitidos separados por coma: movimientos,transportadora,combustible,mantenimiento,informes');
    const cambios = { rol: nuevoRol };
    if (nuevaClave) cambios.clave = nuevaClave;
    if (nuevosModulos) cambios.modulos = nuevosModulos.split(',').map(m => m.trim());
    await db.collection('usuarios').doc(uid).update(cambios);
    alert('✅ Usuario actualizado');
    cargarUsuariosSistema();
}
async function eliminarUsuarioSistema(uid) {
    if (!confirm('⚠️ ¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    await db.collection('usuarios').doc(uid).delete();
    alert('✅ Usuario eliminado');
    cargarUsuariosSistema();
}
// =====================================================
// ===== COLABORADORES: AGREGAR, EDITAR, INACTIVAR =====
// =====================================================
async function guardarColaborador() {
    const nombre = document.getElementById('nombreColaborador').value.trim();
    if (!nombre) return alert('Ingrese nombre del colaborador');
    const existe = colaboradores.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (existe) return alert('⚠️ Este colaborador ya se encuentra registrado');
    await db.collection('colaboradores').add({
        nombre,
        estado: 'activo',
        fechaRegistro: new Date(),
        usuarioRegistro: usuarioActivo.usuario
    });
    alert('✅ Colaborador agregado');
    document.getElementById('nombreColaborador').value = '';
}
async function editarColaborador(id) {
    const nuevoNombre = prompt('Nuevo nombre del colaborador:');
    if (!nuevoNombre) return;
    const nuevoEstado = confirm('¿Marcar como inactivo?') ? 'inactivo' : 'activo';
    await db.collection('colaboradores').doc(id).update({
        nombre: nuevoNombre.trim(),
        estado: nuevoEstado
    });
    alert('✅ Colaborador actualizado');
}
async function inactivarColaborador(id) {
    if (!confirm('¿Inactivar este colaborador? Ya no aparecerá en las listas.')) return;
    await db.collection('colaboradores').doc(id).update({ estado: 'inactivo' });
    alert('✅ Colaborador inactivado');
}
// =====================================================
// ===== TIPOS DE VEHÍCULOS =====
// =====================================================
async function agregarTipoVehiculo() {
    const tipo = document.getElementById('nuevoTipoVehiculo').value.trim();
    if (!tipo) return alert('Ingrese tipo de vehículo');
    await db.collection('tipos_vehiculo').add({
        nombre: tipo,
        fechaRegistro: new Date()
    });
    alert('✅ Tipo agregado');
    document.getElementById('nuevoTipoVehiculo').value = '';
}
// =====================================================
// ===== CIERRE DE SESIÓN POR INACTIVIDAD =====
// =====================================================
let temporizadorInactividad;
const TIEMPO_INACTIVO = 60 * 60 * 1000;
function reiniciarTemporizador() {
    clearTimeout(temporizadorInactividad);
    temporizadorInactividad = setTimeout(() => {
        alert('⏰ Cierre de sesión por inactividad. Vuelva a ingresar.');
        cerrarSesion();
    }, TIEMPO_INACTIVO);
}
['mousemove', 'keydown', 'click', 'touchstart'].forEach(evento => {
    document.addEventListener(evento, reiniciarTemporizador);
});
// =====================================================
// ===== BOTÓN ACTUALIZAR DATOS =====
// =====================================================
async function actualizarDatosManual() {
    const btn = document.getElementById('btnActualizarDatos');
    if (btn) btn.textContent = '🔄 Actualizando...';
    await cargarDatosGenerales();
    if (btn) btn.textContent = '🔄 Actualizar Datos';
    console.log('✅ Datos actualizados desde Firebase');
}
// =====================================================
// ===== FILTROS Y BUSQUEDAS =====
// =====================================================
function filtrarMovimientosPorFecha() {
    const fi = document.getElementById('fechaInicioConsulta')?.value;
    const ff = document.getElementById('fechaFinConsulta')?.value;
    if (!fi || !ff) return alert('Seleccione rango de fechas');
    const filtrados = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    const tb = document.getElementById('tablaConsultaResultado');
    if (!tb) return;
    tb.innerHTML = filtrados.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador || m.conductor || '—'}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '—'}</td>
            <td>${m.canastillasSalida}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${m.totalKilos || 0}</td>
        </tr>
    `).join('') || '<tr><td colspan="8" class="text-center">📭 Sin resultados en este rango</td></tr>';
}
// =====================================================
// ===== CALCULADORA DE KILOS EN TIEMPO REAL =====
// =====================================================
function calcularKilos() {
    const valor1 = parseFloat(document.getElementById('calc_kg1')?.value) || 0;
    const valor2 = parseFloat(document.getElementById('calc_kg2')?.value) || 0;
    const operacion = document.getElementById('calc_op')?.value || '+';
    let total = 0;
    if (operacion === '+') total = valor1 + valor2;
    if (operacion === '-') total = valor1 - valor2;
    if (operacion === '*') total = valor1 * valor2;
    if (operacion === '/') total = valor2 !== 0 ? (valor1 / valor2).toFixed(2) : '∞';
    const res = document.getElementById('calc_resultado');
    if (res) res.value = total;
}
function copiarResultadoCalc() {
    const res = document.getElementById('calc_resultado')?.value;
    if (res) {
        document.getElementById('totalKilos').value = res;
        alert('✅ Copiado al total de kilos');
    }
}
// =====================================================
// ===== FIN DEL ARCHIVO =====
// =====================================================
console.log('✅ Sistema cargado completamente — Versión 3.0');
