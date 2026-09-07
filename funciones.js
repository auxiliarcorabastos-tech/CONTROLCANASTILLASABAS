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
const auth = firebase.auth();
const db = firebase.firestore();

// =====================================================
// ===== USUARIOS PREDETERMINADOS =====
// =====================================================
const usuariosFijos = {
    "jgarnica@correo.com": { pass: "123456", rol: "admin", nombre: "jgarnica" },
    "jgarnica": { pass: "123456", rol: "admin", nombre: "jgarnica" },
    "jfigueroa@correo.com": { pass: "3134630773", rol: "admin", nombre: "jfigueroa" },
    "jfigueroa": { pass: "3134630773", rol: "admin", nombre: "jfigueroa" },
    "estudiante@correo.com": { pass: "123456", rol: "usuario", nombre: "estudiante" },
    "estudiante": { pass: "123456", rol: "usuario", nombre: "estudiante" }
};

// =====================================================
// ===== VARIABLES GLOBALES =====
// =====================================================
let usuarioConectado = null;
let idEdicion = null;
let movimientos = [];
let movimientosTransporte = [];
let conductores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let colaboradores = [];
let tiempoSesion = null;
let filasRecogida = [];
let ultimosResultados = { 
    movimientos: [], transporte: [], combustible: [], 
    kilometraje: [], tanqueo: [] 
};
let tiempoActualizacionAuto = null;
let ultimaActualizacion = null;
let registrosKilometraje = [];
let registrosTanqueo = [];
let ultimoKmPorPlaca = {};

// =====================================================
// ===== INICIO AUTOMÁTICO =====
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.value = hoy);
    agregarFilaRecogida();
    
    // ⏰ ACTUALIZACIÓN AUTOMÁTICA CADA 10 SEGUNDOS
    tiempoActualizacionAuto = setInterval(() => {
        cargarDatosCompleto();
        actualizarTextoUltimaRevision();
    }, 10 * 1000);
});

// =====================================================
// ===== 🔄 BOTÓN ACTUALIZAR INFORMACIÓN =====
// =====================================================
async function actualizarInformacion() {
    const btn = document.getElementById('btnActualizarTodo');
    if (btn) btn.disabled = true;
    await cargarDatosCompleto();
    ultimaActualizacion = new Date();
    actualizarTextoUltimaRevision();
    alert('✅ Información actualizada desde la nube');
    if (btn) btn.disabled = false;
}

function actualizarTextoUltimaRevision() {
    const el = document.getElementById('textoUltimaActualizacion');
    if (el && ultimaActualizacion) {
        const hh = ultimaActualizacion.getHours().toString().padStart(2, '0');
        const mm = ultimaActualizacion.getMinutes().toString().padStart(2, '0');
        const ss = ultimaActualizacion.getSeconds().toString().padStart(2, '0');
        el.textContent = `Última revisión: ${hh}:${mm}:${ss}`;
    }
}

// =====================================================
// ===== CARGA COMPLETA DE TODOS LOS DATOS =====
// =====================================================
async function cargarDatosCompleto() {
    try {
        const cl = await db.collection('colaboradores').orderBy('nombre').get();
        colaboradores = cl.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectColaboradoresConductores();

        const vm = await db.collection('vehiculos_movimientos').orderBy('placa').get();
        vehiculosMov = vm.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosMov();

        const vt = await db.collection('vehiculos_transportadora').orderBy('placa').get();
        vehiculosTransp = vt.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosTransp();

        const cd = await db.collection('conductores').orderBy('nombre').get();
        conductores = cd.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectConductores();
        dibujarListaConductoresTransp();

        const mv = await db.collection('movimientos').orderBy('fecha', 'desc').limit(50).get();
        movimientos = mv.docs.map(d => ({ id: d.id, ...d.data() }));
        dibujarMovimientos();

        const mt = await db.collection('movimientos_transportadora').orderBy('fecha', 'desc').get();
        movimientosTransporte = mt.docs.map(d => ({ id: d.id, ...d.data() }));

        const k = await db.collection('kilometraje_diario').orderBy('fecha', 'desc').get();
        registrosKilometraje = k.docs.map(d => ({ id: d.id, ...d.data() }));

        const tq = await db.collection('tanqueo_combustible').orderBy('fechaTanqueo', 'desc').get();
        registrosTanqueo = tq.docs.map(d => ({ id: d.id, ...d.data() }));

        const selKm = document.getElementById('vehiculoKm');
        const selTq = document.getElementById('vehiculoTanqueo');
        const selReg = document.getElementById('quienRegistraKm');
        const selTanq = document.getElementById('quienTanquea');
        const optsVeh = '<option value="">Seleccione vehículo</option>' + 
            vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
        const optsCol = obtenerOpcionesColaboradoresActivos();
        if (selKm) selKm.innerHTML = optsVeh;
        if (selTq) selTq.innerHTML = optsVeh;
        if (selReg) selReg.innerHTML = optsCol;
        if (selTanq) selTanq.innerHTML = optsCol;

        ultimoKmPorPlaca = {};
        registrosKilometraje.forEach(r => {
            if (!ultimoKmPorPlaca[r.placa] || r.kmFinal > ultimoKmPorPlaca[r.placa]) {
                ultimoKmPorPlaca[r.placa] = r.kmFinal;
            }
        });

        dibujarListaColaboradoresAdmin();
        dibujarListaVehiculosMovAdmin();
        dibujarListaVehiculosTranspAdmin();
        dibujarListaConductoresAdmin();

    } catch (e) {
        console.log('Error cargando datos:', e.message);
    }
}

