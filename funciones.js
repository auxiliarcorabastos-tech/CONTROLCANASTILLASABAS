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

// ==================================================
// ===== VARIABLES GLOBALES =====
// ==================================================
let usuarioActivo = null;
let movimientos = [];
let movimientosTransp = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let mantenimientos = [];
let idEdicion = null;
let idEdicionTransp = null;
let filasRecogida = [];

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "JULIETH LOPEZ" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "J. Nonato" }
];

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    let correo = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('clave').value;
    const error = document.getElementById('mensajeLogin');
    error.textContent = '';
    if (!correo.includes('@')) correo += '@correo.com';
    try {
        const usuarioBuscar = correo.split('@')[0];
        const datos = usuariosFijos.find(u => u.usuario === usuarioBuscar || u.usuario + '@correo.com' === correo);
        if (datos && datos.clave === pass) {
            usuarioActivo = { email: correo, ...datos };
            document.getElementById('pantallaLogin').classList.add('oculto');
            document.getElementById('pantallaApp').classList.remove('oculto');
            document.getElementById('nombreUsuario').textContent = datos.nombre;
            if (datos.rol === 'admin') document.getElementById('btnAdmin').classList.remove('oculto');
            await cargarDatosGenerales();
            const hoy = new Date().toISOString().split('T')[0];
            const fechaInput = document.getElementById('fechaMov');
            if (fechaInput) fechaInput.value = hoy;
            const fechaTransp = document.getElementById('fechaTransp');
            if (fechaTransp) fechaTransp.value = hoy;
            return;
        } else {
            error.textContent = "⚠️ Usuario o contraseña incorrectos";
        }
    } catch (e) { error.textContent = "Error: " + e.message; }
}

function cerrarSesion() {
    usuarioActivo = null;
    document.getElementById('pantallaApp').classList.add('oculto');
    document.getElementById('pantallaLogin').classList.remove('oculto');
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';
}

// =====================================================
// ===== MENÚ Y NAVEGACIÓN =====
// =====================================================
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('abierto');
}

function cambiarPestaña(nombre, e) {
    if (e) e.stopPropagation();
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    document.getElementById('sidebar').classList.remove('abierto');
    if (nombre === 'movimientos') { dibujarMovimientosHoy(); dibujarMovimientosPendientes(); }
    if (nombre === 'transportadora') dibujarMovimientosTranspHoy();
    if (nombre === 'mantenimiento') listarPlacasMantenimiento();
}

function cambiarSubpestañaMov(nombre) {
    document.querySelectorAll('#pest-movimientos .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-movimientos > div[id^="sub-"]').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`sub-${nombre}`).classList.remove('oculto');
    if (nombre === 'hoy') dibujarMovimientosHoy();
    if (nombre === 'pendientes') dibujarMovimientosPendientes();
    if (nombre === 'todos') dibujarTodosMovimientos();
    if (nombre === 'crear') {
        const hoy = new Date().toISOString().split('T')[0];
        const f = document.getElementById('fechaMov'); if(f) f.value = hoy;
    }
}

function cambiarSubpestañaTransp(nombre) {
    document.querySelectorAll('#pest-transportadora .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-transportadora > div[id^="sub-transp-"]').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`sub-transp-${nombre}`).classList.remove('oculto');
    if (nombre === 'hoy') dibujarMovimientosTranspHoy();
    if (nombre === 'crear') {
        const hoy = new Date().toISOString().split('T')[0];
        const f = document.getElementById('fechaTransp'); if(f) f.value = hoy;
    }
}

function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

function cambiarSubFichaMant(nombre) {
    document.querySelectorAll('#formMantenimiento .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#formMantenimiento .subpestaña').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`ficha-${nombre}`).classList.remove('oculto');
    if (nombre === 'historial') dibujarHistorialMantenimiento();
}

