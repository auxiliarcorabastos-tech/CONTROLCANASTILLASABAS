// ==================================================
// ===== VARIABLES GLOBALES =====
// ==================================================
let db, auth;
let usuarioActivo = null;
let movimientos = [];
let movimientosTransp = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let kilometraje = [];
let tanqueo = [];
let datosVehiculos = [];
let historialMantenimientos = [];
let idEdicion = null;
let idEdicionTransp = null;
let filtroPendientes = false;
let filasRecogida = [];
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };

const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", permisos: ["movimientos", "informes"] }
];

// ==================================================
// ===== CONFIGURACIÓN FIREBASE =====
// ==================================================
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
db = firebase.firestore();
auth = firebase.auth();

// ==================================================
// ===== 🔐 INICIAR SESIÓN =====
// ==================================================
async function iniciarSesion() {
    const usu = document.getElementById("correoLogin").value.trim();
    const clave = document.getElementById("passLogin").value;
    const msj = document.getElementById("mensajeError");
    msj.textContent = "";

    const fijo = usuariosFijos.find(u => u.usuario === usu && u.clave === clave);
    if (fijo) {
        usuarioActivo = { ...fijo, uid: "FIJO_" + fijo.usuario };
        ingresarApp();
        return;
    }

    try {
        let correoLogin = usu.includes('@') ? usu : `${usu}@correo.com`;
        const cred = await auth.signInWithEmailAndPassword(correoLogin, clave);
        const doc = await db.collection("usuarios").doc(cred.user.uid).get();
        if (doc.exists) {
            usuarioActivo = { uid: cred.user.uid, email: correoLogin, ...doc.data() };
            ingresarApp();
        } else {
            msj.textContent = "⚠️ Usuario no registrado";
        }
    } catch (e) {
        if (e.code === "auth/user-not-found") msj.textContent = "⚠️ Usuario no registrado";
        else if (e.code === "auth/wrong-password") msj.textContent = "🔑 Contraseña errada";
        else msj.textContent = "❌ " + e.message;
    }
}

function ingresar() { iniciarSesion(); }

function ingresarApp() {
    document.getElementById("modalLogin").classList.add("oculto");
    document.querySelector(".contenedor-principal").classList.remove("oculto");
    document.getElementById("btnAdmin").classList.toggle("oculto", usuarioActivo.rol !== "admin");
    document.querySelector(".btn-salir").classList.remove("oculto");
    cargarDatosCompleto();
    sesionActiva();
}

// ==================================================
// ===== ⏰ CIERRE AUTOMÁTICO POR INACTIVIDAD (1 HORA) =====
// ==================================================
let temporizadorSesion;
function sesionActiva() {
    window.onmousemove = reiniciarContador;
    window.onkeydown = reiniciarContador;
    reiniciarContador();
}
function reiniciarContador() {
    clearTimeout(temporizadorSesion);
    temporizadorSesion = setTimeout(() => {
        if (confirm("⏰ Cierre de sesión por inactividad. ¿Aceptar?")) {
            cerrarSesion();
        } else {
            reiniciarContador();
        }
    }, 3600000);
}
function cerrarSesion() {
    clearTimeout(temporizadorSesion);
    usuarioActivo = null;
    document.getElementById("modalLogin").classList.remove("oculto");
    document.querySelector(".contenedor-principal").classList.add("oculto");
    document.getElementById("correoLogin").value = "";
    document.getElementById("passLogin").value = "";
    document.querySelector(".btn-salir").classList.add("oculto");
}

// ==================================================
// ===== 📋 NAVEGACIÓN DE PESTAÑAS =====
// ==================================================
function cambiarPestaña(nombre) {
    document.querySelectorAll('.pestaña').forEach(p => p.classList.add('oculto'));
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    document.getElementById(`pest-${nombre}`).classList.remove('oculto');
    event.target.classList.add('activa');

    const titulos = {
        movimientos: "📦 Movimientos",
        transportadora: "🚛 Transportadora",
        combustible: "⛽ Combustible",
        mantenimientos: "🔧 Mantenimientos",
        informes: "📊 Informes",
        admin: "⚙️ Administración"
    };
    document.getElementById("tituloPestaña").textContent = titulos[nombre] || nombre;

    if (nombre === 'movimientos') dibujarMovimientos();
    if (nombre === 'transportadora') { llenarSelectsTransportadora(); dibujarMovimientosTransp(); dibujarListaConductores(); }
    if (nombre === 'combustible') { cargarPendientesKilometraje(); }
    if (nombre === 'mantenimientos') { cargarSelectMantenimientos(); cargarHistorialCompleto(); }
    if (nombre === 'admin') cambiarSubpestañaAdmin('colaboradores');
}

function alternarMenu() {
    document.getElementById('sidebar').classList.toggle('mostrar');
}

// ==================================================
// ===== 🔄 CARGAR TODOS LOS DATOS DESDE FIREBASE =====
// ==================================================
async function cargarDatosCompleto() {
    const snapMov = await db.collection('movimientos').orderBy('fecha', 'desc').get();
    movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapMovTransp = await db.collection('movimientos_transportadora').orderBy('fecha', 'desc').get();
    movimientosTransp = snapMovTransp.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapCol = await db.collection('colaboradores').get();
    colaboradores = snapCol.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapVehMov = await db.collection('vehiculos_movimientos').get();
    vehiculosMov = snapVehMov.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapVehTrans = await db.collection('vehiculos_transportadora').get();
    vehiculosTransp = snapVehTrans.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapCond = await db.collection('conductores_transportadora').get();
    conductores = snapCond.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapKm = await db.collection('kilometraje').orderBy('fecha', 'desc').get();
    kilometraje = snapKm.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapTanq = await db.collection('tanqueo').orderBy('fechaTanqueo', 'desc').get();
    tanqueo = snapTanq.docs.map(d => ({ id: d.id, ...d.data() }));

    await cargarDatosMantenimientos();
    llenarSelects();
    llenarSelectsTransportadora();
    dibujarMovimientos();
    cargarPendientesKilometraje();
    document.getElementById("textoUltimaActualizacion").textContent = "Última actualización: " + new Date().toLocaleTimeString('es-CO');
}

