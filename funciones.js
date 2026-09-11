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
let tiempoSesion;

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" }
];

// =====================================================
// ===== 🔄 NAVEGACIÓN =====
// =====================================================
function cambiarPestaña(nombre) {
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    const pestaña = document.getElementById(`pest-${nombre}`);
    if (pestaña) pestaña.classList.remove('oculto');
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event?.target?.classList.add('activa');
    
    if (nombre === 'movimientos') dibujarMovimientosHoy();
    if (nombre === 'transportadora') { dibujarConductoresTransp(); dibujarVehiculosTransp(); dibujarMovimientosTransp(); }
    if (nombre === 'mantenimiento') dibujarListaPlacasMant();
    if (nombre === 'combustible') { cambiarSubpestañaCombustible('kilometraje'); dibujarPendientesKilometraje(); }
    if (nombre === 'informes') generarInformeMovimientos();
    if (nombre === 'admin') cargarUsuariosSistema();
}

function cambiarSubpestañaMov(nombre) {
    document.querySelectorAll('.btn-submov').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-mov').forEach(p => p.classList.add('oculto'));
    event?.target?.classList.add('activa');
    document.getElementById(`submov-${nombre}`)?.classList.remove('oculto');
}

function cambiarSubpestañaTransp(nombre) {
    document.querySelectorAll('.btn-subtransp').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-transp').forEach(p => p.classList.add('oculto'));
    event?.target?.classList.add('activa');
    document.getElementById(`subtransp-${nombre}`)?.classList.remove('oculto');
}

function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event?.target?.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`)?.classList.remove('oculto');
}

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
    document.getElementById('btnAdmin')?.classList.toggle('oculto', usuarioActivo.rol !== 'admin');
    const nom = document.getElementById('nombreUsuarioActivo');
    if (nom) nom.textContent = `Conectado: ${usuarioActivo.nombre} (${usuarioActivo.rol === 'admin' ? 'Admin' : 'Usuario'})`;
    await cargarDatosFirebase();
    reiniciarTiempoSesion();
    cambiarPestaña('movimientos');
    setInterval(cargarDatosFirebase, 10000);
}

function reiniciarTiempoSesion() {
    clearTimeout(tiempoSesion);
    tiempoSesion = setTimeout(() => {
        alert('⏰ Sesión cerrada por inactividad');
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
}

async function actualizarInformacion() {
    await cargarDatosFirebase();
    alert('✅ Datos actualizados');
}

// =====================================================
// ===== 📥 CARGAR DATOS DESDE FIREBASE =====
// =====================================================
async function cargarDatosFirebase() {
    try {
        const [snapMov, snapCol, snapVehM, snapVehT, snapCond, snapKm, snapTan, snapMant, snapMovT] = await Promise.all([
            db.collection('movimientos').get(),
            db.collection('colaboradores').get(),
            db.collection('vehiculos_movimientos').get(),
            db.collection('vehiculos_transportadora').get(),
            db.collection('conductores_transportadora').get(),
            db.collection('kilometraje').get(),
            db.collection('tanqueo').get(),
            db.collection('mantenimientos').get(),
            db.collection('movimientos_transportadora').get()
        ]);

        movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));
        colaboradores = snapCol.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosMov = snapVehM.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosTransp = snapVehT.docs.map(d => ({ id: d.id, ...d.data() }));
        conductores = snapCond.docs.map(d => ({ id: d.id, ...d.data() }));
        kilometraje = snapKm.docs.map(d => ({ id: d.id, ...d.data() }));
        tanqueo = snapTan.docs.map(d => ({ id: d.id, ...d.data() }));
        mantenimientos = snapMant.docs.map(d => ({ id: d.id, ...d.data() }));
        movimientosTransp = snapMovT.docs.map(d => ({ id: d.id, ...d.data() }));

        actualizarSelects();
        dibujarMovimientosHoy();
        dibujarConductoresTransp();
        dibujarVehiculosTransp();
        dibujarMovimientosTransp();
        dibujarListaPlacasMant();
        dibujarPendientesKilometraje();
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

function actualizarSelects() {
    const selVeh = ['vehiculoMov', 'vehiculoKm', 'vehiculoTanqueo'];
    selVeh.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        vehiculosMov.forEach(v => s.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo || 'Sin tipo'}</option>`);
        s.value = sel;
    });

    const selVehT = ['vehiculoTranspMov'];
    selVehT.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        vehiculosTransp.forEach(v => s.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`);
        s.value = sel;
    });

    const selCondT = ['conductorTranspMov'];
    selCondT.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        conductores.forEach(c => s.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
        s.value = sel;
    });

    const activos = colaboradores.filter(c => (c.estado || 'activo') === 'activo');
    const selCol = ['conductorMov', 'quienRegistraKm', 'quienTanquea', 'recogio', 'colaboradorRecogido', 'quienEntregaVehiculo', 'quienRecogeVehiculo'];
    selCol.forEach(id => {
        const s = document.getElementById(id);
        if (!s) return;
        const sel = s.value;
        s.innerHTML = '<option value="">Seleccione...</option>';
        activos.forEach(c => s.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
        s.value = sel;
    });
}

// =====================================================
// ===== 📦 MOVIMIENTOS DE CANASTILLAS =====
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
        return alert('⚠️ Complete Fecha, Vehículo, Conductor y Hora de Salida');
    }

    const recogidas = obtenerRecogidasActuales();
    const totalKilos = recogidas.reduce((s, r) => s + (parseFloat(r.kilos) || 0), 0);
    const totalCanLleg = recogidas.reduce((s, r) => s + (parseInt(r.canastillas) || 0), canLlegada);

    const datos = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: totalCanLleg,
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
        const entreganA = c.querySelector('[name="entreganA"]')?.value || '';
        const kilos = parseFloat(c.querySelector('[name="kilos"]')?.value) || 0;
        const canastillas = parseInt(c.querySelector('[name="canastillas"]')?.value) || 0;
        if (entreganA || kilos || canastillas) {
            lista.push({ recogio, entreganA, kilos, canastillas });
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
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;">
            <select name="recogio" style="flex:1;min-width:120px;"><option value="">Quién recogió</option>${opciones}</select>
            <select name="entreganA" style="flex:1;min-width:120px;"><option value="">Entregan a</option>${opciones}</select>
            <input type="number" name="kilos" placeholder="Kilos" style="width:80px;" oninput="actualizarTotalesRecogidas()">
            <input type="number" name="canastillas" placeholder="Canastillas" style="width:90px;" oninput="actualizarTotalesRecogidas()">
            <button type="button" class="btn-peligro" onclick="this.parentElement.remove();actualizarTotalesRecogidas()">✕</button>
        </div>`;
    lista.appendChild(div);
}

