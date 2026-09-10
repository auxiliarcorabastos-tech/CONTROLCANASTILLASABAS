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
let idEdicion = null;
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };
let tiempoSesion;
let ultimoCambioDatos = Date.now();

// Usuarios fijos predeterminados
const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", modulosPermitidos: ['movimientos'] }
];

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usu = document.getElementById('correoLogin').value.trim();
    const clave = document.getElementById('passLogin').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    // Buscar en usuarios fijos
    const fijo = usuariosFijos.find(u => u.usuario === usu && u.clave === clave);
    if (fijo) {
        usuarioActivo = { ...fijo, uid: "FIJO_" + fijo.usuario };
        await finalizarLogin();
        return;
    }

    if (!usu || !clave) {
        error.textContent = '⚠️ Escribe usuario y contraseña';
        return;
    }
    error.textContent = '❌ Usuario no registrado o contraseña incorrecta';
}

async function finalizarLogin() {
    // Cerrar pantalla de login
    document.getElementById('modalLogin').classList.add('oculto');

    // ✅ MOSTRAR/OCULTAR PESTAÑA DE ADMINISTRACIÓN
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        if (usuarioActivo.rol === 'admin') {
            btnAdmin.classList.remove('oculto');
        } else {
            btnAdmin.classList.add('oculto');
        }
    }

    // Mostrar nombre del usuario conectado
    const nom = document.getElementById('nombreUsuarioActivo');
    if (nom) nom.textContent = `Conectado: ${usuarioActivo.nombre || usuarioActivo.usuario}`;

    // Cargar datos desde Firebase
    await cargarDatosFirebase();

    // Iniciar temporizador de sesión (1 hora)
    reiniciarTiempoSesion();

    // Actualizar datos cada 10 segundos
    setInterval(() => {
        if (Date.now() - ultimoCambioDatos > 5000) {
            cargarDatosFirebase();
        }
    }, 10000);
}

// =====================================================
// ===== ⏰ CONTROL DE SESIÓN =====
// =====================================================
function reiniciarTiempoSesion() {
    clearTimeout(tiempoSesion);
    tiempoSesion = setTimeout(() => {
        alert('⏰ Sesión cerrada por inactividad');
        cerrarSesion();
    }, 60 * 60 * 1000); // 1 hora
}

function cerrarSesion() {
    usuarioActivo = null;
    clearTimeout(tiempoSesion);
    movimientos = [];
    colaboradores = [];
    vehiculosMov = [];
    vehiculosTransp = [];
    conductores = [];
    kilometraje = [];
    tanqueo = [];
    idEdicion = null;
    document.getElementById('modalLogin').classList.remove('oculto');
    document.getElementById('correoLogin').value = '';
    document.getElementById('passLogin').value = '';
    document.getElementById('mensajeError').textContent = '';
    document.getElementById('sidebar').classList.remove('mostrar');
    cambiarPestaña('movimientos');
}

// =====================================================
// ===== 🔄 ACTUALIZAR INFORMACIÓN =====
// =====================================================
async function actualizarInformacion() {
    await cargarDatosFirebase();
    alert('✅ Datos actualizados');
}

// =====================================================
// ===== 📥 CARGAR DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosFirebase() {
    try {
        ultimoCambioDatos = Date.now();

        // Movimientos
        const snapMov = await db.collection('movimientos').get();
        movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));

        // Colaboradores
        const snapCol = await db.collection('colaboradores').get();
        colaboradores = snapCol.docs.map(d => ({ id: d.id, ...d.data() }));

        // Vehículos Movimientos
        const snapVehM = await db.collection('vehiculos_movimientos').get();
        vehiculosMov = snapVehM.docs.map(d => ({ id: d.id, ...d.data() }));

        // Vehículos Transportadora
        const snapVehT = await db.collection('vehiculos_transportadora').get();
        vehiculosTransp = snapVehT.docs.map(d => ({ id: d.id, ...d.data() }));

        // Conductores Transportadora
        const snapCond = await db.collection('conductores_transportadora').get();
        conductores = snapCond.docs.map(d => ({ id: d.id, ...d.data() }));

        // Kilometraje
        const snapKm = await db.collection('kilometraje').get();
        kilometraje = snapKm.docs.map(d => ({ id: d.id, ...d.data() }));

        // Tanqueo
        const snapTan = await db.collection('tanqueo').get();
        tanqueo = snapTan.docs.map(d => ({ id: d.id, ...d.data() }));

        // Actualizar selects y listas
        actualizarSelects();
        dibujarMovimientosHoy();
        dibujarDisponibilidad();
        dibujarPendientesKilometraje();

    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

