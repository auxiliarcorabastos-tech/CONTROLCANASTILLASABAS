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
let vehiculosMov = [];       // Vehículos de MOVIMIENTOS
let vehiculosTransp = [];     // Vehículos de TRANSPORTADORA
let colaboradores = [];
let tiempoSesion = null;
let filasRecogida = [];       // Lista de recogidas

// ===== REFRESCAR DATOS SIN RECARGAR PÁGINA =====
async function refrescarDatos() {
    console.log('🔄 Actualizando datos...');
    await cargarDatos();
    alert('✅ Datos actualizados correctamente');
}

// ===== ALTERNAR MENÚ LATERAL =====
function alternarMenu() {
    document.getElementById('menuLateral').classList.toggle('visible');
    document.getElementById('capaOscura').classList.toggle('activo');
}

// ===== CAMBIAR PESTAÑA =====
function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.pestaña').forEach(p => p.classList.remove('activa'));
    document.getElementById('pest-' + nombre).classList.add('activa');
    if (window.innerWidth < 768) alternarMenu();
}

// ===== INICIAR SESIÓN =====
async function ingresar() {
    let correo = document.getElementById('correoLogin').value.trim();
    let pass = document.getElementById('passLogin').value;
    let error = document.getElementById('mensajeError');
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

        await auth.signInWithEmailAndPassword(correo, pass);
        const usuario = auth.currentUser;
        const doc = await db.doc(`usuarios/${usuario.uid}`).get();
        usuarioConectado = { email: usuario.email, uid: usuario.uid, ...doc.data() };
        await finalizarLogin();

    } catch (e) {
        if (e.code === 'auth/user-not-found') error.textContent = '❌ Usuario no registrado';
        else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') error.textContent = '🔒 Contraseña errada';
        else error.textContent = '⚠️ ' + e.message;
    }
}

async function finalizarLogin() {
    document.getElementById('pantallaLogin').style.display = 'none';
    document.getElementById('usuarioActual').textContent = usuarioConectado.nombre || usuarioConectado.email;
    if (usuarioConectado.rol === 'admin') document.getElementById('btnAdmin').style.display = 'block';
    await cargarDatos();
    iniciarTiempoSesion();
    registrarAccion('Inicio de Sesión', 'Sistema', 'Ingreso exitoso');
}

// ===== TIEMPO DE SESIÓN (1 hora) =====
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

function cerrarSesion() {
    auth.signOut();
    location.reload();
}

function recuperarClave() {
    alert('Solicita recuperación desde Firebase Console o ingresa con tu correo y contraseña');
}

// ===== GESTIÓN DE FILAS DE RECOGIDA =====
function agregarFilaRecogida(datos = null) {
    const idFila = Date.now() + Math.random();
    filasRecogida.push({ 
        id: idFila, 
        recogio: datos?.recogio || '', 
        kilos: datos?.kilos || 0, 
        canastillas: datos?.canastillas || 0 
    });
    renderizarFilasRecogida();
}

function quitarFilaRecogida(idFila) {
    filasRecogida = filasRecogida.filter(f => f.id !== idFila);
    renderizarFilasRecogida();
}

function actualizarFilaRecogida(idFila, campo, valor) {
    const fila = filasRecogida.find(f => f.id === idFila);
    if (fila) {
        fila[campo] = (campo === 'kilos' || campo === 'canastillas') ? Number(valor) || 0 : valor;
        calcularTotales();
    }
}

function calcularTotales() {
    let totalCan = 0;
    filasRecogida.forEach(f => {
        totalCan += Number(f.canastillas) || 0;
    });
    document.getElementById('canSalidaTotal').value = totalCan || '';
    document.getElementById('canLlegadaTotal').value = totalCan || '';
}

function renderizarFilasRecogida() {
    const cont = document.getElementById('listaRecogidas');
    const opcionesColab = colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    cont.innerHTML = filasRecogida.map(f => `
        <div class="fila-recogida">
            <select onchange="actualizarFilaRecogida(${f.id}, 'recogio', this.value)">
                <option value="">¿A quién recoge?</option>${opcionesColab}
                ${f.recogio ? `<option selected value="${f.recogio}">${f.recogio}</option>` : ''}
            </select>
            <input type="number" placeholder="Kilos" value="${f.kilos || ''}" 
                   oninput="actualizarFilaRecogida(${f.id}, 'kilos', this.value)">
            <input type="number" placeholder="Canastillas" value="${f.canastillas || ''}" 
                   oninput="actualizarFilaRecogida(${f.id}, 'canastillas', this.value)">
            <button class="btn-quitar" onclick="quitarFilaRecogida(${f.id})">✕</button>
        </div>
    `).join('');
    calcularTotales();
}

