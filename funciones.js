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
let filtroSelectores = 'todos'; // 🔍 FILTRO SOLO INFORMATIVO — NO BLOQUEA
let filasRecogida = [];
let tiempoActualizacion = null;
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };

// =====================================================
// ===== 💾 PROTEGER FORMULARIO AL ACTUALIZAR =====
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
    dibujarListaMovimientos();
    dibujarListaMovimientosTransp();
    dibujarPendientesKilometraje();
    dibujarListaPlacasMant();
    if (typeof placaSeleccionada !== 'undefined' && placaSeleccionada) verHistorialVehiculo(placaSeleccionada);

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
        const hayDatosEnFormulario = 
            document.getElementById('vehiculoMov')?.value ||
            document.getElementById('colaboradorConductor')?.value ||
            filasRecogida.length > 0;
        if (!hayDatosEnFormulario) {
            cargarDatosCompleto();
        }
    }, 10000);
}

// =====================================================
// ===== 🔍 FILTRO DE SELECTORES — SOLO INFORMATIVO =====
// =====================================================
// ⚠️ MUESTRA quién está libre o en ruta, PERO NO BLOQUEA al guardar
function cambiarFiltroSelectores(nombre) {
    filtroSelectores = nombre;
    document.querySelectorAll('.btn-filtro-mov').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    llenarSelects();
}

