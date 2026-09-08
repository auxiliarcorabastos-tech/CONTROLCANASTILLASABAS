// ==================================================
// ===== VARIABLES GLOBALES =====
// ==================================================
let db, auth;
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
const usuariosFijos = [
    { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "J. Garnica" },
    { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "J. Figueroa" },
    { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", permisos: ["movimientos", "informes"] }
];

// ==================================================
// ===== INICIALIZAR FIREBASE =====
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
// ===== INICIAR SESIÓN =====
// ==================================================
async function iniciarSesion() {
    const usu = document.getElementById("correoLogin").value.trim();
    const clave = document.getElementById("passLogin").value;
    const msj = document.getElementById("mensajeError");
    const fijo = usuariosFijos.find(u => u.usuario === usu && u.clave === clave);
    if (fijo) {
        usuarioActivo = { ...fijo, uid: "FIJO_" + fijo.usuario };
        ingresarApp();
        return;
    }
    try {
        const cred = await auth.signInWithEmailAndPassword(usu, clave);
        const doc = await db.collection("usuarios").doc(cred.user.uid).get();
        if (doc.exists) {
            usuarioActivo = { uid: cred.user.uid, email: usu, ...doc.data() };
            ingresarApp();
        } else {
            msj.textContent = "⚠️ Usuario no registrado en el sistema";
        }
    } catch (e) {
        if (e.code === "auth/user-not-found") msj.textContent = "⚠️ Usuario no registrado";
        else if (e.code === "auth/wrong-password") msj.textContent = "🔑 Contraseña errada";
        else msj.textContent = "❌ " + e.message;
    }
}

function ingresarApp() {
    document.getElementById("modalLogin").classList.add("oculto");
    document.querySelector(".contenedor-principal").classList.remove("oculto");
    document.getElementById("btnAdmin").classList.toggle("oculto", usuarioActivo.rol !== "admin");
    document.querySelector(".btn-salir").classList.remove("oculto");
    cargarDatosCompleto();
    sesionActiva();
}

// ==================================================
// ===== SESIÓN INACTIVA - CIERRE AUTOMÁTICO 1 HORA =====
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
    }, 3600000); // 1 hora
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
// ===== NAVEGACIÓN DE PESTAÑAS =====
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
        informes: "📊 Informes",
        admin: "⚙️ Administración"
    };
    document.getElementById("tituloPestaña").textContent = titulos[nombre] || nombre;
    if (nombre === 'movimientos') dibujarMovimientos();
    if (nombre === 'transportadora') cargarSelectsTransportadora();
    if (nombre === 'admin') cargarSubpestañaAdmin('colaboradores');
}

function alternarMenu() {
    document.getElementById('sidebar').classList.toggle('mostrar');
}

// ==================================================
// ===== CARGAR DATOS DESDE FIREBASE =====
// ==================================================
async function cargarDatosCompleto() {
    const snapMov = await db.collection('movimientos').orderBy('fecha', 'desc').get();
    movimientos = snapMov.docs.map(d => ({ id: d.id, ...d.data() }));
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
    llenarSelects();
    llenarSelectsTransportadora();
    dibujarMovimientos();
    document.getElementById("textoUltimaActualizacion").textContent = "Última actualización: " + new Date().toLocaleTimeString('es-CO');
}

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
    if(selCond) selCond.innerHTML = '<option value="">Seleccione conductor</option>' + conductores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// ==================================================
// ===== ACTUALIZAR APP MANUAL =====
// ==================================================
async function actualizarInformacion() {
    await cargarDatosCompleto();
    alert('✅ Información actualizada desde la nube');
}

// ==================================================
// ===== LIMPIAR FORMULARIO MOVIMIENTOS =====
// ==================================================
function limpiarFormulario() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('colaboradorConductor').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('observaciones').value = '';
    document.getElementById('kilosTotales').value = '';
    document.getElementById('idEditar').value = '';
    idEdicion = null;
    document.getElementById('listaRecogidas').innerHTML = '';
    calcularTotalesRecogidas();
}

// ==================================================
// ===== COMPLETAR MOVIMIENTO =====
// ==================================================
function completarMovimiento() {
    limpiarFormulario();
    alert('✅ Movimiento guardado y formulario limpio. Listo para nuevo registro.');
}

