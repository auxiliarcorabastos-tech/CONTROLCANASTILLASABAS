// ===== CONFIGURACIÓN FIREBASE =====
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

// ===== USUARIOS PREDETERMINADOS =====
const usuariosFijos = {
    "jgarnica@correo.com": { pass: "123456", rol: "admin", nombre: "jgarnica" },
    "jfigueroa@correo.com": { pass: "3134630773", rol: "admin", nombre: "jfigueroa" },
    "estudiante@correo.com": { pass: "123456", rol: "usuario", nombre: "estudiante" }
};

// ===== VARIABLES GLOBALES =====
let usuarioConectado = null;
let idEdicion = null;
let movimientos = [];
let conductores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let colaboradores = [];
let tiempoSesion = null;
let filasRecogida = [];

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fecha = document.getElementById('fecha');
    const fechaTransp = document.getElementById('fechaTransp');
    if (fecha) fecha.value = hoy;
    if (fechaTransp) fechaTransp.value = hoy;
    agregarFilaRecogida();
});

// ===== MENÚ Y PESTAÑAS =====
function alternarMenu() {
    document.getElementById('sidebar').classList.toggle('mostrar');
}

function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.pestaña').forEach(p => p.classList.remove('activa'));
    document.getElementById('pest-' + nombre).classList.add('activa');
    document.getElementById('tituloPestaña').textContent = event.target.textContent.trim();
    if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('mostrar');
    if (nombre === 'admin') cargarListasAdmin();
}

function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    document.getElementById('sub-admin-' + nombre).classList.remove('oculto');
    cargarListasAdmin();
}