// =====================================================
// ===== 📋 LLENAR SELECTS CON FILTRO INFORMATIVO =====
// =====================================================
function llenarSelects() {
    const selVeh = document.getElementById('vehiculoMov');
    const selCond = document.getElementById('colaboradorConductor');
    const selKmVeh = document.getElementById('vehiculoKm');
    const selKmCol = document.getElementById('quienRegistraKm');
    const selTanqVeh = document.getElementById('vehiculoTanqueo');
    const selTanqCol = document.getElementById('quienTanquea');

    // 🚗 Obtener placas y conductores que ESTÁN EN RUTA (sin llegada)
    const placasEnRuta = movimientos.filter(m => !m.horaLlegada).map(m => m.placa);
    const colsEnRuta = movimientos.filter(m => !m.horaLlegada).map(m => m.colaboradorConductor);

    // 📋 Listas completas de activos
    let listaVeh = vehiculosMov.filter(v => v.estado !== 'inactivo');
    let listaCol = colaboradores.filter(c => (c.estado || 'activo') === 'activo');

    // 🔄 Aplicar filtro SOLO para MOSTRAR en el selector
    if (filtroSelectores === 'disponibles') {
        listaVeh = listaVeh.filter(v => !placasEnRuta.includes(v.placa));
        listaCol = listaCol.filter(c => !colsEnRuta.includes(c.nombre));
    } else if (filtroSelectores === 'enruta') {
        listaVeh = listaVeh.filter(v => placasEnRuta.includes(v.placa));
        listaCol = listaCol.filter(c => colsEnRuta.includes(c.nombre));
    }
    // Si es 'todos' → muestra todo sin filtrar

    // 📦 Opciones para el formulario de Movimientos (con filtro de visualización)
    const optCol = listaCol.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const optVeh = listaVeh.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');

    // 📦 Opciones para Combustible (SIN filtro — siempre todos)
    const optVehTodo = vehiculosMov.filter(v => v.estado !== 'inactivo').map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    const optColTodo = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

    // ✅ Asignar a cada selector
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
// ===== 📦 LISTA DE MOVIMIENTOS (BUSCADOR INDEPENDIENTE) =====
// =====================================================
let filtroSoloPendientes = false;

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

function alternarFiltroPendientes() {
    filtroSoloPendientes = !filtroSoloPendientes;
    const btn = document.getElementById('btnFiltroPendientes');
    if (filtroSoloPendientes) {
        btn.classList.add('activa');
        btn.textContent = '📋 Ver Todos';
    } else {
        btn.classList.remove('activa');
        btn.textContent = '⏳ Ver Pendientes';
    }
    dibujarListaMovimientos();
}

function filtrarListaMovimientos() {
    dibujarListaMovimientos();
}

function dibujarListaMovimientos() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('listaMovimientos');
    const buscar = (document.getElementById('buscarMov')?.value || '').toLowerCase();

    // 📋 Lista base: TODOS los movimientos de HOY
    let lista = movimientos.filter(m => m.fecha === hoy);

    // 🔍 Aplicar buscador
    if (buscar) {
        lista = lista.filter(m => 
            m.placa.toLowerCase().includes(buscar) || 
            m.colaboradorConductor.toLowerCase().includes(buscar) ||
            (m.observaciones || '').toLowerCase().includes(buscar)
        );
    }

    // ⏳ Aplicar filtro de SOLO PENDIENTES si está activo
    if (filtroSoloPendientes) {
        lista = lista.filter(m => !m.horaLlegada);
    }

    // 📭 Sin datos
    if (!lista.length) {
        c.innerHTML = '<p class="text-center text-gray-500 py-4">📭 Sin movimientos registrados hoy</p>';
        return;
    }

    // ✅ Dibujar lista con BOTÓN EDITAR / COMPLETAR
    c.innerHTML = lista.map(m => {
        const pendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${pendiente ? 'pendiente' : 'completado'}">
            <div class="flex-1">
                <strong>${m.fecha} | ${m.placa} | ${m.colaboradorConductor}</strong>
                ${pendiente ? '<span class="estado-pendiente">⏳ EN RUTA</span>' : '<span class="estado-completado">✅ COMPLETADO</span>'}
                <br>Salida: ${m.horaSalida || '-'} | Llegada: ${m.horaLlegada || '⏳ PENDIENTE'}
                <br>📦 Salen: ${m.totalCanastillasSalida || m.canSalida || 0} | Llegaron: ${m.totalCanastillasLlegada || m.canLlegada || 0} | ⚖️ ${m.kilosTotales || 0} kg
                ${m.recogidas?.length ? `<br>📝 Recogidas: ${m.recogidas.map(r => `${r.nombre}: ${r.kilos}kg / ${r.canastillas}can`).join(' | ')}` : ''}
                ${m.observaciones ? `<br>💬 ${m.observaciones}` : ''}
                ${m.usuario ? `<br><small>👤 Registrado por: ${m.usuario}</small>` : ''}
            </div>
            <div class="flex flex-col gap-1">
                <button class="btn-editar" onclick="cargarMovimientoEdicion('${m.id}')">
                    ${pendiente ? '✏️ Completar' : '✏️ Editar'}
                </button>
                ${usuarioActivo?.rol === 'admin' 
                    ? `<button class="btn-quitar" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` 
                    : ''}
            </div>
        </div>`;
    }).join('');
}

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
// ===== 📦 GUARDAR MOVIMIENTO — ✅ SIN BLOQUEO =====
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

    // ✅ YA NO HAY BLOQUEO: Se permite crear y editar libremente
    // Los filtros de arriba SOLO muestran información visual

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
    if (!nombre) return alert('Escribe el nombre del conductor');
    if (conductores.some(c => c.nombre.trim() === nombre)) {
        return alert('⚠️ Este conductor ya está registrado');
    }
    await db.collection('conductores_transportadora').add({
        nombre, estado: 'activo',
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fecha: new Date()
    });
    alert('✅ Conductor agregado');
    document.getElementById('nombreConductor').value = '';
    await cargarDatosCompleto();
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    if (vehiculosTransp.some(v => v.placa === placa)) {
        return alert('⚠️ Esta placa ya está registrada en Transportadora');
    }
    await db.collection('vehiculos_transportadora').add({
        placa, tipo, estado: 'activo',
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fecha: new Date()
    });
    alert('✅ Vehículo de Transportadora agregado');
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    await cargarDatosCompleto();
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

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }

    const datos = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            await db.collection('movimientos_transportadora').doc(id).update(datos);
            alert('✅ Movimiento de Transportadora ACTUALIZADO');
        } else {
            await db.collection('movimientos_transportadora').add(datos);
            alert('✅ Movimiento de Transportadora REGISTRADO');
        }
        await registrarAccion(id ? 'Editar Movimiento Transp' : 'Registrar Movimiento Transp', 'Transportadora', `${placa} — ${conductor}`);
        limpiarFormularioTransp();
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function completarMovimientoTransp() {
    alert('✅ Llegada registrada');
    limpiarFormularioTransp();
}

function limpiarFormularioTransp() {
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('idEditarTransp').value = '';
    document.getElementById('btnCompletarTransp').classList.add('oculto');
}

function dibujarListaMovimientosTransp() {
    const c = document.getElementById('listaMovimientosTransp');
    if (!c) return;
    const hoy = new Date().toISOString().split('T')[0];
    const lista = movimientos.filter(m => m.fecha === hoy);

    llenarSelectsTransportadora();

    if (!lista.length) {
        c.innerHTML = '<p class="text-center text-gray-500 py-4">📭 Sin movimientos de Transportadora hoy</p>';
        return;
    }

    c.innerHTML = lista.map(m => {
        const pendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${pendiente ? 'pendiente' : 'completado'}">
            <div class="flex-1">
                <strong>${m.fecha} | ${m.placa} | ${m.colaboradorConductor || m.conductor}</strong>
                ${pendiente ? '<span class="estado-pendiente">⏳ EN RUTA</span>' : '<span class="estado-completado">✅ COMPLETADO</span>'}
                <br>Salida: ${m.horaSalida} | Llegada: ${m.horaLlegada || '⏳ PENDIENTE'}
                <br>📦 Salieron: ${m.canastillasSalida || m.totalCanastillasSalida || 0} | Llegaron: ${m.canastillasLlegada || m.totalCanastillasLlegada || 0}
            </div>
        </div>`;
    }).join('');
}