// ===== CARGAR DATOS DESDE FIREBASE =====
async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('fecha')) document.getElementById('fecha').value = hoy;
    if (document.getElementById('fechaTransp')) document.getElementById('fechaTransp').value = hoy;

    try {
        // Vehículos de MOVIMIENTOS (colección separada)
        const vm = await db.collection('vehiculos_movimientos').get();
        vehiculosMov = vm.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosMov();

        // Vehículos de TRANSPORTADORA (colección separada)
        const vt = await db.collection('vehiculos_transportadora').get();
        vehiculosTransp = vt.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectVehiculosTransp();

        // Conductores
        const cd = await db.collection('conductores').get();
        conductores = cd.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectConductores();

        // Colaboradores
        const cl = await db.collection('colaboradores').get();
        colaboradores = cl.docs.map(d => ({ id: d.id, ...d.data() }));
        actualizarSelectColaboradores();

        // Movimientos
        const mv = await db.collection('movimientos').orderBy('fecha', 'desc').limit(50).get();
        movimientos = mv.docs.map(d => ({ id: d.id, ...d.data() }));
        dibujarMovimientos();
    } catch (e) {
        console.log('⚠️ Al cargar datos:', e.message);
    }
}

// ===== VEHÍCULOS DE MOVIMIENTOS =====
function actualizarSelectVehiculosMov() {
    let opts = '<option value="">Seleccione vehículo</option>';
    vehiculosMov.forEach(v => opts += `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`);
    if (document.getElementById('vehiculoMov')) document.getElementById('vehiculoMov').innerHTML = opts;
    if (document.getElementById('vehiculoComb')) document.getElementById('vehiculoComb').innerHTML = opts;
}

async function agregarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_movimientos').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoMov').value = '';
    document.getElementById('tipoVehiculoMov').value = '';
    await cargarDatos();
    registrarAccion('Agregar Vehículo (Movimientos)', 'Movimientos', `${placa} - ${tipo}`);
}

// ===== VEHÍCULOS DE TRANSPORTADORA =====
function actualizarSelectVehiculosTransp() {
    let opts = '<option value="">Seleccione vehículo</option>';
    vehiculosTransp.forEach(v => opts += `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`);
    if (document.getElementById('vehiculoTransp')) document.getElementById('vehiculoTransp').innerHTML = opts;
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    await cargarDatos();
    registrarAccion('Agregar Vehículo (Transportadora)', 'Transportadora', `${placa} - ${tipo}`);
}

// ===== CONDUCTORES =====
function actualizarSelectConductores() {
    let opts = '<option value="">Seleccione conductor</option>';
    conductores.forEach(c => opts += `<option value="${c.nombre}">${c.nombre}</option>`);
    if (document.getElementById('conductorTransp')) document.getElementById('conductorTransp').innerHTML = opts;
}

async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    await cargarDatos();
    registrarAccion('Agregar Conductor', 'Transportadora', nombre);
}

// ===== COLABORADORES =====
function actualizarSelectColaboradores() {
    let opts = '<option value="">Seleccione colaborador</option>';
    colaboradores.forEach(c => opts += `<option value="${c.nombre}">${c.nombre}</option>`);
    if (document.getElementById('colaboradorConductor')) document.getElementById('colaboradorConductor').innerHTML = opts;
}

async function agregarColaborador() {
    const nombre = document.getElementById('nombreColab').value.trim();
    if (!nombre) return alert('Escriba el nombre del colaborador');
    await db.collection('colaboradores').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreColab').value = '';
    await cargarDatos();
    registrarAccion('Agregar Colaborador', 'Administración', nombre);
}