async function actualizarInformacion() {
    await cargarDatosCompleto();
    alert('✅ Información actualizada desde la nube');
}

// ==================================================
// ===== 📄 LLENAR SELECTS =====
// ==================================================
function llenarSelects() {
    const selVeh = document.getElementById('vehiculoMov');
    const selCond = document.getElementById('colaboradorConductor');
    const selKmVeh = document.getElementById('vehiculoKm');
    const selKmCol = document.getElementById('quienRegistraKm');
    const selTanqVeh = document.getElementById('vehiculoTanqueo');
    const selTanqCol = document.getElementById('quienTanquea');

    const activosCol = colaboradores.filter(c => c.estado !== "inactivo");
    const optCol = activosCol.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const optVeh = vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');

    if(selVeh) selVeh.innerHTML = '<option value="">Seleccione vehículo</option>' + optVeh;
    if(selCond) selCond.innerHTML = '<option value="">Seleccione colaborador</option>' + optCol;
    if(selKmVeh) selKmVeh.innerHTML = '<option value="">Seleccione placa</option>' + optVeh;
    if(selKmCol) selKmCol.innerHTML = '<option value="">Seleccione quien registra</option>' + optCol;
    if(selTanqVeh) selTanqVeh.innerHTML = '<option value="">Seleccione placa</option>' + optVeh;
    if(selTanqCol) selTanqCol.innerHTML = '<option value="">Seleccione quien tanquea</option>' + optCol;
}