// =====================================================
// ===== NAVEGACIÓN Y PESTAÑAS =====
// =====================================================
function alternarMenu() { 
    document.getElementById('sidebar').classList.toggle('mostrar'); 
}

function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.pestaña').forEach(p => { p.classList.remove('activa'); p.classList.add('oculto'); });
    document.getElementById('pest-' + nombre).classList.remove('oculto');
    document.getElementById('pest-' + nombre).classList.add('activa');
    document.getElementById('tituloPestaña').textContent = event.target.textContent.trim();
    if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('mostrar');
    if (nombre === 'admin') cargarListasAdmin();
    if (nombre === 'combustible') cargarDatosCombustibleCompleto();
}

function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    document.getElementById('sub-admin-' + nombre).classList.remove('oculto');
}

function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    document.getElementById('subcomb-' + nombre).classList.remove('oculto');
    if (nombre === 'kilometraje') cargarInformeKilometraje();
    if (nombre === 'tanqueo') cargarInformeTanqueo();
}

// =====================================================
// ===== 🔐 INICIO DE SESIÓN =====
// =====================================================
async function ingresar() {
    let correo = document.getElementById('correoLogin').value.trim();
    const pass = document.getElementById('passLogin').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    if (!correo.includes('@')) correo += '@correo.com';

    try {
        const usuarioBuscar = correo.split('@')[0];
        if (usuariosFijos[usuarioBuscar] || usuariosFijos[correo]) {
            const datos = usuariosFijos[usuarioBuscar] || usuariosFijos[correo];
            if (datos.pass === pass) {
                usuarioConectado = { email: correo, ...datos };
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
    if (usuarioConectado.rol === 'admin') {
        document.getElementById('btnAdmin').classList.remove('oculto');
    }
    await cargarDatosCompleto();
    ultimaActualizacion = new Date();
    actualizarTextoUltimaRevision();
    iniciarTiempoSesion();
    registrarAccion('Inicio de Sesión', 'Sistema', '');
}

function cerrarSesion() {
    clearInterval(tiempoActualizacionAuto);
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

// =====================================================
// ===== UTILIDADES: SELECTORES =====
// =====================================================
function obtenerOpcionesColaboradoresActivos(sel = '') {
    const activos = colaboradores.filter(c => c.activo !== false);
    return '<option value="">Seleccione colaborador</option>' + 
        activos.map(c => `<option value="${c.nombre}" ${sel === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('');
}

function actualizarSelectColaboradoresConductores() {
    const s = document.getElementById('colaboradorConductor');
    if (s) s.innerHTML = obtenerOpcionesColaboradoresActivos();
}

function actualizarSelectVehiculosMov() {
    const opts = '<option value="">Seleccione vehículo</option>' + 
        vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
    const s1 = document.getElementById('vehiculoMov');
    if (s1) s1.innerHTML = opts;
}

function actualizarSelectVehiculosTransp() {
    const s = document.getElementById('vehiculoTransp');
    if (!s) return;
    s.innerHTML = '<option value="">Seleccione vehículo</option>' + 
        vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
}

function actualizarSelectConductores() {
    const s = document.getElementById('conductorTransp');
    if (!s) return;
    s.innerHTML = '<option value="">Seleccione conductor</option>' + 
        conductores.filter(c => c.activo !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

function dibujarListaConductoresTransp() {
    const c = document.getElementById('listaConductoresTransp');
    if (!c) return;
    if (conductores.length === 0) {
        c.innerHTML = '<p class="text-center">No hay conductores registrados</p>';
        return;
    }
    c.innerHTML = conductores.map(co => `
        <div class="fila-lista ${co.activo === false ? 'inactivo' : ''}">
            <span><strong>${co.nombre}</strong></span>
            <button class="btn-inactivar" onclick="cambiarEstadoConductor('${co.id}', ${co.activo === false})">
                ${co.activo === false ? '✅ Activar' : '⏸️ Inactivar'}
            </button>
        </div>`).join('');
}

// =====================================================
// ===== RECOGIDAS DE COLABORADORES =====
// =====================================================
function agregarFilaRecogida(d = null) {
    filasRecogida.push({
        id: Date.now() + Math.random(),
        recogio: d?.recogio || '',
        kilos: d?.kilos || 0,
        canastillas: d?.canastillas || 0
    });
    renderizarFilasRecogida();
}

function quitarFilaRecogida(id) {
    filasRecogida = filasRecogida.filter(f => f.id !== id);
    renderizarFilasRecogida();
}

function actualizarFilaRecogida(id, campo, valor) {
    const f = filasRecogida.find(x => x.id === id);
    if (!f) return;
    f[campo] = (campo === 'kilos' || campo === 'canastillas') ? Number(valor) || 0 : valor;
    calcularTotalesAutomaticos();
}

function calcularTotalesAutomaticos() {
    let tk = 0, tc = 0;
    filasRecogida.forEach(f => {
        tk += Number(f.kilos) || 0;
        tc += Number(f.canastillas) || 0;
    });
    const kt = document.getElementById('kilosTotales');
    const cl = document.getElementById('canLlegadaTotal');
    if (kt) kt.value = tk || '';
    if (cl) cl.value = tc || '';
}

function renderizarFilasRecogida() {
    const c = document.getElementById('listaRecogidas');
    if (!c) return;
    c.innerHTML = filasRecogida.map(f => `
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

// =====================================================
// ===== 📦 GUARDAR MOVIMIENTO PRINCIPAL =====
// =====================================================
async function guardarMovimiento() {
    const rec = filasRecogida.map(f => ({
        recogio: f.recogio,
        kilos: Number(f.kilos) || 0,
        canastillas: Number(f.canastillas) || 0
    }));

    const datos = {
        fecha: document.getElementById('fecha').value,
        placa: document.getElementById('vehiculoMov').value,
        colaboradorConductor: document.getElementById('colaboradorConductor').value,
        horaSalida: document.getElementById('horaSalida').value,
        horaLlegada: document.getElementById('horaLlegada').value,
        recogidas: rec,
        kilosTotales: Number(document.getElementById('kilosTotales').value) || 0,
        totalCanastillasSalida: Number(document.getElementById('canSalidaTotal').value) || 0,
        totalCanastillasLlegada: Number(document.getElementById('canLlegadaTotal').value) || 0,
        observaciones: document.getElementById('observaciones').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };

    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            registrarAccion('Movimiento Modificado', 'Movimientos', `ID: ${idEdicion}`);
        } else {
            await db.collection('movimientos').add(datos);
            registrarAccion('Salida Registrada', 'Movimientos', `Placa: ${datos.placa}`);
        }
        alert('✅ Guardado');
        idEdicion = null;
        filasRecogida = [];
        document.getElementById('horaSalida').value = '';
        document.getElementById('horaLlegada').value = '';
        document.getElementById('canSalidaTotal').value = '';
        document.getElementById('canLlegadaTotal').value = '';
        document.getElementById('kilosTotales').value = '';
        document.getElementById('observaciones').value = '';
        agregarFilaRecogida();
        await cargarDatosCompleto();
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

function dibujarMovimientos() {
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    if (movimientos.length === 0) {
        c.innerHTML = '<p class="text-center">Sin movimientos registrados</p>';
        return;
    }
    c.innerHTML = movimientos.map(m => `
        <div class="fila-lista">
            <div>
                <strong>${m.fecha} | ${m.placa}</strong><br>
                Conductor: ${m.colaboradorConductor}<br>
                🕒 ${m.horaSalida || '--'} - ${m.horaLlegada || '--'} | 📦 Salida: ${m.totalCanastillasSalida} / Llegada: ${m.totalCanastillasLlegada}
            </div>
            <div>
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')">✏️</button>
                ${usuarioConectado?.rol === 'admin' ? `<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` : ''}
            </div>
        </div>`).join('');
}

function cargarEnFormulario(id) {
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;
    idEdicion = id;
    document.getElementById('fecha').value = mov.fecha;
    document.getElementById('vehiculoMov').value = mov.placa;
    document.getElementById('colaboradorConductor').value = mov.colaboradorConductor;
    document.getElementById('horaSalida').value = mov.horaSalida || '';
    document.getElementById('horaLlegada').value = mov.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = mov.totalCanastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = mov.totalCanastillasLlegada || '';
    document.getElementById('kilosTotales').value = mov.kilosTotales || '';
    document.getElementById('observaciones').value = mov.observaciones || '';
    filasRecogida = mov.recogidas ? [...mov.recogidas] : [];
    renderizarFilasRecogida();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioConectado.rol !== 'admin') {
        alert('🔒 Solo el administrador puede eliminar registros');
        return;
    }
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Movimiento Eliminado', 'Movimientos', `ID: ${id}`);
    alert('Eliminado ✅');
    await cargarDatosCompleto();
}

function filtrarMovimientos() {
    const b = document.getElementById('buscarMov').value.toLowerCase();
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    const filtro = movimientos.filter(m => 
        m.placa.toLowerCase().includes(b) || 
        m.colaboradorConductor.toLowerCase().includes(b)
    );
    if (filtro.length === 0) {
        c.innerHTML = '<p class="text-center">Sin coincidencias</p>';
        return;
    }
    c.innerHTML = filtro.map(m => `
        <div class="fila-lista">
            <div>
                <strong>${m.fecha} | ${m.placa}</strong><br>
                Conductor: ${m.colaboradorConductor} | 📦 ${m.totalCanastillasSalida} → ${m.totalCanastillasLlegada}
            </div>
            <div>
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')">✏️</button>
                ${usuarioConectado?.rol === 'admin' ? `<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` : ''}
            </div>
        </div>`).join('');
}
