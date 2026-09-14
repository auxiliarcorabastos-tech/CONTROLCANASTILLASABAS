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
db = firebase.firestore();

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
let mantenimientos = [];
let idEdicion = null;
let idEdicionTransp = null;
let filasRecogida = [];
let placaSeleccionadaMant = null;

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "Javier Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "Daniel Figueroa" },
    { usuario: "jlopez", clave: "123456", rol: "usuario", nombre: "Julieth López" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" },
    { usuario: "jnonato", clave: "123456", rol: "usuario", nombre: "Josefina Nonato" }
];

// =====================================================
// ===== INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usu = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    const msj = document.getElementById('mensajeLogin');
    msj.textContent = '';

    const fijo = usuariosFijos.find(u => u.usuario === usu && u.clave === clave);
    if (fijo) {
        usuarioActivo = { ...fijo, uid: "FIJO_" + fijo.usuario };
        ingresarApp();
        return;
    }

    try {
        const snap = await db.collection('usuarios').get();
        let enc = null;
        snap.forEach(doc => {
            const d = doc.data();
            if (d.usuario === usu && d.clave === clave) {
                enc = { id: doc.id, ...d };
            }
        });
        if (enc) {
            usuarioActivo = enc;
            ingresarApp();
        } else {
            msj.textContent = '⚠️ Usuario o contraseña incorrectos';
        }
    } catch (err) {
        msj.textContent = '❌ Error: ' + err.message;
    }
}

function ingresarApp() {
    document.getElementById('pantallaLogin').classList.add('oculto');
    document.getElementById('pantallaApp').classList.remove('oculto');
    document.getElementById('nombreUsuario').textContent = usuarioActivo.nombre;
    if (usuarioActivo.rol !== "admin") {
        document.getElementById('btnAdmin').classList.add('oculto');
    }
    const hoy = new Date().toISOString().split('T')[0];
    const fechaMov = document.getElementById('fechaMov');
    const fechaTransp = document.getElementById('fechaTransp');
    if (fechaMov) fechaMov.value = hoy;
    if (fechaTransp) fechaTransp.value = hoy;
    cargarDatosGenerales();
}