// ===== GUARDAR MOVIMIENTO CON RECOGIDAS =====
async function guardarMovimiento() {
    const recogidasParaGuardar = filasRecogida.map(f => ({
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
        recogidas: recogidasParaGuardar,
        totalCanastillasSalida: Number(document.getElementById('canSalidaTotal').value) || 0,
        totalCanastillasLlegada: Number(document.getElementById('canLlegadaTotal').value) || 0,
        observaciones: document.getElementById('observaciones').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };

    if (idEdicion) {
        await db.collection('movimientos').doc(idEdicion).update(datos);
        registrarAccion('Editar Movimiento', 'Movimientos', `ID: ${idEdicion}`);
    } else {
        await db.collection('movimientos').add(datos);
        registrarAccion('Nuevo Movimiento', 'Movimientos', `Placa: ${datos.placa}`);
    }

    // Limpiar formulario
    idEdicion = null;
    filasRecogida = [];
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('colaboradorConductor').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('observaciones').value = '';
    renderizarFilasRecogida();
    await cargarDatos();
    alert('✅ Movimiento guardado');
}

// ===== GUARDAR MOVIMIENTO DE TRANSPORTADORA =====
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
    await cargarDatos();
    alert('✅ Movimiento de transportadora registrado');
    registrarAccion('Movimiento Transportadora', 'Transportadora', `Placa: ${datos.placa}`);
}

// ===== DIBUJAR MOVIMIENTOS EN LISTA =====
function dibujarMovimientos(lista = movimientos) {
    const cont = document.getElementById('listaMovimientos');
    if (!cont) return;
    cont.innerHTML = lista.map(m => {
        const listaRec = m.recogidas?.length 
            ? m.recogidas.map(r => `• ${r.recogio || 'Sin nombre'}: ${r.kilos}kg / ${r.canastillas} can`).join('<br>')
            : 'Sin recogidas';
        return `
        <div style="border-bottom:1px solid #e2e8f0; padding:0.75rem 0; border-radius:0.5rem;">
            <strong>${m.fecha}</strong> | ${m.placa} | Conductor: ${m.colaboradorConductor || 'N/D'}<br>
            Salida: ${m.horaSalida || '--'} | Llegada: ${m.horaLlegada || '--'}<br>
            <em>Recogidas:</em><br><small>${listaRec}</small><br>
            📤 Salida: ${m.totalCanastillasSalida} | 📥 Llegada: ${m.totalCanastillasLlegada}
            ${usuarioConectado?.rol === 'admin' ? `<div style="margin-top:0.5rem;">
                <button onclick="editarMovimiento('${m.id}')" style="padding:0.35rem 0.6rem; font-size:0.8rem; margin-right:0.3rem;">✏️ Editar</button> 
                <button onclick="eliminarMovimiento('${m.id}')" style="padding:0.35rem 0.6rem; font-size:0.8rem; background:linear-gradient(135deg,#ef4444,#dc2626);">🗑️ Eliminar</button>
            </div>` : ''}
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

async function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fecha').value = m.fecha;
    document.getElementById('vehiculoMov').value = m.placa;
    document.getElementById('colaboradorConductor').value = m.colaboradorConductor || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
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
    if (usuarioConectado?.rol !== 'admin') return alert('🔒 Solo el administrador puede eliminar');
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
    alert('✅ Combustible guardado');
    registrarAccion('Registro Combustible', 'Combustible', `Placa: ${datos.placa}`);
}

// ===== INFORMES Y EXPORTAR =====
function generarInforme() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    if (!inicio || !fin) return alert('Seleccione rango de fechas');
    const filtrados = movimientos.filter(m => m.fecha >= inicio && m.fecha <= fin);
    const res = document.getElementById('resultadoInforme');
    if (res) {
        res.innerHTML = `<p><strong>✅ ${filtrados.length} movimientos encontrados</strong></p>`;
    }
    dibujarMovimientos(filtrados);
}

function exportarExcel() {
    if (movimientos.length === 0) return alert('No hay datos para exportar');
    const datos = movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada,
        Recogidas: m.recogidas?.map(r => `${r.recogio}: ${r.kilos}kg / ${r.canastillas}can`).join(' | ') || '',
        CanastillasSalida: m.totalCanastillasSalida,
        CanastillasLlegada: m.totalCanastillasLlegada,
        Observaciones: m.observaciones || '',
        RegistradoPor: m.usuario,
        HoraRegistro: m.horaRegistro ? new Date(m.horaRegistro.seconds * 1000).toLocaleString('es-CO') : ''
    }));
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO')}.xlsx`);
    registrarAccion('Exportar Excel', 'Informes', `${movimientos.length} registros`);
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
        alert('✅ Usuario creado correctamente');
        registrarAccion('Crear Usuario', 'Administración', correo);
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// ===== REGISTRAR ACCIONES EN BITÁCORA =====
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
