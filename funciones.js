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
    const usu = document.getElementById("usuario").value.trim();
    const clave = document.getElementById("clave").value;
    const msj = document.getElementById("mensajeLogin");

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
    document.getElementById("pantallaLogin").style.display = "none";
    document.getElementById("pantallaApp").style.display = "block";
    document.getElementById("nombreUsuario").textContent = `${usuarioActivo.nombre || usuarioActivo.usuario} (${usuarioActivo.rol})`;
    cargarDatosCompleto();
    mostrarPestana('movimientos');
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
    document.getElementById("pantallaLogin").style.display = "flex";
    document.getElementById("pantallaApp").style.display = "none";
    document.getElementById("usuario").value = "";
    document.getElementById("clave").value = "";
}

// ==================================================
// ===== MOSTRAR / CAMBIAR PESTAÑAS =====
// ==================================================
function mostrarPestana(nombre) {
    document.querySelectorAll('.pestana').forEach(p => p.style.display = 'none');
    document.getElementById(nombre).style.display = 'block';
    document.querySelectorAll('.btn-pestana').forEach(b => b.classList.remove('activo'));
    event.target.classList.add('activo');
    if (nombre === 'movimientos') dibujarMovimientos();
    if (nombre === 'informes') { ultimosResultados={}; document.getElementById('resultadoMovimientos').innerHTML=''; }
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
    dibujarMovimientos();
}

function llenarSelects() {
    const selCol = document.querySelectorAll('#colaborador, #quienRecoge, #recogeA, #colabKm, #colabTanqueo');
    const selVeh = document.querySelectorAll('#vehiculo, #placaKm, #placaTanqueo');
    const activosCol = colaboradores.filter(c => c.activo !== false);
    const optCol = activosCol.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const optVeh = vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} — ${v.tipo}</option>`).join('');
    selCol.forEach(s => { if(s) s.innerHTML = '<option value="">Seleccione...</option>' + optCol; });
    selVeh.forEach(s => { if(s) s.innerHTML = '<option value="">Seleccione...</option>' + optVeh; });
}

// ==================================================
// ===== LIMPIAR FORMULARIO =====
// ==================================================
function limpiarFormulario() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('colaborador').value = '';
    document.getElementById('vehiculo').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalida').value = '';
    document.getElementById('canLlegada').value = '';
    document.getElementById('obs').value = '';
    document.getElementById('idEditar').value = '';
    idEdicion = null;
}

// ==================================================
// ===== COMPLETAR MOVIMIENTO (Botón) =====
// ==================================================
function completarMovimiento() {
    limpiarFormulario();
    document.getElementById('formularioMovimiento').style.display = 'none';
    alert('✅ Listo. Formulario limpio para nuevo movimiento.');
}

// ==================================================
// ===== GUARDAR MOVIMIENTO =====
// ==================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const placa = document.getElementById('vehiculo').value;
    const conductor = document.getElementById('colaborador').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const canSalida = parseInt(document.getElementById('canSalida').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegada').value) || 0;
    const observaciones = document.getElementById('obs').value;
    const idEditar = document.getElementById('idEditar').value;

    if (!fecha || !placa || !conductor || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }

    const datosMov = {
        fecha, placa, colaboradorConductor: conductor,
        horaSalida, horaLlegada: horaLlegada || '',
        totalCanastillasSalida: canSalida,
        totalCanastillasLlegada: canLlegada,
        kilosTotales: 0, observaciones, recogidas: [],
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

        // ✅ Al guardar: LIMPIA TODO y deja listo
        limpiarFormulario();
        document.getElementById('formularioMovimiento').style.display = 'none';
        await cargarDatosCompleto();

    } catch (error) {
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ==================================================
// ===== CARGAR EN FORMULARIO PARA EDITAR =====
// ==================================================
function cargarEnFormulario(id) {
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;
    idEdicion = id;
    document.getElementById('fecha').value = mov.fecha;
    document.getElementById('colaborador').value = mov.colaboradorConductor;
    document.getElementById('vehiculo').value = mov.placa;
    document.getElementById('horaSalida').value = mov.horaSalida || '';
    document.getElementById('horaLlegada').value = mov.horaLlegada || '';
    document.getElementById('canSalida').value = mov.totalCanastillasSalida || '';
    document.getElementById('canLlegada').value = mov.totalCanastillasLlegada || '';
    document.getElementById('obs').value = mov.observaciones || '';
    document.getElementById('idEditar').value = id;
    document.getElementById('formularioMovimiento').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================================================
// ===== ELIMINAR MOVIMIENTO (SOLO ADMIN) =====
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
// ===== DIBUJAR LISTA DE MOVIMIENTOS =====
// ==================================================
function dibujarMovimientos() {
    const c = document.getElementById('listaMovimientos');
    if (!c) return;
    if (movimientos.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos registrados</p>';
        return;
    }
    c.innerHTML = movimientos.map(m => `
        <div class="tarjeta-movimiento">
            <div class="fila">
                <span><strong>📅 ${m.fecha}</strong></span>
                <span>🚗 ${m.placa}</span>
                <span>👤 ${m.colaboradorConductor}</span>
            </div>
            <div class="fila">
                <span>🕒 Salida: ${m.horaSalida || '--'}</span>
                <span>🕐 Llegada: ${m.horaLlegada || '--'}</span>
            </div>
            <div class="fila">
                <span>📦 Salida: ${m.totalCanastillasSalida}</span>
                <span>📦 Llegada: ${m.totalCanastillasLlegada}</span>
                <span>⚖️ Kilos: ${m.kilosTotales || 0}</span>
            </div>
            ${m.observaciones ? `<p class="obs">📝 ${m.observaciones}</p>` : ''}
            <div class="fila-botones">
                <button class="btn-primario" onclick="cargarEnFormulario('${m.id}')">✏️ Editar / Registrar Retorno</button>
                ${usuarioActivo?.rol==='admin'?`<button class="btn-peligro" onclick="eliminarMovimiento('${m.id}')">🗑️ Eliminar</button>`:''}
            </div>
            <div class="info-usuario">
                ${m.usuario || ''} — ${m.horaRegistro ? new Date(m.horaRegistro.toDate()).toLocaleString('es-CO') : ''}
            </div>
        </div>`).join('');
}

// ==================================================
// ===== KILOMETRAJE =====
// ==================================================
async function guardarKilometraje() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('placaKm').value;
    const kmInicial = parseFloat(document.getElementById('kmInicial').value);
    const kmFinal = parseFloat(document.getElementById('kmFinal').value);
    const colaborador = document.getElementById('colabKm').value;
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
    document.getElementById('placaKm').value = '';
    document.getElementById('kmInicial').value = '';
    document.getElementById('kmFinal').value = '';
    document.getElementById('colabKm').value = '';
    await cargarDatosCompleto();
}

// ==================================================
// ===== TANQUEO =====
// ==================================================
async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('placaTanqueo').value;
    const galones = parseFloat(document.getElementById('galones').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const porcentaje = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const colaborador = document.getElementById('colabTanqueo').value;
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
    document.getElementById('placaTanqueo').value = '';
    document.getElementById('galones').value = '';
    document.getElementById('estadoTanqueo').value = 'FULL';
    document.getElementById('porcentajeTanqueo').value = '100';
    document.getElementById('colabTanqueo').value = '';
    await cargarDatosCompleto();
}

// ==================================================
// ===== CONSULTAS INFORMES =====
// ==================================================
function consultarKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKm');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin datos</p>';
    c.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Km Inic</th><th>Km Fin</th><th>Recorridos</th><th>Colaborador</th>
        </tr></thead><tbody>
        ${res.map(r=>`<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmInicial}</td><td>${r.kmFinal}</td><td>${r.kmRecorridos}</td><td>${r.colaborador}</td></tr>`).join('')}
        </tbody></table>`;
}