function cerrarSesion() {
    usuarioActivo = null;
    document.getElementById('pantallaLogin').classList.remove('oculto');
    document.getElementById('pantallaApp').classList.add('oculto');
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';
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

    db.collection('colaboradores').onSnapshot(snap => {
        colaboradores = [];
        snap.forEach(doc => { colaboradores.push({ id: doc.id, ...doc.data() }); });
        rellenarSelectoresColaboradores();
        dibujarTablaColaboradoresAdmin?.();
    });

    db.collection('vehiculos_movimientos').onSnapshot(snap => {
        vehiculosMov = [];
        snap.forEach(doc => { vehiculosMov.push({ id: doc.id, ...doc.data() }); });
        rellenarSelectoresVehiculos();
        dibujarTablaVehiculosMovAdmin?.();
        listarPlacasMantenimiento?.();
    });

    db.collection('vehiculos_transportadora').onSnapshot(snap => {
        vehiculosTransp = [];
        snap.forEach(doc => { vehiculosTransp.push({ id: doc.id, ...doc.data() }); });
        rellenarSelectoresVehiculosTransp();
        dibujarTablaVehiculosTranspAdmin?.();
    });

    db.collection('conductores_transportadora').onSnapshot(snap => {
        conductores = [];
        snap.forEach(doc => { conductores.push({ id: doc.id, ...doc.data() }); });
        rellenarSelectoresConductoresTransp();
    });

    db.collection('kilometraje').onSnapshot(snap => {
        kilometraje = [];
        snap.forEach(doc => { kilometraje.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('tanqueo').onSnapshot(snap => {
        tanqueo = [];
        snap.forEach(doc => { tanqueo.push({ id: doc.id, ...doc.data() }); });
    });

    db.collection('mantenimientos').onSnapshot(snap => {
        mantenimientos = [];
        snap.forEach(doc => { mantenimientos.push({ id: doc.id, placa: doc.id, ...doc.data() }); });
        listarPlacasMantenimiento?.();
    });
}

// =====================================================
// ===== RELLENAR SELECTORES =====
// =====================================================
function rellenarSelectoresColaboradores() {
    const activos = colaboradores.filter(c => c.estado !== "inactivo");
    const opciones = '<option value="">-- Seleccione --</option>' +
        activos.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    ['colaboradorMov', 'quienLlevoVehiculo', 'quienRecibioVehiculo'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = opciones;
    });
}

function rellenarSelectoresVehiculos() {
    const opciones = '<option value="">-- Seleccione --</option>' +
        vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`).join('');
    ['vehiculoMov', 'vehiculoKm', 'vehiculoTanqueo'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = opciones;
    });
}

function rellenarSelectoresVehiculosTransp() {
    const sel = document.getElementById('vehiculoTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccione --</option>' +
        vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`).join('');
}

function rellenarSelectoresConductoresTransp() {
    const sel = document.getElementById('conductorTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccione Conductor --</option>' +
        conductores.filter(c => c.estado !== "inactivo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// =====================================================
// ===== NAVEGACIÓN PESTAÑAS ✅ CORREGIDO EVENT =====
// =====================================================
function cambiarPestaña(nombre, event) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    document.querySelector('.sidebar').classList.add('oculto');
    document.querySelector('.contenido').classList.add('expandido');
    if (nombre === 'mantenimiento') listarPlacasMantenimiento?.();
    if (nombre === 'administracion') dibujarTablaUsuariosAdmin?.();
}

function cambiarSubpestañaMov(nombre, event) {
    document.querySelectorAll('#pest-movimientos .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-movimientos > div[id^="sub-"]').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`sub-${nombre}`).classList.remove('oculto');
}

function cambiarSubpestañaTransp(nombre, event) {
    document.querySelectorAll('#pest-transportadora .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-transportadora > div[id^="sub-"]').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`sub-transp-${nombre}`).classList.remove('oculto');
}

function cambiarSubpestañaCombustible(nombre, event) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-combustible > div[id^="subcomb-"]').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

function cambiarSubAdmin(nombre, event) {
    document.querySelectorAll('#pest-administracion .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#pest-administracion > div[id^="subadmin-"]').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');
}

function cambiarSubFichaMant(nombre, event) {
    document.querySelectorAll('#formMantenimiento .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('#formMantenimiento .subpestaña').forEach(p => p.classList.add('oculto'));
    if (event) event.target.classList.add('activa');
    document.getElementById(`ficha-${nombre}`).classList.remove('oculto');
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('abierto');
}

// =====================================================
// ===== MOVIMIENTOS - CREAR / EDITAR =====
// =====================================================
function limpiarFormularioMovimiento() {
    idEdicion = null;
    filasRecogida = [];
    document.getElementById('colaboradorMov').value = '';
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('horaSalidaMov').value = '';
    document.getElementById('horaLlegadaMov').value = '';
    document.getElementById('canastillasSalidaMov').value = '';
    document.getElementById('canastillasLlegadaMov').value = '';
    document.getElementById('observacionesMov').value = '';
    document.getElementById('tablaRecogidasCuerpo').innerHTML = '';
    document.getElementById('totalCantidadRecogida').value = '0';
    document.getElementById('totalKilosRecogida').value = '0.00';
    document.getElementById('btnGuardarMov').classList.remove('oculto');
    document.getElementById('btnCompletarMov').classList.add('oculto');
}

function agregarFilaRecogida() {
    filasRecogida.push({ tipo: 'canastilla', cantidad: 0, kilos: 0, recogidoA: '' });
    dibujarTablaRecogidas();
}

function dibujarTablaRecogidas() {
    const tb = document.getElementById('tablaRecogidasCuerpo');
    if (!tb) return;
    tb.innerHTML = filasRecogida.map((f, i) => `
        <tr>
            <td>
                <select class="form-input" onchange="filasRecogida[${i}].tipo=this.value">
                    <option value="canastilla" ${f.tipo==='canastilla'?'selected':''}>Canastilla</option>
                    <option value="bulto" ${f.tipo==='bulto'?'selected':''}>Bulto</option>
                    <option value="atado" ${f.tipo==='atado'?'selected':''}>Atado</option>
                    <option value="caja" ${f.tipo==='caja'?'selected':''}>Caja</option>
                    <option value="racimo" ${f.tipo==='racimo'?'selected':''}>Racimo</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-input" value="${f.cantidad}"
                    onchange="filasRecogida[${i}].cantidad=parseFloat(this.value)||0; calcularTotalesRecogida()">
            </td>
            <td>
                <input type="number" step="0.01" class="form-input" value="${f.kilos}"
                    onchange="filasRecogida[${i}].kilos=parseFloat(this.value)||0; calcularTotalesRecogida()">
            </td>
            <td>
                <select class="form-input" onchange="filasRecogida[${i}].recogidoA=this.value">
                    <option value="">-- A quién se recogió --</option>
                    ${colaboradores.filter(c=>c.estado!=='inactivo').map(c=>`<option value="${c.nombre}" ${f.recogidoA===c.nombre?'selected':''}>${c.nombre}</option>`).join('')}
                </select>
            </td>
            <td>
                <button class="btn btn-peligro btn-sm" onclick="filasRecogida.splice(${i},1); dibujarTablaRecogidas(); calcularTotalesRecogida()">🗑️</button>
            </td>
        </tr>
    `).join('');
    calcularTotalesRecogida();
}

function calcularTotalesRecogida() {
    let totalUnidades = 0, totalKilos = 0;
    filasRecogida.forEach(f => {
        totalUnidades += f.cantidad || 0;
        totalKilos += f.kilos || 0;
    });
    document.getElementById('totalCantidadRecogida').value = totalUnidades;
    document.getElementById('totalKilosRecogida').value = totalKilos.toFixed(2);
}

async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const colaborador = document.getElementById('colaboradorMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const horaSalida = document.getElementById('horaSalidaMov').value;
    const horaLlegada = document.getElementById('horaLlegadaMov').value || '';
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaMov').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaMov').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value.trim();

    if (!fecha || !colaborador || !placa || !horaSalida) {
        return alert('⚠️ Complete: Fecha, Colaborador, Placa y Hora de Salida');
    }

    if (!idEdicion && canastillasSalida <= 0) {
        return alert('⚠️ Canastillas de Salida debe ser mayor a 0');
    }

    const totalUnidades = filasRecogida.reduce((s, f) => s + (f.cantidad || 0), 0);
    const totalKilos = filasRecogida.reduce((s, f) => s + (f.kilos || 0), 0);
    const estado = horaLlegada && canastillasLlegada > 0 ? "Completado" : "Pendiente";

    const datos = {
        fecha, colaborador, placa,
        horaSalida, horaLlegada,
        canastillasSalida, canastillasLlegada,
        recogidas: filasRecogida,
        totalUnidades, totalKilos,
        observaciones, estado,
        usuarioRegistro: usuarioActivo.nombre,
        fechaActualizacion: new Date()
    };

    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(datos);
            alert('✅ Movimiento guardado');
        }
        limpiarFormularioMovimiento();
        cambiarSubpestañaMov('hoy');
    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
}

function irAEditarMovimiento(id) {
    cambiarSubpestañaMov('crear');
    setTimeout(() => editarMovimiento(id), 100);
}

function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return alert('⚠️ Movimiento no encontrado');
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('colaboradorMov').value = m.colaborador;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('horaSalidaMov').value = m.horaSalida;
    document.getElementById('horaLlegadaMov').value = m.horaLlegada || '';
    document.getElementById('canastillasSalidaMov').value = m.canastillasSalida || '';
    document.getElementById('canastillasLlegadaMov').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';
    filasRecogida = m.recogidas || [];
    dibujarTablaRecogidas();

    if (m.horaLlegada && m.canastillasLlegada > 0) {
        document.getElementById('btnGuardarMov').classList.add('oculto');
        document.getElementById('btnCompletarMov').classList.remove('oculto');
    } else {
        document.getElementById('btnGuardarMov').classList.remove('oculto');
        document.getElementById('btnCompletarMov').classList.add('oculto');
    }
}
// =====================================================
// ===== DIBUJAR TABLAS MOVIMIENTOS =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const filtro = movimientos.filter(m => m.fecha === hoy);
    const tb = document.getElementById('tablaMovimientosHoyCuerpo');
    if (!tb) return;
    let salidas = 0, llegadas = 0, kilosTotal = 0;
    filtro.forEach(m => {
        salidas += m.canastillasSalida || 0;
        llegadas += m.canastillasLlegada || 0;
        kilosTotal += m.totalKilos || 0;
    });
    const elSal = document.getElementById('movSalidaHoy'); if(elSal) elSal.textContent = salidas;
    const elLleg = document.getElementById('movLlegadaHoy'); if(elLleg) elLleg.textContent = llegadas;
    const elKilos = document.getElementById('movTotalKilosHoy'); if(elKilos) elKilos.textContent = kilosTotal.toFixed(2);
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
    const filtro = movimientos.filter(m => !m.horaLlegada || !m.canastillasLlegada || m.canastillasLlegada === 0);
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
                ${usuarioActivo?.rol==='admin'?`<button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar?')) db.collection('movimientos').doc('${m.id}').delete()">🗑️</button>`:''}
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
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || '';
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaTransp').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaTransp').value) || 0;

    if(!fecha || !conductor || !placa || !horaSalida || canastillasSalida <= 0) {
        return alert('Complete: Fecha, Conductor, Placa, Hora Salida y Canastillas de Salida');
    }

    const datos = {
        fecha, conductor, placa,
        horaSalida, horaLlegada,
        canastillasSalida, canastillasLlegada,
        estado: horaLlegada && canastillasLlegada > 0 ? "Completado" : "Pendiente",
        usuarioRegistro: usuarioActivo.nombre,
        fechaActualizacion: new Date()
    };

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
    let sal = 0, lle = 0;
    filtro.forEach(m => { sal += m.canastillasSalida||0; lle += m.canastillasLlegada||0; });
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
    if(!fecha || !placa || kmManana === null) return alert('Fecha, placa y km mañana son obligatorios');
    const kmRecorridos = (kmTarde && kmManana) ? (kmTarde - kmManana).toFixed(2) : null;
    await db.collection('kilometraje').add({
        fecha, placa, kmManana, kmTarde, kmRecorridos,
        colaborador: usuarioActivo.nombre, fechaRegistro: new Date()
    });
    alert('✅ Kilometraje guardado');
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
}

