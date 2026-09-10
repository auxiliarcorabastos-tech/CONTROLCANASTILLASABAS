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
let mantenimientos = [];
let idEdicion = null;
let tiempoSesion;

// Usuarios fijos predeterminados
const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" }
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

    error.textContent = '❌ Usuario o contraseña incorrectos';
}

async function finalizarLogin() {
    document.getElementById('modalLogin').classList.add('oculto');

    // ✅ MOSTRAR PESTAÑA DE ADMINISTRACIÓN SOLO SI ES ADMIN
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        if (usuarioActivo.rol === 'admin') {
            btnAdmin.classList.remove('oculto'); // 👈 SOLO ADMIN LA VE
        } else {
            btnAdmin.classList.add('oculto');
        }
    }

    // Mostrar nombre de usuario
    const nom = document.getElementById('nombreUsuarioActivo');
    if (nom) nom.textContent = `Conectado: ${usuarioActivo.nombre} (${usuarioActivo.rol === 'admin' ? 'Admin' : 'Usuario'})`;

    await cargarDatosFirebase();
    reiniciarTiempoSesion();

    // Actualización automática cada 10s
    setInterval(cargarDatosFirebase, 10000);
}

// =====================================================
// ===== ⏰ CONTROL DE SESIÓN =====
// =====================================================
function reiniciarTiempoSesion() {
    clearTimeout(tiempoSesion);
    tiempoSesion = setTimeout(() => {
        alert('⏰ Sesión cerrada por inactividad (1 hora)');
        cerrarSesion();
    }, 60 * 60 * 1000);
}

function cerrarSesion() {
    usuarioActivo = null;
    clearTimeout(tiempoSesion);
    document.getElementById('modalLogin').classList.remove('oculto');
    document.getElementById('correoLogin').value = '';
    document.getElementById('passLogin').value = '';
    document.getElementById('mensajeError').textContent = '';
    document.getElementById('sidebar').classList.remove('mostrar');
    cambiarPestaña('movimientos');
}

// =====================================================
// ===== 🔄 ACTUALIZAR =====
// =====================================================
async function actualizarInformacion() {
    await cargarDatosFirebase();
    alert('✅ Datos actualizados');
}

// =====================================================
// ===== 📥 CARGAR DATOS FIREBASE =====
// =====================================================
async function cargarDatosFirebase() {
    try {
        const [snapMov, snapCol, snapVehM, snapVehT, snapCond, snapKm, snapTan, snapMant] = await Promise.all([
            db.collection('movimientos').get(),
            db.collection('colaboradores').get(),
            db.collection('vehiculos_movimientos').get(),
            db.collection('vehiculos_transportadora').get(),
            db.collection('conductores_transportadora').get(),
            db.collection('kilometraje').get(),
            db.collection('tanqueo').get(),
            db.collection('mantenimientos').get()
        ]);

        movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));
        colaboradores = snapCol.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosMov = snapVehM.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosTransp = snapVehT.docs.map(d => ({ id: d.id, ...d.data() }));
        conductores = snapCond.docs.map(d => ({ id: d.id, ...d.data() }));
        kilometraje = snapKm.docs.map(d => ({ id: d.id, ...d.data() }));
        tanqueo = snapTan.docs.map(d => ({ id: d.id, ...d.data() }));
        mantenimientos = snapMant.docs.map(d => ({ id: d.id, ...d.data() }));

        actualizarSelects();
        dibujarMovimientosHoy();
        dibujarDisponibilidad();
        dibujarPendientesKilometraje();
        dibujarListaPlacasMant(); // ✅ CARGAR MANTENIMIENTOS

    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

// =====================================================
// ===== 🔄 SELECTS =====
// =====================================================
function actualizarSelects() {
    const hoy = new Date().toISOString().split('T')[0];
    const selVeh = ['vehiculoMov', 'vehiculoKm', 'vehiculoTanqueo'];
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

    const activos = colaboradores.filter(c => (c.estado || 'activo') === 'activo');
    const selCol = ['conductorMov', 'quienRegistraKm', 'quienTanquea', 'recogio', 'colaboradorRecogido'];
    selCol.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        activos.forEach(c => {
            s.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
        });
        s.value = sel;
    });
}

