// =====================================================
// ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====
// =====================================================

// 🔑 Tus credenciales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBruMDqyExColkMwy7XyqDSBsF8XcvsFoY",
  authDomain: "control-ingresos-y-canastillas.firebaseapp.com",
  projectId: "control-ingresos-y-canastillas",
  storageBucket: "control-ingresos-y-canastillas.firebasestorage.app",
  messagingSenderId: "372736670308",
  appId: "1:372736670308:web:14c2e2614c14ff3dc2bd71",
  measurementId: "G-N3YMQ2JKZM"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variables globales
let usuarioConectado = null;
let idEdicion = null;
let listaRecogidas = [];
let movimientos = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductoresTransp = [];
let colaboradores = [];
let kilometrajeLista = [];
let tanqueoLista = [];
let intervaloActualizar = null;

// =====================================================
// 🔑 USUARIOS FIJOS (sin necesidad de Firebase)
// =====================================================
const usuariosFijos = {
    "jgarnica": { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "Jorge Garnica" },
    "jfigueroa": { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "Jairo Figueroa" },
    "estudiante": { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante" }
};

// =====================================================
// ===== CAMBIAR PESTAÑAS Y MENÚ =====
// =====================================================
function alternarMenu() {
    const menu = document.getElementById('sidebar');
    menu.classList.toggle('mostrar');
}

function cambiarPestaña(nombre) {
    // Ocultar todas
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    // Mostrar la seleccionada
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    // Cambiar título
    const titulos = {
        movimientos: "📦 Movimientos",
        transportadora: "🚛 Transportadora",
        combustible: "⛽ Combustible",
        informes: "📊 Informes",
        admin: "⚙️ Administración"
    };
    document.getElementById('tituloPestaña').textContent = titulos[nombre] || nombre;
    // Cerrar menú en móvil
    document.getElementById('sidebar').classList.remove('mostrar');
    // Marcar botón activo
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
    
    // Cargar datos según pestaña
    if (nombre === 'movimientos') cargarMovimientos();
    if (nombre === 'transportadora') cargarDatosTransporte();
    if (nombre === 'combustible') cargarSelectsCombustible();
    if (nombre === 'admin') cargarDatosAdmin();
}

// Subpestañas Combustible
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
    event.target.classList.add('activa');
}

// Subpestañas Administración
function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.getElementById(`sub-admin-${nombre}`).classList.remove('oculto');
    event.target.classList.add('activa');
}

// =====================================================
// ===== INGRESAR A LA APLICACIÓN =====
// =====================================================
function ingresarApp() {
    // Ocultar login
    document.getElementById('modalLogin').style.display = 'none';
    // Mostrar botón Salir
    document.querySelector('.btn-salir').classList.remove('oculto');
    // Mostrar pestaña Admin si es administrador
    if (usuarioConectado.rol === 'admin') {
        document.getElementById('btnAdmin').classList.remove('oculto');
    }
    // Cargar todos los datos
    cargarTodo();
    // Iniciar actualización automática cada 10 segundos
    if (intervaloActualizar) clearInterval(intervaloActualizar);
    intervaloActualizar = setInterval(() => {
        cargarTodo();
        const ahora = new Date();
        document.getElementById('textoUltimaActualizacion').textContent =
            `✅ Última actualización: ${ahora.toLocaleTimeString()}`;
    }, 10000);
}

// Cerrar sesión
function cerrarSesion() {
    if (intervaloActualizar) clearInterval(intervaloActualizar);
    usuarioConectado = null;
    location.reload();
}

// =====================================================
// ===== CARGAR TODOS LOS DATOS DESDE FIREBASE =====
// =====================================================
async function cargarTodo() {
    await Promise.all([
        cargarMovimientos(),
        cargarVehiculosMov(),
        cargarColaboradores(),
        cargarDatosTransporte(),
        cargarKilometraje(),
        cargarTanqueo()
    ]);
    const ahora = new Date();
    document.getElementById('textoUltimaActualizacion').textContent =
        `✅ Última actualización: ${ahora.toLocaleTimeString()}`;
}