// ==================================================
// ===== GESTIÓN DE RECOGIDAS =====
// ==================================================
let filasRecogida = [];
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
            <input type="number" placeholder="Kilos" oninput="actualizarRecogida(${idx}, 'kilos', this.value)">
            <input type="number" placeholder="Canastillas" oninput="actualizarRecogida(${idx}, 'canastillas', this.value)">
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
                <input type="number" placeholder="Kilos" value="${f.kilos||''}" oninput="actualizarRecogida(${i}, 'kilos', this.value)">
                <input type="number" placeholder="Canastillas" value="${f.canastillas||''}" oninput="actualizarRecogida(${i}, 'canastillas', this.value)">
                <button class="btn-quitar" onclick="quitarFilaRecogida(${i})">✕</button>
            </div>`;
    });
    calcularTotalesRecogidas();
}

function calcularTotalesRecogidas() {
    const totalKilos = filasRecogida.reduce((s, f) => s + (parseFloat(f.kilos) || 0), 0);
    const totalCanastillas = filasRecogida.reduce((s, f) => s + (parseFloat(f.canastillas) || 0), 0);
    document.getElementById('kilosTotales').value = totalKilos || '';
    document.getElementById('canLlegadaTotal').value = totalCanastillas || '';
}

// ==================================================
// ===== GUARDAR MOVIMIENTO =====
// ==================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const placa = document.getElementById('vehiculoMov').value;
    const conductor = document.getElementById('colaboradorConductor').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canSalida = parseInt(document.getElementById('canSalidaTotal').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTotal').value) || 0;
    const kilosTot = parseInt(document.getElementById('kilosTotales').value) || 0;
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
// ===== CARGAR MOVIMIENTO EN FORMULARIO PARA EDITAR =====
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
// ===== ELIMINAR MOVIMIENTO =====
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
// ===== FILTROS Y LISTA MOVIMIENTOS =====
// ==================================================
let filtroPendientes = false;
function alternarFiltroMovimientos() {
    filtroPendientes = !filtroPendientes;
    document.getElementById('textoFiltro').textContent = filtroPendientes ? '📋 Ver Todos' : '⏳ Ver Pendientes';
    document.getElementById('btnFiltroMov').classList.toggle('activo', filtroPendientes);
    dibujarMovimientos();
}

function filtrarMovimientos() {
    dibujarMovimientos();
}

function dibujarMovimientos() {
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    const busqueda = (document.getElementById('buscarMov')?.value || '').toLowerCase();
    let lista = movimientos;
    if (filtroPendientes) lista = lista.filter(m => !m.horaLlegada);
    if (busqueda) lista = lista.filter(m => 
        m.placa.toLowerCase().includes(busqueda) || 
        m.colaboradorConductor.toLowerCase().includes(busqueda));
    if (lista.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos registrados</p>';
        return;
    }
    c.innerHTML = lista.map(m => {
        const esPendiente = !m.horaLlegada;
        return `
        <div class="fila-lista ${esPendiente?'pendiente':''}">
            <div>
                <strong>📅 ${m.fecha}</strong> | 🚗 ${m.placa} | 👤 ${m.colaboradorConductor}<br>
                🕒 Salida: ${m.horaSalida || '--'} | 🕐 Llegada: ${m.horaLlegada || '--'}<br>
                📦 Salida: ${m.totalCanastillasSalida} | 📦 Llegada: ${m.totalCanastillasLlegada} | ⚖️ Kilos: ${m.kilosTotales || 0}
                ${m.observaciones?`<br>📝 ${m.observaciones}`:''}
                ${esPendiente?'<span class="etiqueta-estado etiqueta-pend">⏳ PENDIENTE</span>':'<span class="etiqueta-estado etiqueta-cerr">✅ COMPLETADO</span>'}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
                <button class="btn-editar" onclick="cargarEnFormulario('${m.id}')">✏️ Editar</button>
                ${usuarioActivo?.rol==='admin'?`<button class="btn-eliminar" onclick="eliminarMovimiento('${m.id}')">🗑️ Eliminar</button>`:''}
            </div>
        </div>`;
    }).join('');
}

// ==================================================
// ===== COMBUSTIBLE - KILOMETRAJE =====
// ==================================================
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmInicial = parseFloat(document.getElementById('kmInicial').value);
    const kmFinal = parseFloat(document.getElementById('kmFinal').value);
    const colaborador = document.getElementById('quienRegistraKm').value;
    if (!fecha || !placa || isNaN(kmInicial) || isNaN(kmFinal) || !colaborador) {
        return alert('⚠️ Complete todos los campos');
    }
    const kmRecorridos = kmFinal - kmInicial;
    if (kmRecorridos < 0) return alert('⚠️ Km Final debe ser mayor al Inicial');
    await db.collection('kilometraje').add({
        fecha, placa, kmInicial, kmFinal, kmRecorridos, colaborador,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: new Date()
    });
    alert(`✅ Guardado. Km recorridos: ${kmRecorridos}`);
    registrarAccion('Registro Kilometraje', 'Combustible', `${placa} — ${kmRecorridos} km`);
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('vehiculoKm').value = '';
    document.getElementById('kmInicial').value = '';
    document.getElementById('kmFinal').value = '';
    document.getElementById('quienRegistraKm').value = '';
    await cargarDatosCompleto();
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
            <th>Fecha</th><th>Placa</th><th>Km Inic</th><th>Km Fin</th><th>Recorridos</th><th>Colaborador</th>
        </tr></thead><tbody>
        ${res.map(r=>`<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmInicial}</td><td>${r.kmFinal}</td><td>${r.kmRecorridos}</td><td>${r.colaborador}</td></tr>`).join('')}
        </tbody></table>`;
}