// =====================================================
// ===== 📦 MOVIMIENTOS =====
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
        return alert('⚠️ Complete: Fecha, Vehículo, Conductor y Hora de Salida');
    }

    const recogidas = obtenerRecogidasActuales();
    const totalKilos = recogidas.reduce((s, r) => s + (parseFloat(r.kilos) || 0), 0);
    const totalCanLleg = recogidas.reduce((s, r) => s + (parseInt(r.canastillas) || 0), canLlegada);

    const datos = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: totalCanLleg,
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
    if (!idEdicion) return alert('⚠️ Primero busque y edite un movimiento para completar');
    const horaLleg = document.getElementById('horaLlegada').value;
    if (!horaLleg) return alert('⚠️ Escriba la Hora de Llegada');
    await guardarMovimiento();
}

// =====================================================
// ===== 📋 LISTAR MOVIMIENTOS =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const buscado = (document.getElementById('buscarMov')?.value || '').toLowerCase();

    // ⏳ PENDIENTES DE LLEGADA: SOLO los que NO tienen horaLlegada
    const pendientes = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada);
    // 📋 TODOS LOS DE HOY
    const todos = movimientos.filter(m => {
        if (m.fecha !== hoy) return false;
        if (!buscado) return true;
        return (m.placa || '').toLowerCase().includes(buscado) ||
               (m.conductor || '').toLowerCase().includes(buscado);
    });

    const cajaPend = document.getElementById('submov-pendientes');
    const cajaTodos = document.getElementById('submov-todos');

    if (cajaPend) {
        cajaPend.innerHTML = pendientes.length === 0
            ? '<p class="text-center p-4 text-sm">✅ No hay movimientos pendientes de llegada</p>'
            : pendientes.map(m => dibujarFilaMov(m)).join('');
    }

    if (cajaTodos) {
        cajaTodos.innerHTML = todos.length === 0
            ? '<p class="text-center p-4 text-sm">📭 Sin movimientos registrados hoy</p>'
            : todos.map(m => dibujarFilaMov(m)).join('');
    }
}