// Botón actualizar manualmente
async function actualizarDatos() {
    await cargarTodo();
    alert('✅ Datos actualizados correctamente');
}

// =====================================================
// ===== MOVIMIENTOS — GUARDAR Y LISTAR =====
// =====================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('colaboradorConductor').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const observaciones = document.getElementById('observaciones').value;

    if (!fecha || !placa || !conductor) {
        return alert('⚠️ Complete Fecha, Vehículo y Conductor');
    }

    const datosRecogida = listaRecogidas.map(r => ({
        recibeA: r.recibeA,
        kilos: parseFloat(r.kilos) || 0,
        canastillas: parseInt(r.canastillas) || 0
    }));

    const totalKilos = datosRecogida.reduce((s, r) => s + r.kilos, 0);
    const totalCanastillasRecibidas = datosRecogida.reduce((s, r) => s + r.canastillas, 0);

    const movimiento = {
        fecha, placa, conductor,
        horaSalida, horaLlegada,
        canSalida, canLlegada: canLlegada || totalCanastillasRecibidas,
        kilosTotales: totalKilos,
        observaciones,
        recogidas: datosRecogida,
        usuarioCreo: usuarioConectado.usuario || usuarioConectado.uid,
        fechaCreacion: new Date()
    };

    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(movimiento);
            alert('✅ Movimiento actualizado');
        } else {
            await db.collection('movimientos').add(movimiento);
            alert('✅ Movimiento guardado');
        }
        limpiarFormularioMovimiento();
        idEdicion = null;
        cargarMovimientos();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function limpiarFormularioMovimiento() {
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
    listaRecogidas = [];
    document.getElementById('listaRecogidas').innerHTML = '';
    calcularTotalesRecogida();
}

async function cargarMovimientos() {
    const snap = await db.collection('movimientos').orderBy('fecha', 'desc').get();
    movimientos = [];
    snap.forEach(doc => {
        movimientos.push({ id: doc.id, ...doc.data() });
    });
    dibujarListaMovimientos();
}

function dibujarListaMovimientos(lista = movimientos) {
    const caja = document.getElementById('listaMovimientos');
    caja.innerHTML = '';
    lista.forEach(m => {
        caja.innerHTML += `
            <div class="fila-lista">
                <div>
                    <strong>${m.fecha}</strong> — ${m.placa} — ${m.conductor}<br>
                    🕒 ${m.horaSalida || '--'} / ${m.horaLlegada || '--'} | 📦 Salida:${m.canSalida} Llegada:${m.canLlegada} | ⚖️ ${m.kilosTotales || 0}kg
                    ${m.recogidas?.length ? `<br>👤 Recogidas: ${m.recogidas.length}` : ''}
                </div>
                <div>
                    <button class="btn-editar" onclick="cargarEditarMovimiento('${m.id}')">✏️</button>
                    ${usuarioConectado?.rol === 'admin' ? `<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️</button>` : ''}
                </div>
            </div>`;
    });
}

function filtrarMovimientos() {
    const texto = document.getElementById('buscarMov').value.toLowerCase();
    const filtrados = movimientos.filter(m =>
        m.placa.toLowerCase().includes(texto) ||
        m.conductor.toLowerCase().includes(texto)
    );
    dibujarListaMovimientos(filtrados);
}

async function cargarEditarMovimiento(id) {
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;
    idEdicion = id;
    document.getElementById('fecha').value = mov.fecha;
    document.getElementById('vehiculoMov').value = mov.placa;
    document.getElementById('colaboradorConductor').value = mov.conductor;
    document.getElementById('horaSalida').value = mov.horaSalida || '';
    document.getElementById('horaLlegada').value = mov.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = mov.canSalida || '';
    document.getElementById('canLlegadaTotal').value = mov.canLlegada || '';
    document.getElementById('observaciones').value = mov.observaciones || '';
    listaRecogidas = mov.recogidas || [];
    dibujarListaRecogidas();
    calcularTotalesRecogida();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioConectado?.rol !== 'admin') {
        return alert('🔒 Solo el administrador puede eliminar');
    }
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    alert('✅ Eliminado');
    cargarMovimientos();
}