async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const full = document.getElementById('tanqueFull').checked;
    const porcentaje = parseFloat(document.getElementById('porcentajeTanqueo').value) || 0;
    if(!fecha || !placa) return alert('Fecha y placa son obligatorios');
    await db.collection('tanqueo').add({
        fecha, placa, full, porcentaje,
        quienTanquea: usuarioActivo.nombre, fechaRegistro: new Date()
    });
    alert('✅ Tanqueo guardado');
    document.getElementById('tanqueFull').checked = true;
    document.getElementById('porcentajeTanqueo').value = '';
}

// =====================================================
// ===== MANTENIMIENTO =====
// =====================================================
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
        colaboradores.filter(c => c.estado !== "inactivo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
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
    if(!placaSeleccionadaMant) return alert('Seleccione una placa primero');
    const datos = {
        placa: placaSeleccionadaMant,
        soatVencimiento: document.getElementById('soatVencimiento').value,
        tecnoVencimiento: document.getElementById('tecnoVencimiento').value,
        ultimoKm: parseFloat(document.getElementById('ultimoKmMant').value) || 0,
        fechaActualizacion: new Date()
    };
    await db.collection('mantenimiento').doc(placaSeleccionadaMant).set(datos, { merge: true });
    alert('✅ Datos del vehículo guardados');
    listarPlacasMantenimiento();
}