function actualizarTotalesRecogidas() {
    const recogidas = obtenerRecogidasActuales();
    const totalK = recogidas.reduce((s, r) => s + r.kilos, 0);
    const totalC = recogidas.reduce((s, r) => s + r.canastillas, 0);
    document.getElementById('kilosTotal').value = totalK || '';
    document.getElementById('canLlegadaTotal').value = totalC || '';
}

function limpiarFormularioMovimiento() {
    document.getElementById('fechaMov').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('conductorMov').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('kilosTotal').value = '';
    document.getElementById('observacionesMov').value = '';
    document.getElementById('listaRecogidas').innerHTML = '';
    idEdicion = null;
}

async function completarMovimiento() {
    if (!idEdicion) return alert('⚠️ Primero edite un movimiento');
    const hl = document.getElementById('horaLlegada').value;
    if (!hl) return alert('⚠️ Escriba Hora de Llegada');
    await guardarMovimiento();
}

function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const pendientes = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada);
    const todos = movimientos.filter(m => m.fecha === hoy);

    const cajaP = document.getElementById('listaMovPendientes');
    const cajaT = document.getElementById('listaMovTodos');

    if (cajaP) cajaP.innerHTML = pendientes.length === 0
        ? '<p class="p-3 text-sm">✅ Sin pendientes</p>'
        : pendientes.map(m => filaMovHtml(m)).join('');
    if (cajaT) cajaT.innerHTML = todos.length === 0
        ? '<p class="p-3 text-sm">📭 Sin movimientos hoy</p>'
        : todos.map(m => filaMovHtml(m)).join('');
}

function filaMovHtml(m) {
    const pend = !m.horaLlegada;
    return `
    <div style="border:1px solid #ddd;padding:10px;margin:6px 0;border-radius:6px;background:${pend?'#fff9e6':'#f9fff9'}">
        <strong>${m.fecha} | ${m.placa} | ${m.conductor}</strong>
        ${pend?'<span style="color:orange">⏳ Pendiente</span>':'<span style="color:green">✅ Completado</span>'}
        <br>🕒 Salida: ${m.horaSalida} | Llegada: ${m.horaLlegada||'—'}
        <br>📦 Salida: ${m.canastillasSalida} | Llegada: ${m.canastillasLlegada||'—'} | ⚖️ ${m.kilosTotales||0}kg
        ${m.recogidas?.length?`<br>📋 Recogidas: ${m.recogidas.length}`:''}
        <div style="margin-top:6px;display:flex;gap:6px;">
            <button onclick="cargarMovEditar('${m.id}')">✏️ Editar</button>
            ${usuarioActivo?.rol==='admin'?`<button onclick="eliminarMov('${m.id}')">🗑️</button>`:''}
        </div>
    </div>`;
}