// =====================================================
// ===== RECOGIDAS DE COLABORADORES =====
// =====================================================
function agregarFilaRecogida() {
    listaRecogidas.push({ recibeA: '', kilos: 0, canastillas: 0 });
    dibujarListaRecogidas();
}

function dibujarListaRecogidas() {
    const caja = document.getElementById('listaRecogidas');
    caja.innerHTML = '';
    listaRecogidas.forEach((r, i) => {
        const opcionesColab = colaboradores.map(c =>
            `<option value="${c.nombre}" ${r.recibeA === c.nombre ? 'selected' : ''}>${c.nombre}</option>`
        ).join('');
        caja.innerHTML += `
            <div class="fila-recogida">
                <select onchange="listaRecogidas[${i}].recibeA=this.value; calcularTotalesRecogida()">
                    <option value="">Seleccione quién recoge</option>${opcionesColab}
                </select>
                <input type="number" placeholder="Kilos" value="${r.kilos || ''}"
                    onchange="listaRecogidas[${i}].kilos=parseFloat(this.value)||0; calcularTotalesRecogida()">
                <input type="number" placeholder="Canastillas" value="${r.canastillas || ''}"
                    onchange="listaRecogidas[${i}].canastillas=parseInt(this.value)||0; calcularTotalesRecogida()">
                <button class="btn-quitar" onclick="listaRecogidas.splice(${i},1); dibujarListaRecogidas(); calcularTotalesRecogida()">✕</button>
            </div>`;
    });
}

function calcularTotalesRecogida() {
    const totalKilos = listaRecogidas.reduce((s, r) => s + (parseFloat(r.kilos) || 0), 0);
    const totalCanastillas = listaRecogidas.reduce((s, r) => s + (parseInt(r.canastillas) || 0), 0);
    document.getElementById('kilosTotales').value = totalKilos;
    document.getElementById('canLlegadaTotal').value = totalCanastillas;
}

// =====================================================
// ===== VEHÍCULOS DE MOVIMIENTOS =====
// =====================================================
async function cargarVehiculosMov() {
    const snap = await db.collection('vehiculos_movimientos').get();
    vehiculosMov = [];
    snap.forEach(doc => {
        vehiculosMov.push({ id: doc.id, ...doc.data() });
    });
    const opciones = vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    document.getElementById('vehiculoMov').innerHTML = `<option value="">Seleccione vehículo</option>${opciones}`;
    document.getElementById('vehiculoKm').innerHTML = `<option value="">Seleccione vehículo</option>${opciones}`;
    document.getElementById('vehiculoTanqueo').innerHTML = `<option value="">Seleccione vehículo</option>${opciones}`;
}

async function guardarVehiculoMov() {
    const placa = document.getElementById('placaVehMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehMov').value;
    if (!placa || !tipo) return alert('⚠️ Escriba placa y seleccione tipo');
    
    const existe = vehiculosMov.find(v => v.placa === placa);
    if (existe) return alert('⚠️ Esta placa ya está registrada');

    await db.collection('vehiculos_movimientos').add({ placa, tipo });
    alert('✅ Vehículo guardado');
    document.getElementById('placaVehMov').value = '';
    cargarVehiculosMov();
    dibujarVehiculosAdmin();
}

function dibujarVehiculosAdmin() {
    const caja = document.getElementById('listaVehiculosMovAdmin') || document.getElementById('tablaVehiculosMov').querySelector('tbody');
    if (!caja) return;
    caja.innerHTML = '';
    vehiculosMov.forEach(v => {
        caja.innerHTML += `<tr><td>${v.placa}</td><td>${v.tipo}</td></tr>`;
    });
}

