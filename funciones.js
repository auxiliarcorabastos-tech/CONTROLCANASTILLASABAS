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
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let historialMantenimientos = [];
let datosVehiculos = [];
let tiposVehiculo = ['Moto', 'Vehículo de Tracción Humana (VTH)', 'Carguero', 'Camión', 'Otro'];
let idEdicion = null;
let idEdicionTransp = null;
let filtroEstadoMov = 'todos';
let placaSeleccionada = null;
let filasRecogida = [];
let tiempoActualizacion = null;
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };

// =====================================================
// ===== 💾 PROTEGER FORMULARIO DE ACTUALIZACIONES =====
// =====================================================
let datosGuardadosFormulario = {};

function guardarDatosFormulario() {
    datosGuardadosFormulario = {
        fecha: document.getElementById('fecha')?.value || '',
        placa: document.getElementById('vehiculoMov')?.value || '',
        conductor: document.getElementById('colaboradorConductor')?.value || '',
        horaSalida: document.getElementById('horaSalida')?.value || '',
        horaLlegada: document.getElementById('horaLlegada')?.value || '',
        canSalida: document.getElementById('canSalidaTotal')?.value || '',
        observaciones: document.getElementById('observaciones')?.value || '',
        filasRecogidas: filasRecogida.length > 0 ? JSON.parse(JSON.stringify(filasRecogida)) : []
    };
}

function restaurarDatosFormulario() {
    if (!datosGuardadosFormulario.placa && !datosGuardadosFormulario.conductor && filasRecogida.length === 0) return;
    if (datosGuardadosFormulario.fecha) document.getElementById('fecha').value = datosGuardadosFormulario.fecha;
    if (datosGuardadosFormulario.placa) document.getElementById('vehiculoMov').value = datosGuardadosFormulario.placa;
    if (datosGuardadosFormulario.conductor) document.getElementById('colaboradorConductor').value = datosGuardadosFormulario.conductor;
    if (datosGuardadosFormulario.horaSalida) document.getElementById('horaSalida').value = datosGuardadosFormulario.horaSalida;
    if (datosGuardadosFormulario.horaLlegada) document.getElementById('horaLlegada').value = datosGuardadosFormulario.horaLlegada;
    if (datosGuardadosFormulario.canSalida) document.getElementById('canSalidaTotal').value = datosGuardadosFormulario.canSalida;
    if (datosGuardadosFormulario.observaciones) document.getElementById('observaciones').value = datosGuardadosFormulario.observaciones;
    if (datosGuardadosFormulario.filasRecogidas?.length > 0) {
        filasRecogida = datosGuardadosFormulario.filasRecogidas;
        dibujarListaRecogidas();
        recalcularTotalesRecogida();
    }
}

// =====================================================
// ===== 🔑 USUARIOS FIJOS =====
// =====================================================
const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", permisos: { movimientos: true, transportadora: false, combustible: false, mantenimientos: false, informes: true, admin: false } }
];

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
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
        const snap = await db.collection('usuarios').get();
        let enc = null;
        snap.forEach(doc => {
            const u = doc.data();
            if ((u.usuario === usu || u.email === usu) && u.clave === clave) {
                enc = { uid: doc.id, ...u };
            }
        });
        if (enc) {
            usuarioActivo = enc;
            await finalizarLogin();
            return;
        }
        error.textContent = '❌ Usuario no registrado';
    } catch (e) {
        error.textContent = '❌ Error: ' + e.message;
    }
}

async function finalizarLogin() {
    document.getElementById('modalLogin').classList.add('oculto');
    document.querySelector('.contenedor-principal').classList.remove('oculto');
    if (usuarioActivo.rol === 'admin') {
        document.getElementById('btnAdmin').classList.remove('oculto');
    }
    if (usuarioActivo.permisos) {
        const mods = {
            movimientos: 'movimientos',
            transportadora: 'transportadora',
            combustible: 'combustible',
            mantenimientos: 'mantenimientos',
            informes: 'informes',
            admin: 'admin'
        };
        Object.entries(mods).forEach(([perm, id]) => {
            if (!usuarioActivo.permisos[perm]) {
                document.querySelector(`button[onclick="cambiarPestaña('${id}')"]`)?.classList.add('oculto');
            }
        });
    }
    await cargarDatosCompleto();
    iniciarActualizacionAutomatica();
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('fechaIngreso').valueAsDate = new Date();
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        usuarioActivo = null;
        filasRecogida = [];
        document.getElementById('modalLogin').classList.remove('oculto');
        document.querySelector('.contenedor-principal').classList.add('oculto');
        document.getElementById('correoLogin').value = '';
        document.getElementById('passLogin').value = '';
        document.getElementById('mensajeError').textContent = '';
    }
}