async function cargarMovEditar(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('conductorMov').value = m.conductor;
    document.getElementById('horaSalida').value = m.horaSalida;
    document.getElementById('horaLlegada').value = m.horaLlegada||'';
    document.getElementById('canSalidaTotal').value = m.canastillasSalida;
    document.getElementById('canLlegadaTotal').value = m.canastillasLlegada||'';
    document.getElementById('kilosTotal').value = m.kilosTotales||'';
    document.getElementById('observacionesMov').value = m.observaciones||'';
    document.getElementById('listaRecogidas').innerHTML = '';
    if (m.recogidas?.length) {
        m.recogidas.forEach(r => {
            agregarRecogida();
            const ult = document.querySelector('#listaRecogidas .fila-recogida:last-child');
            ult.querySelector('[name="recogio"]').value = r.recogio||'';
            ult.querySelector('[name="entreganA"]').value = r.entreganA||'';
            ult.querySelector('[name="kilos"]').value = r.kilos||'';
            ult.querySelector('[name="canastillas"]').value = r.canastillas||'';
        });
    }
    cambiarSubpestañaMov('registro');
}

async function eliminarMov(id) {
    if (usuarioActivo?.rol!=='admin') return alert('🔒 Solo admin');
    if (!confirm('¿Eliminar?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosFirebase();
}
// =====================================================
// ===== 🚛 TRANSPORTADORA =====
// =====================================================

// ===== CONDUCTORES =====
async function agregarConductorTransp() {
    reiniciarTiempoSesion();
    const nom = document.getElementById('nombreConductorTransp').value.trim();
    if (!nom) return alert('⚠️ Escriba el nombre del conductor');
    await db.collection('conductores_transportadora').add({ 
        nombre: nom, 
        fechaCreacion: new Date(),
        estado: 'activo'
    });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
    await cargarDatosFirebase();
}

function dibujarConductoresTransp() {
    const c = document.getElementById('listaConductoresTransp');
    if (!c) return;
    if (conductores.length === 0) {
        c.innerHTML = '<p class="text-sm p-3">📭 Sin conductores registrados</p>';
        return;
    }
    c.innerHTML = `
    <table class="tabla-datos" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:8px;">Nombre del Conductor</th>
            <th style="border:1px solid #ccc;padding:8px;">Estado</th>
            <th style="border:1px solid #ccc;padding:8px;">Acciones</th>
        </tr></thead><tbody>`;
    conductores.forEach(cnd => {
        const est = cnd.estado || 'activo';
        c.innerHTML += `
        <tr>
            <td style="border:1px solid #ccc;padding:8px;">${cnd.nombre}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center;">${est === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center;">
                ${usuarioActivo?.rol === 'admin' 
                    ? `<button class="btn-peligro" style="padding:0.3rem 0.6rem;" onclick="eliminarConductorTransp('${cnd.id}')">🗑️ Eliminar</button>` 
                    : '-'}
            </td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

async function eliminarConductorTransp(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administradores');
    if (!confirm('¿Eliminar este conductor?')) return;
    await db.collection('conductores_transportadora').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosFirebase();
}

// ===== VEHÍCULOS =====
async function agregarVehiculoTransp() {
    reiniciarTiempoSesion();
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('⚠️ Complete placa y tipo de vehículo');
    await db.collection('vehiculos_transportadora').add({ 
        placa, tipo, 
        fechaCreacion: new Date(),
        estado: 'activo'
    });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
    await cargarDatosFirebase();
}

function dibujarVehiculosTransp() {
    const c = document.getElementById('listaVehiculosTransp');
    if (!c) return;
    if (vehiculosTransp.length === 0) {
        c.innerHTML = '<p class="text-sm p-3">📭 Sin vehículos registrados</p>';
        return;
    }
    c.innerHTML = `
    <table class="tabla-datos" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:8px;">Placa</th>
            <th style="border:1px solid #ccc;padding:8px;">Tipo de Vehículo</th>
            <th style="border:1px solid #ccc;padding:8px;">Estado</th>
            <th style="border:1px solid #ccc;padding:8px;">Acciones</th>
        </tr></thead><tbody>`;
    vehiculosTransp.forEach(v => {
        const est = v.estado || 'activo';
        c.innerHTML += `
        <tr>
            <td style="border:1px solid #ccc;padding:8px;font-weight:bold;">${v.placa}</td>
            <td style="border:1px solid #ccc;padding:8px;">${v.tipo}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center;">${est === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center;">
                ${usuarioActivo?.rol === 'admin' 
                    ? `<button class="btn-peligro" style="padding:0.3rem 0.6rem;" onclick="eliminarVehiculoTransp('${v.id}')">🗑️ Eliminar</button>` 
                    : '-'}
            </td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

async function eliminarVehiculoTransp(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administradores');
    if (!confirm('¿Eliminar este vehículo?')) return;
    await db.collection('vehiculos_transportadora').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosFirebase();
}

// ===== MOVIMIENTOS DE CANASTILLAS — TRANSPORTADORA =====
async function guardarMovimientoTransp() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaMovTransp').value;
    const placa = document.getElementById('vehiculoTranspMov').value;
    const conductor = document.getElementById('conductorTranspMov').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    const observaciones = document.getElementById('obsTransp').value;

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete: Fecha, Vehículo, Conductor y Hora de Salida');
    }

    const datos = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canastillasSalida: canSalida,
        canastillasLlegada: canLlegada,
        observaciones,
        estado: horaLlegada ? 'completado' : 'pendiente',
        usuarioCreo: usuarioActivo.usuario,
        nombreUsuario: usuarioActivo.nombre,
        fechaCreacion: new Date(),
        fechaEdicion: null,
        usuarioEdito: null
    };

    try {
        if (idEdicionTransp) {
            datos.fechaEdicion = new Date();
            datos.usuarioEdito = usuarioActivo.usuario;
            await db.collection('movimientos_transportadora').doc(idEdicionTransp).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos_transportadora').add(datos);
            alert('✅ Movimiento guardado');
        }
        limpiarFormularioTransp();
        await cargarDatosFirebase();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function limpiarFormularioTransp() {
    document.getElementById('fechaMovTransp').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoTranspMov').value = '';
    document.getElementById('conductorTranspMov').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('obsTransp').value = '';
    idEdicionTransp = null;
}

async function completarMovimientoTransp() {
    reiniciarTiempoSesion();
    if (!idEdicionTransp) return alert('⚠️ Primero busque y edite un movimiento para completar');
    const horaLleg = document.getElementById('horaLlegadaTransp').value;
    if (!horaLleg) return alert('⚠️ Escriba la Hora de Llegada y las Canastillas de Entrada');
    await guardarMovimientoTransp();
}

function dibujarMovimientosTransp() {
    const hoy = new Date().toISOString().split('T')[0];
    const pendientes = movimientosTransp.filter(m => m.fecha === hoy && !m.horaLlegada);
    const todos = movimientosTransp.filter(m => m.fecha === hoy);

    const cajaPend = document.getElementById('listaMovTranspPendientes');
    const cajaTodos = document.getElementById('listaMovTranspTodos');

    if (cajaPend) {
        cajaPend.innerHTML = pendientes.length === 0
            ? '<p class="text-center p-3 text-sm">✅ Sin movimientos pendientes de llegada</p>'
            : pendientes.map(m => dibujarFilaMovTransp(m)).join('');
    }
    if (cajaTodos) {
        cajaTodos.innerHTML = todos.length === 0
            ? '<p class="text-center p-3 text-sm">📭 Sin movimientos registrados hoy</p>'
            : todos.map(m => dibujarFilaMovTransp(m)).join('');
    }
}

function dibujarFilaMovTransp(m) {
    const esPendiente = !m.horaLlegada;
    return `
    <div class="fila-movimiento" style="border:1px solid #ddd; padding:12px; margin:8px 0; border-radius:8px; background:#fff;">
        <div class="flex justify-between items-start flex-wrap gap-2">
            <div>
                <strong>📅 ${m.fecha} | 🚗 ${m.placa} | 👤 ${m.conductor}</strong>
                ${esPendiente ? '<span style="color:orange; margin-left:8px;">⏳ PENDIENTE DE LLEGADA</span>' : '<span style="color:green; margin-left:8px;">✅ COMPLETADO</span>'}
                <br>🕒 Hora Salida: ${m.horaSalida || '-'} | 🕒 Hora Llegada: ${m.horaLlegada || '⏳ Pendiente'}
                <br>📦 Canastillas Salida: ${m.canastillasSalida || 0} | 📦 Canastillas Llegada: ${m.canastillasLlegada || '⏳ Pendiente'}
                ${m.observaciones ? `<br>📝 Observaciones: ${m.observaciones}` : ''}
                <br><small>📋 Registró: ${m.nombreUsuario || m.usuarioCreo || '?'} | ${m.fechaCreacion?.toDate ? m.fechaCreacion.toDate().toLocaleString() : ''}</small>
            </div>
            <div class="flex gap-2">
                <button class="btn-editar" style="padding:0.4rem 0.8rem;" onclick="cargarMovimientoTranspEditar('${m.id}')">✏️ Editar / Completar</button>
                ${usuarioActivo?.rol === 'admin' ? `<button class="btn-peligro" style="padding:0.4rem 0.8rem;" onclick="eliminarMovimientoTransp('${m.id}')">🗑️ Eliminar</button>` : ''}
            </div>
        </div>
    </div>`;
}

async function cargarMovimientoTranspEditar(id) {
    const m = movimientosTransp.find(x => x.id === id);
    if (!m) return;
    idEdicionTransp = id;
    document.getElementById('fechaMovTransp').value = m.fecha;
    document.getElementById('vehiculoTranspMov').value = m.placa;
    document.getElementById('conductorTranspMov').value = m.conductor;
    document.getElementById('horaSalidaTransp').value = m.horaSalida || '';
    document.getElementById('horaLlegadaTransp').value = m.horaLlegada || '';
    document.getElementById('canSalidaTransp').value = m.canastillasSalida || '';
    document.getElementById('canLlegadaTransp').value = m.canastillasLlegada || '';
    document.getElementById('obsTransp').value = m.observaciones || '';
    cambiarSubpestañaTransp('registro');
}

async function eliminarMovimientoTransp(id) {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo administradores');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos_transportadora').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosFirebase();
}

// =====================================================
// ===== 🔧 MANTENIMIENTO — 3 PESTAÑAS =====
// =====================================================

// ===== CAMBIAR SUBPESTAÑA =====
function cambiarSubpestañaMant(nombre) {
    document.querySelectorAll('.btn-submant').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-mant').forEach(p => p.classList.add('oculto'));
    event?.target?.classList.add('activa');
    document.getElementById(`submant-${nombre}`)?.classList.remove('oculto');
    const placa = document.getElementById('placaSeleccionada').textContent;
    if (placa && placa !== '—') {
        if (nombre === 'general') dibujarInfoGeneralVehiculo(placa);
        if (nombre === 'taller') dibujarHistorialTaller(placa);
        if (nombre === 'seguros') dibujarHistorialSeguros(placa);
    }
}

// ===== LISTA DE PLACAS =====
function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;
    const todasPlacas = [
        ...vehiculosMov.map(v => ({ placa: v.placa, tipo: v.tipo || 'Movimiento' })),
        ...vehiculosTransp.map(v => ({ placa: v.placa, tipo: v.tipo || 'Transp' }))
    ];
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
    cambiarSubpestañaMant('general');
}

function verVencimiento(fechaVenc) {
    if (!fechaVenc) return '<span style="color:red;">⚠️ Sin registrar</span>';
    const hoy = new Date();
    const ven = new Date(fechaVenc + 'T23:59:59');
    const dias = Math.ceil((ven - hoy) / (1000 * 60 * 60 * 24));
    if (dias < 0) return `<span style="color:red;">❌ Vencido hace ${-dias} días</span>`;
    if (dias <= 30) return `<span style="color:orange;">⚠️ Vence en ${dias} días</span>`;
    return `<span style="color:green;">✅ Vence en ${dias} días</span>`;
}

// ===== 1️⃣ PESTAÑA: INFORMACIÓN GENERAL =====
function dibujarInfoGeneralVehiculo(placa) {
    const c = document.getElementById('infoGeneralVehiculo');
    if (!c) return;

    const kmVeh = kilometraje.filter(k => k.placa === placa).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const ultKm = kmVeh[0];
    const tanVeh = tanqueo.filter(t => t.placa === placa).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const ultTan = tanVeh[0];
    const mantVeh = mantenimientos.filter(m => m.placa === placa && m.tipo === 'taller').sort((a, b) => (b.fechaIngreso || '').localeCompare(a.fechaIngreso || ''));
    const ultMant = mantVeh[0];
    const docVeh = mantenimientos.filter(m => m.placa === placa && m.tipo === 'seguro');
    const soat = docVeh.find(d => d.tipoDocumento === 'SOAT');
    const tecno = docVeh.find(d => d.tipoDocumento === 'Tecno-mecánica');
    const seguro = docVeh.find(d => d.tipoDocumento === 'Seguro');
    const totalMant = mantVeh.reduce((s, m) => s + (parseFloat(m.valor) || 0), 0);

    c.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px; margin-top:10px;">
        <div style="background:#f0f7ff; padding:12px; border-radius:8px;">
            <h4 style="font-weight:bold; margin-bottom:8px;">🚗 Datos del Vehículo</h4>
            <p><strong>Placa:</strong> ${placa}</p>
            <p><strong>Último Kilometraje:</strong> ${ultKm ? (ultKm.kmFinal || ultKm.kmInicial) + ' km' : 'Sin registro'}</p>
            <p><strong>Último Combustible:</strong> ${ultTan ? ultTan.galones + ' galones / ' + ultTan.nivel : 'Sin registro'}</p>
        </div>
        <div style="background:#fff9e6; padding:12px; border-radius:8px;">
            <h4 style="font-weight:bold; margin-bottom:8px;">📋 Vencimiento Documentos</h4>
            <p><strong>SOAT:</strong> ${soat ? (soat.fechaVencimiento || 'Sin vencimiento') : 'Sin registrar'} ${verVencimiento(soat?.fechaVencimiento)}</p>
            <p><strong>Tecno-mecánica:</strong> ${tecno ? (tecno.fechaVencimiento || 'Sin vencimiento') : 'Sin registrar'} ${verVencimiento(tecno?.fechaVencimiento)}</p>
            <p><strong>Seguro:</strong> ${seguro ? (seguro.fechaVencimiento || 'Sin vencimiento') : 'Sin registrar'} ${verVencimiento(seguro?.fechaVencimiento)}</p>
        </div>
        <div style="background:#fff0f0; padding:12px; border-radius:8px;">
            <h4 style="font-weight:bold; margin-bottom:8px;">🔧 Último Ingreso a Taller</h4>
            <p><strong>Fecha Ingreso:</strong> ${ultMant?.fechaIngreso || 'Sin registro'}</p>
            <p><strong>Diagnóstico:</strong> ${ultMant?.diagnostico || '—'}</p>
            <p><strong>Costo:</strong> ${ultMant?.valor ? '$' + ultMant.valor : 'Sin registro'}</p>
        </div>
    </div>
    <div style="background:#e6ffe6; padding:12px; border-radius:8px; margin-top:10px;">
        <h4 style="font-weight:bold;">💰 COSTO TOTAL EN MANTENIMIENTOS Y REPARACIONES: $${totalMant.toFixed(0)}</h4>
    </div>`;
}

// ===== 2️⃣ PESTAÑA: TALLER =====
async function registrarIngresoTaller() {
    const placa = document.getElementById('placaSeleccionada').textContent;
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienEntregó = document.getElementById('quienEntregaVehiculo').value.trim();
    
    if (!placa || !fechaIngreso || !quienEntregó) {
        return alert('⚠️ Complete: Fecha y Quién entregó el vehículo');
    }

    await db.collection('mantenimientos').add({
        placa,
        tipo: 'taller',
        fechaIngreso,
        quienEntregó,
        fechaRecogida: null,
        quienRecogió: '',
        diagnostico: '',
        valor: '',
        estado: '🔧 En Taller',
        usuarioCreo: usuarioActivo.usuario,
        nombreUsuario: usuarioActivo.nombre,
        fechaCreacion: new Date()
    });

    alert('✅ Ingreso a taller registrado');
    document.getElementById('fechaIngresoTaller').value = new Date().toISOString().split('T')[0];
    document.getElementById('quienEntregaVehiculo').value = '';
    dibujarHistorialTaller(placa);
    await cargarDatosFirebase();
}

async function recogerVehiculo(id) {
    const fechaRecogida = new Date().toISOString().split('T')[0];
    const quienRecogió = document.getElementById('quienRecogeVehiculo').value.trim();
    const diagnostico = document.getElementById('diagnosticoTaller').value.trim();
    const valor = document.getElementById('costoTaller').value.trim();

    if (!quienRecogió || !diagnostico || !valor) {
        return alert('⚠️ Complete: Quién recoge, Diagnóstico y Costo');
    }

    await db.collection('mantenimientos').doc(id).update({
        fechaRecogida,
        quienRecogió,
        diagnostico,
        valor,
        estado: '✅ Recogido',
        usuarioEdito: usuarioActivo.usuario,
        fechaEdicion: new Date()
    });

    alert('✅ Vehículo recogido y registrado');
    const placa = document.getElementById('placaSeleccionada').textContent;
    document.getElementById('diagnosticoTaller').value = '';
    document.getElementById('costoTaller').value = '';
    document.getElementById('quienRecogeVehiculo').value = '';
    dibujarHistorialTaller(placa);
    dibujarInfoGeneralVehiculo(placa);
    await cargarDatosFirebase();
}

function dibujarHistorialTaller(placa) {
    const c = document.getElementById('historialTaller');
    const hist = mantenimientos.filter(m => m.placa === placa && m.tipo === 'taller').sort((a, b) => (b.fechaIngreso || '').localeCompare(a.fechaIngreso || ''));
    if (hist.length === 0) {
        c.innerHTML = '<p class="text-sm p-3">📭 Sin ingresos a taller para esta placa</p>';
        return;
    }
    c.innerHTML = `
    <table class="tabla-datos" style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:6px;">Fecha Ingreso</th>
            <th style="border:1px solid #ccc;padding:6px;">Quién Entregó</th>
            <th style="border:1px solid #ccc;padding:6px;">Fecha Recogida</th>
            <th style="border:1px solid #ccc;padding:6px;">Quién Recogió</th>
            <th style="border:1px solid #ccc;padding:6px;">Diagnóstico</th>
            <th style="border:1px solid #ccc;padding:6px;">Costo</th>
            <th style="border:1px solid #ccc;padding:6px;">Estado</th>
        </tr></thead><tbody>`;
    hist.forEach(m => {
        c.innerHTML += `
        <tr>
            <td style="border:1px solid #ccc;padding:6px;">${m.fechaIngreso || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.quienEntregó || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.fechaRecogida || '⏳ Pendiente'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.quienRecogió || '⏳ Pendiente'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.diagnostico || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.valor ? '$' + m.valor : '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.estado}</td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

// ===== 3️⃣ PESTAÑA: SEGUROS Y DOCUMENTOS =====
async function registrarDocumentoSeguro() {
    const placa = document.getElementById('placaSeleccionada').textContent;
    const tipoDoc = document.getElementById('tipoDocumentoSeguro').value;
    const fechaEmision = document.getElementById('fechaEmisionDoc').value;
    const fechaVencimiento = document.getElementById('fechaVencimientoDoc').value;

    if (!placa || !tipoDoc || !fechaEmision || !fechaVencimiento) {
        return alert('⚠️ Complete todos los campos: Tipo, Emisión y Vencimiento');
    }

    await db.collection('mantenimientos').add({
        placa,
        tipo: 'seguro',
        tipoDocumento: tipoDoc,
        fechaEmision,
        fechaVencimiento,
        estado: '✅ Vigente',
        usuarioCreo: usuarioActivo.usuario,
        nombreUsuario: usuarioActivo.nombre,
        fechaCreacion: new Date()
    });

    alert(`✅ ${tipoDoc} registrado correctamente`);
    document.getElementById('tipoDocumentoSeguro').value = 'SOAT';
    document.getElementById('fechaEmisionDoc').value = '';
    document.getElementById('fechaVencimientoDoc').value = '';
    dibujarHistorialSeguros(placa);
    dibujarInfoGeneralVehiculo(placa);
    await cargarDatosFirebase();
}

function dibujarHistorialSeguros(placa) {
    const c = document.getElementById('historialSeguros');
    const hist = mantenimientos.filter(m => m.placa === placa && m.tipo === 'seguro').sort((a, b) => (b.fechaVencimiento || '').localeCompare(a.fechaVencimiento || ''));
    if (hist.length === 0) {
        c.innerHTML = '<p class="text-sm p-3">📭 Sin documentos registrados para esta placa</p>';
        return;
    }
    c.innerHTML = `
    <table class="tabla-datos" style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:6px;">Documento</th>
            <th style="border:1px solid #ccc;padding:6px;">Fecha Emisión</th>
            <th style="border:1px solid #ccc;padding:6px;">Fecha Vencimiento</th>
            <th style="border:1px solid #ccc;padding:6px;">Estado</th>
        </tr></thead><tbody>`;
    hist.forEach(m => {
        c.innerHTML += `
        <tr>
            <td style="border:1px solid #ccc;padding:6px;">${m.tipoDocumento}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.fechaEmision || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.fechaVencimiento || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${verVencimiento(m.fechaVencimiento)}</td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

// =====================================================
// ===== ⛽ COMBUSTIBLE =====
// =====================================================
async function guardarKilometrajeDiario() {
    reiniciarTiempoSesion();
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = document.getElementById('kmTarde').value ? parseFloat(document.getElementById('kmTarde').value) : null;
    
    if (!fecha || !placa || kmManana === null) {
        return alert('⚠️ Fecha, Placa y Km de la Mañana son obligatorios');
    }
    const kmRecorridos = (kmManana !== null && kmTarde !== null) ? (kmTarde - kmManana).toFixed(1) : null;
    
    await db.collection('kilometraje').add({
        fecha, placa, kmInicial: kmManana, kmFinal: kmTarde, kmRecorridos,
        colaborador: document.getElementById('quienRegistraKm').value,
        usuario: usuarioActivo.usuario, fechaCreacion: new Date()
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
        <div style="padding:8px; margin:4px 0; background:#fff9e6; border-radius:6px;">
            <strong>${k.placa}</strong> | Mañana: ${k.kmInicial} km | Tarde: ⏳ Pendiente
            <button class="btn-exito" style="margin-left:10px; padding:4px 8px;" onclick="completarKmTarde('${k.id}','${k.placa}',${k.kmInicial})">✅ Completar Km Tarde</button>
        </div>
    `).join('');
}

async function completarKmTarde(id, placa, kmIni) {
    const kmFin = prompt(`Kilometraje de la tarde para ${placa}:`);
    if (!kmFin) return;
    const kmF = parseFloat(kmFin);
    const rec = (kmF - kmIni).toFixed(1);
    await db.collection('kilometraje').doc(id).update({ kmFinal: kmF, kmRecorridos: rec });
    alert('✅ Kilometraje de tarde actualizado');
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
    
    if (!fecha || !placa || !galones || !quien) {
        return alert('⚠️ Complete todos los campos: Fecha, Placa, Galones y Quién tanquea');
    }
    
    await db.collection('tanqueo').add({
        fecha, placa, galones, nivel, porcentaje, quien,
        usuario: usuarioActivo.usuario, fechaCreacion: new Date()
    });
    
    alert('✅ Registro de tanqueo guardado');
    document.getElementById('fechaTanqueo').value = new Date().toISOString().split('T')[0];
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('quienTanquea').value = '';
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
    
    let html = `<p class="font-bold mb-2">📊 Total: ${res.length} movimientos | 📦 Salida: ${totalCanSal} | Llegada: ${totalCanLleg} | ⚖️ ${totalKg} kg</p>`;
    html += `<table class="tabla-datos" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:6px;">Fecha</th>
            <th style="border:1px solid #ccc;padding:6px;">Placa</th>
            <th style="border:1px solid #ccc;padding:6px;">Conductor</th>
            <th style="border:1px solid #ccc;padding:6px;">Hora Salida</th>
            <th style="border:1px solid #ccc;padding:6px;">Hora Llegada</th>
            <th style="border:1px solid #ccc;padding:6px;">Canastillas Salida</th>
            <th style="border:1px solid #ccc;padding:6px;">Canastillas Llegada</th>
            <th style="border:1px solid #ccc;padding:6px;">Kilos Totales</th>
            <th style="border:1px solid #ccc;padding:6px;">Observaciones</th>
        </tr></thead><tbody>`;
    res.forEach(m => {
        html += `
        <tr>
            <td style="border:1px solid #ccc;padding:6px;">${m.fecha}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.placa}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.conductor}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.horaSalida}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.horaLlegada || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.canastillasSalida}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.canastillasLlegada}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.kilosTotales}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.observaciones || '-'}</td>
        </tr>`;
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
    c.innerHTML = `
    <table class="tabla-datos" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ccc;padding:6px;">Usuario</th>
            <th style="border:1px solid #ccc;padding:6px;">Nombre Completo</th>
            <th style="border:1px solid #ccc;padding:6px;">Rol</th>
            <th style="border:1px solid #ccc;padding:6px;">Contraseña</th>
            <th style="border:1px solid #ccc;padding:6px;">Acciones</th>
        </tr></thead><tbody>`;
    lista.forEach(u => {
        c.innerHTML += `
        <tr>
            <td style="border:1px solid #ccc;padding:6px;">${u.usuario}</td>
            <td style="border:1px solid #ccc;padding:6px;">${u.nombre}</td>
            <td style="border:1px solid #ccc;padding:6px;">${u.rol === 'admin' ? '🔴 Administrador' : '🔵 Usuario'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${u.clave}</td>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">
                <button class="btn-peligro" style="padding:0.2rem 0.5rem;" onclick="eliminarUsuarioSistema('${u.id}')">🗑️ Eliminar</button>
            </td>
        </tr>`;
    });
    c.innerHTML += '</tbody></table>';
}

async function eliminarUsuarioSistema(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    await db.collection('usuarios_sistema').doc(id).delete();
    alert('✅ Usuario eliminado');
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