// =====================================================
// ===== COLABORADORES =====
// =====================================================
async function cargarColaboradores() {
    const snap = await db.collection('colaboradores').get();
    colaboradores = [];
    snap.forEach(doc => {
        colaboradores.push({ id: doc.id, ...doc.data() });
    });
    const activos = colaboradores.filter(c => (c.estado || 'activo') === 'activo');
    const opciones = activos.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    
    document.getElementById('colaboradorConductor').innerHTML = `<option value="">Seleccione colaborador</option>${opciones}`;
    document.getElementById('quienRegistraKm').innerHTML = `<option value="">Seleccione</option>${opciones}`;
    document.getElementById('quienTanquea').innerHTML = `<option value="">Seleccione</option>${opciones}`;
    dibujarColaboradoresAdmin();
}

async function guardarColaborador() {
    const nombre = document.getElementById('nombreColabAdmin').value.trim();
    if (!nombre) return alert('⚠️ Escriba el nombre');
    
    const existe = colaboradores.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (existe) return alert('⚠️ Este colaborador ya existe');

    await db.collection('colaboradores').add({ nombre, estado: 'activo', fechaCreacion: new Date() });
    alert('✅ Colaborador agregado');
    document.getElementById('nombreColabAdmin').value = '';
    cargarColaboradores();
}

function dibujarColaboradoresAdmin() {
    const caja = document.getElementById('listaColaboradoresAdmin') || document.getElementById('tablaColaboradores').querySelector('tbody');
    if (!caja) return;
    caja.innerHTML = '';
    colaboradores.forEach(c => {
        const estado = (c.estado || 'activo') === 'activo' ? '✅ Activo' : '❌ Inactivo';
        caja.innerHTML += `
            <tr>
                <td>${c.nombre}</td>
                <td>${estado}</td>
                <td>${c.usuario || '-'}</td>
                <td>
                    ${(c.estado || 'activo') === 'activo'
                        ? `<button class="btn-editar" onclick="inactivarColaborador('${c.id}')">📤 Inactivar</button>`
                        : `<button class="btn-primario" onclick="activarColaborador('${c.id}')">📥 Activar</button>`
                    }
                </td>
            </tr>`;
    });
}

async function inactivarColaborador(id) {
    if (!confirm('¿Inactivar este colaborador?')) return;
    await db.collection('colaboradores').doc(id).update({ estado: 'inactivo' });
    cargarColaboradores();
}

async function activarColaborador(id) {
    await db.collection('colaboradores').doc(id).update({ estado: 'activo' });
    cargarColaboradores();
}
// =====================================================
// ===== TRANSPORTADORA — Vehículos y Conductores =====
// =====================================================
async function cargarDatosTransporte() {
    const [vehSnap, condSnap] = await Promise.all([
        db.collection('vehiculos_transportadora').get(),
        db.collection('conductores_transportadora').get()
    ]);
    
    vehiculosTransp = [];
    vehSnap.forEach(d => vehiculosTransp.push({ id: d.id, ...d.data() }));
    
    conductoresTransp = [];
    condSnap.forEach(d => conductoresTransp.push({ id: d.id, ...d.data() }));

    const optVeh = vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    document.getElementById('vehiculoTransp').innerHTML = `<option value="">Seleccione vehículo</option>${optVeh}`;

    const optCond = conductoresTransp.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    document.getElementById('conductorTransp').innerHTML = `<option value="">Seleccione conductor</option>${optCond}`;

    dibujarVehiculosTransp();
    dibujarConductoresTransp();
}

async function guardarVehiculoTransp() {
    const placa = document.getElementById('placaVehTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehTransp').value;
    if (!placa || !tipo) return alert('⚠️ Escriba placa y seleccione tipo');
    
    const existe = vehiculosTransp.find(v => v.placa === placa);
    if (existe) return alert('⚠️ Esta placa ya existe');

    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    alert('✅ Vehículo agregado');
    document.getElementById('placaVehTransp').value = '';
    cargarDatosTransporte();
}