function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje?.length) return alert('Consulte primero');
    const datos = ultimosResultados.kilometraje.map(r => ({
        Fecha: r.fecha, Placa: r.placa, KmInicial: r.kmInicial, KmFinal: r.kmFinal,
        KmRecorridos: r.kmRecorridos, Colaborador: r.colaborador, Usuario: r.usuario || ''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Kilometraje");
    XLSX.writeFile(libro, `Kilometraje_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel de Kilometraje generado');
}

// ==================================================
// ===== COMBUSTIBLE - TANQUEO =====
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
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        fechaHora: new Date()
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
        Fecha: r.fechaTanqueo, Placa: r.placa, Galones: r.galones, Estado: r.estado==='FULL'?'FULL':'Parcial',
        Porcentaje: r.porcentajeReal||100, Colaborador: r.colaborador, Usuario: r.usuario||''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Tanqueo");
    XLSX.writeFile(libro, `Tanqueo_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel de Tanqueo generado');
}

// ==================================================
// ===== INFORMES - CONSULTAS GENERALES =====
// ==================================================
function consultarMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const c = document.getElementById('resultadoMov');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
    let totalSal=0, totalLleg=0, totalK=0;
    res.forEach(m=>{totalSal+=m.totalCanastillasSalida||0; totalLleg+=m.totalCanastillasLlegada||0; totalK+=m.kilosTotales||0;});
    c.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Conductor</th><th>Hora Salida</th><th>Hora Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th><th>Kilos</th><th>Obs</th>
        </tr></thead><tbody>
        ${res.map(m=>`<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaboradorConductor}</td><td>${m.horaSalida||'--'}</td><td>${m.horaLlegada||'--'}</td><td>${m.totalCanastillasSalida}</td><td>${m.totalCanastillasLlegada}</td><td>${m.kilosTotales}</td><td>${m.observaciones||''}</td></tr>`).join('')}
        </tbody><tfoot style="font-weight:bold;background:#f1f5f9;"><tr>
            <td colspan="5">TOTALES</td><td>${totalSal}</td><td>${totalLleg}</td><td>${totalK}</td><td></td>
        </tr></tfoot></table></div>`;
}

function exportarMovimientosExcel() {
    if (!ultimosResultados.movimientos?.length) return alert('Consulte primero');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha, Placa: m.placa, Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida||'', HoraLlegada: m.horaLlegada||'',
        CanastillasSalida: m.totalCanastillasSalida, CanastillasLlegada: m.totalCanastillasLlegada,
        Kilos: m.kilosTotales, Observaciones: m.observaciones||'', Usuario: m.usuario||''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
    alert('✅ Excel de Movimientos generado');
}

// ==================================================
// ===== TRANSPORTADORA - GUARDAR =====
// ==================================================
async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || 0;
    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }
    await db.collection('movimientos_transportadora').add({
        fecha, placa, conductor, horaSalida, horaLlegada, canSalida, canLlegada,
        usuario: usuarioActivo.email || usuarioActivo.usuario,
        horaRegistro: new Date()
    });
    alert('✅ Movimiento de Transportadora guardado');
    registrarAccion('Movimiento Transportadora', 'Transportadora', `${placa} — ${conductor}`);
    document.getElementById('fechaTransp').value = '';
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    await cargarDatosCompleto();
}

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
// ===== ADMINISTRACIÓN =====
// ==================================================
function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`sub-admin-${nombre}`).classList.remove('oculto');
    if (nombre === 'colaboradores') cargarListaColaboradoresAdmin();
    if (nombre === 'vehiculos') cargarListaVehiculosAdmin();
}

async function agregarColaboradorAdmin() {
    const nombre = document.getElementById('nombreColabAdmin').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    const existe = colaboradores.find(c => c.nombre.trim().toUpperCase() === nombre.toUpperCase());
    if (existe) return alert('⚠️ Este colaborador ya existe');
    await db.collection('colaboradores').add({ nombre, estado: "activo", fechaCreacion: new Date() });
    document.getElementById('nombreColabAdmin').value = '';
    alert('✅ Colaborador agregado');
    registrarAccion('Colaborador Agregado', 'Administración', nombre);
    await cargarDatosCompleto();
}

function cargarListaColaboradoresAdmin() {
    const tb = document.getElementById('listaColaboradoresAdmin');
    if (!colaboradores.length) { tb.innerHTML = '<p>Sin colaboradores</p>'; return; }
    tb.innerHTML = colaboradores.map(c => `
        <div class="fila-lista">
            <span><strong>${c.nombre}</strong> ${c.estado==='inactivo'?'❌ Inactivo':'✅ Activo'}</span>
            <div>
                <button class="btn-editar" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick="cambiarEstadoColaborador('${c.id}', '${c.nombre}', '${c.estado}')">
                    ${c.estado==='inactivo'?'✅ Activar':'❌ Inactivar'}
                </button>
            </div>
        </div>`).join('');
}

async function cambiarEstadoColaborador(id, nombre, estadoActual) {
    const nuevoEstado = estadoActual === 'inactivo' ? 'activo' : 'inactivo';
    await db.collection('colaboradores').doc(id).update({ estado: nuevoEstado });
    alert(`✅ Colaborador ${nuevoEstado==='activo'?'ACTIVADO':'INACTIVADO'}: ${nombre}`);
    registrarAccion(`Colaborador ${nuevoEstado==='activo'?'ACTIVADO':'INACTIVADO'}`, 'Administración', nombre);
    await cargarDatosCompleto();
}

function cargarListaVehiculosAdmin() {
    const tbMov = document.getElementById('listaVehiculosMovAdmin');
    const tbTr = document.getElementById('listaVehiculosTranspAdmin');
    const tbCond = document.getElementById('listaConductoresAdmin');
    if(tbMov) tbMov.innerHTML = vehiculosMov.length? vehiculosMov.map(v=>`<div class="fila-lista"><span>${v.placa} — ${v.tipo}</span></div>`).join(''):'<p>Sin vehículos</p>';
    if(tbTr) tbTr.innerHTML = vehiculosTransp.length? vehiculosTransp.map(v=>`<div class="fila-lista"><span>${v.placa} — ${v.tipo}</span></div>`).join(''):'<p>Sin vehículos</p>';
    if(tbCond) tbCond.innerHTML = conductores.length? conductores.map(c=>`<div class="fila-lista"><span>${c.nombre}</span></div>`).join(''):'<p>Sin conductores</p>';
}

async function agregarVehiculoMovAdmin() {
    const placa = document.getElementById('placaVehiculoMovAdmin').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMovAdmin').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    const existe = vehiculosMov.find(v => v.placa === placa);
    if (existe) return alert('⚠️ Esta placa ya existe');
    await db.collection('vehiculos_movimientos').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoMovAdmin').value = '';
    alert('✅ Vehículo de Movimientos agregado');
    registrarAccion('Vehículo Mov Agregado', 'Administración', `${placa} — ${tipo}`);
    await cargarDatosCompleto();
}

async function crearUsuario() {
    const correo = document.getElementById('correoNuevo').value.trim();
    const clave = document.getElementById('passNuevo').value;
    const rol = document.getElementById('rolNuevo').value;
    if (!correo || clave.length < 6) return alert('Correo y contraseña (mínimo 6 caracteres)');
    try {
        const cred = await auth.createUserWithEmailAndPassword(correo, clave);
        await db.collection('usuarios').doc(cred.user.uid).set({
            correo, rol, fechaCreacion: new Date()
        });
        alert('✅ Usuario creado');
        registrarAccion('Crear Usuario', 'Administración', `${correo} — ${rol}`);
        document.getElementById('correoNuevo').value = '';
        document.getElementById('passNuevo').value = '';
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

async function recuperarClave() {
    const correo = document.getElementById("correoLogin").value.trim();
    if (!correo) return alert('Escriba primero su correo o usuario');
    try {
        await auth.sendPasswordResetEmail(correo);
        alert('✅ Correo de recuperación enviado');
    } catch (e) {
        alert('⚠️ ' + e.message);
    }
}

// ==================================================
// ===== AUDITORÍA =====
// ==================================================
async function registrarAccion(accion, modulo, detalle) {
    if (!usuarioActivo) return;
    await db.collection('auditoria').add({
        accion, modulo, detalle,
        usuario: usuarioActivo.email || usuarioActivo.usuario || usuarioActivo.nombre,
        fechaHora: new Date()
    });
}

// ==================================================
// ===== ALIAS PARA EL BOTÓN DEL LOGIN =====
// ==================================================
function ingresar() {
    iniciarSesion();
}

// ==================================================
// ===== INICIO AUTOMÁTICO =====
// ==================================================
window.onload = function() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.querySelector(".contenedor-principal").classList.add("oculto");
};