// =====================================================
// ===== 🔄 ACTUALIZAR SELECTS =====
// =====================================================
function actualizarSelects() {
    // Vehículos Movimientos
    const selVeh = ['vehiculoMov', 'vehiculoKm'];
    selVeh.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        vehiculosMov.forEach(v => {
            s.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`;
        });
        s.value = sel;
    });

    // Colaboradores / Conductores
    const selCol = ['conductorMov', 'quienRegistraKm', 'quienTanquea'];
    selCol.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        colaboradores.filter(c => (c.estado || 'activo') === 'activo').forEach(c => {
            s.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
        });
        s.value = sel;
    });
}

// =====================================================
// ===== 📦 MOVIMIENTOS - SALIDA =====
// =====================================================
async function guardarMovimiento() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaMov').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('conductorMov').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value;

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Completa Fecha, Vehículo, Conductor y Hora de Salida');
    }

    const recogidas = obtenerRecogidasActuales();
    const totalKilos = recogidas.reduce((s, r) => s + (parseFloat(r.kilos) || 0), 0);
    const totalCanLlegada = recogidas.reduce((s, r) => s + (parseInt(r.canastillas) || 0), canLlegada);

    const datos = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: totalCanLlegada,
        kilosTotales: totalKilos,
        observaciones,
        recogidas,
        estado: horaLlegada ? 'completado' : 'pendiente',
        usuarioCreo: usuarioActivo.usuario,
        nombreUsuario: usuarioActivo.nombre,
        fechaCreacion: new Date(),
        fechaEdicion: null,
        usuarioEdito: null
    };

    try {
        if (idEdicion) {
            datos.fechaEdicion = new Date();
            datos.usuarioEdito = usuarioActivo.usuario;
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(datos);
            alert('✅ Movimiento guardado');
        }
        limpiarFormularioMovimiento();
        await cargarDatosFirebase();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function obtenerRecogidasActuales() {
    const cajas = document.querySelectorAll('#listaRecogidas .fila-recogida');
    const lista = [];
    cajas.forEach(c => {
        const recogio = c.querySelector('[name="recogio"]')?.value || '';
        const nombre = c.querySelector('[name="colaboradorRecogido"]')?.value || '';
        const kilos = c.querySelector('[name="kilosRecogido"]')?.value || 0;
        const canastillas = c.querySelector('[name="canastillasRecogido"]')?.value || 0;
        if (nombre || kilos || canastillas) {
            lista.push({ recogio, nombre, kilos, canastillas });
        }
    });
    return lista;
}

function agregarRecogida() {
    const lista = document.getElementById('listaRecogidas');
    const opciones = colaboradores.filter(c => (c.estado || 'activo') === 'activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const div = document.createElement('div');
    div.className = 'fila-recogida';
    div.innerHTML = `
        <label>Recogió:</label>
        <select name="recogio"><option value="">Seleccione...</option>${opciones}</select>
        <label>A:</label>
        <select name="colaboradorRecogido"><option value="">Seleccione...</option>${opciones}</select>
        <label>Kilos:</label>
        <input type="number" name="kilosRecogido" min="0" style="width:70px" oninput="actualizarTotalesRecogidas()">
        <label>Canastillas:</label>
        <input type="number" name="canastillasRecogido" min="0" style="width:70px" oninput="actualizarTotalesRecogidas()">
        <button type="button" class="btn-peligro text-xs py-1 px-2" onclick="this.parentElement.remove(); actualizarTotalesRecogidas()">✕</button>
    `;
    lista.appendChild(div);
}

function actualizarTotalesRecogidas() {
    const recogidas = obtenerRecogidasActuales();
    const totalKilos = recogidas.reduce((s, r) => s + (parseFloat(r.kilos) || 0), 0);
    const totalCan = recogidas.reduce((s, r) => s + (parseInt(r.canastillas) || 0), 0);
    document.getElementById('kilosTotal').value = totalKilos || '';
    const canSal = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    document.getElementById('canLlegadaTotal').value = (canSal + totalCan) || '';
}

function limpiarFormularioMovimiento() {
    document.getElementById('fechaMov').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('conductorMov').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('observacionesMov').value = '';
    document.getElementById('kilosTotal').value = '';
    document.getElementById('listaRecogidas').innerHTML = '';
    idEdicion = null;
}

async function completarMovimiento() {
    reiniciarTiempoSesion();
    if (!idEdicion) return alert('⚠️ Primero busque o seleccione un movimiento para completar');
    const horaLleg = document.getElementById('horaLlegada').value;
    if (!horaLleg) return alert('⚠️ Escriba la Hora de Llegada');
    await guardarMovimiento();
}

// =====================================================
// ===== 📋 MOSTRAR MOVIMIENTOS =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const todos = document.getElementById('submov-todos');
    const pend = document.getElementById('submov-pendientes');
    const buscado = document.getElementById('buscarMov')?.value?.toLowerCase() || '';

    const filtroPend = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada);
    const filtroTodos = movimientos.filter(m => {
        if (m.fecha !== hoy) return false;
        if (!buscado) return true;
        return m.placa?.toLowerCase().includes(buscado) || m.conductor?.toLowerCase().includes(buscado);
    });

    if (pend) pend.innerHTML = filtroPend.length === 0
        ? '<p class="text-center text-sm">✅ Sin movimientos pendientes de llegada</p>'
        : filtroPend.map(m => dibujarFilaMov(m)).join('');

    if (todos) todos.innerHTML = filtroTodos.length === 0
        ? '<p class="text-center text-sm">📭 Sin movimientos registrados hoy</p>'
        : filtroTodos.map(m => dibujarFilaMov(m)).join('');
}

function dibujarFilaMov(m) {
    let clases = m.horaLlegada ? 'fila-movimiento completado' : 'fila-movimiento pendiente';
    let infoRecogidas = '';
    if (m.recogidas && m.recogidas.length > 0) {
        infoRecogidas = m.recogidas.map(r =>
            `<br>↳ Recogió: ${r.recogio || '-'} → ${r.nombre || '-'} | ${r.kilos || 0}kg | ${r.canastillas || 0}can`
        ).join('');
    }
    return `
    <div class="${clases}">
        <div class="flex justify-between items-start flex-wrap gap-2">
            <div>
                <strong>${m.fecha} | ${m.placa} | ${m.conductor}</strong><br>
                Salida: ${m.horaSalida || '-'} | Llegada: ${m.horaLlegada || '⏳ Pendiente'}<br>
                📦 Salida: ${m.canastillasSalida || 0} | Llegada: ${m.canastillasLlegada || 0} | ⚖️ ${m.kilosTotales || 0}kg
                ${infoRecogidas}
                ${m.observaciones ? `<br>📝 ${m.observaciones}` : ''}
                <br><small>Reg: ${m.nombreUsuario || m.usuarioCreo || '?'} ${m.fechaCreacion?.toDate ? m.fechaCreacion.toDate().toLocaleString() : ''}</small>
            </div>
            <div class="flex gap-1">
                <button class="btn-editar" onclick="cargarMovimientoEditar('${m.id}')">✏️ Editar</button>
                ${usuarioActivo?.rol === 'admin' ? `<button class="btn-peligro text-xs py-1 px-2" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` : ''}
            </div>
        </div>
    </div>`;
}

async function cargarMovimientoEditar(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('conductorMov').value = m.conductor;
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.canastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = m.canastillasLlegada || '';
    document.getElementById('observacionesMov').value = m.observaciones || '';
    document.getElementById('kilosTotal').value = m.kilosTotales || '';

    // Cargar recogidas
    const lista = document.getElementById('listaRecogidas');
    lista.innerHTML = '';
    if (m.recogidas && m.recogidas.length > 0) {
        m.recogidas.forEach(r => {
            agregarRecogida();
            const ult = lista.lastElementChild;
            ult.querySelector('[name="recogio"]').value = r.recogio || '';
            ult.querySelector('[name="colaboradorRecogido"]').value = r.nombre || '';
            ult.querySelector('[name="kilosRecogido"]').value = r.kilos || '';
            ult.querySelector('[name="canastillasRecogido"]').value = r.canastillas || '';
        });
    }

    // Ir a pestaña de registro
    cambiarSubpestañaMov('registro');
}

async function eliminarMovimiento(id) {
    if (usuarioActivo.rol !== 'admin') return alert('🔒 Solo el administrador puede eliminar');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosFirebase();
}

function buscarMovimientos() {
    dibujarMovimientosHoy();
}

// =====================================================
// ===== ✅ DISPONIBILIDAD =====
// =====================================================
function dibujarDisponibilidad() {
    const hoy = new Date().toISOString().split('T')[0];
    const enRutaPlacas = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada).map(m => m.placa);
    const enRutaCond = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada).map(m => m.conductor);

    const dispVeh = vehiculosMov.filter(v => !enRutaPlacas.includes(v.placa)).map(v => `<span class="etiqueta etiqueta-exito">${v.placa}</span>`).join('') || '<span class="text-sm">Ninguno</span>';
    const rutaVeh = enRutaPlacas.map(p => `<span class="etiqueta etiqueta-pendiente">${p}</span>`).join('') || '<span class="text-sm">Ninguno</span>';

    const dispCond = colaboradores.filter(c => (c.estado || 'activo') === 'activo' && !enRutaCond.includes(c.nombre)).map(c => `<span class="etiqueta etiqueta-exito">${c.nombre}</span>`).join('') || '<span class="text-sm">Ninguno</span>';
    const rutaCond = enRutaCond.map(c => `<span class="etiqueta etiqueta-pendiente">${c}</span>`).join('') || '<span class="text-sm">Ninguno</span>';

    const elDV = document.getElementById('vehiculosDisponibles');
    const elRV = document.getElementById('vehiculosEnRuta');
    const elDC = document.getElementById('colaboradoresDisponibles');
    const elRC = document.getElementById('colaboradoresEnRuta');

    if (elDV) elDV.innerHTML = dispVeh;
    if (elRV) elRV.innerHTML = rutaVeh;
    if (elDC) elDC.innerHTML = dispCond;
    if (elRC) elRC.innerHTML = rutaCond;
}

// =====================================================
// ===== 🚛 TRANSPORTADORA =====
// =====================================================
async function agregarConductorTransp() {
    reiniciarTiempoSesion();
    const nom = document.getElementById('nombreConductorTransp').value.trim();
    if (!nom) return alert('Escriba el nombre');
    await db.collection('conductores_transportadora').add({ nombre: nom, fecha: new Date() });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
    await cargarDatosFirebase();
}

async function agregarVehiculoTransp() {
    reiniciarTiempoSesion();
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
    await cargarDatosFirebase();
}

// =====================================================
// ===== ⛽ COMBUSTIBLE - KILOMETRAJE =====
// =====================================================
async function guardarKilometrajeDiario() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;

    if (!fecha || !placa || kmManana === null) {
        return alert('⚠️ Fecha, Placa y Kilometraje de la Mañana son obligatorios');
    }
    const kmRecorridos = (kmManana !== null && kmTarde !== null) ? (kmTarde - kmManana).toFixed(1) : null;

    await db.collection('kilometraje').add({
        fecha, placa,
        kmInicial: kmManana,
        kmFinal: kmTarde,
        kmRecorridos,
        colaborador: document.getElementById('quienRegistraKm').value,
        usuario: usuarioActivo.usuario,
        fechaCreacion: new Date()
    });
    alert('✅ Kilometraje guardado');
    document.getElementById('fechaKm').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoKm').value = '';
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
    document.getElementById('quienRegistraKm').value = '';
    await cargarDatosFirebase();
}

function dibujarPendientesKilometraje() {
    const hoy = new Date().toISOString().split('T')[0];
    const pend = kilometraje.filter(k => k.fecha === hoy && !k.kmFinal);
    const c = document.getElementById('pendientesKilometraje');
    if (!c) return;
    if (pend.length === 0) {
        c.innerHTML = '<p class="text-sm">✅ Sin pendientes</p>';
        return;
    }
    c.innerHTML = pend.map(k => `
        <div class="fila-pendiente">
            <strong>${k.placa}</strong> | Mañana: ${k.kmInicial} | Tarde: ⏳ Pendiente
            <button class="btn-exito text-xs py-1 px-2" onclick="completarKmTarde('${k.id}','${k.placa}',${k.kmInicial})">✅ Completar</button>
        </div>
    `).join('');
}

async function completarKmTarde(id, placa, kmIni) {
    const kmFin = prompt(`Escriba kilometraje de la tarde para ${placa}:`);
    if (!kmFin) return;
    const kmF = parseFloat(kmFin);
    const rec = (kmF - kmIni).toFixed(1);
    await db.collection('kilometraje').doc(id).update({ kmFinal: kmF, kmRecorridos: rec });
    alert('✅ Actualizado');
    await cargarDatosFirebase();
}

async function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKilometraje');
    if (res.length === 0) return c.innerHTML = '<p class="text-sm">📭 Sin registros</p>';
    let html = '<table class="tabla-datos"><thead><tr><th>Fecha</th><th>Placa</th><th>Mañana</th><th>Tarde</th><th>Recorridos</th><th>Registró</th></tr></thead><tbody>';
    res.forEach(r => {
        html += `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmInicial}</td><td>${r.kmFinal || '-'}</td><td>${r.kmRecorridos || '-'}</td><td>${r.colaborador}</td></tr>`;
    });
    html += '</tbody></table>';
    c.innerHTML = html;
}

async function guardarRegistroTanqueo() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = parseFloat(document.getElementById('galonesTanqueo').value);
    const nivel = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const quien = document.getElementById('quienTanquea').value;

    if (!fecha || !placa || !galones || !quien) return alert('Complete todos los campos');

    await db.collection('tanqueo').add({
        fecha, placa, galones, nivel, porcentaje, quien,
        usuario: usuarioActivo.usuario,
        fechaCreacion: new Date()
    });
    alert('✅ Tanqueo guardado');
    document.getElementById('fechaTanqueo').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('quienTanquea').value = '';
    await cargarDatosFirebase();
}

async function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo').value;
    const ff = document.getElementById('fechaFinTanqueo').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fecha >= fi && t.fecha <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanqueo');
    if (res.length === 0) return c.innerHTML = '<p class="text-sm">📭 Sin registros</p>';
    let html = '<table class="tabla-datos"><thead><tr><th>Fecha</th><th>Placa</th><th>Galones</th><th>Nivel</th><th>%</th><th>Quién</th></tr></thead><tbody>';
    res.forEach(r => {
        html += `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.nivel}</td><td>${r.porcentaje}%</td><td>${r.quien}</td></tr>`;
    });
    html += '</tbody></table>';
    c.innerHTML = html;
}

// =====================================================
// ===== 📊 INFORMES =====
// =====================================================
async function generarInformeMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const c = document.getElementById('resultadoInformeMov');
    if (res.length === 0) return c.innerHTML = '<p class="text-sm">📭 Sin movimientos en este período</p>';

    let totalCanSal = 0, totalCanLleg = 0, totalKg = 0;
    res.forEach(m => {
        totalCanSal += m.canastillasSalida || 0;
        totalCanLleg += m.canastillasLlegada || 0;
        totalKg += m.kilosTotales || 0;
    });

    let html = `<p class="font-bold mb-2">Total: ${res.length} movimientos | 📦 Salida: ${totalCanSal} | Llegada: ${totalCanLleg} | ⚖️ ${totalKg}kg</p>`;
    html += '<table class="tabla-datos"><thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Can Salida</th><th>Can Llegada</th><th>Kilos</th><th>Observaciones</th></tr></thead><tbody>';
    res.forEach(m => {
        html += `<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.conductor}</td><td>${m.horaSalida}</td><td>${m.horaLlegada || '-'}</td><td>${m.canastillasSalida}</td><td>${m.canastillasLlegada}</td><td>${m.kilosTotales}</td><td>${m.observaciones || '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    c.innerHTML = html;
}