function dibujarVehiculosTransp() {
    const caja = document.getElementById('tablaVehiculosTransp');
    if (!caja) return;
    caja.innerHTML = '';
    vehiculosTransp.forEach(v => {
        caja.innerHTML += `<div class="fila-lista"><span>${v.placa} — ${v.tipo}</span></div>`;
    });
}

async function guardarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if (!nombre) return alert('⚠️ Escriba el nombre');

    const existe = conductoresTransp.find(c => c.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (existe) return alert('⚠️ Este conductor ya existe');

    await db.collection('conductores_transportadora').add({ nombre, fechaCreacion: new Date() });
    alert('✅ Conductor agregado');
    document.getElementById('nombreConductorTransp').value = '';
    cargarDatosTransporte();
}

function dibujarConductoresTransp() {
    const caja = document.getElementById('tablaConductoresTransp');
    if (!caja) return;
    caja.innerHTML = '';
    conductoresTransp.forEach(c => {
        caja.innerHTML += `<div class="fila-lista"><span>${c.nombre}</span></div>`;
    });
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;

    if (!fecha || !placa || !conductor) return alert('⚠️ Complete Fecha, Vehículo y Conductor');

    await db.collection('movimientos_transportadora').add({
        fecha, placa, conductor, horaSalida, horaLlegada, canSalida, canLlegada,
        usuarioCreo: usuarioConectado.usuario,
        fechaCreacion: new Date()
    });
    alert('✅ Movimiento registrado');
    document.getElementById('fechaTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
}

// =====================================================
// ===== COMBUSTIBLE — Kilometraje =====
// =====================================================
async function cargarKilometraje() {
    const snap = await db.collection('kilometraje').orderBy('fecha', 'desc').get();
    kilometrajeLista = [];
    snap.forEach(d => kilometrajeLista.push({ id: d.id, ...d.data() }));
}

async function guardarKilometraje() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmInicial = parseFloat(document.getElementById('kmInicial').value);
    const kmFinal = parseFloat(document.getElementById('kmFinal').value);
    const quienRegistra = document.getElementById('quienRegistraKm').value;

    if (!fecha || !placa || isNaN(kmInicial) || isNaN(kmFinal) || !quienRegistra) {
        return alert('⚠️ Complete todos los campos');
    }
    if (kmFinal < kmInicial) return alert('⚠️ Km Final no puede ser menor al inicial');

    const kmRecorridos = kmFinal - kmInicial;
    await db.collection('kilometraje').add({
        fecha, placa, kmInicial, kmFinal, kmRecorridos, quienRegistra,
        fechaCreacion: new Date()
    });
    alert(`✅ Guardado. Kilómetros recorridos: ${kmRecorridos}`);
    document.getElementById('fechaKm').value = '';
    document.getElementById('vehiculoKm').value = '';
    document.getElementById('kmInicial').value = '';
    document.getElementById('kmFinal').value = '';
    cargarKilometraje();
}

function cargarInformeKilometraje() {
    const desde = document.getElementById('fechaInicioKm').value;
    const hasta = document.getElementById('fechaFinKm').value;
    if (!desde || !hasta) return alert('⚠️ Seleccione fechas');

    const filtrados = kilometrajeLista.filter(k => k.fecha >= desde && k.fecha <= hasta);
    let html = `<table class="w-full text-sm border mt-2"><thead class="bg-gray-100"><tr>
        <th class="border p-1">Fecha</th><th class="border p-1">Placa</th><th class="border p-1">Km Inicial</th>
        <th class="border p-1">Km Final</th><th class="border p-1">Recorridos</th><th class="border p-1">Quién</th></tr></thead><tbody>`;
    let totalKm = 0;
    filtrados.forEach(k => {
        html += `<tr><td class="border p-1">${k.fecha}</td><td class="border p-1">${k.placa}</td>
            <td class="border p-1">${k.kmInicial}</td><td class="border p-1">${k.kmFinal}</td>
            <td class="border p-1">${k.kmRecorridos}</td><td class="border p-1">${k.quienRegistra}</td></tr>`;
        totalKm += k.kmRecorridos;
    });
    html += `</tbody><tr class="font-bold bg-gray-100"><td colspan="4" class="border p-1">TOTAL</td><td class="border p-1">${totalKm}</td><td class="border p-1"></td></tr></table>`;
    document.getElementById('resultadoKilometraje').innerHTML = html;
}