// =====================================================
// ===== 🔄 CARGAR TODOS LOS DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosCompleto() {
    guardarDatosFormulario();

    const [snapMov, snapCol, snapVehMov, snapVehTransp, snapCond, snapKm, snapTanq, snapMant, snapDatVeh] = await Promise.all([
        db.collection('movimientos').orderBy('fecha', 'desc').get(),
        db.collection('colaboradores').get(),
        db.collection('vehiculos_movimientos').get(),
        db.collection('vehiculos_transportadora').get(),
        db.collection('conductores_transportadora').get(),
        db.collection('kilometraje').orderBy('fecha', 'desc').get(),
        db.collection('tanqueo').orderBy('fecha', 'desc').get(),
        db.collection('historial_mantenimientos').orderBy('fechaIngreso', 'desc').get(),
        db.collection('datos_vehiculos').get()
    ]);

    movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));
    colaboradores = snapCol.docs.map(d => ({ id: d.id, ...d.data() }));
    vehiculosMov = snapVehMov.docs.map(d => ({ id: d.id, ...d.data() }));
    vehiculosTransp = snapVehTransp.docs.map(d => ({ id: d.id, ...d.data() }));
    conductores = snapCond.docs.map(d => ({ id: d.id, ...d.data() }));
    kilometraje = snapKm.docs.map(d => ({ id: d.id, ...d.data() }));
    tanqueo = snapTanq.docs.map(d => ({ id: d.id, ...d.data() }));
    historialMantenimientos = snapMant.docs.map(d => ({ id: d.id, ...d.data() }));
    datosVehiculos = snapDatVeh.docs.map(d => ({ id: d.id, ...d.data() }));

    llenarSelects();
    llenarSelectsTransportadora();
    dibujarListaMovimientos();
    dibujarListaMovimientosTransp();
    dibujarPendientesKilometraje();
    dibujarListaPlacasMant();
    if (placaSeleccionada) verHistorialVehiculo(placaSeleccionada);

    restaurarDatosFormulario();
    document.getElementById("textoUltimaActualizacion").textContent = "Última: " + new Date().toLocaleTimeString();
}

async function actualizarInformacion() {
    await cargarDatosCompleto();
    alert('✅ Datos actualizados');
}

function iniciarActualizacionAutomatica() {
    if (tiempoActualizacion) clearInterval(tiempoActualizacion);
    tiempoActualizacion = setInterval(() => {
        if (!usuarioActivo) return;
        const formActivo = 
            document.getElementById('vehiculoMov')?.value ||
            document.getElementById('colaboradorConductor')?.value ||
            filasRecogida.length > 0 ||
            document.getElementById('placaVehiculoMov')?.value;
        if (!formActivo) {
            cargarDatosCompleto();
        }
    }, 10000);
}

// =====================================================
// ===== 📋 LLENAR SELECTS CON FILTRO DISPONIBLES =====
// =====================================================
function cambiarFiltroMovimientos(estado) {
    filtroEstadoMov = estado;
    document.querySelectorAll('.btn-filtro-mov').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    llenarSelects();
    dibujarListaMovimientos();
}

function llenarSelects() {
    const selVeh = document.getElementById('vehiculoMov');
    const selCond = document.getElementById('colaboradorConductor');
    const selKmVeh = document.getElementById('vehiculoKm');
    const selKmCol = document.getElementById('quienRegistraKm');
    const selTanqVeh = document.getElementById('vehiculoTanqueo');
    const selTanqCol = document.getElementById('quienTanquea');

    const placasEnRuta = movimientos.filter(m => !m.horaLlegada).map(m => m.placa);
    const colsEnRuta = movimientos.filter(m => !m.horaLlegada).map(m => m.colaboradorConductor);

    let listaVeh = vehiculosMov.filter(v => v.estado !== 'inactivo');
    let listaCol = colaboradores.filter(c => (c.estado || 'activo') === 'activo');

    if (filtroEstadoMov === 'disponibles') {
        listaVeh = listaVeh.filter(v => !placasEnRuta.includes(v.placa));
        listaCol = listaCol.filter(c => !colsEnRuta.includes(c.nombre));
    } else if (filtroEstadoMov === 'enruta') {
        listaVeh = listaVeh.filter(v => placasEnRuta.includes(v.placa));
        listaCol = listaCol.filter(c => colsEnRuta.includes(c.nombre));
    }

    const optCol = listaCol.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const optVeh = listaVeh.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    const optVehTodo = vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    const optColTodo = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

    if (selVeh) selVeh.innerHTML = '<option value="">Seleccione vehículo...</option>' + optVeh;
    if (selCond) selCond.innerHTML = '<option value="">Seleccione conductor...</option>' + optCol;
    if (selKmVeh) selKmVeh.innerHTML = '<option value="">Seleccione placa...</option>' + optVehTodo;
    if (selKmCol) selKmCol.innerHTML = '<option value="">Seleccione...</option>' + optColTodo;
    if (selTanqVeh) selTanqVeh.innerHTML = '<option value="">Seleccione placa...</option>' + optVehTodo;
    if (selTanqCol) selTanqCol.innerHTML = '<option value="">Seleccione...</option>' + optColTodo;
}