function exportarInformeMovExcel() {
    if (ultimosResultados.movimientos.length === 0) return alert('Genera el informe primero');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.conductor,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || '-',
        CanastillasSalida: m.canastillasSalida,
        CanastillasLlegada: m.canastillasLlegada,
        Kilos: m.kilosTotales,
        Observaciones: m.observaciones || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportarKilometrajeExcel() {
    if (ultimosResultados.kilometraje.length === 0) return alert('Consulta primero el informe');
    const datos = ultimosResultados.kilometraje.map(r => ({
        Fecha: r.fecha, Placa: r.placa, KmInicial: r.kmInicial, KmFinal: r.kmFinal || '-', Recorridos: r.kmRecorridos || '-', Registró: r.colaborador
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Kilometraje');
    XLSX.writeFile(libro, `Kilometraje_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportarTanqueoExcel() {
    if (ultimosResultados.tanqueo.length === 0) return alert('Consulta primero el informe');
    const datos = ultimosResultados.tanqueo.map(r => ({
        Fecha: r.fecha, Placa: r.placa, Galones: r.galones, Nivel: r.nivel, Porcentaje: r.porcentaje, Quien: r.quien
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Tanqueo');
    XLSX.writeFile(libro, `Tanqueo_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// =====================================================
// ===== ⚙️ ADMINISTRACIÓN - USUARIOS =====
// =====================================================
async function guardarUsuarioSistema() {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administradores');
    const usu = document.getElementById('usuarioNuevo').value.trim();
    const cla = document.getElementById('claveNuevo').value;
    const nom = document.getElementById('nombreCompletoUsuario').value.trim();
    const rol = document.getElementById('rolUsuario').value;
    const puedeEditar = document.getElementById('puedeEditarDatos').checked;

    if (!usu || !cla || !nom) return alert('Complete todos los campos');
    await db.collection('usuarios_sistema').add({
        usuario: usu, clave: cla, nombre: nom, rol, puedeEditar,
        fechaCreacion: new Date(),
        creadoPor: usuarioActivo.usuario
    });
    alert('✅ Usuario guardado');
    document.getElementById('usuarioNuevo').value = '';
    document.getElementById('claveNuevo').value = '';
    document.getElementById('nombreCompletoUsuario').value = '';
    document.getElementById('rolUsuario').value = 'usuario';
    document.getElementById('puedeEditarDatos').checked = true;
    cargarUsuariosSistema();
}

async function cargarUsuariosSistema() {
    if (usuarioActivo?.rol !== 'admin') return;
    const snap = await db.collection('usuarios_sistema').get();
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const c = document.getElementById('listaUsuariosSistema');
    if (lista.length === 0) {
        c.innerHTML = '<p class="text-sm">Sin usuarios registrados</p>';
        return;
    }
    c.innerHTML = '<table class="tabla-datos"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Clave</th><th>Permisos</th><th>Acciones</th></tr></thead><tbody>';
    lista.forEach(u => {
        c.innerHTML += `<tr>
            <td>${u.usuario}</td>
            <td>${u.nombre}</td>
            <td>${u.rol === 'admin' ? '🔴 Admin' : '🔵 Usuario'}</td>
            <td>${u.clave}</td>
            <td>${u.puedeEditar ? '✅ Editar' : '👁️ Solo ver'}</td>
            <td>
                <button class="btn-editar text-xs py-1 px-2" onclick="cargarEditarUsuario('${u.id}','${u.usuario}','${u.clave}','${u.nombre}','${u.rol}','${u.puedeEditar}')">✏️</button>
                <button class="btn-peligro text-xs py-1 px-2" onclick="eliminarUsuarioSistema('${u.id}')">🗑️</button>
            </td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

function cargarEditarUsuario(id, usu, cla, nom, rol, editar) {
    document.getElementById('usuarioNuevo').value = usu;
    document.getElementById('claveNuevo').value = cla;
    document.getElementById('nombreCompletoUsuario').value = nom;
    document.getElementById('rolUsuario').value = rol;
    document.getElementById('puedeEditarDatos').checked = editar === 'true';
}

async function eliminarUsuarioSistema(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    await db.collection('usuarios_sistema').doc(id).delete();
    alert('✅ Eliminado');
    cargarUsuariosSistema();
}

async function cambiarContrasena() {
    const actual = document.getElementById('claveActual').value;
    const nueva1 = document.getElementById('claveNueva1').value;
    const nueva2 = document.getElementById('claveNueva2').value;

    if (!actual || !nueva1 || !nueva2) return alert('Complete todos los campos');
    if (nueva1 !== nueva2) return alert('⚠️ Las contraseñas nuevas no coinciden');

    const fijo = usuariosFijos.find(u => u.usuario === usuarioActivo.usuario);
    if (fijo) {
        if (fijo.clave !== actual) return alert('⚠️ Contraseña actual incorrecta');
        fijo.clave = nueva1;
        alert('✅ Contraseña cambiada con éxito');
        document.getElementById('claveActual').value = '';
        document.getElementById('claveNueva1').value = '';
        document.getElementById('claveNueva2').value = '';
        return;
    }

    alert('⚠️ Usuario no puede cambiar contraseña desde esta versión');
}

// =====================================================
// ===== 🔧 MANTENIMIENTOS =====
// =====================================================
function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;
    const placas = [...new Set([...vehiculosMov.map(v => v.placa), ...vehiculosTransp.map(v => v.placa)])].sort();
    if (placas.length === 0) {
        c.innerHTML = '<p class="text-sm">Primero cree vehículos en Movimientos o Transportadora</p>';
        return;
    }
    c.innerHTML = placas.map(p => `<button class="btn-placa" onclick="seleccionarPlacaMant('${p}')">🚗 ${p}</button>`).join('');
}

function seleccionarPlacaMant(placa) {
    document.querySelectorAll('.btn-placa').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.getElementById('placaSeleccionada').textContent = placa;
    document.getElementById('formMantenimiento').classList.remove('oculto');
    document.getElementById('fechaIngreso').value = new Date().toISOString().split('T')[0];
    dibujarHistorialPlaca(placa);
}

function dibujarHistorialPlaca(placa) {
    const c = document.getElementById('historialVehiculo');
    const hist = []; // Aquí se cargarán los registros de mantenimiento
    c.innerHTML = '<p class="text-sm">📭 Sin registros de mantenimiento</p>';
}

async function registrarIngresoTaller() {
    const placa = document.getElementById('placaSeleccionada').textContent;
    const fecha = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMantenimiento').value.trim();
    const quien = document.getElementById('quienEntregaVehiculo').value.trim();

    if (!placa || !fecha || !motivo || !quien) return alert('Complete todos los campos');

    await db.collection('mantenimientos').add({
        placa, fecha, motivo, quien,
        usuario: usuarioActivo.usuario,
        fechaCreacion: new Date()
    });
    alert('✅ Ingreso a taller registrado');
    document.getElementById('motivoMantenimiento').value = '';
    document.getElementById('quienEntregaVehiculo').value = '';
    dibujarHistorialPlaca(placa);
}

// =====================================================
// ===== FIN DEL ARCHIVO =====
// =====================================================