function exportarKilometrajeExcel() {
    const tabla = document.getElementById('resultadoKilometraje').querySelector('table');
    if (!tabla) return alert('⚠️ Primero consulte los datos');
    const wb = XLSX.utils.table_to_book(tabla);
    XLSX.writeFile(wb, `Kilometraje_${new Date().toLocaleDateString()}.xlsx`);
}

// =====================================================
// ===== COMBUSTIBLE — Tanqueo =====
// =====================================================
async function cargarTanqueo() {
    const snap = await db.collection('tanqueo').orderBy('fechaTanqueo', 'desc').get();
    tanqueoLista = [];
    snap.forEach(d => tanqueoLista.push({ id: d.id, ...d.data() }));
}

async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = parseFloat(document.getElementById('galonesTanqueo').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const quienTanquea = document.getElementById('quienTanquea').value;

    if (!fecha || !placa || isNaN(galones) || !quienTanquea) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('tanqueo').add({
        fechaTanqueo: fecha, placa, galones, estado, porcentaje, quienTanquea,
        fechaCreacion: new Date()
    });
    alert('✅ Tanqueo guardado');
    document.getElementById('fechaTanqueo').value = '';
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('quienTanquea').value = '';
    cargarTanqueo();
}

function cargarInformeTanqueo() {
    const desde = document.getElementById('fechaInicioTanqueo').value;
    const hasta = document.getElementById('fechaFinTanqueo').value;
    if (!desde || !hasta) return alert('⚠️ Seleccione fechas');

    const filtrados = tanqueoLista.filter(t => t.fechaTanqueo >= desde && t.fechaTanqueo <= hasta);
    let html = `<table class="w-full text-sm border mt-2"><thead class="bg-gray-100"><tr>
        <th class="border p-1">Fecha</th><th class="border p-1">Placa</th><th class="border p-1">Galones</th>
        <th class="border p-1">Estado</th><th class="border p-1">Quién</th></tr></thead><tbody>`;
    let totalGalones = 0;
    filtrados.forEach(t => {
        html += `<tr><td class="border p-1">${t.fechaTanqueo}</td><td class="border p-1">${t.placa}</td>
            <td class="border p-1">${t.galones}</td><td class="border p-1">${t.estado}</td>
            <td class="border p-1">${t.quienTanquea}</td></tr>`;
        totalGalones += t.galones;
    });
    html += `</tbody><tr class="font-bold bg-gray-100"><td colspan="2" class="border p-1">TOTAL</td>
        <td class="border p-1">${totalGalones.toFixed(2)}</td><td colspan="2" class="border p-1"></td></tr></table>`;
    document.getElementById('resultadoTanqueo').innerHTML = html;
}

function exportarTanqueoExcel() {
    const tabla = document.getElementById('resultadoTanqueo').querySelector('table');
    if (!tabla) return alert('⚠️ Primero consulte los datos');
    const wb = XLSX.utils.table_to_book(tabla);
    XLSX.writeFile(wb, `Tanqueo_${new Date().toLocaleDateString()}.xlsx`);
}

function cargarSelectsCombustible() {
    cargarVehiculosMov();
    cargarColaboradores();
}