async function enviarVehiculoATaller() {
    if(!placaSeleccionadaMant) return alert('Seleccione una placa');
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienLlevo = document.getElementById('quienLlevoVehiculo').value.trim();
    const diagnostico = document.getElementById('diagnosticoTaller').value.trim();
    if(!fechaIngreso || !quienLlevo || !diagnostico) {
        return alert('⚠️ Complete: Fecha, Quién llevó y Diagnóstico');
    }
    const registro = {
        fechaIngreso, quienLlevo, diagnostico,
        fechaRetorno: null, quienRecibio: '',
        trabajosRealizados: '', costo: 0,
        estado: "En Taller", fechaRegistro: new Date()
    };
    const docRef = db.collection('mantenimiento').doc(placaSeleccionadaMant);
    const docSnap = await docRef.get();
    let historial = [];
    if(docSnap.exists) historial = docSnap.data().historial || [];
    historial.push(registro);
    await docRef.set({
        placa: placaSeleccionadaMant,
        estado: "En Taller", historial,
        fechaUltimoIngresoTaller: fechaIngreso,
        fechaActualizacion: new Date()
    }, { merge: true });
    alert('✅ Vehículo enviado a Taller — Queda INACTIVO');
    document.getElementById('fechaIngresoTaller').value = '';
    document.getElementById('quienLlevoVehiculo').value = '';
    document.getElementById('diagnosticoTaller').value = '';
    listarPlacasMantenimiento();
}