function cambiarSubAdmin(nombre) {
    document.querySelectorAll('#pest-administracion .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-administracion > div[id^="subadmin-"]').forEach(p => p.classList.add('oculto'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');
    if (nombre === 'colaboradores') dibujarTablaColaboradoresAdmin();
    if (nombre === 'vehmov') dibujarTablaVehiculosMovAdmin();
    if (nombre === 'vehtransp') dibujarTablaVehiculosTranspAdmin();
    if (nombre === 'conductores') dibujarTablaConductoresTranspAdmin();
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
        dibujarTodosMovimientos();
    });
    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').onSnapshot(snap => {
        movimientosTransp = [];
        snap.forEach(doc => { movimientosTransp.push({ id: doc.id, ...doc.data() }); });
        dibujarMovimientosTranspHoy();
    });
    db.collection('colaboradores').orderBy('nombre').onSnapshot(snap => {
        colaboradores = [];
        snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
        llenarSelectColaboradores();
        dibujarTablaColaboradoresAdmin();
    });
    db.collection('vehiculos_movimientos').orderBy('placa').onSnapshot(snap => {
        vehiculosMov = [];
        snap.forEach(doc => { vehiculosMov.push({ id: doc.id, ...doc.data() }); });
        llenarSelectVehiculos();
        dibujarTablaVehiculosMovAdmin();
    });
    db.collection('vehiculos_transportadora').orderBy('placa').onSnapshot(snap => {
        vehiculosTransp = [];
        snap.forEach(doc => { vehiculosTransp.push({ id: doc.id, ...doc.data() }); });
        llenarSelectVehiculosTransp();
        dibujarTablaVehiculosTranspAdmin();
        listarPlacasMantenimiento();
    });
    db.collection('conductores_transportadora').orderBy('nombre').onSnapshot(snap => {
        conductores = [];
        snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
        llenarSelectConductoresTransp();
        dibujarTablaConductoresTranspAdmin();
    });
    db.collection('kilometraje').onSnapshot(snap => {
        kilometraje = [];
        snap.forEach(doc => { kilometraje.push({ id: doc.id, ...doc.data() }); });
    });
    db.collection('tanqueo').onSnapshot(snap => {
        tanqueo = [];
        snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
    });
    db.collection('mantenimiento').onSnapshot(snap => {
        mantenimientos = [];
        snap.forEach(doc => { mantenimientos.push({ id: doc.id, placa: doc.id, ...doc.data() }); });
        listarPlacasMantenimiento();
    });
}