function llenarSelectsTransportadora() {
    const selVeh = document.getElementById('vehiculoTransp');
    const selCond = document.getElementById('conductorTransp');
    if (selVeh) selVeh.innerHTML = '<option value="">Seleccione vehículo...</option>' + vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    if (selCond) selCond.innerHTML = '<option value="">Seleccione conductor...</option>' + conductores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// =====================================================
// ===== 📦 MOVIMIENTOS — LISTA Y CAMBIO PESTAÑA =====
// =====================================================
function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    const titulos = {
        movimientos: '📦 Movimientos de Canastillas',
        transportadora: '🚛 Transportadora',
        combustible: '⛽ Control de Combustible',
        mantenimientos: '🔧 Mantenimientos',
        informes: '📊 Informes',
        admin: '⚙️ Administración'
    };
    document.getElementById('tituloPestaña').textContent = titulos[nombre] || nombre;
    document.getElementById('sidebar').classList.remove('mostrar');
}

function alternarMenu() {
    document.getElementById('sidebar').classList.toggle('mostrar');
}

function dibujarListaMovimientos() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('listaMovimientos');
    const buscar = (document.getElementById('buscarMov')?.value || '').toLowerCase();
    let lista = movimientos.filter(m => m.fecha === hoy);
    if (buscar) {
        lista = lista.filter(m => m.placa.toLowerCase().includes(buscar) || m.colaboradorConductor.toLowerCase().includes(buscar));
    }
    if (filtroEstadoMov === 'disponibles') lista = lista.filter(m => m.horaLlegada);
    if (filtroEstadoMov === 'enruta') lista = lista.filter(m => !m.horaLlegada);

    if (!lista.length) {
        c.innerHTML = '<p class="text-center text-gray-500 py-4">📭 Sin movimientos registrados hoy</p>';
        return;
    }
    c.innerHTML = lista.map(m => {
        const pendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${pendiente ? 'pendiente' : 'completado'}">
            <div class="flex-1">
                <strong>${m.fecha} | ${m.placa} | ${m.colaboradorConductor}</strong>
                ${pendiente ? '<span class="estado-pendiente">⏳ EN RUTA</span>' : '<span class="estado-completado">✅ COMPLETADO</span>'}
                <br>Salida: ${m.horaSalida || '-'} | Llegada: ${m.horaLlegada || 'PENDIENTE'}
                <br>📦 Salen: ${m.totalCanastillasSalida || m.canSalida || 0} | Llegaron: ${m.totalCanastillasLlegada || m.canLlegada || 0} | ⚖️ ${m.kilosTotales || 0} kg
                ${m.recogidas?.length ? `<br>📝 Recogidas: ${m.recogidas.map(r => `${r.nombre}: ${r.kilos}kg / ${r.canastillas}can`).join(' | ')}` : ''}
                ${m.observaciones ? `<br>💬 ${m.observaciones}` : ''}
                ${m.usuario ? `<br><small>👤 Registrado por: ${m.usuario} — ${m.fechaHora?.toDate ? m.fechaHora.toDate().toLocaleString() : ''}</small>` : ''}
            </div>
            <div class="flex flex-col gap-1">
                ${pendiente ? `<button class="btn-editar" onclick="cargarMovimientoEdicion('${m.id}')">✏️ Completar</button>` : ''}
                ${usuarioActivo?.rol === 'admin' ? `<button class="btn-quitar" onclick="eliminarMovimiento('${m.id}')">×</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function filtrarMovimientos() { dibujarListaMovimientos(); }

// =====================================================
// ===== 📦 RECOGIDAS — AGREGAR, ELIMINAR, CALCULAR =====
// =====================================================
function agregarFilaRecogida() {
    const selCol = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    filasRecogida.push({ id: Date.now(), nombre: '', kilos: 0, canastillas: 0 });
    dibujarListaRecogidas();
}

function dibujarListaRecogidas() {
    const c = document.getElementById('listaRecogidas');
    const selCol = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    c.innerHTML = filasRecogida.map((f, i) => `
    <div class="fila-recogida" data-id="${f.id}">
        <select onchange="filasRecogida[${i}].nombre=this.value; recalcularTotalesRecogida()">
            <option value="">Seleccione a quién recoge</option>${selCol}
            ${f.nombre ? `<option selected>${f.nombre}</option>` : ''}
        </select>
        <input type="number" placeholder="Kilos" value="${f.kilos || ''}" onchange="filasRecogida[${i}].kilos=parseFloat(this.value)||0; recalcularTotalesRecogida()">
        <input type="number" placeholder="Canastillas" value="${f.canastillas || ''}" onchange="filasRecogida[${i}].canastillas=parseInt(this.value)||0; recalcularTotalesRecogida()">
        <button class="btn-quitar" onclick="filasRecogida.splice(${i},1); dibujarListaRecogidas(); recalcularTotalesRecogida()">×</button>
    </div>`).join('');
}

function recalcularTotalesRecogida() {
    const totalCanSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const totalCan = filasRecogida.reduce((s, f) => s + (f.canastillas || 0), 0);
    const totalKg = filasRecogida.reduce((s, f) => s + (f.kilos || 0), 0);
    document.getElementById('canLlegadaTotal').value = totalCan || totalCanSalida;
    document.getElementById('kilosTotales').value = totalKg;
}

// =====================================================
// ===== 📦 GUARDAR MOVIMIENTO — CON VALIDACIÓN =====
// =====================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('colaboradorConductor').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || canSalida;
    const kilos = parseInt(document.getElementById('kilosTotales').value) || 0;
    const observaciones = document.getElementById('observaciones').value;
    const id = document.getElementById('idEditar').value;

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }

    const pendVeh = movimientos.find(m => m.placa === placa && !m.horaLlegada && m.id !== id);
    if (pendVeh) return alert(`⚠️ El vehículo ${placa} está EN RUTA. Complete primero su llegada.`);
    const pendCond = movimientos.find(m => m.colaboradorConductor === conductor && !m.horaLlegada && m.id !== id);
    if (pendCond) return alert(`⚠️ El conductor ${conductor} está EN RUTA. Complete primero su llegada.`);

    const datos = {
        fecha, placa, colaboradorConductor: conductor,
        horaSalida, horaLlegada,
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: canLlegada,
        kilosTotales: kilos, observaciones,
        recogidas: filasRecogida.filter(f => f.nombre),
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            await db.collection('movimientos').doc(id).update(datos);
            alert('✅ Movimiento ACTUALIZADO');
        } else {
            await db.collection('movimientos').add(datos);
            alert('✅ Movimiento GUARDADO');
        }
        await registrarAccion(id ? 'Editar Movimiento' : 'Crear Movimiento', 'Movimientos', `${placa} — ${conductor}`);
        limpiarFormulario();
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function cargarMovimientoEdicion(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fecha').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('colaboradorConductor').value = m.colaboradorConductor;
    document.getElementById('horaSalida').value = m.horaSalida;
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.totalCanastillasSalida || '';
    filasRecogida = m.recogidas?.length ? JSON.parse(JSON.stringify(m.recogidas)) : [];
    dibujarListaRecogidas();
    recalcularTotalesRecogida();
    document.getElementById('observaciones').value = m.observaciones || '';
    document.getElementById('idEditar').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administrador puede eliminar');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function completarMovimiento() {
    limpiarFormulario();
    alert('✅ Listo para nuevo movimiento');
}

function limpiarFormulario() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('colaboradorConductor').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('kilosTotales').value = '';
    document.getElementById('observaciones').value = '';
    document.getElementById('idEditar').value = '';
    filasRecogida = [];
    document.getElementById('listaRecogidas').innerHTML = '';
    datosGuardadosFormulario = {};
}
// =====================================================
// ===== 🚛 TRANSPORTADORA =====
// =====================================================
async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores_transportadora').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    alert('✅ Conductor agregado');
    await cargarDatosCompleto();
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
    await cargarDatosCompleto();
}

function verificarCanastillasSalida() {
    const sal = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    document.getElementById('canLlegadaTransp').value = sal || '';
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || canSalida;
    const id = document.getElementById('idEditarTransp').value;

    if (!fecha || !placa || !conductor || !horaSalida) return alert('Complete todos los datos de salida');

    const datos = { fecha, placa, conductor, horaSalida, horaLlegada, canSalida, canLlegada,
        usuario: usuarioActivo.email, fechaHora: new Date() };

    if (id) {
        await db.collection('movimientos_transportadora').doc(id).update(datos);
        alert('✅ Llegada registrada');
    } else {
        await db.collection('movimientos_transportadora').add(datos);
        alert('✅ Salida registrada');
    }
    document.getElementById('idEditarTransp').value = '';
    document.getElementById('btnCompletarTransp').classList.add('oculto');
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    await cargarDatosCompleto();
}

function dibujarListaMovimientosTransp() {
    const c = document.getElementById('listaMovimientosTransp');
    const lista = movimientos.filter(m => m.placa && m.conductor && m.horaSalida).length ? [] : [];
    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').limit(30).get().then(snap => {
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!lista.length) { c.innerHTML = '<p class="text-center text-gray-500 py-4">📭 Sin movimientos</p>'; return; }
        c.innerHTML = lista.map(m => {
            const pend = !m.horaLlegada;
            return `<div class="fila-lista ${pend?'pendiente':'completado'}">
                <div class="flex-1"><strong>${m.fecha} | ${m.placa} | ${m.conductor}</strong>
                <br>Salida: ${m.horaSalida} | Llegada: ${m.horaLlegada||'PENDIENTE'}
                <br>📦 Salen: ${m.canSalida} | Llegaron: ${m.canLlegada}</div>
                <div>${pend?`<button class="btn-editar" onclick="cargarMovTranspEdicion('${m.id}')">✏️ Registrar Llegada</button>`:''}</div>
            </div>`;
        }).join('');
    });
}

async function cargarMovTranspEdicion(id) {
    const doc = await db.collection('movimientos_transportadora').doc(id).get();
    const m = { id: doc.id, ...doc.data() };
    document.getElementById('fechaTransp').value = m.fecha;
    document.getElementById('vehiculoTransp').value = m.placa;
    document.getElementById('conductorTransp').value = m.conductor;
    document.getElementById('horaSalidaTransp').value = m.horaSalida;
    document.getElementById('canSalidaTransp').value = m.canSalida;
    document.getElementById('canLlegadaTransp').value = m.canLlegada;
    document.getElementById('idEditarTransp').value = id;
    document.getElementById('btnCompletarTransp').classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function completarMovimientoTransp() {
    guardarMovimientoTransp();
}

// =====================================================
// ===== ⛽ COMBUSTIBLE =====
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
    const kmM = parseFloat(document.getElementById('kmManana').value);
    const kmT = parseFloat(document.getElementById('kmTarde').value) || null;
    const quien = document.getElementById('quienRegistraKm').value;
    if (!fecha || !placa || !kmM || !quien) return alert('Complete Fecha, Placa, Km Mañana y Quien registra');
    const rec = kilometraje.find(k => k.fecha === fecha && k.placa === placa);
    const datos = { fecha, placa, kmManana: kmM, kmTarde: kmT, kmRecorridos: kmT ? (kmT - kmM).toFixed(1) : null, colaborador: quien, usuario: usuarioActivo.email };
    if (rec) await db.collection('kilometraje').doc(rec.id).update(datos);
    else await db.collection('kilometraje').add(datos);
    alert('✅ Kilometraje guardado');
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
    await cargarDatosCompleto();
}

function dibujarPendientesKilometraje() {
    const c = document.getElementById('pendientesKilometraje');
    const pend = kilometraje.filter(k => !k.kmTarde);
    if (!pend.length) { c.innerHTML = '<p class="text-green-600">✅ Sin pendientes — todos completados</p>'; return; }
    c.innerHTML = pend.map(k => `<div class="p-2 bg-orange-50 border rounded mb-2">📅 ${k.fecha} | ${k.placa} | 🌅 ${k.kmManana} km → <input type="number" placeholder="Tarde" onkeydown="if(event.key==='Enter'){actualizarKmTarde('${k.id}',this.value)}"> <button class="btn-primario text-xs" onclick="actualizarKmTarde('${k.id}',this.parentElement.querySelector('input').value)">Guardar</button></div>`).join('');
}

async function actualizarKmTarde(id, valor) {
    const kmT = parseFloat(valor);
    if (!kmT) return alert('Escriba el kilometraje de la tarde');
    const rec = kilometraje.find(k => k.id === id);
    await db.collection('kilometraje').doc(id).update({ kmTarde: kmT, kmRecorridos: (kmT - rec.kmManana).toFixed(1) });
    alert('✅ Completado');
    await cargarDatosCompleto();
}

function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKilometraje');
    if (!res.length) { c.innerHTML = '<p>Sin registros</p>'; return; }
    const tot = res.reduce((s, r) => s + (parseFloat(r.kmRecorridos) || 0), 0);
    c.innerHTML = `<p class="font-bold">Total km recorridos: ${tot.toFixed(1)} km</p><table><tr><th>Fecha</th><th>Placa</th><th>Mañana</th><th>Tarde</th><th>Recorridos</th><th>Registrado por</th></tr>` + res.map(r => `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmManana}</td><td>${r.kmTarde||'—'}</td><td>${r.kmRecorridos||'—'}</td><td>${r.colaborador}</td></tr>`).join('') + `</table>`;
}

function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje.length) return alert('Consulte primero');
    const datos = ultimosResultados.kilometraje.map(r => ({ Fecha: r.fecha, Placa: r.placa, KmMañana: r.kmManana, KmTarde: r.kmTarde||'', KmRecorridos: r.kmRecorridos||'', Colaborador: r.colaborador }));
    XLSX.writeFile(XLSX.utils.book_new(null, XLSX.utils.json_to_sheet(datos)), 'Kilometraje.xlsx');
}

async function guardarRegistroTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const gal = parseFloat(document.getElementById('galonesTanqueo').value);
    const est = document.getElementById('estadoTanqueo').value;
    const por = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const quien = document.getElementById('quienTanquea').value;
    if (!fecha || !placa || !gal || !quien) return alert('Complete todos los campos');
    await db.collection('tanqueo').add({ fecha, placa, galones, estado: est, porcentaje: por, colaborador: quien, usuario: usuarioActivo.email });
    alert('✅ Tanqueo registrado');
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('porcentajeTanqueo').value = '100';
    await cargarDatosCompleto();
}

function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo').value;
    const ff = document.getElementById('fechaFinTanqueo').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fecha >= fi && t.fecha <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanqueo');
    if (!res.length) { c.innerHTML = '<p>Sin registros</p>'; return; }
    const tot = res.reduce((s, r) => s + r.galones, 0);
    c.innerHTML = `<p class="font-bold">Total galones: ${tot.toFixed(2)} gl</p><table><tr><th>Fecha</th><th>Placa</th><th>Galones</th><th>Estado</th><th>%</th><th>Quien tanqueó</th></tr>` + res.map(r => `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.estado}</td><td>${r.porcentaje}%</td><td>${r.colaborador}</td></tr>`).join('') + `</table>`;
}

function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo.length) return alert('Consulte primero');
    XLSX.writeFile(XLSX.utils.book_new(null, XLSX.utils.json_to_sheet(ultimosResultados.tanqueo.map(t => ({ Fecha: t.fecha, Placa: t.placa, Galones: t.galones, Estado: t.estado, Porcentaje: t.porcentaje+'%', Colaborador: t.colaborador })))), 'Tanqueo.xlsx');
}

// =====================================================
// ===== 🔧 MANTENIMIENTOS =====
// =====================================================
function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;
    const placas = [...new Set([...vehiculosMov.map(v=>v.placa), ...datosVehiculos.map(d=>d.placa)])].sort();
    c.innerHTML = placas.map(p => {
        const enTaller = historialMantenimientos.some(m => m.placa === p && !m.fechaEntrega);
        return `<div class="p-2 border-b flex justify-between items-center ${enTaller?'bg-orange-50':''}"><span><strong>${p}</strong> ${enTaller?'🔧 EN TALLER':'✅ En Servicio'}</span><button class="btn-primario text-xs" onclick="verHistorialVehiculo('${p}')">👁️ Ver</button></div>`;
    }).join('');
}

async function verHistorialVehiculo(placa) {
    placaSeleccionada = placa;
    document.getElementById('placaMantSeleccionada').textContent = placa;
    const datos = datosVehiculos.find(d => d.placa === placa);
    const cDatos = document.getElementById('datosVehiculoSeleccionado');
    if (datos) {
        cDatos.innerHTML = `<p><strong>📅 Tecno-mecánica:</strong> ${datos.fechaTecno||'No registrada'}</p><p><strong>📅 SOAT:</strong> ${datos.fechaSoat||'No registrado'}</p><p><strong>📅 Seguro:</strong> ${datos.fechaSeguro||'No registrado'}</p><p><strong>📝 Observaciones:</strong> ${datos.observaciones||'—'}</p><button class="btn-primario mt-2" onclick="editarDatosVehiculo('${placa}')">✏️ Actualizar Datos</button>`;
    } else {
        cDatos.innerHTML = `<p class="text-gray-500">Sin datos registrados</p><button class="btn-primario mt-2" onclick="editarDatosVehiculo('${placa}')">➕ Registrar Datos</button>`;
    }
    const hist = historialMantenimientos.filter(m => m.placa === placa);
    const cHist = document.getElementById('historialVehiculoSeleccionado');
    if (!hist.length) { cHist.innerHTML = '<p class="text-gray-500">Sin historial de mantenimiento</p>'; }
    else {
        cHist.innerHTML = hist.map(m => {
            const act = !m.fechaEntrega;
            return `<div class="border p-3 mb-2 ${act?'bg-orange-50 border-orange-300':''}"><p><strong>📅 Ingreso:</strong> ${m.fechaIngreso}</p><p><strong>📝 Motivo:</strong> ${m.motivo}</p><p><strong>👤 Quien entrega:</strong> ${m.responsable}</p>${act?`<p class="text-orange-600 font-bold">🔧 EN TALLER</p><button class="btn-primario mt-2" onclick="registrarEntregaTaller('${m.id}')">✅ Registrar Entrega</button>`:`<p><strong>✅ Entregado:</strong> ${m.fechaEntrega}</p><p><strong>📝 Observaciones:</strong> ${m.observacionesEntrega||'—'}</p>`}<button class="btn-editar text-xs mt-2" onclick="editarRegistroMantenimiento('${m.id}')">✏️ Actualizar</button></div>`;
        }).join('');
    }
    const enTaller = hist.some(m => !m.fechaEntrega);
    document.getElementById('btnEnviarTaller').style.display = enTaller ? 'none' : 'inline-block';
    document.getElementById('formIngresoTaller').classList.remove('oculto');
}

async function editarDatosVehiculo(placa) {
    const d = datosVehiculos.find(x => x.placa === placa);
    const fT = prompt('Fecha Tecno-mecánica (AAAA-MM-DD):', d?.fechaTecno||'');
    fS = prompt('Fecha SOAT:', d?.fechaSoat||'');
    fSeg = prompt('Fecha Seguro:', d?.fechaSeguro||'');
    obs = prompt('Observaciones/Documentos:', d?.observaciones||'');
    if (!fT && !fS && !fSeg && !obs) return;
    const nd = { placa, fechaTecno: fT||null, fechaSoat: fS||null, fechaSeguro: fSeg||null, observaciones: obs||'', fechaEdicion: new Date(), usuario: usuarioActivo.email };
    try {
        if (d) await db.collection('datos_vehiculos').doc(d.id).update(nd);
        else { nd.fechaCreacion = new Date(); await db.collection('datos_vehiculos').add(nd); }
        alert('✅ Datos actualizados');
        await cargarDatosCompleto();
        verHistorialVehiculo(placa);
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function registrarIngresoTaller() {
    if (!placaSeleccionada) return alert('Seleccione una placa');
    const fecha = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMant').value.trim();
    const resp = document.getElementById('quienEntrega').value.trim();
    if (!fecha || !motivo || !resp) return alert('Complete Fecha, Motivo y Responsable');
    await db.collection('historial_mantenimientos').add({ placa: placaSeleccionada, fechaIngreso: fecha, motivo, responsable: resp, fechaEntrega: null, usuario: usuarioActivo.email });
    const v = vehiculosMov.find(x => x.placa === placaSeleccionada);
    if (v) await db.collection('vehiculos_movimientos').doc(v.id).update({ estado: 'inactivo' });
    alert(`✅ ${placaSeleccionada} enviado a TALLER → Queda INACTIVO`);
    document.getElementById('motivoMant').value = '';
    document.getElementById('quienEntrega').value = '';
    await cargarDatosCompleto();
    verHistorialVehiculo(placaSeleccionada);
}

async function registrarEntregaTaller(id) {
    const fecha = prompt('Fecha de entrega:', new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    const obs = prompt('Observaciones al entregar:');
    const m = historialMantenimientos.find(x => x.id === id);
    await db.collection('historial_mantenimientos').doc(id).update({ fechaEntrega: fecha, observacionesEntrega: obs||'' });
    const v = vehiculosMov.find(x => x.placa === m.placa);
    if (v) await db.collection('vehiculos_movimientos').doc(v.id).update({ estado: 'activo' });
    alert(`✅ ${m.placa} ENTREGADO → Queda ACTIVO`);
    await cargarDatosCompleto();
    verHistorialVehiculo(m.placa);
}

async function editarRegistroMantenimiento(id) {
    const m = historialMantenimientos.find(x => x.id === id);
    if (!m) return;
    const fecha = prompt('Fecha de ingreso:', m.fechaIngreso);
    const motivo = prompt('Motivo:', m.motivo);
    const resp = prompt('Responsable:', m.responsable);
    if (!fecha || !motivo || !resp) return;
    await db.collection('historial_mantenimientos').doc(id).update({ fechaIngreso: fecha, motivo, responsable: resp });
    alert('✅ Registro actualizado');
    await cargarDatosCompleto();
    verHistorialVehiculo(m.placa);
}

// =====================================================
// ===== ⚙️ ADMINISTRACIÓN =====
// =====================================================
function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subadmin').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');
    if (nombre === 'colaboradores') dibujarTablaColaboradores();
    if (nombre === 'vehiculos') dibujarTablaVehiculosAdmin();
    if (nombre === 'tipos-vehiculo') dibujarListaTiposVehiculo();
}

async function guardarColaborador() {
    const nom = document.getElementById('nombreColaboradorAdmin').value.trim();
    const id = document.getElementById('idEditarColaborador').value;
    if (!nom) return;
    if (colaboradores.some(c => c.nombre.trim() === nom && c.id !== id)) {
        return alert('⚠️ Este colaborador ya está registrado');
    }
    const datos = { nombre: nom, estado: 'activo', usuario: usuarioActivo.email, fecha: new Date() };
    try {
        if (id) {
            await db.collection('colaboradores').doc(id).update(datos);
            alert('✅ Colaborador actualizado');
        } else {
            await db.collection('colaboradores').add(datos);
            alert('✅ Colaborador guardado');
        }
        document.getElementById('nombreColaboradorAdmin').value = '';
        document.getElementById('idEditarColaborador').value = '';
        await cargarDatosCompleto();
        dibujarTablaColaboradores();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function dibujarTablaColaboradores() {
    const tb = document.querySelector('#tablaColaboradores tbody');
    if (!tb) return;
    tb.innerHTML = colaboradores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${(c.estado || 'activo') === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>
                <button class="btn-editar" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='editarColaborador("${c.id}","${c.nombre}","${c.estado||"activo"}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='cambiarEstadoColaborador("${c.id}","${c.estado||"activo"}")'>${(c.estado||"activo")==="activo"?"❌ Inactivar":"✅ Activar"}</button>
            </td>
        </tr>`).join('');
}