function dibujarFilaMov(m) {
    const esPendiente = !m.horaLlegada;
    let infoRecogidas = '';
    if (m.recogidas && m.recogidas.length > 0) {
        infoRecogidas = m.recogidas.map(r =>
            `<br>↳ Recogió: ${r.recogio || '-'} → ${r.nombre || '-'} | ${r.kilos || 0}kg | ${r.canastillas || 0}can`
        ).join('');
    }
    return `
    <div class="fila-movimiento ${esPendiente ? 'pendiente' : 'completado'}">
        <div class="flex justify-between items-start flex-wrap gap-2">
            <div>
                <strong>${m.fecha} | ${m.placa} | ${m.conductor}</strong>
                ${esPendiente ? '<span class="etiqueta etiqueta-pendiente ml-2">⏳ PENDIENTE</span>' : '<span class="etiqueta etiqueta-exito ml-2">✅ COMPLETADO</span>'}
                <br>
                Salida: ${m.horaSalida || '-'} | Llegada: ${m.horaLlegada || '⏳ Pendiente'}
                <br>
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
    cambiarSubpestañaMov('registro');
}

async function eliminarMovimiento(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo el administrador puede eliminar');
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

    const activos = colaboradores.filter(c => (c.estado || 'activo') === 'activo');
    const dispCond = activos.filter(c => !enRutaCond.includes(c.nombre)).map(c => `<span class="etiqueta etiqueta-exito">${c.nombre}</span>`).join('') || '<span class="text-sm">Ninguno</span>';
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
// ===== 🔧 MANTENIMIENTOS — CORREGIDO =====
// =====================================================
function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;

    // ✅ UNIR VEHÍCULOS DE MOVIMIENTOS + TRANSPORTADORA
    const todasPlacas = [
        ...vehiculosMov.map(v => ({ placa: v.placa, tipo: v.tipo || 'Movimiento' })),
        ...vehiculosTransp.map(v => ({ placa: v.placa, tipo: v.tipo || 'Transp' }))
    ];

    // Eliminar duplicados
    const unicas = [];
    const vistas = new Set();
    todasPlacas.forEach(v => {
        if (!vistas.has(v.placa)) { vistas.add(v.placa); unicas.push(v); }
    });
    unicas.sort((a, b) => a.placa.localeCompare(b.placa));

    if (unicas.length === 0) {
        c.innerHTML = '<p class="text-sm p-3">⚠️ Primero cree vehículos en Movimientos o Transportadora</p>';
        return;
    }

    c.innerHTML = unicas.map(v =>
        `<button type="button" class="btn-placa" onclick="seleccionarPlacaMant('${v.placa}')">🚗 ${v.placa} <small>(${v.tipo})</small></button>`
    ).join('');
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
    const hist = mantenimientos.filter(m => m.placa === placa).sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (hist.length === 0) {
        c.innerHTML = '<p class="text-sm p-2">📭 Sin registros de mantenimiento para esta placa</p>';
        return;
    }

    c.innerHTML = '<table class="tabla-datos"><thead><tr><th>Fecha</th><th>Motivo</th><th>Quién Entregó</th><th>Estado</th></tr></thead><tbody>';
    hist.forEach(m => {
        c.innerHTML += `<tr>
            <td>${m.fecha}</td>
            <td>${m.motivo}</td>
            <td>${m.quien || '-'}</td>
            <td>${m.estado || '🔧 En Taller'}</td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

async function registrarIngresoTaller() {
    const placa = document.getElementById('placaSeleccionada').textContent;
    const fecha = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMantenimiento').value.trim();
    const quien = document.getElementById('quienEntregaVehiculo').value.trim();

    if (!placa || !fecha || !motivo || !quien) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('mantenimientos').add({
        placa, fecha, motivo, quien,
        estado: '🔧 En Taller',
        usuario: usuarioActivo.usuario,
        fechaCreacion: new Date()
    });

    alert('✅ Ingreso a taller registrado');
    document.getElementById('motivoMantenimiento').value = '';
    document.getElementById('quienEntregaVehiculo').value = '';
    dibujarHistorialPlaca(placa);
    await cargarDatosFirebase();
}

// =====================================================
// ===== ⛽ COMBUSTIBLE =====
// =====================================================
async function guardarKilometrajeDiario() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;

    if (!fecha || !placa || kmManana === null) {
        return alert('⚠️ Fecha, Placa y Km de la Mañana son obligatorios');
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
    const kmFin = prompt(`Kilometraje de la tarde para ${placa}:`);
    if (!kmFin) return;
    const kmF = parseFloat(kmFin);
    const rec = (kmF - kmIni).toFixed(1);
    await db.collection('kilometraje').doc(id).update({ kmFinal: kmF, kmRecorridos: rec });
    alert('✅ Actualizado');
    await cargarDatosFirebase();
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
// ===== 📊 INFORMES =====
// =====================================================
async function generarInformeMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
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

// =====================================================
// ===== ⚙️ ADMINISTRACIÓN =====
// =====================================================
async function guardarUsuarioSistema() {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administradores');
    const usu = document.getElementById('usuarioNuevo').value.trim();
    const cla = document.getElementById('claveNuevo').value;
    const nom = document.getElementById('nombreCompletoUsuario').value.trim();
    const rol = document.getElementById('rolUsuario').value;

    if (!usu || !cla || !nom) return alert('Complete todos los campos');
    await db.collection('usuarios_sistema').add({
        usuario: usu, clave: cla, nombre: nom, rol,
        fechaCreacion: new Date(), creadoPor: usuarioActivo.usuario
    });
    alert('✅ Usuario guardado');
    document.getElementById('usuarioNuevo').value = '';
    document.getElementById('claveNuevo').value = '';
    document.getElementById('nombreCompletoUsuario').value = '';
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
    c.innerHTML = '<table class="tabla-datos"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Clave</th><th>Acciones</th></tr></thead><tbody>';
    lista.forEach(u => {
        c.innerHTML += `<tr>
            <td>${u.usuario}</td>
            <td>${u.nombre}</td>
            <td>${u.rol === 'admin' ? '🔴 Admin' : '🔵 Usuario'}</td>
            <td>${u.clave}</td>
            <td>
                <button class="btn-editar text-xs py-1 px-2" onclick="alert('Edición disponible próximamente')">✏️</button>
                <button class="btn-peligro text-xs py-1 px-2" onclick="eliminarUsuarioSistema('${u.id}')">🗑️</button>
            </td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
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
    if (fijo && fijo.clave === actual) {
        fijo.clave = nueva1;
        alert('✅ Contraseña cambiada con éxito');
        document.getElementById('claveActual').value = '';
        document.getElementById('claveNueva1').value = '';
        document.getElementById('claveNueva2').value = '';
        return;
    }
    alert('⚠️ Contraseña actual incorrecta');
}

// =====================================================
// ===== FIN DEL ARCHIVO =====
// =====================================================
