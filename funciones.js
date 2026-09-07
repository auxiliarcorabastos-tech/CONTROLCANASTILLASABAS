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
let vehiculos = [];
let colaboradores = [];
let tiempoSesion = null;

// ===== ALTERNAR MENÚ =====
function alternarMenu() {
    document.querySelector('.sidebar').classList.toggle('visible');
    document.querySelector('.overlay').classList.toggle('activo');
}

// ===== CAMBIAR PESTAÑA =====
function cambiarPestaña(nombre) {
    document.querySelectorAll('.btn-pestaña').forEach(b=>b.classList.remove('activa'));
    event.target.classList.add('activa');
    document.querySelectorAll('.pestaña').forEach(p=>p.classList.remove('activa'));
    document.getElementById('pest-'+nombre).classList.add('activa');
    if(window.innerWidth < 768) alternarMenu();
}

// ===== INICIAR SESIÓN =====
async function ingresar() {
    let correo = document.getElementById('correoLogin').value.trim();
    let pass = document.getElementById('passLogin').value;
    let error = document.getElementById('mensajeError');
    error.textContent = '';

    if(!correo.includes('@')) correo += '@correo.com';

    try {
        if(usuariosFijos[correo]) {
            if(usuariosFijos[correo].pass === pass) {
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

    } catch(e) {
        if(e.code === 'auth/user-not-found') error.textContent = '❌ Usuario no registrado';
        else if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') error.textContent = '🔒 Contraseña errada';
        else error.textContent = '⚠️ ' + e.message;
    }
}

async function finalizarLogin() {
    document.getElementById('pantallaLogin').style.display = 'none';
    document.getElementById('usuarioActual').textContent = usuarioConectado.nombre || usuarioConectado.email;
    if(usuarioConectado.rol === 'admin') document.getElementById('btnAdmin').style.display = 'block';
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

// ===== CARGAR DATOS =====
async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    document.getElementById('fechaTransp').value = hoy;

    const vh = await db.collection('vehiculos').get();
    vehiculos = vh.docs.map(d=>({id:d.id, ...d.data()}));
    actualizarSelectVehiculos();

    const cd = await db.collection('conductores').get();
    conductores = cd.docs.map(d=>({id:d.id, ...d.data()}));
    actualizarSelectConductores();

    const cl = await db.collection('colaboradores').get();
    colaboradores = cl.docs.map(d=>({id:d.id, ...d.data()}));
    actualizarSelectColaboradores();

    const mv = await db.collection('movimientos').orderBy('fecha', 'desc').limit(50).get();
    movimientos = mv.docs.map(d=>({id:d.id, ...d.data()}));
    dibujarMovimientos();
}

function actualizarSelectVehiculos() {
    let opts = '<option value="">Seleccione vehículo</option>';
    vehiculos.forEach(v=> opts += `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`);
    document.getElementById('vehiculo').innerHTML = opts;
    document.getElementById('vehiculoTransp').innerHTML = opts;
    document.getElementById('vehiculoComb').innerHTML = opts;
}

function actualizarSelectConductores() {
    let opts = '<option value="">Seleccione conductor</option>';
    conductores.forEach(c=> opts += `<option value="${c.nombre}">${c.nombre}</option>`);
    document.getElementById('conductorTransp').innerHTML = opts;
}

function actualizarSelectColaboradores() {
    let opts = '<option value="">Seleccione colaborador</option>';
    colaboradores.forEach(c=> opts += `<option value="${c.nombre}">${c.nombre}</option>`);
    document.getElementById('quienRecoge').innerHTML = opts;
}

// ===== CONDUCTORES =====
async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if(!nombre) return alert('Escriba el nombre');
    await db.collection('conductores').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    cargarDatos();
    registrarAccion('Agregar Conductor', 'Transportadora', nombre);
}

// ===== VEHÍCULOS =====
async function agregarVehiculo() {
    const placa = document.getElementById('placaVehiculo').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculo').value;
    if(!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculo').value = '';
    cargarDatos();
    registrarAccion('Agregar Vehículo', 'Transportadora', `${placa} - ${tipo}`);
}

// ===== COLABORADORES =====
async function agregarColaborador() {
    const nombre = document.getElementById('nombreColab').value.trim();
    if(!nombre) return alert('Escriba el nombre');
    await db.collection('colaboradores').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreColab').value = '';
    cargarDatos();
    registrarAccion('Agregar Colaborador', 'Administración', nombre);
}

// ===== GUARDAR MOVIMIENTO =====
async function guardarMovimiento() {
    const datos = {
        fecha: document.getElementById('fecha').value,
        placa: document.getElementById('vehiculo').value,
        colaborador: document.getElementById('quienRecoge').value,
        horaSalida: document.getElementById('horaSalida').value,
        horaLlegada: document.getElementById('horaLlegada').value,
        canastSalida: document.getElementById('canSalida').value,
        canastLlegada: document.getElementById('canLlegada').value,
        observaciones: document.getElementById('observaciones').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };

    if(idEdicion) {
        await db.collection('movimientos').doc(idEdicion).update(datos);
        registrarAccion('Editar Movimiento', 'Movimientos', `ID: ${idEdicion}`);
    } else {
        await db.collection('movimientos').add(datos);
        registrarAccion('Nuevo Movimiento', 'Movimientos', `Placa: ${datos.placa}`);
    }
    idEdicion = null;
    cargarDatos();
    alert('✅ Movimiento guardado');
}

async function guardarMovimientoTransp() {
    const datos = {
        fecha: document.getElementById('fechaTransp').value,
        placa: document.getElementById('vehiculoTransp').value,
        conductor: document.getElementById('conductorTransp').value,
        horaSalida: document.getElementById('horaSalidaTransp').value,
        horaLlegada: document.getElementById('horaLlegadaTransp').value,
        canastSalida: document.getElementById('canSalidaTransp').value,
        canastLlegada: document.getElementById('canLlegadaTransp').value,
        usuario: usuarioConectado.nombre || usuarioConectado.email,
        horaRegistro: new Date()
    };
    await db.collection('movimientos').add(datos);
    registrarAccion('Movimiento Transportadora', 'Transportadora', `Placa: ${datos.placa}`);
    cargarDatos();
    alert('✅ Movimiento registrado');
}

function dibujarMovimientos(lista = movimientos) {
    document.getElementById('listaMovimientos').innerHTML = lista.map(m=>`
        <div style="border-bottom:1px solid #eee; padding:0.5rem 0; font-size:0.9rem;">
            <strong>${m.fecha}</strong> | ${m.placa} | ${m.colaborador || m.conductor || 'Sin conductor'}<br>
            Salida: ${m.horaSalida || '--'} | Llegada: ${m.horaLlegada || '--'} | 📤${m.canastSalida||0} 📥${m.canastLlegada||0}
            ${usuarioConectado.rol==='admin'?`<div style="margin-top:0.3rem;"><button onclick="editarMovimiento('${m.id}')" style="width:auto; padding:0.3rem 0.5rem; font-size:0.8rem;">✏️ Editar</button> <button onclick="eliminarMovimiento('${m.id}')" style="width:auto; padding:0.3rem 0.5rem; font-size:0.8rem; background:#dc2626;">🗑️ Eliminar</button></div>`:''}
        </div>
    `).join('');
}

function filtrarMovimientos() {
    const b = document.getElementById('buscarMov').value.toLowerCase();
    dibujarMovimientos(movimientos.filter(m=>
        (m.placa && m.placa.toLowerCase().includes(b)) ||
        (m.colaborador && m.colaborador.toLowerCase().includes(b)) ||
        (m.conductor && m.conductor.toLowerCase().includes(b))
    ));
}

async function editarMovimiento(id) {
    const m = movimientos.find(x=>x.id===id);
    if(!m) return;
    idEdicion = id;
    document.getElementById('fecha').value = m.fecha;
    document.getElementById('vehiculo').value = m.placa;
    document.getElementById('quienRecoge').value = m.colaborador || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalida').value = m.canastSalida || '';
    document.getElementById('canLlegada').value = m.canastLlegada || '';
    document.getElementById('observaciones').value = m.observaciones || '';
    window.scrollTo({top:0, behavior:'smooth'});
}

async function eliminarMovimiento(id) {
    if(usuarioConectado.rol!=='admin') return alert('🔒 Solo el administrador puede eliminar');
    if(!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Eliminar Movimiento', 'Movimientos', `ID: ${id}`);
    cargarDatos();
}

// ===== COMBUSTIBLE =====
async function guardarCombustible() {
    const datos = {
        fecha: new Date().toISOString().split('T')[0],
        placa: document.getElementById('vehiculoComb').value,
        kmManana: document.getElementById('kma').value,
        kmTarde: document.getElementById('kmt').value,
        galones: document.getElementById('galones').value,
        usuario: usuarioConectado.nombre,
        horaRegistro: new Date()
    };
    await db.collection('combustible').add(datos);
    registrarAccion('Registro Combustible', 'Combustible', datos.placa);
    alert('✅ Guardado');
}

// ===== INFORMES Y EXPORTAR =====
function generarInforme() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    const filtrados = movimientos.filter(m=> m.fecha >= inicio && m.fecha <= fin);
    document.getElementById('resultadoInforme').innerHTML = `<p>Se encontraron ${filtrados.length} movimientos</p>`;
    dibujarMovimientos(filtrados);
}

function exportarExcel() {
    const hoja = XLSX.utils.json_to_sheet(movimientos.map(m=>({
        Fecha: m.fecha, Placa: m.placa,
        Colaborador: m.colaborador || m.conductor,
        HoraSalida: m.horaSalida, HoraLlegada: m.horaLlegada,
        CanastillasSalida: m.canastSalida, CanastillasLlegada: m.canastLlegada,
        RegistradoPor: m.usuario
    })));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos-${new Date().toLocaleDateString()}.xlsx`);
    registrarAccion('Exportar Excel', 'Informes', 'Descarga generada');
}

// ===== CREAR USUARIO (ADMIN) =====
async function crearUsuario() {
    if(usuarioConectado.rol!=='admin') return alert('🔒 Acceso denegado');
    let correo = document.getElementById('correoNuevo').value.trim();
    if(!correo.includes('@')) correo += '@correo.com';
    const pass = document.getElementById('passNuevo').value;
    const rol = document.getElementById('rolNuevo').value;
    try {
        const cred = await auth.createUserWithEmailAndPassword(correo, pass);
        await db.collection('usuarios').doc(cred.user.uid).set({
            email: correo, rol, nombre: correo.split('@')[0], fechaCreacion: new Date()
        });
        alert('✅ Usuario creado');
        registrarAccion('Crear Usuario', 'Administración', correo);
    } catch(e) { alert('Error: ' + e.message); }
}

// ===== BITÁCORA =====
async function registrarAccion(accion, modulo, detalle) {
    await db.collection('bitacora').add({
        accion, modulo, detalle,
        usuario: usuarioConectado?.nombre || usuarioConectado?.email || 'Anónimo',
        fechaHora: new Date()
    });
}