async function editarColaborador(id, nombre, estado) {
    document.getElementById('nombreColaboradorAdmin').value = nombre;
    document.getElementById('idEditarColaborador').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cambiarEstadoColaborador(id, estadoActual) {
    const nuevo = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿Seguro de poner como ${nuevo.toUpperCase()} este colaborador?`)) return;
    await db.collection('colaboradores').doc(id).update({ estado: nuevo });
    alert(`✅ Colaborador ${nuevo}`);
    await cargarDatosCompleto();
}

async function guardarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    const marca = document.getElementById('marcaVehiculoMov').value.trim();
    const id = document.getElementById('idEditarVehiculoMov').value;
    if (!placa || !tipo) return alert('Complete Placa y Tipo');
    if (vehiculosMov.some(v => v.placa === placa && v.id !== id)) {
        return alert('⚠️ Esta placa ya está registrada');
    }
    const datos = { placa, tipo, marca, estado: 'activo', usuario: usuarioActivo.email, fecha: new Date() };
    try {
        if (id) {
            await db.collection('vehiculos_movimientos').doc(id).update(datos);
            alert('✅ Vehículo actualizado');
        } else {
            await db.collection('vehiculos_movimientos').add(datos);
            alert('✅ Vehículo guardado');
        }
        document.getElementById('placaVehiculoMov').value = '';
        document.getElementById('tipoVehiculoMov').value = '';
        document.getElementById('marcaVehiculoMov').value = '';
        document.getElementById('idEditarVehiculoMov').value = '';
        await cargarDatosCompleto();
        dibujarTablaVehiculosAdmin();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function dibujarTablaVehiculosAdmin() {
    const tb = document.querySelector('#tablaVehiculosMov tbody');
    if (!tb) return;
    tb.innerHTML = vehiculosMov.map(v => `
        <tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td>${v.marca || '—'}</td>
            <td>
                <button class="btn-editar" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='editarVehiculoMov("${v.id}","${v.placa}","${v.tipo}","${v.marca||""}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='eliminarVehiculoMov("${v.id}","${v.placa}")'>🗑️</button>
            </td>
        </tr>`).join('');
    document.getElementById('tipoVehiculoMov').innerHTML = `<option value="">Seleccione tipo...</option>` + tiposVehiculo.map(t => `<option>${t}</option>`).join('');
}

async function editarVehiculoMov(id, placa, tipo, marca) {
    document.getElementById('placaVehiculoMov').value = placa;
    document.getElementById('tipoVehiculoMov').value = tipo;
    document.getElementById('marcaVehiculoMov').value = marca;
    document.getElementById('idEditarVehiculoMov').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarVehiculoMov(id, placa) {
    if (!confirm(`¿Eliminar vehículo ${placa}?`)) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function dibujarListaTiposVehiculo() {
    const c = document.getElementById('listaTiposVehiculo');
    c.innerHTML = tiposVehiculo.map((t, i) => `<div class="p-2 border-b flex justify-between items-center"><span>${t}</span><button class="btn-peligro text-xs" onclick="tiposVehiculo.splice(${i},1); dibujarListaTiposVehiculo(); alert('Borrado — Recarga para ver cambios')">🗑️</button></div>`).join('');
}

function agregarTipoVehiculo() {
    const t = document.getElementById('nuevoTipoVehiculo').value.trim();
    if (!t) return alert('Escriba el tipo');
    if (tiposVehiculo.includes(t)) return alert('Ya existe este tipo');
    tiposVehiculo.push(t);
    document.getElementById('nuevoTipoVehiculo').value = '';
    dibujarListaTiposVehiculo();
    alert('✅ Tipo agregado — se refleja al recargar');
}

// =====================================================
// ===== 📊 INFORMES =====
// =====================================================
function generarInformeMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const c = document.getElementById('resultadoMovimientos');
    if (!res.length) { c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>'; return; }
    let totalCanSal = 0, totalCanLleg = 0, totalKg = 0;
    res.forEach(m => {
        totalCanSal += m.totalCanastillasSalida || 0;
        totalCanLleg += m.totalCanastillasLlegada || 0;
        totalKg += m.kilosTotales || 0;
    });
    c.innerHTML = `
        <p class="font-bold mb-2">📊 Totales del período: 📦 Salieron: ${totalCanSal} | 📦 Llegaron: ${totalCanLleg} | ⚖️ ${totalKg} kg</p>
        <table>
            <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canastillas Salida</th><th>Canastillas Llegada</th><th>Kilos</th><th>Observaciones</th></tr></thead>
            <tbody>
                ${res.map(m => `<tr>
                    <td>${m.fecha}</td>
                    <td>${m.placa}</td>
                    <td>${m.colaboradorConductor}</td>
                    <td>${m.horaSalida}</td>
                    <td>${m.horaLlegada || 'PENDIENTE'}</td>
                    <td>${m.totalCanastillasSalida || 0}</td>
                    <td>${m.totalCanastillasLlegada || 0}</td>
                    <td>${m.kilosTotales || 0}</td>
                    <td>${m.observaciones || '—'}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportarExcel() {
    if (!ultimosResultados.movimientos.length) return alert('Genere primero el informe');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || 'PENDIENTE',
        CanastillasSalida: m.totalCanastillasSalida || 0,
        CanastillasLlegada: m.totalCanastillasLlegada || 0,
        Kilos: m.kilosTotales || 0,
        Observaciones: m.observaciones || ''
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
}

// =====================================================
// ===== 📝 REGISTRO DE ACCIONES / AUDITORÍA =====
// =====================================================
async function registrarAccion(accion, modulo, detalle) {
    try {
        await db.collection('auditoria').add({
            usuario: usuarioActivo.email || usuarioActivo.usuario,
            nombre: usuarioActivo.nombre || '',
            accion, modulo, detalle,
            fechaHora: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { /* Silencioso */ }
}

// =====================================================
// ===== INICIO AUTOMÁTICO AL CARGAR PÁGINA =====
// =====================================================
window.onload = function() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('fechaIngreso').valueAsDate = new Date();
    document.getElementById('fechaInicioMov').valueAsDate = new Date();
    document.getElementById('fechaFinMov').valueAsDate = new Date();
    document.getElementById('fechaInicioKm').valueAsDate = new Date();
    document.getElementById('fechaFinKm').valueAsDate = new Date();
    document.getElementById('fechaInicioTanqueo').valueAsDate = new Date();
    document.getElementById('fechaFinTanqueo').valueAsDate = new Date();
};
