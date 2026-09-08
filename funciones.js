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
    "jgarnica": { usuario: "jgarnica", clave: "123456", rol: "admin", nombre: "Jorge Garnica" },
    "jfigueroa": { usuario: "jfigueroa", clave: "3134630773", rol: "admin", nombre: "Jorge Figueroa" },
    "estudiante": { usuario: "estudiante", clave: "123456", rol: "usuario", nombre: "Estudiante", permisos: ["movimientos", "colaboradores"] }
};

// =====================================================
// ===== VARIABLES GLOBALES =====
// =====================================================
let usuarioConectado = null;
let idEdicion = null;
let movimientos = [];
let colaboradores = [];
let vehiculosMov = [];
let vehiculosTransp = [];
let conductores = [];
let registrosKilometraje = [];
let registrosTanqueo = [];
let filasRecogida = [];
let ultimosResultados = { movimientos: [], kilometraje: [], tanqueo: [] };
let ultimaActividad = Date.now();
const TIEMPO_SESION = 60 * 60 * 1000; // 1 hora

// =====================================================
// ===== INICIO AUTOMÁTICO =====
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = hoy;
    
    agregarFilaRecogida();
    verificarSesion();
    document.addEventListener('mousemove', () => ultimaActividad = Date.now());
    document.addEventListener('keydown', () => ultimaActividad = Date.now());
});

// =====================================================
// ===== SESIÓN Y TIEMPO DE INACTIVIDAD =====
// =====================================================
function verificarSesion() {
    setInterval(() => {
        if (usuarioConectado && (Date.now() - ultimaActividad) > TIEMPO_SESION) {
            alert('⏰ Cierre de sesión por inactividad');
            cerrarSesion();
        }
    }, 30000);
}

// =====================================================
// ===== INICIAR SESIÓN =====
// =====================================================
async function iniciarSesion() {
    const usu = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    const msj = document.getElementById('mensajeLogin');

    if (usuariosFijos[usu] && usuariosFijos[usu].clave === clave) {
        usuarioConectado = { ...usuariosFijos[usu], uid: "FIJO_" + usu };
        ingresarApp();
        return;
    }

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
            if (existe) msj.textContent = "🔒 Contraseña errada";
            else msj.textContent = "❌ Usuario no registrado";
        }
    } catch (e) {
        msj.textContent = "⚠️ Error: " + e.message;
    }
}

// ✅ Soluciona el error: "ingresar is not defined"
const ingresar = iniciarSesion;

function ingresarApp() {
    ultimaActividad = Date.now();
    document.getElementById('pantallaLogin').style.display = 'none';
    document.getElementById('pantallaPrincipal').style.display = 'block';
    document.getElementById('nombreUsuario').textContent = usuarioConectado.nombre || usuarioConectado.usuario;
    document.getElementById('rolUsuario').textContent = usuarioConectado.rol;
    cargarDatosCompleto();
    cambiarPestaña('movimientos');
}

function cerrarSesion() {
    usuarioConectado = null;
    idEdicion = null;
    document.getElementById('pantallaLogin').style.display = 'block';
    document.getElementById('pantallaPrincipal').style.display = 'none';
    document.getElementById('usuario').value = '';
    document.getElementById('clave').value = '';
    document.getElementById('mensajeLogin').textContent = '';
}

// =====================================================
// ===== NAVEGACIÓN Y PESTAÑAS =====
// =====================================================
function alternarMenu() {
    document.getElementById('menuLateral').classList.toggle('oculto');
}

function cambiarPestaña(nombre) {
    document.querySelectorAll('.pestaña-contenido').forEach(p => p.classList.add('oculto'));
    document.getElementById('pest-' + nombre).classList.remove('oculto');
    document.querySelectorAll('.btn-pestaña').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
}

function cambiarSubpestaña(nombre) {
    document.querySelectorAll('.subpestaña').forEach(p => p.classList.add('oculto'));
    document.getElementById('subinf-' + nombre).classList.remove('oculto');
    document.querySelectorAll('.btn-subinforme').forEach(b => b.classList.remove('activa'));
    event.target.classList.add('activa');
}