async function recibirVehiculoDeTaller() {
    if(!placaSeleccionadaMant) return alert('Seleccione una placa');
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
        fechaUltimoRetornoTaller: fechaRetorno,
        fechaActualizacion: new Date()
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
            <td>${!h.fechaRetorno ? `<button class="btn btn-amarillo btn-sm" onclick="cargarRegistroHistorial(${i})">✏️ Cerrar</button>` : `<button class="btn btn-gris btn-sm" onclick="cargarRegistroHistorial(${i})">👁️ Ver</button>`}</td>
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
    if(h.fechaRetorno) {
        document.getElementById('fechaRetornoTaller').value = h.fechaRetorno;
        document.getElementById('quienRecibioVehiculo').value = h.quienRecibio;
        document.getElementById('trabajosRealizados').value = h.trabajosRealizados;
        document.getElementById('costoReparacion').value = h.costo;
    }
}

function cerrarFichaMantenimiento() {
    placaSeleccionadaMant = null;
    document.getElementById('formMantenimiento').classList.add('oculto');
}

// =====================================================
// ===== ADMINISTRACIÓN =====
// =====================================================
function dibujarTablaUsuariosAdmin() {
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
    if(!nombre) return alert('Escriba el nombre');
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
    if(!placa || !tipo) return alert('Complete placa y tipo');
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
            <td><button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar este vehículo?')) db.collection('vehiculos_movimientos').doc('${v.id}').delete()">🗑️ Eliminar</button></td>
        </tr>
    `).join('');
}

async function agregarVehiculoTranspAdmin() {
    const placa = document.getElementById('placaVehiculoTranspAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTranspAdmin').value;
    if(!placa || !tipo) return alert('Complete placa y tipo');
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
            <td><button class="btn btn-peligro btn-sm" onclick="if(confirm('¿Eliminar este vehículo?')) db.collection('vehiculos_transportadora').doc('${v.id}').delete()">🗑️ Eliminar</button></td>
        </tr>
    `).join('');
}

async function agregarConductorTranspAdmin() {
    const nombre = document.getElementById('nombreConductorTranspAdmin').value.trim();
    if(!nombre) return alert('Escriba el nombre');
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
        TotalUnidades: m.totalUnidades || 0,
        TotalKilos: m.totalKilos ? m.totalKilos.toFixed(2) : '0.00',
        Estado: m.estado,
        Observaciones: m.observaciones || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
}