function llenarSelectColaboradores() {
    const sel1 = document.getElementById('colaboradorMov');
    if (sel1) sel1.innerHTML = '<option value="">-- Seleccione --</option>' +
        colaboradores.filter(c => c.estado === "activo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

function llenarSelectVehiculos() {
    const sel1 = document.getElementById('vehiculoMov');
    const sel2 = document.getElementById('vehiculoKm');
    const opt = '<option value="">-- Seleccione --</option>' +
        vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
    if (sel1) sel1.innerHTML = opt;
    if (sel2) sel2.innerHTML = opt;
}

function llenarSelectVehiculosTransp() {
    const sel = document.getElementById('vehiculoTransp');
    if (sel) sel.innerHTML = '<option value="">-- Seleccione --</option>' +
        vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
}

function llenarSelectConductoresTransp() {
    const sel = document.getElementById('conductorTransp');
    if (sel) sel.innerHTML = '<option value="">-- Seleccione --</option>' +
        conductores.filter(c => c.estado === "activo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}
// =====================================================
// ===== MOVIMIENTOS - GUARDAR Y EDITAR =====
// =====================================================
function limpiarFormularioMovimiento() {
    idEdicion = null;
    filasRecogida = [];
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaMov').value = hoy;
    document.getElementById('colaboradorMov').value = '';
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('horaSalidaMov').value = '';
    document.getElementById('canastillasSalidaMov').value = '';
    document.getElementById('horaLlegadaMov').value = '';
    document.getElementById('canastillasLlegadaMov').value = '';
    document.getElementById('observacionesMov').value = '';
    document.getElementById('tablaRecogidasCuerpo').innerHTML = '';
    document.getElementById('totalCantidadRecogida').value = '0';
    document.getElementById('totalKilosRecogida').value = '0.00';
    document.getElementById('tituloFormMov').textContent = '➕ Nuevo Movimiento';
    document.getElementById('btnGuardarMov').classList.remove('oculto');
    document.getElementById('btnCompletarMov').classList.add('oculto');
}

function irAEditarMovimiento(id) {
    cambiarSubpestañaMov('crear');
    setTimeout(() => { editarMovimiento(id); }, 150);
}

function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return alert('⚠️ Movimiento no encontrado');
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('colaboradorMov').value = m.colaborador || '';
    document.getElementById('vehiculoMov').value = m.placa || '';
    document.getElementById('horaSalidaMov').value = m.horaSalida || '';
    document.getElementById('canastillasSalidaMov').value = m.canastillasSalida || '';
    document.getElementById('horaLlegadaMov').value = m.horaLlegada || '';
    document.getElementById('canastillasLlegadaMov').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';
    filasRecogida = m.recogidas || [];
    dibujarTablaRecogida();
    document.getElementById('tituloFormMov').textContent = '✏️ Editar Movimiento';
    if (m.horaLlegada && m.canastillasLlegada > 0) {
        document.getElementById('btnGuardarMov').classList.add('oculto');
        document.getElementById('btnCompletarMov').classList.remove('oculto');
    } else {
        document.getElementById('btnGuardarMov').classList.remove('oculto');
        document.getElementById('btnCompletarMov').classList.add('oculto');
    }
}

async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const colaborador = document.getElementById('colaboradorMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const horaSalida = document.getElementById('horaSalidaMov').value;
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaMov').value) || 0;
    const horaLlegada = document.getElementById('horaLlegadaMov').value || null;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaMov').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value;

    if (!fecha || !colaborador || !placa || !horaSalida) {
        return alert('⚠️ Complete Fecha, Colaborador, Placa y Hora de Salida');
    }

    // ✅ YA NO SE BLOQUEA CON 0 CANASTILLAS DE SALIDA
    if (canastillasSalida < 0) {
        return alert('⚠️ Las canastillas no pueden ser negativas');
    }

    const totalCanastillas = filasRecogida.reduce((s, f) => s + (f.cantidad || 0), 0);
    const totalKilos = filasRecogida.reduce((s, f) => s + (f.kilos || 0), 0);
    const estado = (horaLlegada && canastillasLlegada >= 0) ? 'Completado' : 'Pendiente';

    const datos = {
        fecha, colaborador, placa, horaSalida, canastillasSalida,
        horaLlegada, canastillasLlegada, totalCanastillas, totalKilos,
        recogidas: filasRecogida, observaciones, estado,
        usuarioRegistro: usuarioActivo.nombre,
        fechaActualizacion: new Date()
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

// =====================================================
// ===== TABLA DE RECOGIDAS =====
// =====================================================
function agregarFilaRecogida() {
    filasRecogida.push({ tipo: 'Canastilla', cantidad: 0, kilos: 0, recogidoA: '' });
    dibujarTablaRecogida();
}

function quitarFilaRecogida(indice) {
    filasRecogida.splice(indice, 1);
    dibujarTablaRecogida();
}

function dibujarTablaRecogida() {
    const tb = document.getElementById('tablaRecogidasCuerpo');
    tb.innerHTML = filasRecogida.map((f, i) => `
        <tr>
            <td>
                <select onchange="filasRecogida[${i}].tipo=this.value; recalcularTotales();">
                    <option ${f.tipo==='Canastilla'?'selected':''}>Canastilla</option>
                    <option ${f.tipo==='Bulto'?'selected':''}>Bulto</option>
                    <option ${f.tipo==='Atado'?'selected':''}>Atado</option>
                    <option ${f.tipo==='Caja'?'selected':''}>Caja</option>
                    <option ${f.tipo==='Racimo'?'selected':''}>Racimo</option>
                </select>
            </td>
            <td><input type="number" value="${f.cantidad||''}" onchange="filasRecogida[${i}].cantidad=parseInt(this.value)||0; recalcularTotales();" style="width:60px;"></td>
            <td><input type="number" step="0.01" value="${f.kilos||''}" onchange="filasRecogida[${i}].kilos=parseFloat(this.value)||0; recalcularTotales();" style="width:70px;"></td>
            <td><input type="text" value="${f.recogidoA||''}" onchange="filasRecogida[${i}].recogidoA=this.value;" placeholder="Nombre"></td>
            <td><button class="btn btn-peligro btn-sm" onclick="quitarFilaRecogida(${i})">✖</button></td>
        </tr>
    `).join('');
    recalcularTotales();
}

function recalcularTotales() {
    const totalCan = filasRecogida.reduce((s, f) => s + (f.cantidad || 0), 0);
    const totalKg = filasRecogida.reduce((s, f) => s + (f.kilos || 0), 0);
    document.getElementById('totalCantidadRecogida').value = totalCan;
    document.getElementById('totalKilosRecogida').value = totalKg.toFixed(2);
}

// =====================================================
// ===== DIBUJAR TABLAS MOVIMIENTOS =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const filtro = movimientos.filter(m => m.fecha === hoy);
    const tb = document.getElementById('tablaMovimientosHoyCuerpo');
    if (!tb) return;
    let sal = 0, lle = 0, kil = 0;
    filtro.forEach(m => { sal += m.canastillasSalida || 0; lle += m.canastillasLlegada || 0; kil += m.totalKilos || 0; });
    const elSal = document.getElementById('movSalidaHoy'); if(elSal) elSal.textContent = sal;
    const elLle = document.getElementById('movLlegadaHoy'); if(elLle) elLle.textContent = lle;
    const elKil = document.getElementById('movTotalKilosHoy'); if(elKil) elKil.textContent = kil.toFixed(2);
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '—'}</td>
            <td>${m.canastillasSalida || 0}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${(m.totalKilos||0).toFixed(2)}</td>
            <td><button class="btn btn-amarillo btn-sm" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button></td>
        </tr>
    `).join('') || '<tr><td colspan="9" class="text-center">📭 Sin movimientos hoy</td></tr>';
}

function dibujarMovimientosPendientes() {
    const filtro = movimientos.filter(m => !m.horaLlegada || m.canastillasLlegada === 0);
    const tb = document.getElementById('tablaPendientesCuerpo');
    if (!tb) return;
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador}</td>
            <td>${m.horaSalida}</td>
            <td><span class="text-yellow-600 font-semibold">⏳ Pendiente</span></td>
            <td>${m.canastillasSalida || 0}</td>
            <td><button class="btn btn-amarillo btn-sm" onclick="irAEditarMovimiento('${m.id}')">✅ Completar</button></td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">✅ Sin movimientos pendientes</td></tr>';
}

function dibujarTodosMovimientos() {
    const tb = document.getElementById('tablaTodosMovimientosCuerpo');
    if (!tb) return;
    tb.innerHTML = movimientos.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '—'}</td>
            <td>${m.canastillasSalida || 0}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${(m.totalKilos||0).toFixed(2)}</td>
            <td>${m.estado==='Completado'?'✅ Completado':'⏳ Pendiente'}</td>
            <td>
                <button class="btn btn-primario btn-sm" onclick="irAEditarMovimiento('${m.id}')">✏️</button>
                ${usuarioActivo?.rol==='admin'?`<button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar este movimiento?')) db.collection('movimientos').doc('${m.id}').delete()">🗑️</button>`:''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="10" class="text-center">📭 Sin movimientos registrados</td></tr>';
}

// =====================================================
// ===== TRANSPORTADORA =====
// =====================================================
async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if(!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
}

async function agregarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if(!nombre) return alert('Escriba el nombre');
    await db.collection('conductores_transportadora').add({ nombre, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaTransp').value) || 0;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || null;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaTransp').value) || 0;

    if(!fecha || !conductor || !placa || !horaSalida) {
        return alert('⚠️ Complete Fecha, Conductor, Placa y Hora de Salida');
    }
    if (canastillasSalida < 0) {
        return alert('⚠️ Las canastillas no pueden ser negativas');
    }

    const estado = (horaLlegada && canastillasLlegada >= 0) ? 'Completado' : 'Pendiente';
    const datos = { fecha, conductor, placa, horaSalida, canastillasSalida, horaLlegada, canastillasLlegada, estado, usuarioRegistro: usuarioActivo.nombre, fechaActualizacion: new Date() };

    if(idEdicionTransp) {
        await db.collection('movimientos_transportadora').doc(idEdicionTransp).update(datos);
        alert('✅ Movimiento actualizado');
    } else {
        await db.collection('movimientos_transportadora').add(datos);
        alert('✅ Movimiento guardado');
    }
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canastillasSalidaTransp').value = '';
    document.getElementById('canastillasLlegadaTransp').value = '';
    idEdicionTransp = null;
}

function dibujarMovimientosTranspHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const filtro = movimientosTransp.filter(m => m.fecha === hoy);
    const tb = document.getElementById('tablaTranspHoyCuerpo');
    if(!tb) return;
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.conductor}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada||'—'}</td>
            <td>${m.canastillasSalida||0}</td>
            <td>${m.canastillasLlegada||0}</td>
            <td>${m.estado==='Completado'?'✅':'⏳'}</td>
        </tr>
    `).join('') || '<tr><td colspan="8" class="text-center">📭 Sin movimientos hoy</td></tr>';
}

// =====================================================
// ===== COMBUSTIBLE =====
// =====================================================
async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;
    if(!fecha || !placa || kmManana === null) return alert('⚠️ Fecha, placa y km mañana son obligatorios');
    const kmRecorridos = (kmTarde && kmManana) ? (kmTarde - kmManana).toFixed(2) : null;
    await db.collection('kilometraje').add({ fecha, placa, kmManana, kmTarde, kmRecorridos, colaborador: usuarioActivo.nombre, fechaRegistro: new Date() });
    alert('✅ Kilometraje guardado');
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
}

async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const full = document.getElementById('tanqueFull').checked;
    const porcentaje = parseFloat(document.getElementById('porcentajeTanqueo').value) || 0;
    if(!fecha || !placa) return alert('⚠️ Fecha y placa son obligatorios');
    await db.collection('tanqueo').add({ fecha, placa, full, porcentaje, quienTanquea: usuarioActivo.nombre, fechaRegistro: new Date() });
    alert('✅ Tanqueo guardado');
    document.getElementById('tanqueFull').checked = true;
    document.getElementById('porcentajeTanqueo').value = '';
}

// =====================================================
// ===== MANTENIMIENTO =====
// =====================================================
let placaSeleccionadaMant = null;

function listarPlacasMantenimiento() {
    const tb = document.getElementById('listaPlacasMantCuerpo');
    if(!tb) return;
    const todasPlacas = [...vehiculosMov, ...vehiculosTransp];
    const hoy = new Date().toISOString().split('T')[0];
    tb.innerHTML = todasPlacas.map(v => {
        const doc = mantenimientos.find(m => m.placa === v.placa);
        const enTaller = doc?.estado === "En Taller";
        const vencSoat = doc?.soatVencimiento;
        const vencTecno = doc?.tecnoVencimiento;
        const alertaSoat = vencSoat && vencSoat < hoy ? ' ❌' : '';
        const alertaTecno = vencTecno && vencTecno < hoy ? ' ❌' : '';
        return `
            <tr>
                <td class="font-bold">${v.placa}</td>
                <td>${v.tipo || '—'}</td>
                <td>${enTaller ? '<span class="text-yellow-600 font-semibold">🔧 En Taller</span>' : '<span class="text-green-600 font-semibold">✅ Activo</span>'}</td>
                <td>${vencSoat || '—'}${alertaSoat}</td>
                <td>${vencTecno || '—'}${alertaTecno}</td>
                <td><button class="btn btn-primario btn-sm" onclick="cargarFichaMantenimiento('${v.placa}')">📋 Ver / Editar</button></td>
            </tr>
        `;
    }).join('');
}

async function cargarFichaMantenimiento(placa) {
    placaSeleccionadaMant = placa;
    document.getElementById('placaMant').textContent = placa;
    document.getElementById('formMantenimiento').classList.remove('oculto');
    const selLlevo = document.getElementById('quienLlevoVehiculo');
    const selRecibio = document.getElementById('quienRecibioVehiculo');
    const opcionesColab = '<option value="">-- Seleccione --</option>' +
        colaboradores.filter(c => c.estado === "activo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    if(selLlevo) selLlevo.innerHTML = opcionesColab;
    if(selRecibio) selRecibio.innerHTML = opcionesColab;

    const doc = mantenimientos.find(m => m.placa === placa);
    if(doc) {
        document.getElementById('soatVencimiento').value = doc.soatVencimiento || '';
        document.getElementById('tecnoVencimiento').value = doc.tecnoVencimiento || '';
        document.getElementById('ultimoKmMant').value = doc.ultimoKm || '';
        document.getElementById('costoTotalMant').value = doc.costoTotal || 0;
    } else {
        document.getElementById('soatVencimiento').value = '';
        document.getElementById('tecnoVencimiento').value = '';
        document.getElementById('ultimoKmMant').value = '';
        document.getElementById('costoTotalMant').value = 0;
    }
    cambiarSubFichaMant('general');
}

async function guardarDatosGeneralesVehiculo() {
    if(!placaSeleccionadaMant) return alert('⚠️ Seleccione una placa primero');
    const datos = {
        soatVencimiento: document.getElementById('soatVencimiento').value,
        tecnoVencimiento: document.getElementById('tecnoVencimiento').value,
        ultimoKm: parseFloat(document.getElementById('ultimoKmMant').value) || 0,
        fechaActualizacion: new Date()
    };
    await db.collection('mantenimiento').doc(placaSeleccionadaMant).set(datos, { merge: true });
    alert('✅ Datos guardados');
    listarPlacasMantenimiento();
}

async function enviarVehiculoATaller() {
    if(!placaSeleccionadaMant) return alert('⚠️ Seleccione una placa');
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienLlevo = document.getElementById('quienLlevoVehiculo').value.trim();
    const diagnostico = document.getElementById('diagnosticoTaller').value.trim();
    if(!fechaIngreso || !quienLlevo || !diagnostico) {
        return alert('⚠️ Complete: Fecha, Quién llevó y Diagnóstico');
    }
    const registro = {
        fechaIngreso, quienLlevo, diagnostico,
        fechaRetorno: null, quienRecibio: '', trabajosRealizados: '', costo: 0,
        estado: "En Taller", fechaRegistro: new Date()
    };
    const docRef = db.collection('mantenimiento').doc(placaSeleccionadaMant);
    const docSnap = await docRef.get();
    let historial = [];
    if(docSnap.exists) historial = docSnap.data().historial || [];
    historial.push(registro);
    await docRef.set({
        placa: placaSeleccionadaMant, estado: "En Taller", historial,
        fechaUltimoIngresoTaller: fechaIngreso, fechaActualizacion: new Date()
    }, { merge: true });
    alert('✅ Vehículo enviado a Taller — Queda INACTIVO');
    document.getElementById('fechaIngresoTaller').value = '';
    document.getElementById('quienLlevoVehiculo').value = '';
    document.getElementById('diagnosticoTaller').value = '';
    listarPlacasMantenimiento();
}

async function recibirVehiculoDeTaller() {
    if(!placaSeleccionadaMant) return alert('⚠️ Seleccione una placa');
    const fechaRetorno = document.getElementById('fechaRetornoTaller').value;
    const quienRecibio = document.getElementById('quienRecibioVehiculo').value.trim();
    const trabajos = document.getElementById('trabajosRealizados').value.trim();
    const costo = parseFloat(document.getElementById('costoReparacion').value) || 0;
    if(!fechaRetorno || !quienRecibio || !trabajos) {
        return alert('⚠️ Complete: Fecha Retorno, Quién Recibió y Trabajos Realizados');
    }
    const docRef = db.collection('mantenimiento').doc(placaSeleccionadaMant);
    const docSnap = await docRef.get();
    if(!docSnap.exists) return alert('⚠️ No hay registro de ingreso a taller');
    const datos = docSnap.data();
    const historial = datos.historial || [];
    const ultimo = historial.filter(h => !h.fechaRetorno).pop();
    if(!ultimo) return alert('⚠️ No hay ingreso pendiente por cerrar');
    ultimo.fechaRetorno = fechaRetorno;
    ultimo.quienRecibio = quienRecibio;
    ultimo.trabajosRealizados = trabajos;
    ultimo.costo = costo;
    const costoTotal = (datos.costoTotal || 0) + costo;
    await docRef.set({
        estado: "Activo", historial, costoTotal,
        ultimoKm: parseFloat(document.getElementById('ultimoKmMant').value) || 0,
        fechaUltimoRetornoTaller: fechaRetorno, fechaActualizacion: new Date()
    }, { merge: true });
    alert('✅ Vehículo recibido de Taller — Queda ACTIVO');
    document.getElementById('fechaRetornoTaller').value = '';
    document.getElementById('quienRecibioVehiculo').value = '';
    document.getElementById('trabajosRealizados').value = '';
    document.getElementById('costoReparacion').value = '';
    document.getElementById('costoTotalMant').value = costoTotal.toFixed(2);
    listarPlacasMantenimiento();
}

function dibujarHistorialMantenimiento() {
    const tb = document.getElementById('historialMantCuerpo');
    if(!tb || !placaSeleccionadaMant) return;
    const doc = mantenimientos.find(m => m.placa === placaSeleccionadaMant);
    const historial = doc?.historial || [];
    if(historial.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center py-3">📭 Sin historial de mantenimiento</td></tr>';
        return;
    }
    tb.innerHTML = historial.map((h, i) => `
        <tr>
            <td>${h.fechaIngreso}</td>
            <td>${h.quienLlevo}</td>
            <td style="max-width:150px; font-size:0.85rem;">${h.diagnostico}</td>
            <td>${h.fechaRetorno || '🔧 En Taller'}</td>
            <td>${h.quienRecibio || '—'}</td>
            <td>${h.costo ? '$' + h.costo.toFixed(2) : '—'}</td>
            <td>${!h.fechaRetorno ? `<button class="btn btn-amarillo btn-sm" onclick="cargarRegistroHistorial(${i})">✏️ Cerrar</button>` : `<button class="btn btn-gris btn-sm">👁️ Ver</button>`}</td>
        </tr>
    `).join('');
}

function cargarRegistroHistorial(indice) {
    const doc = mantenimientos.find(m => m.placa === placaSeleccionadaMant);
    const historial = doc?.historial || [];
    const h = historial[indice];
    if(!h) return;
    cambiarSubFichaMant('taller');
    document.getElementById('fechaIngresoTaller').value = h.fechaIngreso;
    document.getElementById('quienLlevoVehiculo').value = h.quienLlevo;
    document.getElementById('diagnosticoTaller').value = h.diagnostico;
}

function cerrarFichaMantenimiento() {
    placaSeleccionadaMant = null;
    document.getElementById('formMantenimiento').classList.add('oculto');
}

// =====================================================
// ===== ADMINISTRACIÓN =====
// =====================================================
function dibujarTablaUsuariosAdminCuerpo() {
    const tb = document.getElementById('tablaUsuariosAdminCuerpo');
    if(!tb) return;
    tb.innerHTML = usuariosFijos.map(u => `
        <tr>
            <td>${u.usuario}</td>
            <td>${u.nombre}</td>
            <td><code>${u.clave}</code></td>
            <td>${u.rol}</td>
            <td>✅ Activo</td>
        </tr>
    `).join('');
}

async function guardarColaborador() {
    const nombre = document.getElementById('nombreColaborador').value.trim();
    if(!nombre) return alert('⚠️ Escriba el nombre');
    const existe = colaboradores.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if(existe) return alert('⚠️ Este colaborador ya existe');
    await db.collection('colaboradores').add({ nombre, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('nombreColaborador').value = '';
    alert('✅ Colaborador guardado');
}

async function dibujarTablaColaboradoresAdmin() {
    const tb = document.getElementById('tablaColaboradoresAdminCuerpo');
    if(!tb) return;
    tb.innerHTML = colaboradores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.estado === "activo" ? "✅ Activo" : "❌ Inactivo"}</td>
            <td>
                <button class="btn ${c.estado==='activo'?'btn-peligro':'btn-exito'} btn-sm" onclick="cambiarEstadoColaborador('${c.id}', '${c.estado==='activo'?'inactivo':'activo'}')">
                    ${c.estado==='activo'?'❌ Inactivar':'✅ Activar'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function cambiarEstadoColaborador(id, nuevoEstado) {
    await db.collection('colaboradores').doc(id).update({ estado: nuevoEstado });
}

async function agregarVehiculoMovAdmin() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    if(!placa || !tipo) return alert('⚠️ Complete placa y tipo');
    const existe = vehiculosMov.find(v => v.placa === placa);
    if(existe) return alert('⚠️ Esta placa ya existe');
    await db.collection('vehiculos_movimientos').add({ placa, tipo, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('placaVehiculoMov').value = '';
    alert('✅ Vehículo agregado');
}

async function dibujarTablaVehiculosMovAdmin() {
    const tb = document.getElementById('tablaVehiculosMovAdminCuerpo');
    if(!tb) return;
    tb.innerHTML = vehiculosMov.map(v => `
        <tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td><button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar?')) db.collection('vehiculos_movimientos').doc('${v.id}').delete()">🗑️</button></td>
        </tr>
    `).join('');
}

async function agregarVehiculoTranspAdmin() {
    const placa = document.getElementById('placaVehiculoTranspAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTranspAdmin').value;
    if(!placa || !tipo) return alert('⚠️ Complete placa y tipo');
    const existe = vehiculosTransp.find(v => v.placa === placa);
    if(existe) return alert('⚠️ Esta placa ya existe');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTranspAdmin').value = '';
    alert('✅ Vehículo agregado');
}

async function dibujarTablaVehiculosTranspAdmin() {
    const tb = document.getElementById('tablaVehiculosTranspAdminCuerpo');
    if(!tb) return;
    tb.innerHTML = vehiculosTransp.map(v => `
        <tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td><button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar?')) db.collection('vehiculos_transportadora').doc('${v.id}').delete()">🗑️</button></td>
        </tr>
    `).join('');
}

async function agregarConductorTranspAdmin() {
    const nombre = document.getElementById('nombreConductorTranspAdmin').value.trim();
    if(!nombre) return alert('⚠️ Escriba el nombre');
    const existe = conductores.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if(existe) return alert('⚠️ Este conductor ya existe');
    await db.collection('conductores_transportadora').add({ nombre, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('nombreConductorTranspAdmin').value = '';
    alert('✅ Conductor agregado');
}

async function dibujarTablaConductoresTranspAdmin() {
    const tb = document.getElementById('tablaConductoresTranspAdminCuerpo');
    if(!tb) return;
    tb.innerHTML = conductores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.estado === "activo" ? "✅ Activo" : "❌ Inactivo"}</td>
            <td>
                <button class="btn ${c.estado==='activo'?'btn-peligro':'btn-exito'} btn-sm" onclick="cambiarEstadoConductorTransp('${c.id}', '${c.estado==='activo'?'inactivo':'activo'}')">
                    ${c.estado==='activo'?'❌ Inactivar':'✅ Activar'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function cambiarEstadoConductorTransp(id, nuevoEstado) {
    await db.collection('conductores_transportadora').doc(id).update({ estado: nuevoEstado });
}

// =====================================================
// ===== EXPORTAR EXCEL =====
// =====================================================
function exportarExcel() {
    if(movimientos.length === 0) return alert('📭 Sin datos para exportar');
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Colaborador: m.colaborador,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || '',
        CanastillasSalida: m.canastillasSalida || 0,
        CanastillasLlegada: m.canastillasLlegada || 0,
        TotalUnidades: m.totalCanastillas || 0,
        TotalKilos: m.totalKilos ? m.totalKilos.toFixed(2) : '0.00',
        Estado: m.estado,
        Observaciones: m.observaciones || ''
    }));
        const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Excel descargado correctamente');
}

// =====================================================
// ===== FIN DEL ARCHIVO =====
// =====================================================