// ===== INICIO DE SESIÓN =====
async function ingresar() {
    let correo = document.getElementById('correoLogin').value.trim();
    const pass = document.getElementById('passLogin').value;
    const error = document.getElementById('mensajeError');
    error.textContent = '';

    if (!correo.includes('@')) correo += '@correo.com';

    try {
        if (usuariosFijos[correo]) {
            if (usuariosFijos[correo].pass === pass) {
                usuarioConectado = { email: correo, ...usuariosFijos[correo] };
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
    if (usuarioConectado.rol === 'admin') document.getElementById('btnAdmin').classList.remove('oculto');
    await cargarDatos();
    iniciarTiempoSesion();
    registrarAccion('Inicio de Sesión', 'Sistema', '');
}

function cerrarSesion() {
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

// ===== ÚNICA LISTA DE COLABORADORES =====
function obtenerOpcionesColaboradoresActivos(valorSeleccionado = '') {
    const activos = colaboradores.filter(c => c.activo !== false);
    return '<option value="">Seleccione colaborador</option>' +
        activos.map(c => `<option value="${c.nombre}" ${valorSeleccionado === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('');
}

function actualizarSelectColaboradoresConductores() {
    const sel = document.getElementById('colaboradorConductor');
    if (sel) sel.innerHTML = obtenerOpcionesColaboradoresActivos();
}

// ===== GESTIÓN DE RECOGIDAS =====
function agregarFilaRecogida(datos = null) {
    filasRecogida.push({
        id: Date.now() + Math.random(),
        recogio: datos?.recogio || '',
        kilos: datos?.kilos || 0,
        canastillas: datos?.canastillas || 0
    });
    renderizarFilasRecogida();
}

function quitarFilaRecogida(id) {
    filasRecogida = filasRecogida.filter(f => f.id !== id);
    renderizarFilasRecogida();
}

function actualizarFilaRecogida(id, campo, valor) {
    const fila = filasRecogida.find(f => f.id === id);
    if (fila) {
        fila[campo] = (campo === 'kilos' || campo === 'canastillas') ? Number(valor) || 0 : valor;
        calcularTotalesAutomaticos();
    }
}

// ===== ✅ SUMA AUTOMÁTICA DE KILOS Y CANASTILLAS DE LLEGADA =====
function calcularTotalesAutomaticos() {
    let totalKilos = 0;
    let totalCanastillas = 0;
    filasRecogida.forEach(f => {
        totalKilos += Number(f.kilos) || 0;
        totalCanastillas += Number(f.canastillas) || 0;
    });

    const kilosTotal = document.getElementById('kilosTotales');
    if (kilosTotal) kilosTotal.value = totalKilos || '';

    const llegada = document.getElementById('canLlegadaTotal');
    if (llegada) llegada.value = totalCanastillas || '';
}

function renderizarFilasRecogida() {
    const cont = document.getElementById('listaRecogidas');
    if (!cont) return;
    cont.innerHTML = filasRecogida.map(f => `
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

// ===== CARGA DE DATOS DESDE FIREBASE =====
async function cargarDatos() {
    try {
        const cl = await db.collection('colaboradores').orderBy('nombre').get();
        colaboradores = cl.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectColaboradoresConductores();
        renderizarFilasRecogida();

        const vm = await db.collection('vehiculos_movimientos').orderBy('placa').get();
        vehiculosMov = vm.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosMov();

        const vt = await db.collection('vehiculos_transportadora').orderBy('placa').get();
        vehiculosTransp = vt.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosTransp();

        const cd = await db.collection('conductores').orderBy('nombre').get();
        conductores = cd.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectConductores();

        const mv = await db.collection('movimientos').orderBy('fecha', 'desc').limit(50).get();
        movimientos = mv.docs.map(d => ({ id: d.id, ...d.data() }));
        dibujarMovimientos();
    } catch (e) {
        console.log('Error cargando datos:', e.message);
    }
}

// ===== VEHÍCULOS MOVIMIENTOS =====
function actualizarSelectVehiculosMov() {
    const sel = document.getElementById('vehiculoMov');
    const sel2 = document.getElementById('vehiculoComb');
    const opts = '<option value="">Seleccione vehículo</option>' +
        vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
    if (sel) sel.innerHTML = opts;
    if (sel2) sel2.innerHTML = opts;
}

async function agregarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_movimientos').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoMov').value = '';
    document.getElementById('tipoVehiculoMov').value = '';
    await cargarDatos();
    registrarAccion('Agregar Vehículo Mov', 'Movimientos', `${placa} - ${tipo}`);
}

// ===== VEHÍCULOS TRANSPORTADORA =====
function actualizarSelectVehiculosTransp() {
    const sel = document.getElementById('vehiculoTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione vehículo</option>' +
        vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    await cargarDatos();
    registrarAccion('Agregar Vehículo Transp', 'Transportadora', `${placa} - ${tipo}`);
}

// ===== CONDUCTORES =====
function actualizarSelectConductores() {
    const sel = document.getElementById('conductorTransp');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione conductor</option>' +
        conductores.filter(c => c.activo !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores').add({ nombre, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    await cargarDatos();
    registrarAccion('Agregar Conductor', 'Transportadora', nombre);
}

// ===== ✅ GUARDAR MOVIMIENTO (Salida / Llegada) =====
async function guardarMovimiento() {
    const recogidasGuardar = filasRecogida.map(f => ({
        recogio: f.recogio,
        kilos: Number(f.kilos) || 0,
        canastillas: Number(f.canastillas) || 0
    }));

    const canSalida = Number(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = Number(document.getElementById('canLlegadaTotal').value) || 0;
    const kilosTotal = Number(document.getElementById('kilosTotales').value) || 0;

    const datos = {
        fecha: document.getElementById('fecha').value,
        placa: document.getElementById('vehiculoMov').value,
        colaboradorConductor: document.getElementById('colaboradorConductor').value,
        horaSalida: document.getElementById('horaSalida').value,
        horaLlegada: document.getElementById('horaLlegada').value,
        recogidas: recogidasGuardar,
        kilosTotales: kilosTotal,
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: canLlegada,
        observaciones: document.getElementById('observaciones').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };

    if (idEdicion) {
        await db.collection('movimientos').doc(idEdicion).update(datos);
        registrarAccion('Llegada Registrada', 'Movimientos', `ID: ${idEdicion}`);
        alert('✅ Llegada registrada correctamente');
    } else {
        await db.collection('movimientos').add(datos);
        registrarAccion('Salida Registrada', 'Movimientos', `Placa: ${datos.placa}`);
        alert('✅ Salida registrada');
    }

    idEdicion = null;
    filasRecogida = [];
    agregarFilaRecogida();
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('colaboradorConductor').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('kilosTotales').value = '';
    document.getElementById('observaciones').value = '';
    
    await cargarDatos();
}

// ===== MOVIMIENTO TRANSPORTADORA =====
async function guardarMovimientoTransp() {
    const datos = {
        fecha: document.getElementById('fechaTransp').value,
        placa: document.getElementById('vehiculoTransp').value,
        conductor: document.getElementById('conductorTransp').value,
        canastillasSalida: Number(document.getElementById('canSalidaTransp').value) || 0,
        canastillasLlegada: Number(document.getElementById('canLlegadaTransp').value) || 0,
        horaSalida: document.getElementById('horaSalidaTransp').value,
        horaLlegada: document.getElementById('horaLlegadaTransp').value,
        usuario: usuarioConectado.nombre,
        horaRegistro: new Date()
    };
    await db.collection('movimientos_transportadora').add(datos);
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    alert('✅ Movimiento registrado');
    registrarAccion('Movimiento Transp', 'Transportadora', datos.placa);
}

// ===== LISTA MOVIMIENTOS =====
function dibujarMovimientos(lista = movimientos) {
    const cont = document.getElementById('listaMovimientos');
    if (!cont) return;
    cont.innerHTML = lista.map(m => {
        const rec = m.recogidas?.length ?
            m.recogidas.map(r => `• ${r.recogio || 'Sin nombre'}: ${r.kilos}kg / ${r.canastillas} can`).join('<br>')
            : 'Sin recogidas';
        return `<div style="border-bottom:1px solid #e5e7eb; padding:0.75rem 0;">
            <strong>${m.fecha}</strong> | ${m.placa} | Conductor: ${m.colaboradorConductor || 'N/D'}<br>
            Salida: ${m.horaSalida || '--'} | Llegada: ${m.horaLlegada || '--'}<br>
            📤 Salida: ${m.totalCanastillasSalida || 0} canastillas<br>
            📥 Llegada: ${m.totalCanastillasLlegada || 0} canastillas | ⚖️ ${m.kilosTotales || 0} kg<br>
            <em>Recogidas:</em><br><small>${rec}</small>
            <div style="margin-top:0.5rem;">
                <button onclick="editarMovimiento('${m.id}')" class="btn-editar">✏️ Completar Llegada</button>
                ${usuarioConectado?.rol === 'admin' ? `<button onclick="eliminarMovimiento('${m.id}')" class="btn-eliminar">🗑️ Eliminar</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function filtrarMovimientos() {
    const b = document.getElementById('buscarMov').value.toLowerCase();
    dibujarMovimientos(movimientos.filter(m =>
        (m.placa && m.placa.toLowerCase().includes(b)) ||
        (m.colaboradorConductor && m.colaboradorConductor.toLowerCase().includes(b))
    ));
}

// ===== ✏️ EDITAR = CARGAR PARA COMPLETAR LLEGADA =====
async function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    
    idEdicion = id;
    
    document.getElementById('fecha').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('colaboradorConductor').value = m.colaboradorConductor || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('canSalidaTotal').value = m.totalCanastillasSalida || '';

    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canLlegadaTotal').value = m.totalCanastillasLlegada || '';
    document.getElementById('kilosTotales').value = m.kilosTotales || '';
    document.getElementById('observaciones').value = m.observaciones || '';
    
    filasRecogida = (m.recogidas || []).map(r => ({
        id: Date.now() + Math.random(),
        recogio: r.recogio || '',
        kilos: r.kilos || 0,
        canastillas: r.canastillas || 0
    }));
    
    renderizarFilasRecogida();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Acceso denegado');
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Eliminar Movimiento', 'Movimientos', `ID: ${id}`);
    await cargarDatos();
}

// ===== COMBUSTIBLE =====
async function guardarCombustible() {
    const datos = {
        fecha: new Date().toISOString().split('T')[0],
        placa: document.getElementById('vehiculoComb').value,
        kmManana: Number(document.getElementById('kma').value) || 0,
        kmTarde: Number(document.getElementById('kmt').value) || 0,
        galones: Number(document.getElementById('galones').value) || 0,
        usuario: usuarioConectado.nombre,
        horaRegistro: new Date()
    };
    await db.collection('combustible').add(datos);
    document.getElementById('kma').value = '';
    document.getElementById('kmt').value = '';
    document.getElementById('galones').value = '';
    alert('✅ Guardado');
    registrarAccion('Registro Combustible', 'Combustible', datos.placa);
}

// ===== INFORMES =====
function generarInforme() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    if (!inicio || !fin) return alert('Seleccione fechas');
    const filtro = movimientos.filter(m => m.fecha >= inicio && m.fecha <= fin);
    dibujarMovimientos(filtro);
}

function exportarExcel() {
    if (movimientos.length === 0) return alert('Sin datos para exportar');
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida || '',
        HoraLlegada: m.horaLlegada || '',
        CanastillasSalida: m.totalCanastillasSalida || 0,
        CanastillasLlegada: m.totalCanastillasLlegada || 0,
        KilosTotales: m.kilosTotales || 0,
        Recogidas: m.recogidas?.map(r => `${r.recogio}: ${r.kilos}kg / ${r.canastillas}can`).join(' | ') || '',
        Observaciones: m.observaciones || '',
        RegistradoPor: m.usuario
    }));
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO')}.xlsx`);
    registrarAccion('Exportar Excel', 'Informes', `${movimientos.length} registros`);
}

// ===== ADMINISTRACIÓN: CARGAR LISTAS =====
async function cargarListasAdmin() {
    try {
        const cl = await db.collection('colaboradores').orderBy('nombre').get();
        colaboradores = cl.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const listaColab = document.getElementById('listaColaboradoresAdmin');
        if (listaColab) {
            listaColab.innerHTML = colaboradores.map(c => `
                <div class="fila-lista ${c.activo === false ? 'inactivo' : ''}">
                    <span>${c.nombre}</span>
                    <div>
                        <button class="btn-editar" onclick="editarColaborador('${c.id}','${c.nombre}')">✏️ Editar</button>
                        <button class="btn-inactivar" onclick="inactivarColaborador('${c.id}',${c.activo !== false})">
                            ${c.activo === false ? '✅ Activar' : '⏸️ Inactivar'}
                        </button>
                        <button class="btn-eliminar" onclick="eliminarColaborador('${c.id}')">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
        }

        actualizarSelectColaboradoresConductores();
        renderizarFilasRecogida();

        const cd = await db.collection('conductores').orderBy('nombre').get();
        conductores = cd.docs.map(d => ({ id: d.id, ...d.data() }));
        const listaCond = document.getElementById('listaConductoresAdmin');
        if (listaCond) {
            listaCond.innerHTML = conductores.map(c => `
                <div class="fila-lista ${c.activo === false ? 'inactivo' : ''}">
                    <span>${c.nombre}</span>
                    <div>
                        <button class="btn-editar" onclick="editarConductor('${c.id}','${c.nombre}')">✏️ Editar</button>
                        <button class="btn-inactivar" onclick="inactivarConductor('${c.id}',${c.activo !== false})">
                            ${c.activo === false ? '✅ Activar' : '⏸️ Inactivar'}
                        </button>
                        <button class="btn-eliminar" onclick="eliminarConductor('${c.id}')">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
        }
        actualizarSelectConductores();

        const vm = await db.collection('vehiculos_movimientos').orderBy('placa').get();
        vehiculosMov = vm.docs.map(d => ({ id: d.id, ...d.data() }));
        const listaVM = document.getElementById('listaVehiculosMovAdmin');
        if (listaVM) {
            listaVM.innerHTML = vehiculosMov.map(v => `
                <div class="fila-lista">
                    <span>${v.placa} — ${v.tipo}</span>
                    <div>
                        <button class="btn-editar" onclick="editarVehiculoMov('${v.id}','${v.placa}','${v.tipo}')">✏️ Editar</button>
                        <button class="btn-eliminar" onclick="eliminarVehiculoMov('${v.id}')">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
        }
        actualizarSelectVehiculosMov();

        const vt = await db.collection('vehiculos_transportadora').orderBy('placa').get();
        vehiculosTransp = vt.docs.map(d => ({ id: d.id, ...d.data() }));
        const listaVT = document.getElementById('listaVehiculosTranspAdmin');
        if (listaVT) {
            listaVT.innerHTML = vehiculosTransp.map(v => `
                <div class="fila-lista">
                    <span>${v.placa} — ${v.tipo}</span>
                    <div>
                        <button class="btn-editar" onclick="editarVehiculoTransp('${v.id}','${v.placa}','${v.tipo}')">✏️ Editar</button>
                        <button class="btn-eliminar" onclick="eliminarVehiculoTransp('${v.id}')">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
        }
        actualizarSelectVehiculosTransp();
    } catch (e) {
        console.log('Error cargando admin:', e.message);
    }
}

// ===== COLABORADORES =====
async function agregarColaboradorAdmin() {
    const nombre = document.getElementById('nombreColabAdmin').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('colaboradores').add({ nombre, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreColabAdmin').value = '';
    await cargarListasAdmin();
    registrarAccion('Agregar Colaborador', 'Administración', nombre);
}

async function editarColaborador(id, nombreActual) {
    const nuevoNombre = prompt('Editar nombre:', nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    await db.collection('colaboradores').doc(id).update({ nombre: nuevoNombre.trim() });
    await cargarListasAdmin();
    registrarAccion('Editar Colaborador', 'Administración', `${nombreActual} ➔ ${nuevoNombre}`);
}

async function inactivarColaborador(id, estado) {
    await db.collection('colaboradores').doc(id).update({ activo: !estado });
    await cargarListasAdmin();
    registrarAccion(estado ? 'Inactivar Colaborador' : 'Activar Colaborador', 'Administración', '');
}

async function eliminarColaborador(id) {
    if (!confirm('¿Eliminar este colaborador definitivamente?')) return;
    await db.collection('colaboradores').doc(id).delete();
    await cargarListasAdmin();
    registrarAccion('Eliminar Colaborador', 'Administración', '');
}

// ===== CONDUCTORES ADMIN =====
async function agregarConductorAdmin() {
    const nombre = document.getElementById('nombreConductorAdmin').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores').add({ nombre, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreConductorAdmin').value = '';
    await cargarListasAdmin();
    registrarAccion('Agregar Conductor', 'Administración', nombre);
}

async function editarConductor(id, nombreActual) {
    const nuevoNombre = prompt('Editar nombre:', nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    await db.collection('conductores').doc(id).update({ nombre: nuevoNombre.trim() });
    await cargarListasAdmin();
    registrarAccion('Editar Conductor', 'Administración', `${nombreActual} ➔ ${nuevoNombre}`);
}

async function inactivarConductor(id, estado) {
    await db.collection('conductores').doc(id).update({ activo: !estado });
    await cargarListasAdmin();
    registrarAccion(estado ? 'Inactivar Conductor' : 'Activar Conductor', 'Administración', '');
}

async function eliminarConductor(id) {
    if (!confirm('¿Eliminar este conductor definitivamente?')) return;
    await db.collection('conductores').doc(id).delete();
    await cargarListasAdmin();
    registrarAccion('Eliminar Conductor', 'Administración', '');
}

// ===== VEHÍCULOS MOVIMIENTOS ADMIN =====
async function agregarVehiculoMovAdmin() {
    const placa = document.getElementById('placaVehiculoMovAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMovAdmin').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_movimientos').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoMovAdmin').value = '';
    document.getElementById('tipoVehiculoMovAdmin').value = '';
    await cargarListasAdmin();
    registrarAccion('Agregar Vehículo Mov', 'Administración', `${placa} - ${tipo}`);
}

async function editarVehiculoMov(id, placaActual, tipoActual) {
    const nuevaPlaca = prompt('Editar placa:', placaActual);
    if (!nuevaPlaca) return;
    const nuevoTipo = prompt('Editar tipo:', tipoActual);
    if (!nuevoTipo) return;
    await db.collection('vehiculos_movimientos').doc(id).update({ placa: nuevaPlaca.trim().toUpperCase(), tipo: nuevoTipo });
    await cargarListasAdmin();
    registrarAccion('Editar Vehículo Mov', 'Administración', `${placaActual} ➔ ${nuevaPlaca}`);
}

async function eliminarVehiculoMov(id) {
    if (!confirm('¿Eliminar este vehículo definitivamente?')) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    await cargarListasAdmin();
    registrarAccion('Eliminar Vehículo Mov', 'Administración', '');
}

// ===== VEHÍCULOS TRANSPORTADORA ADMIN =====
async function agregarVehiculoTranspAdmin() {
    const placa = document.getElementById('placaVehiculoTranspAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTranspAdmin').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTranspAdmin').value = '';
    document.getElementById('tipoVehiculoTranspAdmin').value = '';
    await cargarListasAdmin();
    registrarAccion('Agregar Vehículo Transp', 'Administración', `${placa} - ${tipo}`);
}

async function editarVehiculoTransp(id, placaActual, tipoActual) {
    const nuevaPlaca = prompt('Editar placa:', placaActual);
    if (!nuevaPlaca) return;
    const nuevoTipo = prompt('Editar tipo:', tipoActual);
    if (!nuevoTipo) return;
    await db.collection('vehiculos_transportadora').doc(id).update({ placa: nuevaPlaca.trim().toUpperCase(), tipo: nuevoTipo });
    await cargarListasAdmin();
    registrarAccion('Editar Vehículo Transp', 'Administración', `${placaActual} ➔ ${nuevaPlaca}`);
}

async function eliminarVehiculoTransp(id) {
    if (!confirm('¿Eliminar este vehículo definitivamente?')) return;
    await db.collection('vehiculos_transportadora').doc(id).delete();
    await cargarListasAdmin();
    registrarAccion('Eliminar Vehículo Transp', 'Administración', '');
}

// ===== CREAR USUARIO EN FIREBASE =====
async function crearUsuario() {
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Acceso denegado');
    let correo = document.getElementById('correoNuevo').value.trim();
    const pass = document.getElementById('passNuevo').value;
    const rol = document.getElementById('rolNuevo').value;
    if (!correo.includes('@')) correo += '@correo.com';
    if (pass.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');

    try {
        const cred = await auth.createUserWithEmailAndPassword(correo, pass);
        await db.collection('usuarios').doc(cred.user.uid).set({
            email: correo,
            rol,
            nombre: correo.split('@')[0],
            fechaCreacion: new Date()
        });
        document.getElementById('correoNuevo').value = '';
        document.getElementById('passNuevo').value = '';
        alert('✅ Usuario creado: ' + correo);
        registrarAccion('Crear Usuario', 'Administración', `${correo} [${rol}]`);
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// ===== BITÁCORA DE ACCIONES =====
async function registrarAccion(accion, modulo, detalle) {
    try {
        await db.collection('bitacora').add({
            accion,
            modulo,
            detalle,
            usuario: usuarioConectado?.nombre || usuarioConectado?.email || 'Desconocido',
            hora: new Date()
        });
    } catch (e) {
        console.log('⚠️ No se pudo registrar acción:', e.message);
    }
}