function llenarSelectsTransportadora() {
    const selVeh = document.getElementById('vehiculoTransp');
    const selCond = document.getElementById('conductorTransp');
    if(selVeh) selVeh.innerHTML = '<option value="">Seleccione vehículo</option>' + vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    if(selCond) selCond.innerHTML = '<option value="">Seleccione conductor</option>' + conductores.filter(c => c.activo !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// ==================================================
// ===== 🧮 CALCULADORA EN CADA FILA DE RECOGIDA =====
// ==================================================
function calcularKilosTeclado(e, idx) {
    if (e.key === 'Enter') {
        e.preventDefault();
        calcularKilosFila(idx);
    }
}

function calcularKilosFila(idx) {
    const campo = document.querySelector(`.fila-recogida[data-idx="${idx}"] input[placeholder*="Kilos"]`);
    if (!campo) return;
    
    let texto = campo.value.trim();
    if (!texto || !isNaN(texto)) return;
    
    const seguro = texto.replace(/[^0-9+\-*/.\s]/g, '');
    try {
        const resultado = Function('"use strict"; return (' + seguro + ')')();
        if (typeof resultado === 'number' && !isNaN(resultado) && isFinite(resultado)) {
            campo.value = resultado;
            filasRecogida[idx].kilos = resultado;
            calcularTotalesRecogidas();
        }
    } catch (err) {
        alert('⚠️ Operación inválida. Ejemplo: 120+45-10');
        campo.value = '';
        filasRecogida[idx].kilos = 0;
        calcularTotalesRecogidas();
    }
}

// ==================================================
// ===== 📝 LIMPIAR FORMULARIO =====
// ==================================================
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
    idEdicion = null;
    document.getElementById('listaRecogidas').innerHTML = '';
    filasRecogida = [];
    calcularTotalesRecogidas();
}

function completarMovimiento() {
    limpiarFormulario();
    alert('✅ Movimiento guardado y formulario limpio. Listo para nuevo registro.');
}

// ==================================================
// ===== 👥 GESTIÓN DE RECOGIDAS =====
// ==================================================
function agregarFilaRecogida() {
    const contenedor = document.getElementById('listaRecogidas');
    const idx = filasRecogida.length;
    filasRecogida.push({ colaborador: '', kilos: 0, canastillas: 0 });
    contenedor.innerHTML += `
        <div class="fila-recogida" data-idx="${idx}">
            <select onchange="actualizarRecogida(${idx}, 'colaborador', this.value)">
                <option value="">Seleccione quién recoge</option>
                ${colaboradores.filter(c => c.estado !== "inactivo").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
            </select>
            <input type="text" placeholder="Kilos (ej: 120+45)" 
                   onkeydown="calcularKilosTeclado(event, ${idx})"
                   oninput="actualizarRecogida(${idx}, 'kilos', this.value)">
            <input type="number" placeholder="Canastillas" 
                   oninput="actualizarRecogida(${idx}, 'canastillas', this.value)">
            <button class="btn-quitar" onclick="quitarFilaRecogida(${idx})">✕</button>
        </div>`;
    calcularTotalesRecogidas();
}

function actualizarRecogida(idx, campo, valor) {
    if(campo === 'kilos' || campo === 'canastillas') valor = parseFloat(valor) || 0;
    filasRecogida[idx][campo] = valor;
    calcularTotalesRecogidas();
}

function quitarFilaRecogida(idx) {
    filasRecogida.splice(idx, 1);
    redibujarFilasRecogida();
}

function redibujarFilasRecogida() {
    const contenedor = document.getElementById('listaRecogidas');
    contenedor.innerHTML = '';
    filasRecogida.forEach((f, i) => {
        contenedor.innerHTML += `
            <div class="fila-recogida" data-idx="${i}">
                <select onchange="actualizarRecogida(${i}, 'colaborador', this.value)">
                    <option value="">Seleccione quién recoge</option>
                    ${colaboradores.filter(c => c.estado !== "inactivo").map(c => `<option value="${c.nombre}" ${f.colaborador===c.nombre?'selected':''}>${c.nombre}</option>`).join('')}
                </select>
                <input type="text" placeholder="Kilos (ej: 120+45)" value="${f.kilos||''}"
                       onkeydown="calcularKilosTeclado(event, ${i})"
                       oninput="actualizarRecogida(${i}, 'kilos', this.value)">
                <input type="number" placeholder="Canastillas" value="${f.canastillas||''}"
                       oninput="actualizarRecogida(${i}, 'canastillas', this.value)">
                <button class="btn-quitar" onclick="quitarFilaRecogida(${i})">✕</button>
            </div>`;
    });
    calcularTotalesRecogidas();
}

function calcularTotalesRecogidas() {
    // ✅ SUMA AUTOMÁTICA — EL TOTAL SE CALCULA SOLO Y NO SE PUEDE EDITAR
    const totalKilos = filasRecogida.reduce((s, f) => s + (parseFloat(f.kilos) || 0), 0);
    const totalCanastillas = filasRecogida.reduce((s, f) => s + (parseFloat(f.canastillas) || 0), 0);
    
    const campoKilos = document.getElementById('kilosTotales');
    if (campoKilos) {
        campoKilos.value = totalKilos || '';
        campoKilos.readOnly = true;
        campoKilos.style.backgroundColor = '#eef2ff';
        campoKilos.style.cursor = 'not-allowed';
    }
    
    const campoCan = document.getElementById('canLlegadaTotal');
    if (campoCan) {
        campoCan.value = totalCanastillas || '';
        campoCan.readOnly = true;
        campoCan.style.backgroundColor = '#eef2ff';
        campoCan.style.cursor = 'not-allowed';
    }
}

// ==================================================
// ===== 💾 GUARDAR MOVIMIENTO =====
// ==================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('colaboradorConductor').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const kilosTot = parseFloat(document.getElementById('kilosTotales').value) || 0;
    const observaciones = document.getElementById('observaciones').value;
    const idEditar = document.getElementById('idEditar').value;

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }

    const datosMov = {
        fecha, placa, colaboradorConductor: conductor,
        horaSalida, horaLlegada: horaLlegada || '',
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: canLlegada,
        kilosTotales: kilosTot, observaciones,
        recogidas: filasRecogida,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        horaRegistro: new Date()
    };

    try {
        if (idEditar) {
            await db.collection('movimientos').doc(idEditar).update(datosMov);
            alert('✅ Movimiento MODIFICADO correctamente');
            registrarAccion('Editar Movimiento', 'Movimientos', `Placa: ${placa} — ${conductor}`);
        } else {
            await db.collection('movimientos').add(datosMov);
            alert('✅ Movimiento GUARDADO correctamente');
            registrarAccion('Nuevo Movimiento', 'Movimientos', `Placa: ${placa} — ${conductor}`);
        }
        limpiarFormulario();
        filasRecogida = [];
        await cargarDatosCompleto();
    } catch (error) {
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ==================================================
// ===== ✏️ CARGAR MOVIMIENTO PARA EDITAR =====
// ==================================================
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
    document.getElementById('idEditar').value = id;
    filasRecogida = mov.recogidas || [];
    redibujarFilasRecogida();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================================================
// ===== 🗑️ ELIMINAR MOVIMIENTO =====
// ==================================================
async function eliminarMovimiento(id) {
    if (usuarioActivo.rol !== 'admin') {
        alert('🔒 Solo el administrador puede eliminar registros');
        return;
    }
    if (!confirm('⚠️ ¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Eliminar Movimiento', 'Movimientos', `ID: ${id}`);
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

// ==================================================
// ===== 📋 FILTROS Y LISTA MOVIMIENTOS (SOLO DEL DÍA) =====
// ==================================================
function alternarFiltroMovimientos() {
    filtroPendientes = !filtroPendientes;
    const btn = document.getElementById('btnFiltroMov');
    if(btn) {
        btn.textContent = filtroPendientes ? '📋 Ver Todos' : '⏳ Ver Pendientes';
        btn.classList.toggle('activo', filtroPendientes);
    }
    dibujarMovimientos();
}

function filtrarMovimientos() { dibujarMovimientos(); }

function dibujarMovimientos() {
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    const hoy = new Date().toISOString().split('T')[0];
    let lista = movimientos.filter(m => m.fecha === hoy);
    const busqueda = (document.getElementById('buscarMov')?.value || '').toLowerCase();
    if (filtroPendientes) lista = lista.filter(m => !m.horaLlegada);
    if (busqueda) lista = lista.filter(m => 
        m.placa.toLowerCase().includes(busqueda) || 
        m.colaboradorConductor.toLowerCase().includes(busqueda));

    if (lista.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos registrados HOY</p>';
        return;
    }

    c.innerHTML = lista.map(m => {
        const esPendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${esPendiente?'pendiente':'completado'}">
            <div>
                <strong>📅 ${m.fecha}</strong> | 🚗 ${m.placa} | 👤 ${m.colaboradorConductor}<br>
                🕒 Salida: ${m.horaSalida || '--'} | 🕐 Llegada: ${m.horaLlegada || '--'}<br>
                📦 Salida: ${m.totalCanastillasSalida} | 📦 Llegada: ${m.totalCanastillasLlegada} | ⚖️ Kilos: ${m.kilosTotales || 0}
                ${m.observaciones?`<br>📝 ${m.observaciones}`:''}
                ${esPendiente?'<span class="estado-pendiente">⏳ PENDIENTE</span>':'<span class="estado-completado">✅ COMPLETADO</span>'}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')">✏️ Editar</button>
                ${usuarioActivo?.rol==='admin'?`<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️ Eliminar</button>`:''}
            </div>
        </div>`;
    }).join('');
}

// ==================================================
// ===== 🚛 TRANSPORTADORA - CONDUCTORES =====
// ==================================================
async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if (!nombre) return alert('Escriba el nombre del conductor');
    const existe = conductores.find(c => c.nombre.trim().toUpperCase() === nombre.toUpperCase());
    if (existe) return alert('⚠️ Este conductor ya existe');
    await db.collection('conductores_transportadora').add({ nombre, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    alert('✅ Conductor agregado');
    registrarAccion('Conductor Agregado', 'Transportadora', nombre);
    await cargarDatosCompleto();
}

function dibujarListaConductores() {
    const c = document.getElementById('listaConductoresTransp');
    if (!c) return;
    if (!conductores.length) return c.innerHTML = '<p>Sin conductores registrados</p>';
    c.innerHTML = conductores.map(cnd => `
        <div class="fila-lista">
            <span><strong>${cnd.nombre}</strong> ${cnd.activo !== false ? '✅ Activo' : '❌ Inactivo'}</span>
            <div>
                <button class="btn-editar" style="padding:0.3rem 0.5rem;font-size:0.8rem;" onclick="cambiarEstadoConductor('${cnd.id}', '${cnd.nombre}', ${cnd.activo !== false})">
                    ${cnd.activo !== false ? '❌ Inactivar' : '✅ Activar'}
                </button>
            </div>
        </div>`).join('');
}

async function cambiarEstadoConductor(id, nombre, estadoActualActivo) {
    const nuevoEstado = !estadoActualActivo;
    await db.collection('conductores_transportadora').doc(id).update({ activo: nuevoEstado });
    alert(`✅ Conductor ${nuevoEstado ? 'ACTIVADO' : 'INACTIVADO'}: ${nombre}`);
    registrarAccion(`Conductor ${nuevoEstado ? 'ACTIVADO' : 'INACTIVADO'}`, 'Transportadora', nombre);
    await cargarDatosCompleto();
}

// ==================================================
// ===== 🚛 TRANSPORTADORA - VEHÍCULOS =====
// ==================================================
async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    const existe = vehiculosTransp.find(v => v.placa === placa);
    if (existe) return alert('⚠️ Esta placa ya existe');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    alert('✅ Vehículo de Transportadora agregado');
    registrarAccion('Vehículo Transp Agregado', 'Transportadora', `${placa} — ${tipo}`);
    await cargarDatosCompleto();
}

// ==================================================
// ===== 🚛 TRANSPORTADORA - MOVIMIENTOS =====
// ==================================================
function verificarCanastillasSalida() {
    const canSal = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    if (canSal > 0) {
        document.getElementById('btnCompletarTransp').classList.remove('oculto');
    } else {
        document.getElementById('btnCompletarTransp').classList.add('oculto');
    }
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    const idEditar = document.getElementById('idEditarTransp').value;

    if (!fecha || !placa || !conductor || !horaSalida || canSalida <= 0) {
        return alert('⚠️ Complete Fecha, Placa, Conductor, Hora de Salida y Canastillas que salen');
    }

    const datos = {
        fecha, placa, conductor, horaSalida, horaLlegada, canSalida, canLlegada,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        horaRegistro: new Date()
    };

    try {
        if (idEditar) {
            await db.collection('movimientos_transportadora').doc(idEditar).update(datos);
            alert(horaLlegada && canLlegada >= 0 ? '✅ Movimiento COMPLETADO y guardado' : '✅ Salida actualizada');
            registrarAccion('Editar Movimiento Transp', 'Transportadora', `${placa} — ${conductor}`);
        } else {
            await db.collection('movimientos_transportadora').add(datos);
            alert('✅ Salida registrada. Cuando regrese, ingrese la llegada.');
            registrarAccion('Nueva Salida Transp', 'Transportadora', `${placa} — ${conductor}`);
        }
        limpiarFormularioTransp();
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function completarMovimientoTransp() {
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    if (!horaLlegada || canLlegada <= 0) {
        return alert('⚠️ Para completar ingrese Hora de Llegada y Canastillas que llegan');
    }
    guardarMovimientoTransp();
}

function limpiarFormularioTransp() {
    document.getElementById('fechaTransp').value = '';
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    document.getElementById('idEditarTransp').value = '';
    idEdicionTransp = null;
    document.getElementById('btnCompletarTransp').classList.add('oculto');
}

function cargarMovimientoTranspParaEditar(id) {
    const mov = movimientosTransp.find(m => m.id === id);
    if (!mov) return;
    idEdicionTransp = id;
    document.getElementById('fechaTransp').value = mov.fecha;
    document.getElementById('vehiculoTransp').value = mov.placa;
    document.getElementById('conductorTransp').value = mov.conductor;
    document.getElementById('horaSalidaTransp').value = mov.horaSalida;
    document.getElementById('horaLlegadaTransp').value = mov.horaLlegada || '';
    document.getElementById('canSalidaTransp').value = mov.canSalida;
    document.getElementById('canLlegadaTransp').value = mov.canLlegada || '';
    document.getElementById('idEditarTransp').value = id;
    if (mov.canSalida > 0 && !mov.horaLlegada) {
        document.getElementById('btnCompletarTransp').classList.remove('oculto');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function dibujarMovimientosTransp() {
    const c = document.getElementById('listaMovimientosTransp');
    if (!c) return;
    if (!movimientosTransp.length) return c.innerHTML = '<p class="text-center">📭 Sin movimientos registrados</p>';
    c.innerHTML = movimientosTransp.map(m => {
        const esPendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${esPendiente?'pendiente':'completado'}">
            <div>
                <strong>📅 ${m.fecha}</strong> | 🚗 ${m.placa} | 👤 ${m.conductor}<br>
                🕒 Salida: ${m.horaSalida} | 🕐 Llegada: ${m.horaLlegada || '--'}<br>
                📦 Salida: ${m.canSalida} | 📦 Llegada: ${m.canLlegada || '--'}
                ${esPendiente?'<span class="estado-pendiente">⏳ PENDIENTE — FALTA LLEGADA</span>':'<span class="estado-completado">✅ COMPLETADO</span>'}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
                <button class="btn-editar" onclick="cargarMovimientoTranspParaEditar('${m.id}')">✏️ ${esPendiente?'Registrar Llegada':'Editar'}</button>
            </div>
        </div>`;
    }).join('');
}

// ==================================================
// ===== ⛽ COMBUSTIBLE - KILOMETRAJE =====
// ==================================================
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

function cargarPendientesKilometraje() {
    const pendientes = kilometraje.filter(k => k.kmTarde === null || k.kmTarde === undefined || k.kmTarde === '');
    const c = document.getElementById('pendientesKilometraje');
    if (!c) return;
    if (pendientes.length === 0) {
        c.innerHTML = '<p class="text-sm text-green-600">✅ No hay registros pendientes por completar</p>';
        return;
    }
    c.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#fed7aa;"><tr>
            <th>Fecha</th><th>Placa</th><th>🌅 Km Mañana</th><th>Colaborador</th><th>Acción</th>
        </tr></thead><tbody>
        ${pendientes.map(r=>`<tr style="background:#fff7ed;">
            <td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmManana}</td><td>${r.colaborador}</td>
            <td><button class="bg-orange-500 text-white px-2 py-1 rounded text-xs" onclick="cargarParaCompletar('${r.id}')">✏️ Completar Tarde</button></td>
        </tr>`).join('')}
        </tbody></table>`;
}

function cargarParaCompletar(id) {
    const reg = kilometraje.find(k => k.id === id);
    if (!reg) return;
    document.getElementById('fechaKm').value = reg.fecha;
    document.getElementById('vehiculoKm').value = reg.placa;
    document.getElementById('kmManana').value = reg.kmManana;
    document.getElementById('kmTarde').value = '';
    document.getElementById('kmTarde').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmManana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;
    const colaborador = document.getElementById('quienRegistraKm').value;

    if (!fecha || !placa || !colaborador) {
        return alert('⚠️ Complete Fecha, Placa y Quién Registra');
    }
    if (kmManana === null && kmTarde === null) {
        return alert('⚠️ Escriba al menos el Kilometraje de la Mañana o de la Tarde');
    }

    const registroExistente = kilometraje.find(k => k.fecha === fecha && k.placa === placa);
    let kmRecorridos = null;
    if (kmManana !== null && kmTarde !== null) {
        if (kmTarde < kmManana) return alert('⚠️ Km Tarde debe ser MAYOR a Km Mañana');
        kmRecorridos = kmTarde - kmManana;
    }

    const datos = {
        fecha, placa, kmManana, kmTarde, kmRecorridos, colaborador,
        usuario: usuarioActivo.email || usuarioActivo.usuario, fechaHora: new Date()
    };

    try {
        if (registroExistente) {
            await db.collection('kilometraje').doc(registroExistente.id).update(datos);
            alert('✅ Registro ACTUALIZADO. Kilometraje de la tarde guardado.');
            registrarAccion('Completar Kilometraje', 'Combustible', `${placa} — Mañana:${kmManana} Tarde:${kmTarde}`);
        } else {
            await db.collection('kilometraje').add(datos);
            alert('✅ Kilometraje de la Mañana GUARDADO. Puede completar el de la tarde más tarde.');
            registrarAccion('Registro Kilometraje', 'Combustible', `${placa} — Mañana:${kmManana}`);
        }
        document.getElementById('fechaKm').valueAsDate = new Date();
        document.getElementById('vehiculoKm').value = '';
        document.getElementById('kmManana').value = '';
        document.getElementById('kmTarde').value = '';
        document.getElementById('quienRegistraKm').value = '';
        await cargarDatosCompleto();
    } catch (error) { alert('❌ Error: ' + error.message); }
}

function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKilometraje');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin datos</p>';
    c.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>🌅 Km Mañana</th><th>🌇 Km Tarde</th><th>✅ Recorridos</th><th>Colaborador</th>
        </tr></thead><tbody>
        ${res.map(r=>`<tr>
            <td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmManana || '--'}</td><td>${r.kmTarde || '--'}</td>
            <td>${r.kmRecorridos !== null ? r.kmRecorridos : '⏳ Pendiente'}</td><td>${r.colaborador}</td>
        </tr>`).join('')}
        </tbody></table>`;
}

function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje?.length) return alert('Consulte primero');
    const datos = ultimosResultados.kilometraje.map(r => ({
        Fecha: r.fecha, Placa: r.placa, KmMañana: r.kmManana, KmTarde: r.kmTarde,
        KmRecorridos: r.kmRecorridos !== null ? r.kmRecorridos : 'Pendiente',
        Colaborador: r.colaborador, Usuario: r.usuario || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Kilometraje");
    XLSX.writeFile(libro, `Kilometraje_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel de Kilometraje generado');
}

// ==================================================
// ===== ⛽ COMBUSTIBLE - TANQUEO =====
// ==================================================
async function guardarRegistroTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = parseFloat(document.getElementById('galonesTanqueo').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const colaborador = document.getElementById('quienTanquea').value;

    if (!fecha || !placa || isNaN(galones) || !colaborador) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('tanqueo').add({
        fechaTanqueo: fecha, placa, galones, estado, porcentajeReal: porcentaje, colaborador,
        usuario: usuarioActivo.email || usuarioActivo.usuario, fechaHora: new Date()
    });

    alert('✅ Tanqueo guardado');
    registrarAccion('Registro Tanqueo', 'Combustible', `${placa} — ${galones} gln`);
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('estadoTanqueo').value = 'FULL';
    document.getElementById('porcentajeTanqueo').value = '100';
    document.getElementById('quienTanquea').value = '';
    await cargarDatosCompleto();
}

function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo').value;
    const ff = document.getElementById('fechaFinTanqueo').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fechaTanqueo >= fi && t.fechaTanqueo <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanqueo');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin datos</p>';
    c.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Galones</th><th>Estado</th><th>Colaborador</th>
        </tr></thead><tbody>
        ${res.map(r=>`<tr><td>${r.fechaTanqueo}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.estado==='FULL'?'✅ FULL':'⚡ Parcial'}</td><td>${r.colaborador}</td></tr>`).join('')}
        </tbody></table>`;
}

function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo?.length) return alert('Consulte primero');
    const datos = ultimosResultados.tanqueo.map(r => ({
        Fecha: r.fechaTanqueo, Placa: r.placa, Galones: r.galones,
        Estado: r.estado==='FULL'?'FULL':'Parcial', Porcentaje: r.porcentajeReal||100,
        Colaborador: r.colaborador, Usuario: r.usuario||''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Tanqueo");
    XLSX.writeFile(libro, `Tanqueo_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel de Tanqueo generado');
}

// ==================================================
// ===== 🔧 MANTENIMIENTOS Y DOCUMENTOS VEHICULOS =====
// ==================================================
function cargarSelectMantenimientos() {
    const sel = document.getElementById('placaMantenimiento');
    if(!sel) return;
    const todasPlacas = [...vehiculosMov];
    sel.innerHTML = '<option value="">Seleccione placa...</option>' + 
        todasPlacas.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    cargarHistorialCompleto();
}

async function cargarDatosVehiculo() {
    const placa = document.getElementById('placaMantenimiento').value;
    if(!placa) {
        document.getElementById('fechaTecnoMecanica').value = '';
        document.getElementById('fechaSoat').value = '';
        document.getElementById('fechaSeguro').value = '';
        document.getElementById('numDocumentos').value = '';
        document.getElementById('estadoVehiculo').innerHTML = '✅ En Servicio';
        document.getElementById('estadoVehiculo').className = 'py-2 font-bold text-green-600';
        return;
    }
    const datos = datosVehiculos.find(d => d.placa === placa);
    if(datos) {
        document.getElementById('fechaTecnoMecanica').value = datos.fechaTecno || '';
        document.getElementById('fechaSoat').value = datos.fechaSoat || '';
        document.getElementById('fechaSeguro').value = datos.fechaSeguro || '';
        document.getElementById('numDocumentos').value = datos.observaciones || '';
        mostrarVencimientos(datos);
    } else {
        document.getElementById('fechaTecnoMecanica').value = '';
        document.getElementById('fechaSoat').value = '';
        document.getElementById('fechaSeguro').value = '';
        document.getElementById('numDocumentos').value = '';
    }

    const ultimo = historialMantenimientos
        .filter(m => m.placa === placa && !m.fechaEntrega)
        .sort((a,b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso))[0];
    if(ultimo) {
        document.getElementById('estadoVehiculo').innerHTML = '🔧 EN TALLER';
        document.getElementById('estadoVehiculo').className = 'py-2 font-bold text-orange-600';
    } else {
        document.getElementById('estadoVehiculo').innerHTML = '✅ En Servicio';
        document.getElementById('estadoVehiculo').className = 'py-2 font-bold text-green-600';
    }
    dibujarHistorialPlaca(placa);
}
// ==================================================
// ===== 🔧 MANTENIMIENTOS - GUARDAR DOCUMENTOS =====
// ==================================================
async function guardarDatosVehiculo() {
    const placa = document.getElementById('placaMantenimiento').value;
    const fechaTecno = document.getElementById('fechaTecnoMecanica').value;
    const fechaSoat = document.getElementById('fechaSoat').value;
    const fechaSeguro = document.getElementById('fechaSeguro').value;
    const observaciones = document.getElementById('numDocumentos').value;

    if (!placa) return alert('⚠️ Seleccione la placa del vehículo');

    const datos = { placa, fechaTecno, fechaSoat, fechaSeguro, observaciones,
        usuario: usuarioActivo.email || usuarioActivo.usuario, fechaHora: new Date() };

    const existe = datosVehiculos.find(d => d.placa === placa);
    try {
        if (existe) {
            await db.collection('datos_vehiculos').doc(existe.id).update(datos);
            alert('✅ Datos del vehículo ACTUALIZADOS');
        } else {
            await db.collection('datos_vehiculos').add(datos);
            alert('✅ Datos del vehículo GUARDADOS');
        }
        registrarAccion('Datos Vehículo', 'Mantenimientos', `Placa: ${placa}`);
        await cargarDatosMantenimientos();
        mostrarVencimientos(datos);
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function mostrarVencimientos(datos) {
    const hoy = new Date();
    const msDia = 86400000;
    const alerta = [];
    const fechaT = datos.fechaTecno ? new Date(datos.fechaTecno) : null;
    const fechaS = datos.fechaSoat ? new Date(datos.fechaSoat) : null;
    const fechaSeg = datos.fechaSeguro ? new Date(datos.fechaSeguro) : null;

    if (fechaT) {
        const faltan = Math.ceil((fechaT - hoy) / msDia);
        if (faltan < 0) alerta.push(`🔴 Tecno-mecánica VENCIDA hace ${Math.abs(faltan)} días`);
        else if (faltan <= 30) alerta.push(`🟡 Tecno-mecánica vence en ${faltan} días`);
        else alerta.push(`🟢 Tecno-mecánica vigente hasta ${datos.fechaTecno}`);
    }
    if (fechaS) {
        const faltan = Math.ceil((fechaS - hoy) / msDia);
        if (faltan < 0) alerta.push(`🔴 SOAT VENCIDO hace ${Math.abs(faltan)} días`);
        else if (faltan <= 30) alerta.push(`🟡 SOAT vence en ${faltan} días`);
        else alerta.push(`🟢 SOAT vigente hasta ${datos.fechaSoat}`);
    }
    if (fechaSeg) {
        const faltan = Math.ceil((fechaSeg - hoy) / msDia);
        if (faltan < 0) alerta.push(`🔴 Seguro VENCIDO hace ${Math.abs(faltan)} días`);
        else if (faltan <= 30) alerta.push(`🟡 Seguro vence en ${faltan} días`);
        else alerta.push(`🟢 Seguro vigente hasta ${datos.fechaSeguro}`);
    }
    const c = document.getElementById('alertasVencimientos');
    if (c) c.innerHTML = alerta.map(a => `<p class="py-1 text-sm">${a}</p>`).join('');
}

// ==================================================
// ===== 🔧 MANTENIMIENTOS - REGISTRO INGRESO/SALIDA =====
// ==================================================
async function registrarIngresoTaller() {
    const placa = document.getElementById('placaMant').value.toUpperCase();
    const fechaIngreso = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMant').value;
    const responsable = document.getElementById('quienEntrega').value;

    if (!placa || !fechaIngreso || !motivo || !responsable) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('historial_mantenimientos').add({
        placa, fechaIngreso, motivo, responsable, fechaEntrega: null, observacionesEntrega: null,
        usuario: usuarioActivo.email || usuarioActivo.usuario, fechaHora: new Date()
    });

    alert('✅ Ingreso a taller registrado');
    registrarAccion('Ingreso Taller', 'Mantenimientos', `${placa} — ${motivo}`);
    document.getElementById('placaMant').value = '';
    document.getElementById('fechaIngreso').valueAsDate = new Date();
    document.getElementById('motivoMant').value = '';
    document.getElementById('quienEntrega').value = '';
    await cargarDatosMantenimientos();
    cargarDatosVehiculo();
}

async function registrarEntregaTaller(id) {
    const fechaEntrega = prompt('Ingrese fecha de entrega (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!fechaEntrega) return;
    const obs = prompt('Observaciones al entregar:');

    await db.collection('historial_mantenimientos').doc(id).update({
        fechaEntrega, observacionesEntrega: obs || ''
    });

    alert('✅ Vehículo entregado');
    registrarAccion('Entrega Taller', 'Mantenimientos', `ID: ${id}`);
    await cargarDatosMantenimientos();
    cargarDatosVehiculo();
}

async function cargarDatosMantenimientos() {
    const snapVeh = await db.collection('datos_vehiculos').get();
    datosVehiculos = snapVeh.docs.map(d => ({ id: d.id, ...d.data() }));

    const snapHist = await db.collection('historial_mantenimientos').orderBy('fechaIngreso', 'desc').get();
    historialMantenimientos = snapHist.docs.map(d => ({ id: d.id, ...d.data() }));
}

function cargarHistorialCompleto() {
    const c = document.getElementById('listaHistorialMant');
    if (!c) return;
    if (!historialMantenimientos.length) return c.innerHTML = '<p class="text-center">📭 Sin registros de mantenimiento</p>';
    c.innerHTML = historialMantenimientos.map(m => {
        const activo = !m.fechaEntrega;
        return `
        <div class="fila-lista ${activo?'pendiente':'completado'}">
            <div>
                <strong>🚗 ${m.placa}</strong> — 📅 Ingreso: ${m.fechaIngreso}<br>
                📝 Motivo: ${m.motivo}<br>
                👤 Quien entrega: ${m.responsable}
                ${activo ? `<br><span class="estado-pendiente">🔧 EN TALLER desde ${m.fechaIngreso}</span>` : 
                `<br>✅ Entregado: ${m.fechaEntrega} — ${m.observacionesEntrega||'Sin observaciones'}`}
            </div>
            <div>
                ${activo && usuarioActivo?.rol==='admin' ? 
                `<button class="btn-editar" onclick="registrarEntregaTaller('${m.id}')">✅ Registrar Entrega</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function dibujarHistorialPlaca(placa) {
    const c = document.getElementById('historialPlaca');
    if (!c) return;
    const filtro = historialMantenimientos.filter(m => m.placa === placa);
    if (!filtro.length) return c.innerHTML = '<p class="text-sm">Sin historial para esta placa</p>';
    c.innerHTML = filtro.map(m => `
        <div class="border-b py-2 text-sm">
            <strong>📅 ${m.fechaIngreso}</strong> — ${m.motivo}<br>
            ${m.fechaEntrega ? `✅ Entregado: ${m.fechaEntrega}` : '🔧 EN TALLER'}
        </div>`).join('');
}

// ==================================================
// ===== ⚙️ ADMINISTRACIÓN =====
// ==================================================
function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subadmin').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');
    if (nombre === 'colaboradores') dibujarColaboradores();
    if (nombre === 'vehiculos') dibujarVehiculosMov();
    if (nombre === 'tipos-vehiculo') dibujarTiposVehiculo();
}

// ===== COLABORADORES =====
async function guardarColaborador() {
    const nombre = document.getElementById('nombreColaboradorAdmin').value.trim();
    const idEditar = document.getElementById('idEditarColaborador').value;
    if (!nombre) return alert('Escriba el nombre');

    const existe = colaboradores.find(c => c.nombre.trim().toUpperCase() === nombre.toUpperCase() && c.id !== idEditar);
    if (existe) return alert('⚠️ Este colaborador ya existe');

    const datos = { nombre, estado: 'activo', fechaEdicion: new Date(), usuario: usuarioActivo.email };
    try {
        if (idEditar) {
            await db.collection('colaboradores').doc(idEditar).update(datos);
            alert('✅ Colaborador ACTUALIZADO');
        } else {
            datos.fechaCreacion = new Date();
            await db.collection('colaboradores').add(datos);
            alert('✅ Colaborador AGREGADO');
        }
        document.getElementById('nombreColaboradorAdmin').value = '';
        document.getElementById('idEditarColaborador').value = '';
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function editarColaborador(id) {
    const c = colaboradores.find(x => x.id === id);
    if (!c) return;
    document.getElementById('nombreColaboradorAdmin').value = c.nombre;
    document.getElementById('idEditarColaborador').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cambiarEstadoColaborador(id) {
    if (!confirm('¿Cambiar estado del colaborador?')) return;
    const c = colaboradores.find(x => x.id === id);
    const nuevoEstado = c.estado === 'activo' ? 'inactivo' : 'activo';
    await db.collection('colaboradores').doc(id).update({ estado: nuevoEstado });
    alert(`✅ Colaborador ${nuevoEstado === 'activo' ? 'ACTIVADO' : 'INACTIVADO'}`);
    registrarAccion(`Colaborador ${nuevoEstado}`, 'Administración', c.nombre);
    await cargarDatosCompleto();
}

function dibujarColaboradores() {
    const tb = document.querySelector('#tablaColaboradores tbody');
    if (!tb) return;
    tb.innerHTML = '';
    colaboradores.forEach(c => {
        tb.innerHTML += `<tr>
            <td>${c.nombre}</td>
            <td>${(c.estado || "activo") === "activo" ? "✅ Activo" : "❌ Inactivo"}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primario" style="padding:0.3rem 0.5rem; font-size:0.75rem;" onclick='editarColaborador("${c.id}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.75rem;" onclick="cambiarEstadoColaborador('${c.id}')">
                    ${(c.estado || "activo") === "activo" ? '❌ Inactivar' : '✅ Activar'}
                </button>
            </td>
        </tr>`;
    });
}

// ===== VEHÍCULOS DE MOVIMIENTO =====
async function guardarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    const marca = document.getElementById('marcaVehiculoMov').value.trim();
    const idEditar = document.getElementById('idEditarVehiculoMov').value;
    if (!placa || !tipo) return alert('Complete Placa y Tipo');

    const existe = vehiculosMov.find(v => v.placa === placa && v.id !== idEditar);
    if (existe) return alert('⚠️ Esta placa ya existe');

    const datos = { placa, tipo, marca, fechaEdicion: new Date(), usuario: usuarioActivo.email };
    try {
        if (idEditar) {
            await db.collection('vehiculos_movimientos').doc(idEditar).update(datos);
            alert('✅ Vehículo ACTUALIZADO');
        } else {
            datos.fechaCreacion = new Date();
            await db.collection('vehiculos_movimientos').add(datos);
            alert('✅ Vehículo AGREGADO');
        }
        document.getElementById('placaVehiculoMov').value = '';
        document.getElementById('tipoVehiculoMov').value = '';
        document.getElementById('marcaVehiculoMov').value = '';
        document.getElementById('idEditarVehiculoMov').value = '';
        await cargarDatosCompleto();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function editarVehiculoMov(id) {
    const v = vehiculosMov.find(x => x.id === id);
    if (!v) return;
    document.getElementById('placaVehiculoMov').value = v.placa;
    document.getElementById('tipoVehiculoMov').value = v.tipo;
    document.getElementById('marcaVehiculoMov').value = v.marca || '';
    document.getElementById('idEditarVehiculoMov').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarVehiculoMov(id) {
    if (!confirm('¿Eliminar este vehículo?')) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function dibujarVehiculosMov() {
    const tb = document.querySelector('#tablaVehiculosMov tbody');
    if (!tb) return;
    tb.innerHTML = '';
    vehiculosMov.forEach(v => {
        tb.innerHTML += `<tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td>${v.marca || '-'}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primario" style="padding:0.3rem 0.5rem; font-size:0.75rem;" onclick='editarVehiculoMov("${v.id}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.75rem;" onclick="eliminarVehiculoMov('${v.id}')">🗑️</button>
            </td>
        </tr>`;
    });
}

// ===== TIPOS DE VEHÍCULO =====
let tiposVehiculo = ['Moto', 'Vehículo de Tracción Humana (VTH)', 'Carguero', 'Camión', 'Otro'];
async function dibujarTiposVehiculo() {
    const c = document.getElementById('listaTiposVehiculo');
    const sel = document.getElementById('tipoVehiculoMov');
    const selT = document.getElementById('tipoVehiculoTransp');
    if (c) {
        c.innerHTML = tiposVehiculo.map((t, i) => `<div class="p-2 border-b flex justify-between"><span>${t}</span><button class="btn-peligro text-xs" onclick="tiposVehiculo.splice(${i},1);dibujarTiposVehiculo();">🗑️</button></div>`).join('');
    }
    if (sel) sel.innerHTML = '<option value="">Seleccione...</option>' + tiposVehiculo.map(t => `<option value="${t}">${t}</option>`).join('');
    if (selT) selT.innerHTML = '<option value="">Seleccione...</option>' + tiposVehiculo.map(t => `<option value="${t}">${t}</option>`).join('');
}

function agregarTipoVehiculo() {
    const n = document.getElementById('nuevoTipoVehiculo').value.trim();
    if (!n) return alert('Escriba el tipo');
    if (tiposVehiculo.includes(n)) return alert('Ya existe');
    tiposVehiculo.push(n);
    document.getElementById('nuevoTipoVehiculo').value = '';
    dibujarTiposVehiculo();
}

// ==================================================
// ===== 📊 INFORMES Y EXPORTAR =====
// ==================================================
function generarInformeMovimientos() {
    const desde = document.getElementById("fechaInicioMov").value;
    const hasta = document.getElementById("fechaFinMov").value;
    if (!desde || !hasta) return alert('Seleccione fechas de inicio y fin');
    const resultados = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
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
        <p class="font-bold mb-2">📊 Total Salida: ${totalCanSalida} | 📦 Total Llegada: ${totalCanLlegada} | ⚖️ Total Kilos: ${totalKilos}</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Conductor</th><th>Hora Salida</th><th>Hora Llegada</th>
            <th>Canastillas Salida</th><th>Canastillas Llegada</th><th>Kilos Totales</th><th>Observaciones</th>
        </tr></thead><tbody>
        ${resultados.map(m=>`<tr>
            <td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaboradorConductor}</td><td>${m.horaSalida}</td><td>${m.horaLlegada||'--'}</td>
            <td>${m.totalCanastillasSalida}</td><td>${m.totalCanastillasLlegada||'--'}</td><td>${m.kilosTotales||0}</td><td>${m.observaciones||''}</td>
        </tr>`).join('')}
        </tbody></table>`;
}

function exportarExcel() {
    if (!ultimosResultados.movimientos?.length) return alert('Consulte primero los movimientos');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha, Placa: m.placa, Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida, HoraLlegada: m.horaLlegada || '',
        CanastillasSalida: m.totalCanastillasSalida, CanastillasLlegada: m.totalCanastillasLlegada || '',
        KilosTotales: m.kilosTotales || 0, Observaciones: m.observaciones || '',
        Recogidas: m.recogidas?.map(r => `${r.colaborador}: ${r.kilos||0}kg / ${r.canastillas||0}can`).join(' | ') || '',
        Usuario: m.usuario || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel generado');
}

// ==================================================
// ===== 📝 REGISTRO DE ACCIONES / AUDITORÍA =====
// ==================================================
async function registrarAccion(accion, modulo, detalle) {
    try {
        await db.collection('auditoria').add({
            accion, modulo, detalle,
            usuario: usuarioActivo?.email || usuarioActivo?.usuario || 'Desconocido',
            fechaHora: new Date()
        });
    } catch (e) { /* silencioso */ }
}

// ==================================================
// ===== 🔄 ACTUALIZACIÓN AUTOMÁTICA CADA 10 SEGUNDOS =====
// ==================================================
setInterval(() => {
    if (usuarioActivo) {
        cargarDatosCompleto();
    }
}, 10000);