// =====================================================
// ===== ⛽ COMBUSTIBLE - KILOMETRAJE =====
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

    if (!fecha || !placa || !colaborador) {
        return alert('⚠️ Complete Fecha, Placa y Quien registra');
    }

    const kmRecorridos = (kmManana !== null && kmTarde !== null) ? (kmTarde - kmManana) : null;

    const datos = {
        fecha, placa,
        kmManana, kmTarde, kmRecorridos,
        colaborador,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('kilometraje').add(datos);
        alert('✅ Kilometraje guardado');
        await registrarAccion('Registrar Kilometraje', 'Combustible', `${placa} — ${colaborador}`);
        document.getElementById('fechaKm').valueAsDate = new Date();
        document.getElementById('vehiculoKm').value = '';
        document.getElementById('kmManana').value = '';
        document.getElementById('kmTarde').value = '';
        document.getElementById('quienRegistraKm').value = '';
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function dibujarPendientesKilometraje() {
    const c = document.getElementById('pendientesKilometraje');
    if (!c) return;
    const pendientes = kilometraje.filter(k => k.kmTarde === null);
    if (!pendientes.length) {
        c.innerHTML = '<p class="text-sm text-gray-500">✅ Sin pendientes — todos los días completos</p>';
        return;
    }
    c.innerHTML = pendientes.map(k => `
    <div class="flex gap-2 items-center p-2 border rounded mb-2 bg-yellow-50">
        <span class="font-bold">${k.fecha} | ${k.placa}</span>
        <span class="text-sm">🌅 Mañana: ${k.kmManana} km</span>
        <button class="btn-primario text-xs py-1 px-2 ml-auto" onclick="completarKilometrajeTarde('${k.id}','${k.fecha}','${k.placa}',${k.kmManana})">✏️ Completar Tarde</button>
    </div>`).join('');
}

async function completarKilometrajeTarde(id, fecha, placa, kmManana) {
    const kmTarde = prompt(`Kilometraje de la tarde para ${placa} (${fecha}):`);
    if (!kmTarde) return;
    const kmTardeNum = parseFloat(kmTarde);
    const kmRecorridos = kmTardeNum - kmManana;
    await db.collection('kilometraje').doc(id).update({
        kmTarde: kmTardeNum,
        kmRecorridos
    });
    alert(`✅ Kilometraje completado — Recorridos: ${kmRecorridos} km`);
    await registrarAccion('Completar Kilometraje', 'Combustible', `${placa} — ${kmRecorridos} km`);
    await cargarDatosCompleto();
}

async function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKilometraje');
    if (!res.length) {
        c.innerHTML = '<p class="text-center">📭 Sin registros en este período</p>';
        return;
    }
    let totalKm = 0;
    res.forEach(r => { if (r.kmRecorridos) totalKm += r.kmRecorridos; });
    c.innerHTML = `
        <p class="font-bold mb-2">📏 Total Kilómetros Recorridos: ${totalKm} km</p>
        <table>
            <thead><tr><th>Fecha</th><th>Placa</th><th>🌅 Mañana</th><th>🌇 Tarde</th><th>Recorridos</th><th>Colaborador</th></tr></thead>
            <tbody>
                ${res.map(r => `
                <tr>
                    <td>${r.fecha}</td>
                    <td>${r.placa}</td>
                    <td>${r.kmManana || '-'}</td>
                    <td>${r.kmTarde || 'PENDIENTE'}</td>
                    <td>${r.kmRecorridos !== null ? r.kmRecorridos : '—'}</td>
                    <td>${r.colaborador}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje?.length) return alert('Genere primero el informe');
    const datos = ultimosResultados.kilometraje.map(r => ({
        Fecha: r.fecha,
        Placa: r.placa,
        KilometrajeMañana: r.kmManana,
        KilometrajeTarde: r.kmTarde || 'PENDIENTE',
        KilometrosRecorridos: r.kmRecorridos !== null ? r.kmRecorridos : '—',
        Colaborador: r.colaborador,
        Usuario: r.usuario || ''
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), 'Kilometraje');
    XLSX.writeFile(libro, `Kilometraje_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
}

// =====================================================
// ===== ⛽ COMBUSTIBLE - TANQUEO =====
// =====================================================
async function guardarRegistroTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = parseFloat(document.getElementById('galonesTanqueo').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const colaborador = document.getElementById('quienTanquea').value;

    if (!fecha || !placa || !galones || !colaborador) {
        return alert('⚠️ Complete Fecha, Placa, Galones y Quien tanquea');
    }

    await db.collection('tanqueo').add({
        fecha, placa, galones, estado, porcentaje, colaborador,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('✅ Tanqueo registrado');
    await registrarAccion('Registrar Tanqueo', 'Combustible', `${placa} — ${galones} galones`);
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('quienTanquea').value = '';
    await cargarDatosCompleto();
}

async function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo').value;
    const ff = document.getElementById('fechaFinTanqueo').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fecha >= fi && t.fecha <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanqueo');
    if (!res.length) {
        c.innerHTML = '<p class="text-center">📭 Sin registros de tanqueo</p>';
        return;
    }
    let totalGalones = 0;
    res.forEach(r => { totalGalones += r.galones; });
    c.innerHTML = `
        <p class="font-bold mb-2">⛽ Total Galones: ${totalGalones.toFixed(2)} gl</p>
        <table>
            <thead><tr><th>Fecha</th><th>Placa</th><th>Galones</th><th>Estado</th><th>%</th><th>Quien tanqueó</th></tr></thead>
            <tbody>
                ${res.map(r => `
                <tr>
                    <td>${r.fecha}</td>
                    <td>${r.placa}</td>
                    <td>${r.galones}</td>
                    <td>${r.estado}</td>
                    <td>${r.porcentaje}%</td>
                    <td>${r.colaborador}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo?.length) return alert('Genere primero el informe');
    const datos = ultimosResultados.tanqueo.map(r => ({
        Fecha: r.fecha,
        Placa: r.placa,
        Galones: r.galones,
        Estado: r.estado,
        Porcentaje: r.porcentaje,
        Colaborador: r.colaborador,
        Usuario: r.usuario || ''
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), 'Tanqueo');
    XLSX.writeFile(libro, `Tanqueo_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
}

// =====================================================
// ===== 🔧 MANTENIMIENTOS =====
// =====================================================
let placaSeleccionada = null;

function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;
    const placas = [...new Set([...vehiculosMov.map(v => v.placa), ...vehiculosTransp.map(v => v.placa)])].sort();
    if (!placas.length) {
        c.innerHTML = '<p class="text-sm text-gray-500">Sin vehículos registrados</p>';
        return;
    }
    c.innerHTML = placas.map(p => `
        <button class="btn-primario text-sm m-1 ${placaSeleccionada===p?'bg-blue-800':''}" onclick="verHistorialVehiculo('${p}')">${p}</button>
    `).join('');
}

function verHistorialVehiculo(placa) {
    placaSeleccionada = placa;
    document.getElementById('placaMantSeleccionada').textContent = placa;
    document.getElementById('formIngresoTaller').classList.remove('oculto');
    const datos = datosVehiculos.find(d => d.placa === placa);
    document.getElementById('datosVehiculoSeleccionado').innerHTML = datos ? `
        <p><strong>Tipo:</strong> ${datos.tipo || '—'}</p>
        <p><strong>Marca:</strong> ${datos.marca || '—'}</p>
        <p><strong>Último Mantenimiento:</strong> ${datos.ultimoMantenimiento || 'Sin registro'}</p>
    ` : '<p class="text-sm text-gray-500">Sin datos adicionales del vehículo</p>';

    const historial = historialMantenimientos.filter(h => h.placa === placa);
    document.getElementById('historialVehiculoSeleccionado').innerHTML = historial.length ? historial.map(h => `
        <div class="p-2 border rounded mb-2 bg-gray-50">
            <p><strong>Ingreso:</strong> ${h.fechaIngreso} | <strong>Salida:</strong> ${h.fechaSalida || '⏳ EN TALLER'}</p>
            <p><strong>Motivo:</strong> ${h.motivo}</p>
            <p><strong>Entregó:</strong> ${h.quienEntrega || '—'}</p>
        </div>
    `).join('') : '<p class="text-sm text-gray-500">Sin historial de mantenimiento</p>';

    dibujarListaPlacasMant();
}

async function registrarIngresoTaller() {
    const placa = document.getElementById('placaMantSeleccionada').textContent;
    const fechaIngreso = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMant').value.trim();
    const quienEntrega = document.getElementById('quienEntrega').value.trim();

    if (!placa || !fechaIngreso || !motivo || !quienEntrega) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('historial_mantenimientos').add({
        placa, fechaIngreso, motivo, quienEntrega,
        estado: 'en_taller',
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('✅ Vehículo enviado a mantenimiento');
    await registrarAccion('Enviar a Taller', 'Mantenimientos', `${placa} — ${motivo}`);
    document.getElementById('motivoMant').value = '';
    document.getElementById('quienEntrega').value = '';
    await cargarDatosCompleto();
    verHistorialVehiculo(placa);
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
    if (nombre === 'vehiculos') {
        dibujarTablaVehiculosAdmin();
        document.getElementById('tipoVehiculoMov').innerHTML = `<option value="">Seleccione tipo...</option>` + tiposVehiculo.map(t => `<option>${t}</option>`).join('');
    }
    if (nombre === 'tipos-vehiculo') dibujarListaTiposVehiculo();
}

async function guardarColaborador() {
    const nombre = document.getElementById('nombreColaboradorAdmin').value.trim();
    const id = document.getElementById('idEditarColaborador').value;
    if (!nombre) return alert('Escribe el nombre');

    if (colaboradores.some(c => c.nombre.trim() === nombre && c.id !== id)) {
        return alert('⚠️ Este colaborador ya existe');
    }

    const datos = {
        nombre, estado: 'activo',
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fecha: new Date()
    };

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
    if (!confirm(`¿Marcar como ${nuevo.toUpperCase()}?`)) return;
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

    const datos = {
        placa, tipo, marca, estado: 'activo',
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fecha: new Date()
    };

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
}

async function editarVehiculoMov(id, placa, tipo, marca) {
    document.getElementById('placaVehiculoMov').value = placa;
    document.getElementById('tipoVehiculoMov').value = tipo;
    document.getElementById('marcaVehiculoMov').value = marca;
    document.getElementById('idEditarVehiculoMov').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarVehiculoMov(id, placa) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administrador');
    if (!confirm(`¿Eliminar vehículo ${placa}?`)) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function dibujarListaTiposVehiculo() {
    const c = document.getElementById('listaTiposVehiculo');
    c.innerHTML = tiposVehiculo.map((t, i) => `
        <div class="p-2 border-b flex justify-between items-center">
            <span>${t}</span>
            <button class="btn-peligro text-xs py-1 px-2" onclick="tiposVehiculo.splice(${i},1); dibujarListaTiposVehiculo(); alert('Eliminado — recarga para ver cambios')">🗑️ Eliminar</button>
        </div>`).join('');
}

function agregarTipoVehiculo() {
    const t = document.getElementById('nuevoTipoVehiculo').value.trim();
    if (!t) return alert('Escribe el tipo de vehículo');
    if (tiposVehiculo.includes(t)) return alert('⚠️ Este tipo ya existe');
    tiposVehiculo.push(t);
    document.getElementById('nuevoTipoVehiculo').value = '';
    dibujarListaTiposVehiculo();
    alert('✅ Tipo agregado — se refleja al recargar la página');
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
    if (!res.length) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
        return;
    }
    let totalCanSal = 0, totalCanLleg = 0, totalKg = 0;
    res.forEach(m => {
        totalCanSal += m.totalCanastillasSalida || m.canSalida || 0;
        totalCanLleg += m.totalCanastillasLlegada || m.canLlegada || 0;
        totalKg += m.kilosTotales || 0;
    });
    c.innerHTML = `
        <p class="font-bold mb-2">📊 Totales: 📦 Salieron: ${totalCanSal} | 📦 Llegaron: ${totalCanLleg} | ⚖️ ${totalKg} kg</p>
        <table>
            <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canastillas Salida</th><th>Canastillas Llegada</th><th>Kilos</th><th>Observaciones</th></tr></thead>
            <tbody>
                ${res.map(m => `
                <tr>
                    <td>${m.fecha}</td>
                    <td>${m.placa}</td>
                    <td>${m.colaboradorConductor || m.conductor}</td>
                    <td>${m.horaSalida}</td>
                    <td>${m.horaLlegada || 'PENDIENTE'}</td>
                    <td>${m.totalCanastillasSalida || m.canSalida || 0}</td>
                    <td>${m.totalCanastillasLlegada || m.canLlegada || 0}</td>
                    <td>${m.kilosTotales || 0}</td>
                    <td>${m.observaciones || '—'}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportarExcel() {
    if (!ultimosResultados.movimientos?.length) return alert('Genere primero el informe');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor || m.conductor,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || 'PENDIENTE',
        CanastillasSalida: m.totalCanastillasSalida || m.canSalida || 0,
        CanastillasLlegada: m.totalCanastillasLlegada || m.canLlegada || 0,
        Kilos: m.kilosTotales || 0,
        Observaciones: m.observaciones || ''
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
}

// =====================================================
// ===== 📝 AUDITORÍA / REGISTRO DE ACCIONES =====
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