// =====================================================
// ===== CARGA COMPLETA DE DATOS =====
// =====================================================
async function cargarDatosCompleto() {
    try {
        const [movSnap, colSnap, vehSnap, vtransSnap, condSnap, kmSnap, tanqSnap] = await Promise.all([
            db.collection('movimientos').orderBy('fecha', 'desc').limit(100).get(),
            db.collection('colaboradores').orderBy('nombre').get(),
            db.collection('vehiculos_mov').orderBy('placa').get(),
            db.collection('vehiculos_transportadora').orderBy('placa').get(),
            db.collection('conductores').orderBy('nombre').get(),
            db.collection('kilometraje').orderBy('fecha', 'desc').get(),
            db.collection('tanqueo').orderBy('fecha', 'desc').get()
        ]);

        movimientos = movSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        colaboradores = colSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosMov = vehSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        vehiculosTransp = vtransSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        conductores = condSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        registrosKilometraje = kmSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        registrosTanqueo = tanqSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        actualizarSelectores();
        dibujarMovimientos();
        dibujarColaboradores();
        dibujarVehiculosMov();
        dibujarVehiculosTransp();
        dibujarConductores();
        dibujarKilometraje();
        dibujarTanqueo();

    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

function actualizarSelectores() {
    const optsCol = colaboradores.filter(c => c.estado !== 'inactivo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    const optsVeh = vehiculosMov.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');

    document.querySelectorAll('.select-colaborador').forEach(s => s.innerHTML = optsCol);
    document.querySelectorAll('.select-vehiculo').forEach(s => s.innerHTML = optsVeh);
}

// =====================================================
// ===== MOVIMIENTOS - RECOGIDAS =====
// =====================================================
function agregarFilaRecogida(datos = null) {
    filasRecogida.push({
        id: Date.now() + Math.random(),
        recogio: datos?.recogio || '',
        kilos: datos?.kilos || 0,
        canastillas: datos?.canastillas || 0
    });
    dibujarFilasRecogida();
    recalcularTotales();
}

function dibujarFilasRecogida() {
    const cont = document.getElementById('listaRecogidas');
    cont.innerHTML = filasRecogida.map((f, i) => `
        <div class="fila-recogida">
            <select class="select-colaborador" onchange="filasRecogida[${i}].recogio=this.value">
                <option value="">Seleccione quién recoge</option>
                ${colaboradores.filter(c => c.estado !== 'inactivo').map(c => `<option value="${c.nombre}" ${f.recogio===c.nombre?'selected':''}>${c.nombre}</option>`).join('')}
            </select>
            <input type="number" placeholder="Kilos" value="${f.kilos||''}" onchange="filasRecogida[${i}].kilos=Number(this.value); recalcularTotales();">
            <input type="number" placeholder="Canastillas" value="${f.canastillas||''}" onchange="filasRecogida[${i}].canastillas=Number(this.value); recalcularTotales();">
            <button class="btn-peligro" onclick="filasRecogida.splice(${i},1); dibujarFilasRecogida(); recalcularTotales();">🗑️</button>
        </div>
    `).join('');
}

function recalcularTotales() {
    let totalKilos = 0, totalCan = 0;
    filasRecogida.forEach(f => { totalKilos += Number(f.kilos) || 0; totalCan += Number(f.canastillas) || 0; });
    const kt = document.getElementById('kilosTotales');
    const ct = document.getElementById('canLlegadaTotal');
    if (kt) kt.value = totalKilos;
    if (ct) ct.value = totalCan;
}

// =====================================================
// ===== 📦 GUARDAR MOVIMIENTO — NO BORRA DATOS ANTERIORES =====
// =====================================================
async function guardarMovimiento() {
    const rec = filasRecogida.map(f => ({
        recogio: f.recogio,
        kilos: Number(f.kilos) || 0,
        canastillas: Number(f.canastillas) || 0
    }));

    const datosNuevos = {
        fecha: document.getElementById('fecha').value,
        placa: document.getElementById('vehiculoMov').value,
        colaboradorConductor: document.getElementById('colaboradorConductor').value,
        horaSalida: document.getElementById('horaSalida').value || '',
        horaLlegada: document.getElementById('horaLlegada').value || '',
        recogidas: rec,
        kilosTotales: Number(document.getElementById('kilosTotales').value) || 0,
        totalCanastillasSalida: Number(document.getElementById('canSalidaTotal').value) || 0,
        totalCanastillasLlegada: Number(document.getElementById('canLlegadaTotal').value) || 0,
        observaciones: document.getElementById('observaciones').value || '',
        usuarioEdicion: usuarioConectado.nombre || usuarioConectado.usuario,
        horaUltimaModificacion: new Date()
    };

    try {
        if (idEdicion) {
            // ✅ MODO EDICIÓN: Leer PRIMERO y combinar
            const docRef = db.collection('movimientos').doc(idEdicion);
            const snap = await docRef.get();
            
            if (snap.exists) {
                const datosGuardados = snap.data();
                const datosFinales = {
                    ...datosGuardados,
                    ...datosNuevos,
                    fechaCreacion: datosGuardados.fechaCreacion || datosGuardados.horaRegistro
                };
                await docRef.update(datosFinales);
            } else {
                await docRef.set({ ...datosNuevos, fechaCreacion: new Date() });
            }
            alert('✅ Movimiento actualizado — se conservaron los datos anteriores');
            registrarAccion('Movimiento Modificado', 'Movimientos', `ID: ${idEdicion}`);

        } else {
            // 🆕 MODO NUEVO
            await db.collection('movimientos').add({
                ...datosNuevos,
                fechaCreacion: new Date(),
                horaRegistro: new Date(),
                usuarioCreacion: usuarioConectado.nombre || usuarioConectado.usuario
            });
            alert('✅ Movimiento guardado');
            registrarAccion('Salida Registrada', 'Movimientos', `Placa: ${datosNuevos.placa}`);
        }

        limpiarFormularioMovimiento();
        await cargarDatosCompleto();

    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function limpiarFormularioMovimiento() {
    idEdicion = null;
    filasRecogida = [];
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    document.getElementById('vehiculoMov').value = '';
    document.getElementById('colaboradorConductor').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canSalidaTotal').value = '';
    document.getElementById('canLlegadaTotal').value = '';
    document.getElementById('kilosTotales').value = '';
    document.getElementById('observaciones').value = '';
    agregarFilaRecogida();
}

function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;
    document.getElementById('fecha').value = m.fecha || '';
    document.getElementById('vehiculoMov').value = m.placa || '';
    document.getElementById('colaboradorConductor').value = m.colaboradorConductor || '';
    document.getElementById('horaSalida').value = m.horaSalida || '';
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canSalidaTotal').value = m.totalCanastillasSalida || '';
    document.getElementById('canLlegadaTotal').value = m.totalCanastillasLlegada || '';
    document.getElementById('kilosTotales').value = m.kilosTotales || '';
    document.getElementById('observaciones').value = m.observaciones || '';
    
    filasRecogida = [];
    if (m.recogidas && m.recogidas.length > 0) {
        m.recogidas.forEach(r => agregarFilaRecogida(r));
    } else {
        agregarFilaRecogida();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarMovimiento(id) {
    if (usuarioConectado.rol !== 'admin') {
        return alert('🔒 Solo el administrador puede eliminar');
    }
    if (!confirm('¿Eliminar este movimiento?')) return;
    await db.collection('movimientos').doc(id).delete();
    registrarAccion('Eliminar Movimiento', 'Movimientos', `ID: ${id}`);
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function dibujarMovimientos() {
    const tb = document.querySelector('#tablaMovimientos tbody');
    if (!tb) return;
    tb.innerHTML = movimientos.map(m => `
        <tr>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaboradorConductor}</td>
            <td>${m.horaSalida} - ${m.horaLlegada||'—'}</td>
            <td>${m.totalCanastillasSalida} / ${m.totalCanastillasLlegada||'—'}</td>
            <td>${m.kilosTotales}</td>
            <td>${m.recogidas?.length||0} recogidas</td>
            <td>
                <button class="btn-primario" onclick="editarMovimiento('${m.id}')">✏️ Editar</button>
                ${usuarioConectado?.rol==='admin'?`<button class="btn-peligro" onclick="eliminarMovimiento('${m.id}')">🗑️</button>`:''}
            </td>
        </tr>
    `).join('');
}

// =====================================================
// ===== COLABORADORES =====
// =====================================================
async function guardarColaborador() {
    const nombre = document.getElementById('nombreColaborador').value.trim();
    if (!nombre) return alert('Escribe el nombre');
    const existe = colaboradores.some(c => c.nombre.trim().toUpperCase() === nombre.toUpperCase());
    if (existe) return alert('⚠️ Este colaborador ya existe');

    await db.collection('colaboradores').add({
        nombre, estado: 'activo', fechaCreacion: new Date(),
        usuario: usuarioConectado.nombre || usuarioConectado.usuario
    });
    alert('✅ Colaborador agregado');
    document.getElementById('nombreColaborador').value = '';
    registrarAccion('Agregar Colaborador', 'Movimientos', nombre);
    await cargarDatosCompleto();
}

async function cambiarEstadoColab(id, estado) {
    await db.collection('colaboradores').doc(id).update({ estado });
    registrarAccion(`${estado==='activo'?'✅ Activar':'❌ Inactivar'} Colaborador`, 'Administración', `ID: ${id}`);
    await cargarDatosCompleto();
}

function dibujarColaboradores() {
    const tb = document.querySelector('#tablaColaboradores tbody');
    if (!tb) return;
    tb.innerHTML = colaboradores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.estado==='activo'?'✅ Activo':'❌ Inactivo'}</td>
            <td>${c.usuario||'—'}</td>
            <td>
                ${c.estado==='activo'
                    ?`<button class="btn-peligro" onclick="cambiarEstadoColab('${c.id}','inactivo')">❌ Inactivar</button>`
                    :`<button class="btn-exito" onclick="cambiarEstadoColab('${c.id}','activo')">✅ Activar</button>`}
            </td>
        </tr>
    `).join('');
}

// =====================================================
// ===== VEHÍCULOS MOVIMIENTOS =====
// =====================================================
async function guardarVehiculoMov() {
    const placa = document.getElementById('placaVehMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehMov').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    const existe = vehiculosMov.some(v => v.placa === placa);
    if (existe) return alert('⚠️ Esta placa ya existe');

    await db.collection('vehiculos_mov').add({ placa, tipo, fechaCreacion: new Date() });
    alert('✅ Vehículo agregado');
    document.getElementById('placaVehMov').value = '';
    registrarAccion('Agregar Vehículo Mov', 'Movimientos', placa);
    await cargarDatosCompleto();
}

function dibujarVehiculosMov() {
    const tb = document.querySelector('#tablaVehiculosMov tbody');
    if (!tb) return;
    tb.innerHTML = vehiculosMov.map(v => `<tr><td>${v.placa}</td><td>${v.tipo}</td></tr>`).join('');
}

// =====================================================
// ===== TRANSPORTADORA =====
// =====================================================
async function guardarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if (!nombre) return alert('Escribe el nombre');
    await db.collection('conductores').add({ nombre, fechaCreacion: new Date() });
    alert('✅ Conductor agregado');
    document.getElementById('nombreConductorTransp').value = '';
    registrarAccion('Agregar Conductor', 'Transportadora', nombre);
    await cargarDatosCompleto();
}

async function guardarVehiculoTransp() {
    const placa = document.getElementById('placaVehTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    alert('✅ Vehículo Transportadora agregado');
    document.getElementById('placaVehTransp').value = '';
    registrarAccion('Agregar Vehículo Transp', 'Transportadora', placa);
    await cargarDatosCompleto();
}

function dibujarConductores() {
    const tb = document.querySelector('#tablaConductoresTransp tbody');
    if (!tb) return;
    tb.innerHTML = conductores.map(c => `<tr><td>${c.nombre}</td></tr>`).join('');
}

function dibujarVehiculosTransp() {
    const tb = document.querySelector('#tablaVehiculosTransp tbody');
    if (!tb) return;
    tb.innerHTML = vehiculosTransp.map(v => `<tr><td>${v.placa}</td><td>${v.tipo}</td></tr>`).join('');
}

// =====================================================
// ===== COMBUSTIBLE - KILOMETRAJE =====
// =====================================================
async function guardarKilometraje() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmInicial = Number(document.getElementById('kmInicial').value);
    const kmFinal = Number(document.getElementById('kmFinal').value);
    const colaborador = document.getElementById('colaboradorKm').value;

    if (!fecha || !placa || !colaborador || isNaN(kmInicial) || isNaN(kmFinal)) {
        return alert('⚠️ Complete todos los campos');
    }
    if (kmFinal < kmInicial) return alert('⚠️ Km Final no puede ser menor al inicial');

    await db.collection('kilometraje').add({
        fecha, placa, kmInicial, kmFinal, kmRecorridos: kmFinal - kmInicial, colaborador,
        usuario: usuarioConectado.nombre || usuarioConectado.usuario, fechaCreacion: new Date()
    });
    alert(`✅ Guardado — Kilómetros recorridos: ${kmFinal - kmInicial}`);
    registrarAccion('Registro Kilometraje', 'Combustible', `${placa} — ${kmFinal - kmInicial} km`);
    document.getElementById('kmInicial').value = '';
    document.getElementById('kmFinal').value = '';
    await cargarDatosCompleto();
}

function dibujarKilometraje() {
    const tb = document.querySelector('#tablaKilometraje tbody');
    if (!tb) return;
    tb.innerHTML = registrosKilometraje.map(r => `
        <tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmInicial}</td><td>${r.kmFinal}</td><td>${r.kmRecorridos}</td><td>${r.colaborador}</td></tr>
    `).join('');
}

// =====================================================
// ===== COMBUSTIBLE - TANQUEO =====
// =====================================================
async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const galones = Number(document.getElementById('galonesTanqueo').value);
    const estado = document.getElementById('estadoTanqueo').value;
    const colaborador = document.getElementById('colaboradorTanqueo').value;

    if (!fecha || !placa || !galones || !colaborador) {
        return alert('⚠️ Complete todos los campos');
    }

    await db.collection('tanqueo').add({
        fecha, placa, galones, estado, colaborador,
        usuario: usuarioConectado.nombre || usuarioConectado.usuario, fechaCreacion: new Date()
    });
    alert('✅ Tanqueo guardado');
    registrarAccion('Registro Tanqueo', 'Combustible', `${placa} — ${galones} galones ${estado}`);
    document.getElementById('galonesTanqueo').value = '';
    await cargarDatosCompleto();
}

function dibujarTanqueo() {
    const tb = document.querySelector('#tablaTanqueo tbody');
    if (!tb) return;
    tb.innerHTML = registrosTanqueo.map(r => `
        <tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.estado==='full'?'✅ FULL':'⛽ Parcial'}</td><td>${r.colaborador}</td></tr>
    `).join('');
}

// =====================================================
// ===== INFORMES =====
// =====================================================
function consultarMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas');

    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const tb = document.querySelector('#tablaInformeMov tbody');
    if (!tb) return;

    let tCanSal = 0, tCanLl = 0, tKilos = 0;
    res.forEach(m => { tCanSal += m.totalCanastillasSalida||0; tCanLl += m.totalCanastillasLlegada||0; tKilos += m.kilosTotales||0; });

    tb.innerHTML = res.map(m => `
        <tr>
            <td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaboradorConductor}</td>
            <td>${m.totalCanastillasSalida}</td><td>${m.totalCanastillasLlegada||'—'}</td><td>${m.kilosTotales}</td>
        </tr>
    `).join('') + `
        <tr style="font-weight:bold; background:#e3f2fd;">
            <td colspan="3">TOTALES</td><td>${tCanSal}</td><td>${tCanLl}</td><td>${tKilos}</td>
        </tr>`;
}

function exportarExcel() {
    if (ultimosResultados.movimientos.length === 0) {
        return alert('Realice una consulta primero');
    }
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha, Placa: m.placa, Conductor: m.colaboradorConductor,
        CanastillasSalida: m.totalCanastillasSalida, CanastillasLlegada: m.totalCanastillasLlegada,
        Kilos: m.kilosTotales, Observaciones: m.observaciones||'', Usuario: m.usuarioEdicion||m.usuarioCreacion||''
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Informe");
    XLSX.writeFile(libro, `Informe_${new Date().toLocaleDateString('es-CO')}.xlsx`);
    alert('✅ Excel descargado');
}

// =====================================================
// ===== ACTUALIZAR DATOS MANUALMENTE =====
// =====================================================
async function actualizarDatos() {
    await cargarDatosCompleto();
    alert('✅ Datos actualizados');
}

// =====================================================
// ===== AUDITORÍA / REGISTRO DE ACCIONES =====
// =====================================================
async function registrarAccion(accion, modulo, detalle) {
    if (!usuarioConectado) return;
    await db.collection('auditoria').add({
        accion, modulo, detalle,
        usuario: usuarioConectado.nombre || usuarioConectado.usuario,
        fechaHora: new Date()
    });
}