function consultarTanqueo() {
    const fi = document.getElementById('fechaInicioTanq').value;
    const ff = document.getElementById('fechaFinTanq').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fechaTanqueo >= fi && t.fechaTanqueo <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanq');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin datos</p>';
    c.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Galones</th><th>Estado</th><th>Colaborador</th>
        </tr></thead><tbody>
        ${res.map(r=>`<tr><td>${r.fechaTanqueo}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.estado==='FULL'?'✅ FULL':'⚠️ Parcial'}</td><td>${r.colaborador}</td></tr>`).join('')}
        </tbody></table>`;
}

function consultarMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const c = document.getElementById('resultadoMovimientos');
    if (res.length === 0) return c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
    let totalSal=0, totalLleg=0, totalK=0;
    res.forEach(m=>{totalSal+=m.totalCanastillasSalida||0; totalLleg+=m.totalCanastillasLlegada||0; totalK+=m.kilosTotales||0;});
    c.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
        <thead style="background:#dbeafe;"><tr>
            <th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th><th>Kilos</th><th>Obs</th>
        </tr></thead><tbody>
        ${res.map(m=>`<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaboradorConductor}</td><td>${m.horaSalida||'--'}</td><td>${m.horaLlegada||'--'}</td><td>${m.totalCanastillasSalida}</td><td>${m.totalCanastillasLlegada}</td><td>${m.kilosTotales}</td><td>${m.observaciones||''}</td></tr>`).join('')}
        </tbody><tfoot style="font-weight:bold;background:#f1f5f9;"><tr>
            <td colspan="5">TOTALES</td><td>${totalSal}</td><td>${totalLleg}</td><td>${totalK}</td><td></td>
        </tr></tfoot></table></div>`;
}

// ==================================================
// ===== EXPORTAR A EXCEL =====
// ==================================================
function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje.length) return alert('Consulte primero');
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

function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo.length) return alert('Consulte primero');
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

function exportarMovimientosExcel() {
    if (!ultimosResultados.movimientos.length) return alert('Consulte primero');
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
// ===== TRANSPORTADORA =====
// ==================================================
async function agregarVehiculoTransp() {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo el administrador');
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    alert('✅ Vehículo de Transportadora agregado');
    registrarAccion('Vehículo Transp Agregado', 'Transportadora', `${placa} — ${tipo}`);
    await cargarDatosCompleto();
}

async function agregarConductorTransp() {
    if (usuarioActivo?.rol !== 'admin') return alert('🔒 Solo el administrador');
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores_transportadora').add({ nombre, activo: true, fechaCreacion: new Date() });
    document.getElementById('nombreConductorTransp').value = '';
    alert('✅ Conductor agregado');
    registrarAccion('Conductor Agregado', 'Transportadora', nombre);
    await cargarDatosCompleto();
}

// ==================================================
// ===== ACTUALIZAR DATOS MANUAL =====
// ==================================================
async function actualizarDatos() {
    await cargarDatosCompleto();
    alert('✅ Datos actualizados');
}

// ==================================================
// ===== REGISTRAR ACCIONES / AUDITORÍA =====
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
// ===== INICIO AUTOMÁTICO =====
// ==================================================
window.onload = function() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
};
// Alias para que el botón del HTML funcione
function ingresar() {
    iniciarSesion();
}
