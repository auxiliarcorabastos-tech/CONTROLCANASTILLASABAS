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
let filtroSoloPendientes = false;

// =====================================================
// ===== 🔄 BOTÓN ACTUALIZAR INFORMACIÓN =====
// =====================================================
async function actualizarInformacion() {
    const btn = document.getElementById('btnActualizarTodo');
    if (btn) btn.disabled = true;
    console.log('🔄 Actualizando datos desde Firebase...');
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
// ===== INICIO AUTOMÁTICO + ACTUALIZACIÓN CADA 10s =====
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.value = hoy);
    agregarFilaRecogida();
    
    // 🔄 ACTUALIZACIÓN AUTOMÁTICA DESDE FIREBASE — NO BORRA LO QUE ESCRIBES
    tiempoActualizacionAuto = setInterval(async () => {
        console.log('🔄 Actualizando datos desde Firebase...');
        
        // Guardar lo que estás escribiendo para NO perderlo
        const valoresGuardados = {
            fecha: document.getElementById('fecha')?.value,
            vehiculo: document.getElementById('vehiculoMov')?.value,
            conductor: document.getElementById('colaboradorConductor')?.value,
            horaSalida: document.getElementById('horaSalida')?.value,
            horaLlegada: document.getElementById('horaLlegada')?.value,
            canSalida: document.getElementById('canSalidaTotal')?.value,
            observaciones: document.getElementById('observaciones')?.value
        };

        // ✅ Cargar datos nuevos desde Firebase
        await cargarDatosCompleto();

        // Restaurar lo que estabas escribiendo
        if (valoresGuardados.fecha) document.getElementById('fecha').value = valoresGuardados.fecha;
        if (valoresGuardados.vehiculo) document.getElementById('vehiculoMov').value = valoresGuardados.vehiculo;
        if (valoresGuardados.conductor) document.getElementById('colaboradorConductor').value = valoresGuardados.conductor;
        if (valoresGuardados.horaSalida) document.getElementById('horaSalida').value = valoresGuardados.horaSalida;
        if (valoresGuardados.horaLlegada) document.getElementById('horaLlegada').value = valoresGuardados.horaLlegada;
        if (valoresGuardados.canSalida) document.getElementById('canSalidaTotal').value = valoresGuardados.canSalida;
        if (valoresGuardados.observaciones) document.getElementById('observaciones').value = valoresGuardados.observaciones;

        ultimaActualizacion = new Date();
        actualizarTextoUltimaRevision();
        console.log('✅ Datos actualizados desde Firebase');
    }, 10000); // Cada 10 segundos
});