// =====================================================
// ===== INFORMES GENERALES =====
// =====================================================
function consultarMovimientos() {
    const desde = document.getElementById('fechaInicioMov').value;
    const hasta = document.getElementById('fechaFinMov').value;
    if (!desde || !hasta) return alert('⚠️ Seleccione fechas');

    const filtrados = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
    const caja = document.getElementById('tablaInformeMov').querySelector('tbody');
    caja.innerHTML = '';
    filtrados.forEach(m => {
        caja.innerHTML += `<tr>
            <td class="border p-1">${m.fecha}</td>
            <td class="border p-1">${m.placa}</td>
            <td class="border p-1">${m.conductor}</td>
            <td class="border p-1">${m.canSalida}</td>
            <td class="border p-1">${m.canLlegada}</td>
            <td class="border p-1">${m.kilosTotales || 0}</td>
        </tr>`;
    });
}

function exportarExcel() {
    const tabla = document.getElementById('tablaInformeMov');
    if (!tabla) return alert('⚠️ Primero consulte los datos');
    const wb = XLSX.utils.table_to_book(tabla);
    XLSX.writeFile(wb, `Movimientos_${new Date().toLocaleDateString()}.xlsx`);
}

// =====================================================
// ===== ADMINISTRACIÓN — Cargar datos =====
// =====================================================
async function cargarDatosAdmin() {
    await cargarVehiculosMov();
    await cargarColaboradores();
    await cargarDatosTransporte();
}

// =====================================================
// ===== CREAR USUARIO EN FIREBASE =====
// =====================================================
async function crearUsuario() {
    const usuario = document.getElementById('usuarioNuevo').value.trim();
    const clave = document.getElementById('claveNuevo').value;
    const rol = document.getElementById('rolNuevo').value;

    if (!usuario || !clave) return alert('⚠️ Escriba usuario y contraseña');
    if (clave.length < 6) return alert('⚠️ La contraseña debe tener mínimo 6 caracteres');

    await db.collection('usuarios').add({ usuario, clave, rol, fechaCreacion: new Date() });
    alert('✅ Usuario creado correctamente');
    document.getElementById('usuarioNuevo').value = '';
    document.getElementById('claveNuevo').value = '';
}

// =====================================================
// 🔑 INICIO DE SESIÓN — FUNCIÓN PRINCIPAL
// =====================================================
async function iniciarSesion() {
    const campoUsuario = document.getElementById('correoLogin');
    const campoClave = document.getElementById('passLogin');
    const campoMensaje = document.getElementById('mensajeError');

    if (!campoUsuario || !campoClave || !campoMensaje) {
        console.log('Esperando campos...');
        return;
    }

    const usu = campoUsuario.value.trim();
    const clave = campoClave.value;

    if (!usu || !clave) {
        campoMensaje.textContent = "⚠️ Escriba usuario y contraseña";
        return;
    }

    // ✅ USUARIOS FIJOS
    if (usuariosFijos[usu] && usuariosFijos[usu].clave === clave) {
        usuarioConectado = { ...usuariosFijos[usu], uid: "FIJO_" + usu };
        ingresarApp();
        return;
    }

    // 🔍 Buscar en Firebase
    try {
        const snap = await db.collection('usuarios').get();
        let enc = null;
        snap.forEach(doc => {
            const u = doc.data();
            if (u.usuario === usu && u.clave === clave) {
                enc = { uid: doc.id, ...u };
            }
        });

        if (enc) {
            usuarioConectado = enc;
            ingresarApp();
        } else {
            let existe = false;
            snap.forEach(doc => { if (doc.data().usuario === usu) existe = true; });
            campoMensaje.textContent = existe ? "🔒 Contraseña errada" : "❌ Usuario no registrado";
        }
    } catch (e) {
        campoMensaje.textContent = "⚠️ Error: " + e.message;
    }
}

// ✅ HACER VISIBLES PARA EL BOTÓN DEL HTML
window.ingresar = iniciarSesion;

window.recuperarClave = function() {
    alert('📧 Por favor contacte al administrador para restablecer su contraseña.');
};

// =====================================================
// ✅ CARGA AUTOMÁTICA AL INICIAR
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Sistema cargado correctamente');
});