// =====================================================
// 🔄 CARGAR TODOS LOS DATOS GUARDADOS EN FIREBASE
// =====================================================
async function cargarDatosCompleto() {
    try {
        console.log("🔄 Cargando datos desde Firebase...");

        // 📦 MOVIMIENTOS
        const snapMov = await db.collection('movimientos').get();
        movimientos = [];
        snapMov.forEach(doc => {
            movimientos.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Movimientos cargados: ${movimientos.length}`);

        // 👥 COLABORADORES
        const snapCol = await db.collection('colaboradores').get();
        colaboradores = [];
        snapCol.forEach(doc => {
            colaboradores.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Colaboradores cargados: ${colaboradores.length}`);

        // 👤 CONDUCTORES
        const snapCond = await db.collection('conductores').get();
        conductores = [];
        snapCond.forEach(doc => {
            conductores.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Conductores cargados: ${conductores.length}`);

        // 🚗 VEHÍCULOS DE MOVIMIENTOS
        const snapVehMov = await db.collection('vehiculos_movimientos').get();
        vehiculosMov = [];
        snapVehMov.forEach(doc => {
            vehiculosMov.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Vehículos Mov cargados: ${vehiculosMov.length}`);

        // 🚛 VEHÍCULOS DE TRANSPORTADORA
        const snapVehTr = await db.collection('vehiculos_transportadora').get();
        vehiculosTransp = [];
        snapVehTr.forEach(doc => {
            vehiculosTransp.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Vehículos Transp cargados: ${vehiculosTransp.length}`);

        // 📋 MOVIMIENTOS DE TRANSPORTADORA
        const snapMovTr = await db.collection('movimientos_transportadora').get();
        movimientosTransp = [];
        snapMovTr.forEach(doc => {
            movimientosTransp.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ Movimientos Transp cargados: ${movimientosTransp.length}`);

        // ⛽ Si tienes datos de combustible/kilometraje
        const kmRef = await db.collection('vehiculos').get();
        console.log(`✅ Vehículos base: ${kmRef.size}`);

        // 🔄 LLENAR LOS DESPLEGABLES
        llenarSelects();

        // 📋 MOSTRAR EN PANTALLA
        dibujarListaMovimientos();
        dibujarListaColaboradoresAdmin();
        dibujarListaVehiculosMovAdmin();
        dibujarListaVehiculosTranspAdmin();
        dibujarListaConductoresAdmin();

        // ✅ Actualizar hora
        const ahora = new Date().toLocaleTimeString('es-CO');
        document.getElementById('textoUltimaActualizacion').textContent = `Última actualización: ${ahora}`;

    } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        alert("⚠️ " + error.message);
    }
}
// =====================================================
// 🔄 BOTÓN ACTUALIZAR APP
// =====================================================
async function actualizarInformacion() {
    await cargarDatosCompleto();
    alert("✅ Datos actualizados correctamente");
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
    if (nombre === 'informes') cambiarSubpestañaInformes('movimientos');
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
function cambiarSubpestañaInformes(nombre) {
    const btns = document.querySelectorAll('.btn-subinforme');
    const cajas = document.querySelectorAll('.subpestaña-informe');
    btns.forEach(b => b.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
    cajas.forEach(p => p.classList.add('oculto'));
    const caja = document.getElementById('subinf-' + nombre);
    if (caja) caja.classList.remove('oculto');
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
    }, 60 * 60 * 1000); // 1 hora
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
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(datos);
            registrarAccion('Salida Registrada', 'Movimientos', `Placa: ${datos.placa}`);
            alert('✅ Movimiento guardado');
        }
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

// =====================================================
// ===== 📋 DIBUJAR MOVIMIENTOS + FILTRO PENDIENTES =====
// =====================================================
function alternarFiltroMovimientos() {
    filtroSoloPendientes = !filtroSoloPendientes;
    const btn = document.getElementById('btnFiltroMov');
    const txt = document.getElementById('textoFiltro');
    if (filtroSoloPendientes) {
        btn.classList.add('activo');
        txt.textContent = '📋 Ver Todos';
    } else {
        btn.classList.remove('activo');
        txt.textContent = '⏳ Ver Pendientes';
    }
    dibujarMovimientos();
}
function dibujarMovimientos() {
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    let lista = [...movimientos];
    
    // Aplicar filtro de pendientes
    if (filtroSoloPendientes) {
        lista = lista.filter(m => !m.horaLlegada || m.totalCanastillasLlegada === 0);
    }

    if (lista.length === 0) {
        c.innerHTML = '<p class="text-center">Sin movimientos registrados</p>';
        return;
    }

    // Separar VTH y Vehículos
    const vth = [];
    const vehiculos = [];
    lista.forEach(m => {
        const v = vehiculosMov.find(vh => vh.placa === m.placa);
        if (v && v.tipo.includes('Tracción Humana')) vth.push(m);
        else vehiculos.push(m);
    });

    let html = '';
    if (vth.length > 0) {
        html += `<div class="grupo-titulo grupo-vth">🚲 Vehículos de Tracción Humana (${vth.length})</div>`;
        html += vth.map(m => dibujarFilaMovimiento(m)).join('');
    }
    if (vehiculos.length > 0) {
        html += `<div class="grupo-titulo grupo-veh">🏍️ Vehículos (${vehiculos.length})</div>`;
        html += vehiculos.map(m => dibujarFilaMovimiento(m)).join('');
    }
    c.innerHTML = html;
}
function dibujarFilaMovimiento(m) {
    const esPendiente = !m.horaLlegada || !m.totalCanastillasLlegada || m.totalCanastillasLlegada === 0;
    const etiqueta = esPendiente 
        ? '<span class="etiqueta-estado etiqueta-pend">⏳ PENDIENTE</span>' 
        : '<span class="etiqueta-estado etiqueta-cerr">✅ CERRADO</span>';
    return `
        <div class="fila-lista ${esPendiente ? 'pendiente' : ''}">
            <div>
                <strong>${m.fecha} | ${m.placa}</strong> ${etiqueta}<br>
                Conductor: ${m.colaboradorConductor}<br>
                🕒 ${m.horaSalida || '--'} - ${m.horaLlegada || '--'} | 📦 Salieron: ${m.totalCanastillasSalida} / Llegaron: ${m.totalCanastillasLlegada}
                ${m.kilosTotales > 0 ? `<br>⚖️ Kilos totales: ${m.kilosTotales}` : ''}
            </div>
            <div>
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')" title="Editar/Registrar llegada">✏️</button>
                ${usuarioConectado?.rol === 'admin' ? `<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')" title="Eliminar">🗑️</button>` : ''}
            </div>
        </div>`;
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
    let html = '';
    filtro.forEach(m => {
        const esPendiente = !m.horaLlegada || !m.totalCanastillasLlegada || m.totalCanastillasLlegada === 0;
        html += `
        <div class="fila-lista ${esPendiente ? 'pendiente' : ''}">
            <div>
                <strong>${m.fecha} | ${m.placa}</strong><br>
                Conductor: ${m.colaboradorConductor} | 📦 Salieron: ${m.totalCanastillasSalida} / Llegaron: ${m.totalCanastillasLlegada}
            </div>
            <div>
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')">✏️</button>
                ${usuarioConectado?.rol === 'admin' ? `<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` : ''}
            </div>
        </div>`;
    });
    c.innerHTML = html;
}

// =====================================================
// ===== 🚛 TRANSPORTADORA =====
// =====================================================
async function guardarMovimientoTransp() {
    const datos = {
        fecha: document.getElementById('fechaTransp').value,
        placa: document.getElementById('vehiculoTransp').value,
        conductor: document.getElementById('conductorTransp').value,
        canastillasSalida: Number(document.getElementById('canSalidaTransp').value) || 0,
        canastillasLlegada: Number(document.getElementById('canLlegadaTransp').value) || 0,
        horaSalida: document.getElementById('horaSalidaTransp').value,
        horaLlegada: document.getElementById('horaLlegadaTransp').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };
    await db.collection('movimientos_transportadora').add(datos);
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    alert('✅ Movimiento registrado');
    registrarAccion('Movimiento Transportadora', 'Transportadora', datos.placa);
    await cargarDatosCompleto();
}
async function agregarConductor() {
    const n = document.getElementById('nombreConductor').value.trim();
    if (!n) return alert('Escribe el nombre del conductor');
    await db.collection('conductores').add({ nombre: n, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    alert('✅ Conductor agregado');
    await cargarDatosCompleto();
}
async function cambiarEstadoConductor(id, activar) {
    await db.collection('conductores').doc(id).update({ activo: activar });
    registrarAccion(activar ? 'Conductor Activado' : 'Conductor Inactivado', 'Administración', '');
    await cargarDatosCompleto();
}
async function agregarVehiculoTransp() {
    const p = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const t = document.getElementById('tipoVehiculoTransp').value;
    if (!p || !t) return alert('Escribe placa y selecciona tipo');
    await db.collection('vehiculos_transportadora').add({ placa: p, tipo: t, activo: true, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
    registrarAccion('Vehículo Agregado', 'Transportadora', `${p} - ${t}`);
    await cargarDatosCompleto();
}

// =====================================================
// ===== ⛽ COMBUSTIBLE - KILOMETRAJE DIARIO =====
// =====================================================
async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmInicial = Number(document.getElementById('kmInicial').value);
    const kmFinal = Number(document.getElementById('kmFinal').value);
    const colaborador = document.getElementById('quienRegistraKm').value;
    if (!fecha || !placa || isNaN(kmInicial) || isNaN(kmFinal) || !colaborador) {
        return alert('⚠️ Complete todos los campos');
    }
    if (kmFinal < kmInicial) {
        return alert('⚠️ Km Final no puede ser menor al Km Inicial');
    }
    const kmRecorridos = kmFinal - kmInicial;
    const datos = {
        fecha, placa, kmInicial, kmFinal, kmRecorridos, colaborador,
        usuario: usuarioConectado.nombre || usuarioConectado.email, 
        horaRegistro: new Date()
    };
    await db.collection('kilometraje_diario').add(datos);
    alert(`✅ Guardado\nKilómetros recorridos: ${kmRecorridos} km`);
    registrarAccion('Registro Kilometraje', 'Combustible-Km', `${placa} — ${kmRecorridos} km`);
    ultimoKmPorPlaca[placa] = kmFinal;
    document.getElementById('kmInicial').value = '';
    document.getElementById('kmFinal').value = '';
    await cargarDatosCompleto();
}
function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm')?.value;
    const ff = document.getElementById('fechaFinKm')?.value;
    if (!fi || !ff) return;
    const resultados = registrosKilometraje.filter(r => r.fecha >= fi && r.fecha <= ff);
    ultimosResultados.kilometraje = resultados;
    const cont = document.getElementById('resultadoKilometraje');
    if (!cont) return;
    if (resultados.length === 0) {
        cont.innerHTML = '<p class="text-center">📭 Sin registros en este período</p>';
        return;
    }
    let totalKm = 0;
    resultados.forEach(r => totalKm += r.kmRecorridos || 0);
    cont.innerHTML = `
        <p class="font-bold mb-2">📋 Período: ${fi} al ${ff} — Total: ${totalKm} km recorridos</p>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;">
            <tr>
                <th style="border:1px solid #ccc;padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc;padding:6px;">Placa</th>
                <th style="border:1px solid #ccc;padding:6px;">Km Inicial</th>
                <th style="border:1px solid #ccc;padding:6px;">Km Final</th>
                <th style="border:1px solid #ccc;padding:6px;">Km Recorridos</th>
                <th style="border:1px solid #ccc;padding:6px;">Quién Registró</th>
            </tr>
        </thead>
        <tbody>
        ${resultados.map(r => `
            <tr>
                <td style="border:1px solid #ccc;padding:6px;">${r.fecha}</td>
                <td style="border:1px solid #ccc;padding:6px;">${r.placa}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${r.kmInicial}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${r.kmFinal}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;font-weight:bold;">${r.kmRecorridos}</td>
                <td style="border:1px solid #ccc;padding:6px;">${r.colaborador}</td>
            </tr>`).join('')}
        </tbody>
        </table>
        </div>`;
}

// =====================================================
// ===== ⛽ COMBUSTIBLE - REGISTRO DE TANQUEO =====
// =====================================================
async function guardarRegistroTanqueo() {
    const fechaTanqueo = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = Number(document.getElementById('galonesTanqueo').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = Number(document.getElementById('porcentajeTanqueo').value) || 100;
    const colaborador = document.getElementById('quienTanquea').value;
    if (!fechaTanqueo || !placa || isNaN(galones) || !colaborador) {
        return alert('⚠️ Complete fecha, placa, galones y quien tanquea');
    }
    let kmRecorridosDesdeUltimo = null;
    let rendimiento = null;
    if (estado === 'FULL' && ultimoKmPorPlaca[placa]) {
        const ultimoRegistro = registrosKilometraje
            .filter(r => r.placa === placa)
            .sort((a, b) => b.kmFinal - a.kmFinal)[0];
        if (ultimoRegistro && ultimoRegistro.kmFinal > ultimoKmPorPlaca[placa]) {
            kmRecorridosDesdeUltimo = ultimoRegistro.kmFinal - ultimoKmPorPlaca[placa];
            rendimiento = (kmRecorridosDesdeUltimo / galones).toFixed(2);
            ultimoKmPorPlaca[placa] = ultimoRegistro.kmFinal;
        }
    }
    const datos = {
        fechaTanqueo, placa, galones, estado,
        porcentajeReal: estado === 'FULL' ? 100 : porcentaje,
        colaborador, kmRecorridosDesdeUltimo, rendimientoKmPorGalon: rendimiento,
        usuario: usuarioConectado.nombre || usuarioConectado.email, 
        horaRegistro: new Date()
    };
    await db.collection('tanqueo_combustible').add(datos);
    let mensaje = `✅ Tanqueo guardado\nPlaca: ${placa}\nGalones: ${galones}`;
    if (rendimiento) mensaje += `\n📊 Rendimiento: ${rendimiento} km/gal`;
    alert(mensaje);
    registrarAccion('Registro Tanqueo', 'Combustible-Tanqueo', `${placa} — ${galones} gal ${estado}`);
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('porcentajeTanqueo').value = '';
    await cargarDatosCompleto();
}
function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo')?.value;
    const ff = document.getElementById('fechaFinTanqueo')?.value;
    if (!fi || !ff) return;
    const resultados = registrosTanqueo.filter(r => r.fechaTanqueo >= fi && r.fechaTanqueo <= ff);
    ultimosResultados.tanqueo = resultados;
    const cont = document.getElementById('resultadoTanqueo');
    if (!cont) return;
    if (resultados.length === 0) {
        cont.innerHTML = '<p class="text-center">📭 Sin registros de tanqueo en este período</p>';
        return;
    }
    let totalGalones = 0;
    let tanqueosFull = 0;
    let sumaRendimientos = 0;
    resultados.forEach(r => {
        totalGalones += r.galones || 0;
        if (r.estado === 'FULL' && r.rendimientoKmPorGalon) {
            tanqueosFull++;
            sumaRendimientos += Number(r.rendimientoKmPorGalon);
        }
    });
    const promRendimiento = tanqueosFull > 0 ? (sumaRendimientos / tanqueosFull).toFixed(2) : '—';
    cont.innerHTML = `
        <p class="font-bold mb-2">⛽ Período: ${fi} al ${ff} — Total Galones: ${totalGalones.toFixed(2)} | Promedio Rendimiento FULL: ${promRendimiento} km/gal</p>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
        <thead style="background:#fff3cd;">
            <tr>
                <th style="border:1px solid #ccc;padding:5px;">Fecha Tanqueo</th>
                <th style="border:1px solid #ccc;padding:5px;">Placa</th>
                <th style="border:1px solid #ccc;padding:5px;">Galones</th>
                <th style="border:1px solid #ccc;padding:5px;">Estado</th>
                <th style="border:1px solid #ccc;padding:5px;">Km Recorridos</th>
                <th style="border:1px solid #ccc;padding:5px;">Rendimiento km/gal</th>
                <th style="border:1px solid #ccc;padding:5px;">Quién Tanqueó</th>
            </tr>
        </thead>
        <tbody>
        ${resultados.map(r => `
            <tr style="${r.estado === 'FULL' ? 'background:#e8fff3;' : ''}">
                <td style="border:1px solid #ccc;padding:5px;">${r.fechaTanqueo}</td>
                <td style="border:1px solid #ccc;padding:5px;">${r.placa}</td>
                <td style="border:1px solid #ccc;padding:5px;text-align:center;">${r.galones}</td>
                <td style="border:1px solid #ccc;padding:5px;text-align:center;font-weight:bold;">${r.estado === 'FULL' ? '✅ FULL' : '⚡ PARCIAL'}</td>
                <td style="border:1px solid #ccc;padding:5px;text-align:center;">${r.kmRecorridosDesdeUltimo || '—'}</td>
                <td style="border:1px solid #ccc;padding:5px;text-align:center;font-weight:bold;color:${r.rendimientoKmPorGalon ? '#006633' : '#999'};">${r.rendimientoKmPorGalon || 'Solo en FULL'}</td>
                <td style="border:1px solid #ccc;padding:5px;">${r.colaborador}</td>
            </tr>`).join('')}
        </tbody>
        </table>
        </div>`;
}
async function cargarDatosCombustibleCompleto() {
    const k = await db.collection('kilometraje_diario').orderBy('fecha', 'desc').get();
    registrosKilometraje = k.docs.map(d => ({ id: d.id, ...d.data() }));
    const tq = await db.collection('tanqueo_combustible').orderBy('fechaTanqueo', 'desc').get();
    registrosTanqueo = tq.docs.map(d => ({ id: d.id, ...d.data() }));
    ultimoKmPorPlaca = {};
    registrosKilometraje.forEach(r => {
        if (!ultimoKmPorPlaca[r.placa] || r.kmFinal > ultimoKmPorPlaca[r.placa]) {
            ultimoKmPorPlaca[r.placa] = r.kmFinal;
        }
    });
}

// =====================================================
// ===== 📥 EXPORTAR A EXCEL =====
// =====================================================
function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje || ultimosResultados.kilometraje.length === 0) {
        return alert('Realice una consulta primero');
    }
    const datos = ultimosResultados.kilometraje.map(r => ({
        Fecha: r.fecha,
        Placa: r.placa,
        KilometrajeInicial: r.kmInicial,
        KilometrajeFinal: r.kmFinal,
        KilometrosRecorridos: r.kmRecorridos,
        ColaboradorQueRegistra: r.colaborador,
        UsuarioSistema: r.usuario || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Kilometraje Diario");
    XLSX.writeFile(libro, `Kilometraje_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`);
    alert('✅ Excel de Kilometraje generado');
}
function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo || ultimosResultados.tanqueo.length === 0) {
        return alert('Realice una consulta primero');
    }
    const datos = ultimosResultados.tanqueo.map(r => ({
        FechaTanqueo: r.fechaTanqueo,
        Placa: r.placa,
        GalonesCargados: r.galones,
        EstadoTanqueo: r.estado === 'FULL' ? 'TANQUEÓ FULL' : 'CARGA PARCIAL',
        PorcentajeTanqueado: r.porcentajeReal || 100,
        KilometrosRecorridosDesdeUltimo: r.kmRecorridosDesdeUltimo || '—',
        Rendimiento_Km_Por_Galon: r.rendimientoKmPorGalon || 'Solo se calcula en tanqueo FULL',
        ColaboradorQueTanqueo: r.colaborador,
        UsuarioSistema: r.usuario || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Registro Tanqueo");
    XLSX.writeFile(libro, `Tanqueo_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`);
    alert('✅ Excel de Tanqueo generado');
}

// =====================================================
// ===== 📊 INFORMES =====
// =====================================================
function consultarMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');
    const resultados = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = resultados;
    const c = document.getElementById('resultadoMovimientos');
    if (!c) return;
    if (resultados.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
        return;
    }
    let totalCanSalida = 0, totalCanLlegada = 0, totalKilos = 0;
    resultados.forEach(m => {
        totalCanSalida += m.totalCanastillasSalida || 0;
        totalCanLlegada += m.totalCanastillasLlegada || 0;
        totalKilos += m.kilosTotales || 0;
    });
    c.innerHTML = `
        <p class="font-bold mb-2">📋 Movimientos del ${fi} al ${ff}</p>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;">
                    <tr>
                <th style="border:1px solid #ccc;padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc;padding:6px;">Placa</th>
                <th style="border:1px solid #ccc;padding:6px;">Conductor</th>
                <th style="border:1px solid #ccc;padding:6px;">Hora Salida</th>
                <th style="border:1px solid #ccc;padding:6px;">Hora Llegada</th>
                <th style="border:1px solid #ccc;padding:6px;">Canastillas Salida</th>
                <th style="border:1px solid #ccc;padding:6px;">Canastillas Llegada</th>
                <th style="border:1px solid #ccc;padding:6px;">Kilos Totales</th>
                <th style="border:1px solid #ccc;padding:6px;">Observaciones</th>
                <th style="border:1px solid #ccc;padding:6px;">Usuario / Hora Registro</th>
            </tr>
        </thead>
        <tbody>
        ${resultados.map(m => `
            <tr>
                <td style="border:1px solid #ccc;padding:6px;">${m.fecha}</td>
                <td style="border:1px solid #ccc;padding:6px;">${m.placa}</td>
                <td style="border:1px solid #ccc;padding:6px;">${m.colaboradorConductor}</td>
                <td style="border:1px solid #ccc;padding:6px;">${m.horaSalida || '--'}</td>
                <td style="border:1px solid #ccc;padding:6px;">${m.horaLlegada || '--'}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${m.totalCanastillasSalida}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${m.totalCanastillasLlegada}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${m.kilosTotales}</td>
                <td style="border:1px solid #ccc;padding:6px;">${m.observaciones || ''}</td>
                <td style="border:1px solid #ccc;padding:6px;font-size:0.75rem;">
                    ${m.usuario || '--'}<br>
                    ${m.horaRegistro ? new Date(m.horaRegistro.toDate()).toLocaleString('es-CO') : ''}
                </td>
            </tr>`).join('')}
        </tbody>
        <tfoot style="background:#f1f5f9;font-weight:bold;">
            <tr>
                <td colspan="5" style="border:1px solid #ccc;padding:6px;">TOTALES</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${totalCanSalida}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${totalCanLlegada}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${totalKilos}</td>
                <td style="border:1px solid #ccc;padding:6px;" colspan="2">—</td>
            </tr>
        </tfoot>
        </table>
        </div>`;
}

function exportarMovimientosExcel() {
    if (!ultimosResultados.movimientos || ultimosResultados.movimientos.length === 0) {
        return alert('⚠️ Realice una consulta primero antes de exportar');
    }
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida || '',
        HoraLlegada: m.horaLlegada || '',
        CanastillasSalida: m.totalCanastillasSalida,
        CanastillasLlegada: m.totalCanastillasLlegada,
        KilosTotales: m.kilosTotales,
        Observaciones: m.observaciones || '',
        UsuarioQueRegistro: m.usuario || '',
        FechaHoraRegistro: m.horaRegistro ? new Date(m.horaRegistro.toDate()).toLocaleString('es-CO') : ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`);
    alert('✅ Excel generado correctamente');
}

// =====================================================
// ===== ⚙️ ADMINISTRACIÓN =====
// =====================================================
function cargarListasAdmin() {
    dibujarListaColaboradoresAdmin();
    dibujarListaVehiculosMovAdmin();
    dibujarListaVehiculosTranspAdmin();
    dibujarListaConductoresAdmin();
}

async function agregarColaboradorAdmin() {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Solo el administrador puede agregar');
    const nombre = document.getElementById('nombreColabAdmin').value.trim();
    if (!nombre) return alert('⚠️ Escribe el nombre del colaborador');
    const repetido = colaboradores.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (repetido) return alert('⚠️ Este colaborador ya existe');
    await db.collection('colaboradores').add({ 
        nombre, 
        activo: true, 
        fechaCreacion: new Date() 
    });
    document.getElementById('nombreColabAdmin').value = '';
    alert('✅ Colaborador agregado');
    registrarAccion('Colaborador Agregado', 'Administración', nombre);
    await cargarDatosCompleto();
}

function dibujarListaColaboradoresAdmin() {
    const c = document.getElementById('listaColaboradoresAdmin');
    if (!c) return;
    if (colaboradores.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin colaboradores registrados</p>';
        return;
    }
    c.innerHTML = colaboradores.map(co => `
        <div class="fila-lista ${co.activo === false ? 'inactivo' : ''}">
            <span><strong>${co.nombre}</strong> ${co.activo === false ? '❌ INACTIVO' : '✅ ACTIVO'}</span>
            <button class="btn-inactivar" onclick="cambiarEstadoColab('${co.id}', ${co.activo === false})">
                ${co.activo === false ? '✅ Activar' : '⏸️ Inactivar'}
            </button>
        </div>`).join('');
}

async function cambiarEstadoColab(id, activar) {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Solo el administrador');
    await db.collection('colaboradores').doc(id).update({ activo: activar });
    registrarAccion(activar ? 'Colaborador Activado' : 'Colaborador Inactivado', 'Administración', '');
    await cargarDatosCompleto();
}

async function agregarVehiculoMovAdmin() {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Solo el administrador');
    const placa = document.getElementById('placaVehiculoMovAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMovAdmin').value;
    if (!placa || !tipo) return alert('⚠️ Escribe la placa y selecciona el tipo');
    const repetido = vehiculosMov.find(v => v.placa === placa);
    if (repetido) return alert('⚠️ Esta placa ya está registrada');
    await db.collection('vehiculos_movimientos').add({ 
        placa, 
        tipo, 
        activo: true, 
        fechaCreacion: new Date() 
    });
    document.getElementById('placaVehiculoMovAdmin').value = '';
    alert('✅ Vehículo agregado');
    registrarAccion('Vehículo Agregado', 'Administración', `${placa} — ${tipo}`);
    await cargarDatosCompleto();
}

function dibujarListaVehiculosMovAdmin() {
    const c = document.getElementById('listaVehiculosMovAdmin');
    if (!c) return;
    if (vehiculosMov.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin vehículos registrados</p>';
        return;
    }
    c.innerHTML = vehiculosMov.map(v => `
        <div class="fila-lista">
            <span><strong>${v.placa}</strong> — ${v.tipo}</span>
        </div>`).join('');
}

function dibujarListaVehiculosTranspAdmin() {
    const c = document.getElementById('listaVehiculosTranspAdmin');
    if (!c) return;
    if (vehiculosTransp.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin vehículos de transportadora</p>';
        return;
    }
    c.innerHTML = vehiculosTransp.map(v => `
        <div class="fila-lista">
            <span><strong>${v.placa}</strong> — ${v.tipo}</span>
        </div>`).join('');
}

function dibujarListaConductoresAdmin() {
    const c = document.getElementById('listaConductoresAdmin');
    if (!c) return;
    if (conductores.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin conductores registrados</p>';
        return;
    }
    c.innerHTML = conductores.map(co => `
        <div class="fila-lista ${co.activo === false ? 'inactivo' : ''}">
            <span><strong>${co.nombre}</strong> ${co.activo === false ? '❌ INACTIVO' : '✅ ACTIVO'}</span>
        </div>`).join('');
}

async function crearUsuario() {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Solo el administrador puede crear usuarios');
    let correo = document.getElementById('correoNuevoUsuario').value.trim();
    const clave = document.getElementById('claveNuevoUsuario').value;
    const rol = document.getElementById('rolNuevoUsuario').value;
    if (!correo.includes('@')) correo += '@correo.com';
    if (clave.length < 6) return alert('⚠️ La contraseña debe tener al menos 6 caracteres');
    try {
        const cred = await auth.createUserWithEmailAndPassword(correo, clave);
        await db.collection('usuarios').doc(cred.user.uid).set({
            correo,
            rol,
            fechaCreacion: new Date(),
            creadoPor: usuarioConectado.email || usuarioConectado.nombre
        });
        alert('✅ Usuario creado exitosamente');
        registrarAccion('Usuario Creado', 'Administración', `${correo} — Rol: ${rol}`);
        document.getElementById('correoNuevoUsuario').value = '';
        document.getElementById('claveNuevoUsuario').value = '';
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// =====================================================
// ===== 📝 AUDITORÍA / REGISTRO DE ACCIONES =====
// =====================================================
async function registrarAccion(accion, modulo, detalle) {
    if (!usuarioConectado) return;
    await db.collection('auditoria').add({
        accion,
        modulo,
        detalle,
        usuario: usuarioConectado.email || usuarioConectado.nombre || 'Anónimo',
        fechaHora: new Date()
    });
}
