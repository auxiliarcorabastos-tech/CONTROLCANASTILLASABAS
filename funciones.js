// =====================================================
// ===== 🚛 TRANSPORTADORA =====
// =====================================================
async function agregarConductor() {
    const nombre = document.getElementById('nombreConductor').value.trim();
    if (!nombre) return alert('Escriba el nombre');
    await db.collection('conductores_transportadora').add({ nombre, fechaCreacion: new Date() });
    document.getElementById('nombreConductor').value = '';
    alert('✅ Conductor agregado');
    await cargarDatosCompleto();
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if (!placa || !tipo) return alert('Complete placa y tipo');
    await db.collection('vehiculos_transportadora').add({ placa, tipo, fechaCreacion: new Date() });
    document.getElementById('placaVehiculoTransp').value = '';
    document.getElementById('tipoVehiculoTransp').value = '';
    alert('✅ Vehículo agregado');
    await cargarDatosCompleto();
}

function verificarCanastillasSalida() {
    const sal = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    document.getElementById('canLlegadaTransp').value = sal || '';
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value || '';
    const canSalida = parseInt(document.getElementById('canSalidaTransp').value) || 0;
    const canLlegada = parseInt(document.getElementById('canLlegadaTransp').value) || canSalida;
    const id = document.getElementById('idEditarTransp').value;

    if (!fecha || !placa || !conductor || !horaSalida) return alert('Complete todos los datos de salida');

    const datos = { fecha, placa, conductor, horaSalida, horaLlegada, canSalida, canLlegada,
        usuario: usuarioActivo.email, fechaHora: new Date() };

    if (id) {
        await db.collection('movimientos_transportadora').doc(id).update(datos);
        alert('✅ Llegada registrada');
    } else {
        await db.collection('movimientos_transportadora').add(datos);
        alert('✅ Salida registrada');
    }
    document.getElementById('idEditarTransp').value = '';
    document.getElementById('btnCompletarTransp').classList.add('oculto');
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canSalidaTransp').value = '';
    document.getElementById('canLlegadaTransp').value = '';
    await cargarDatosCompleto();
}

function dibujarListaMovimientosTransp() {
    const c = document.getElementById('listaMovimientosTransp');
    const lista = movimientos.filter(m => m.placa && m.conductor && m.horaSalida).length ? [] : [];
    db.collection('movimientos_transportadora').orderBy('fecha', 'desc').limit(30).get().then(snap => {
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!lista.length) { c.innerHTML = '<p class="text-center text-gray-500 py-4">📭 Sin movimientos</p>'; return; }
        c.innerHTML = lista.map(m => {
            const pend = !m.horaLlegada;
            return `<div class="fila-lista ${pend?'pendiente':'completado'}">
                <div class="flex-1"><strong>${m.fecha} | ${m.placa} | ${m.conductor}</strong>
                <br>Salida: ${m.horaSalida} | Llegada: ${m.horaLlegada||'PENDIENTE'}
                <br>📦 Salen: ${m.canSalida} | Llegaron: ${m.canLlegada}</div>
                <div>${pend?`<button class="btn-editar" onclick="cargarMovTranspEdicion('${m.id}')">✏️ Registrar Llegada</button>`:''}</div>
            </div>`;
        }).join('');
    });
}

async function cargarMovTranspEdicion(id) {
    const doc = await db.collection('movimientos_transportadora').doc(id).get();
    const m = { id: doc.id, ...doc.data() };
    document.getElementById('fechaTransp').value = m.fecha;
    document.getElementById('vehiculoTransp').value = m.placa;
    document.getElementById('conductorTransp').value = m.conductor;
    document.getElementById('horaSalidaTransp').value = m.horaSalida;
    document.getElementById('canSalidaTransp').value = m.canSalida;
    document.getElementById('canLlegadaTransp').value = m.canLlegada;
    document.getElementById('idEditarTransp').value = id;
    document.getElementById('btnCompletarTransp').classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function completarMovimientoTransp() {
    guardarMovimientoTransp();
}

// =====================================================
// ===== ⛽ COMBUSTIBLE =====
// =====================================================
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-combustible').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

async function guardarKilometrajeDiario() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmM = parseFloat(document.getElementById('kmManana').value);
    const kmT = parseFloat(document.getElementById('kmTarde').value) || null;
    const quien = document.getElementById('quienRegistraKm').value;
    if (!fecha || !placa || !kmM || !quien) return alert('Complete Fecha, Placa, Km Mañana y Quien registra');
    const rec = kilometraje.find(k => k.fecha === fecha && k.placa === placa);
    const datos = { fecha, placa, kmManana: kmM, kmTarde: kmT, kmRecorridos: kmT ? (kmT - kmM).toFixed(1) : null, colaborador: quien, usuario: usuarioActivo.email };
    if (rec) await db.collection('kilometraje').doc(rec.id).update(datos);
    else await db.collection('kilometraje').add(datos);
    alert('✅ Kilometraje guardado');
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
    await cargarDatosCompleto();
}

function dibujarPendientesKilometraje() {
    const c = document.getElementById('pendientesKilometraje');
    const pend = kilometraje.filter(k => !k.kmTarde);
    if (!pend.length) { c.innerHTML = '<p class="text-green-600">✅ Sin pendientes — todos completados</p>'; return; }
    c.innerHTML = pend.map(k => `<div class="p-2 bg-orange-50 border rounded mb-2">📅 ${k.fecha} | ${k.placa} | 🌅 ${k.kmManana} km → <input type="number" placeholder="Tarde" onkeydown="if(event.key==='Enter'){actualizarKmTarde('${k.id}',this.value)}"> <button class="btn-primario text-xs" onclick="actualizarKmTarde('${k.id}',this.parentElement.querySelector('input').value)">Guardar</button></div>`).join('');
}

async function actualizarKmTarde(id, valor) {
    const kmT = parseFloat(valor);
    if (!kmT) return alert('Escriba el kilometraje de la tarde');
    const rec = kilometraje.find(k => k.id === id);
    await db.collection('kilometraje').doc(id).update({ kmTarde: kmT, kmRecorridos: (kmT - rec.kmManana).toFixed(1) });
    alert('✅ Completado');
    await cargarDatosCompleto();
}

function cargarInformeKilometraje() {
    const fi = document.getElementById('fechaInicioKm').value;
    const ff = document.getElementById('fechaFinKm').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    ultimosResultados.kilometraje = res;
    const c = document.getElementById('resultadoKilometraje');
    if (!res.length) { c.innerHTML = '<p>Sin registros</p>'; return; }
    const tot = res.reduce((s, r) => s + (parseFloat(r.kmRecorridos) || 0), 0);
    c.innerHTML = `<p class="font-bold">Total km recorridos: ${tot.toFixed(1)} km</p><table><tr><th>Fecha</th><th>Placa</th><th>Mañana</th><th>Tarde</th><th>Recorridos</th><th>Registrado por</th></tr>` + res.map(r => `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmManana}</td><td>${r.kmTarde||'—'}</td><td>${r.kmRecorridos||'—'}</td><td>${r.colaborador}</td></tr>`).join('') + `</table>`;
}

function exportarKilometrajeExcel() {
    if (!ultimosResultados.kilometraje.length) return alert('Consulte primero');
    const datos = ultimosResultados.kilometraje.map(r => ({ Fecha: r.fecha, Placa: r.placa, KmMañana: r.kmManana, KmTarde: r.kmTarde||'', KmRecorridos: r.kmRecorridos||'', Colaborador: r.colaborador }));
    XLSX.writeFile(XLSX.utils.book_new(null, XLSX.utils.json_to_sheet(datos)), 'Kilometraje.xlsx');
}

async function guardarRegistroTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const gal = parseFloat(document.getElementById('galonesTanqueo').value);
    const est = document.getElementById('estadoTanqueo').value;
    const por = parseInt(document.getElementById('porcentajeTanqueo').value) || 100;
    const quien = document.getElementById('quienTanquea').value;
    if (!fecha || !placa || !gal || !quien) return alert('Complete todos los campos');
    await db.collection('tanqueo').add({ fecha, placa, galones, estado: est, porcentaje: por, colaborador: quien, usuario: usuarioActivo.email });
    alert('✅ Tanqueo registrado');
    document.getElementById('galonesTanqueo').value = '';
    document.getElementById('porcentajeTanqueo').value = '100';
    await cargarDatosCompleto();
}

function cargarInformeTanqueo() {
    const fi = document.getElementById('fechaInicioTanqueo').value;
    const ff = document.getElementById('fechaFinTanqueo').value;
    if (!fi || !ff) return alert('Seleccione fechas');
    const res = tanqueo.filter(t => t.fecha >= fi && t.fecha <= ff);
    ultimosResultados.tanqueo = res;
    const c = document.getElementById('resultadoTanqueo');
    if (!res.length) { c.innerHTML = '<p>Sin registros</p>'; return; }
    const tot = res.reduce((s, r) => s + r.galones, 0);
    c.innerHTML = `<p class="font-bold">Total galones: ${tot.toFixed(2)} gl</p><table><tr><th>Fecha</th><th>Placa</th><th>Galones</th><th>Estado</th><th>%</th><th>Quien tanqueó</th></tr>` + res.map(r => `<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.galones}</td><td>${r.estado}</td><td>${r.porcentaje}%</td><td>${r.colaborador}</td></tr>`).join('') + `</table>`;
}

function exportarTanqueoExcel() {
    if (!ultimosResultados.tanqueo.length) return alert('Consulte primero');
    XLSX.writeFile(XLSX.utils.book_new(null, XLSX.utils.json_to_sheet(ultimosResultados.tanqueo.map(t => ({ Fecha: t.fecha, Placa: t.placa, Galones: t.galones, Estado: t.estado, Porcentaje: t.porcentaje+'%', Colaborador: t.colaborador })))), 'Tanqueo.xlsx');
}

// =====================================================
// ===== 🔧 MANTENIMIENTOS =====
// =====================================================
function dibujarListaPlacasMant() {
    const c = document.getElementById('listaPlacasMant');
    if (!c) return;
    const placas = [...new Set([...vehiculosMov.map(v=>v.placa), ...datosVehiculos.map(d=>d.placa)])].sort();
    c.innerHTML = placas.map(p => {
        const enTaller = historialMantenimientos.some(m => m.placa === p && !m.fechaEntrega);
        return `<div class="p-2 border-b flex justify-between items-center ${enTaller?'bg-orange-50':''}"><span><strong>${p}</strong> ${enTaller?'🔧 EN TALLER':'✅ En Servicio'}</span><button class="btn-primario text-xs" onclick="verHistorialVehiculo('${p}')">👁️ Ver</button></div>`;
    }).join('');
}

async function verHistorialVehiculo(placa) {
    placaSeleccionada = placa;
    document.getElementById('placaMantSeleccionada').textContent = placa;
    const datos = datosVehiculos.find(d => d.placa === placa);
    const cDatos = document.getElementById('datosVehiculoSeleccionado');
    if (datos) {
        cDatos.innerHTML = `<p><strong>📅 Tecno-mecánica:</strong> ${datos.fechaTecno||'No registrada'}</p><p><strong>📅 SOAT:</strong> ${datos.fechaSoat||'No registrado'}</p><p><strong>📅 Seguro:</strong> ${datos.fechaSeguro||'No registrado'}</p><p><strong>📝 Observaciones:</strong> ${datos.observaciones||'—'}</p><button class="btn-primario mt-2" onclick="editarDatosVehiculo('${placa}')">✏️ Actualizar Datos</button>`;
    } else {
        cDatos.innerHTML = `<p class="text-gray-500">Sin datos registrados</p><button class="btn-primario mt-2" onclick="editarDatosVehiculo('${placa}')">➕ Registrar Datos</button>`;
    }
    const hist = historialMantenimientos.filter(m => m.placa === placa);
    const cHist = document.getElementById('historialVehiculoSeleccionado');
    if (!hist.length) { cHist.innerHTML = '<p class="text-gray-500">Sin historial de mantenimiento</p>'; }
    else {
        cHist.innerHTML = hist.map(m => {
            const act = !m.fechaEntrega;
            return `<div class="border p-3 mb-2 ${act?'bg-orange-50 border-orange-300':''}"><p><strong>📅 Ingreso:</strong> ${m.fechaIngreso}</p><p><strong>📝 Motivo:</strong> ${m.motivo}</p><p><strong>👤 Quien entrega:</strong> ${m.responsable}</p>${act?`<p class="text-orange-600 font-bold">🔧 EN TALLER</p><button class="btn-primario mt-2" onclick="registrarEntregaTaller('${m.id}')">✅ Registrar Entrega</button>`:`<p><strong>✅ Entregado:</strong> ${m.fechaEntrega}</p><p><strong>📝 Observaciones:</strong> ${m.observacionesEntrega||'—'}</p>`}<button class="btn-editar text-xs mt-2" onclick="editarRegistroMantenimiento('${m.id}')">✏️ Actualizar</button></div>`;
        }).join('');
    }
    const enTaller = hist.some(m => !m.fechaEntrega);
    document.getElementById('btnEnviarTaller').style.display = enTaller ? 'none' : 'inline-block';
    document.getElementById('formIngresoTaller').classList.remove('oculto');
}

async function editarDatosVehiculo(placa) {
    const d = datosVehiculos.find(x => x.placa === placa);
    const fT = prompt('Fecha Tecno-mecánica (AAAA-MM-DD):', d?.fechaTecno||'');
    fS = prompt('Fecha SOAT:', d?.fechaSoat||'');
    fSeg = prompt('Fecha Seguro:', d?.fechaSeguro||'');
    obs = prompt('Observaciones/Documentos:', d?.observaciones||'');
    if (!fT && !fS && !fSeg && !obs) return;
    const nd = { placa, fechaTecno: fT||null, fechaSoat: fS||null, fechaSeguro: fSeg||null, observaciones: obs||'', fechaEdicion: new Date(), usuario: usuarioActivo.email };
    try {
        if (d) await db.collection('datos_vehiculos').doc(d.id).update(nd);
        else { nd.fechaCreacion = new Date(); await db.collection('datos_vehiculos').add(nd); }
        alert('✅ Datos actualizados');
        await cargarDatosCompleto();
        verHistorialVehiculo(placa);
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function registrarIngresoTaller() {
    if (!placaSeleccionada) return alert('Seleccione una placa');
    const fecha = document.getElementById('fechaIngreso').value;
    const motivo = document.getElementById('motivoMant').value.trim();
    const resp = document.getElementById('quienEntrega').value.trim();
    if (!fecha || !motivo || !resp) return alert('Complete Fecha, Motivo y Responsable');
    await db.collection('historial_mantenimientos').add({ placa: placaSeleccionada, fechaIngreso: fecha, motivo, responsable: resp, fechaEntrega: null, usuario: usuarioActivo.email });
    const v = vehiculosMov.find(x => x.placa === placaSeleccionada);
    if (v) await db.collection('vehiculos_movimientos').doc(v.id).update({ estado: 'inactivo' });
    alert(`✅ ${placaSeleccionada} enviado a TALLER → Queda INACTIVO`);
    document.getElementById('motivoMant').value = '';
    document.getElementById('quienEntrega').value = '';
    await cargarDatosCompleto();
    verHistorialVehiculo(placaSeleccionada);
}

async function registrarEntregaTaller(id) {
    const fecha = prompt('Fecha de entrega:', new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    const obs = prompt('Observaciones al entregar:');
    const m = historialMantenimientos.find(x => x.id === id);
    await db.collection('historial_mantenimientos').doc(id).update({ fechaEntrega: fecha, observacionesEntrega: obs||'' });
    const v = vehiculosMov.find(x => x.placa === m.placa);
    if (v) await db.collection('vehiculos_movimientos').doc(v.id).update({ estado: 'activo' });
    alert(`✅ ${m.placa} ENTREGADO → Queda ACTIVO`);
    await cargarDatosCompleto();
    verHistorialVehiculo(m.placa);
}

async function editarRegistroMantenimiento(id) {
    const m = historialMantenimientos.find(x => x.id === id);
    if (!m) return;
    const fecha = prompt('Fecha de ingreso:', m.fechaIngreso);
    const motivo = prompt('Motivo:', m.motivo);
    const resp = prompt('Responsable:', m.responsable);
    if (!fecha || !motivo || !resp) return;
    await db.collection('historial_mantenimientos').doc(id).update({ fechaIngreso: fecha, motivo, responsable: resp });
    alert('✅ Registro actualizado');
    await cargarDatosCompleto();
    verHistorialVehiculo(m.placa);
}

// =====================================================
// ===== ⚙️ ADMINISTRACIÓN =====
// =====================================================
function cambiarSubpestañaAdmin(nombre) {
    document.querySelectorAll('.btn-subadmin').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.subpestaña-admin').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');
    if (nombre === 'colaboradores') dibujarTablaColaboradores();
    if (nombre === 'vehiculos') dibujarTablaVehiculosAdmin();
    if (nombre === 'tipos-vehiculo') dibujarListaTiposVehiculo();
}

async function guardarColaborador() {
    const nom = document.getElementById('nombreColaboradorAdmin').value.trim();
    const id = document.getElementById('idEditarColaborador').value;
    if (!nom) return;
    if (colaboradores.some(c => c.nombre.trim() === nom && c.id !== id)) {
        return alert('⚠️ Este colaborador ya está registrado');
    }
    const datos = { nombre: nom, estado: 'activo', usuario: usuarioActivo.email, fecha: new Date() };
    try {
        if (id) {
            await db.collection('colaboradores').doc(id).update(datos);
            alert('✅ Colaborador actualizado');
        } else {
            await db.collection('colaboradores').add(datos);
            alert('✅ Colaborador guardado');
        }
        document.getElementById('nombreColaboradorAdmin').value = '';
        document.getElementById('idEditarColaborador').value = '';
        await cargarDatosCompleto();
        dibujarTablaColaboradores();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function dibujarTablaColaboradores() {
    const tb = document.querySelector('#tablaColaboradores tbody');
    if (!tb) return;
    tb.innerHTML = colaboradores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${(c.estado || 'activo') === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>
                <button class="btn-editar" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='editarColaborador("${c.id}","${c.nombre}","${c.estado||"activo"}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='cambiarEstadoColaborador("${c.id}","${c.estado||"activo"}")'>${(c.estado||"activo")==="activo"?"❌ Inactivar":"✅ Activar"}</button>
            </td>
        </tr>`).join('');
}

async function editarColaborador(id, nombre, estado) {
    document.getElementById('nombreColaboradorAdmin').value = nombre;
    document.getElementById('idEditarColaborador').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cambiarEstadoColaborador(id, estadoActual) {
    const nuevo = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿Seguro de poner como ${nuevo.toUpperCase()} este colaborador?`)) return;
    await db.collection('colaboradores').doc(id).update({ estado: nuevo });
    alert(`✅ Colaborador ${nuevo}`);
    await cargarDatosCompleto();
}

async function guardarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    const marca = document.getElementById('marcaVehiculoMov').value.trim();
    const id = document.getElementById('idEditarVehiculoMov').value;
    if (!placa || !tipo) return alert('Complete Placa y Tipo');
    if (vehiculosMov.some(v => v.placa === placa && v.id !== id)) {
        return alert('⚠️ Esta placa ya está registrada');
    }
    const datos = { placa, tipo, marca, estado: 'activo', usuario: usuarioActivo.email, fecha: new Date() };
    try {
        if (id) {
            await db.collection('vehiculos_movimientos').doc(id).update(datos);
            alert('✅ Vehículo actualizado');
        } else {
            await db.collection('vehiculos_movimientos').add(datos);
            alert('✅ Vehículo guardado');
        }
        document.getElementById('placaVehiculoMov').value = '';
        document.getElementById('tipoVehiculoMov').value = '';
        document.getElementById('marcaVehiculoMov').value = '';
        document.getElementById('idEditarVehiculoMov').value = '';
        await cargarDatosCompleto();
        dibujarTablaVehiculosAdmin();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function dibujarTablaVehiculosAdmin() {
    const tb = document.querySelector('#tablaVehiculosMov tbody');
    if (!tb) return;
    tb.innerHTML = vehiculosMov.map(v => `
        <tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td>${v.marca || '—'}</td>
            <td>
                <button class="btn-editar" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='editarVehiculoMov("${v.id}","${v.placa}","${v.tipo}","${v.marca||""}")'>✏️ Editar</button>
                <button class="btn-peligro" style="padding:0.3rem 0.5rem; font-size:0.8rem;" onclick='eliminarVehiculoMov("${v.id}","${v.placa}")'>🗑️</button>
            </td>
        </tr>`).join('');
    document.getElementById('tipoVehiculoMov').innerHTML = `<option value="">Seleccione tipo...</option>` + tiposVehiculo.map(t => `<option>${t}</option>`).join('');
}

async function editarVehiculoMov(id, placa, tipo, marca) {
    document.getElementById('placaVehiculoMov').value = placa;
    document.getElementById('tipoVehiculoMov').value = tipo;
    document.getElementById('marcaVehiculoMov').value = marca;
    document.getElementById('idEditarVehiculoMov').value = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarVehiculoMov(id, placa) {
    if (!confirm(`¿Eliminar vehículo ${placa}?`)) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    alert('✅ Eliminado');
    await cargarDatosCompleto();
}

function dibujarListaTiposVehiculo() {
    const c = document.getElementById('listaTiposVehiculo');
    c.innerHTML = tiposVehiculo.map((t, i) => `<div class="p-2 border-b flex justify-between items-center"><span>${t}</span><button class="btn-peligro text-xs" onclick="tiposVehiculo.splice(${i},1); dibujarListaTiposVehiculo(); alert('Borrado — Recarga para ver cambios')">🗑️</button></div>`).join('');
}

function agregarTipoVehiculo() {
    const t = document.getElementById('nuevoTipoVehiculo').value.trim();
    if (!t) return alert('Escriba el tipo');
    if (tiposVehiculo.includes(t)) return alert('Ya existe este tipo');
    tiposVehiculo.push(t);
    document.getElementById('nuevoTipoVehiculo').value = '';
    dibujarListaTiposVehiculo();
    alert('✅ Tipo agregado — se refleja al recargar');
}

// =====================================================
// ===== 📊 INFORMES =====
// =====================================================
function generarInformeMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('Seleccione fechas de inicio y fin');
    const res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = res;
    const c = document.getElementById('resultadoMovimientos');
    if (!res.length) { c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>'; return; }
    let totalCanSal = 0, totalCanLleg = 0, totalKg = 0;
    res.forEach(m => {
        totalCanSal += m.totalCanastillasSalida || 0;
        totalCanLleg += m.totalCanastillasLlegada || 0;
        totalKg += m.kilosTotales || 0;
    });
    c.innerHTML = `
        <p class="font-bold mb-2">📊 Totales del período: 📦 Salieron: ${totalCanSal} | 📦 Llegaron: ${totalCanLleg} | ⚖️ ${totalKg} kg</p>
        <table>
            <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canastillas Salida</th><th>Canastillas Llegada</th><th>Kilos</th><th>Observaciones</th></tr></thead>
            <tbody>
                ${res.map(m => `<tr>
                    <td>${m.fecha}</td>
                    <td>${m.placa}</td>
                    <td>${m.colaboradorConductor}</td>
                    <td>${m.horaSalida}</td>
                    <td>${m.horaLlegada || 'PENDIENTE'}</td>
                    <td>${m.totalCanastillasSalida || 0}</td>
                    <td>${m.totalCanastillasLlegada || 0}</td>
                    <td>${m.kilosTotales || 0}</td>
                    <td>${m.observaciones || '—'}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportarExcel() {
    if (!ultimosResultados.movimientos.length) return alert('Genere primero el informe');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha,
        Placa: m.placa,
        Conductor: m.colaboradorConductor,
        HoraSalida: m.horaSalida,
        HoraLlegada: m.horaLlegada || 'PENDIENTE',
        CanastillasSalida: m.totalCanastillasSalida || 0,
        CanastillasLlegada: m.totalCanastillasLlegada || 0,
        Kilos: m.kilosTotales || 0,
        Observaciones: m.observaciones || ''
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.xlsx`);
}

// =====================================================
// ===== 📝 REGISTRO DE ACCIONES / AUDITORÍA =====
// =====================================================
async function registrarAccion(accion, modulo, detalle) {
    try {
        await db.collection('auditoria').add({
            usuario: usuarioActivo.email || usuarioActivo.usuario,
            nombre: usuarioActivo.nombre || '',
            accion, modulo, detalle,
            fechaHora: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { /* Silencioso */ }
}

// =====================================================
// ===== INICIO AUTOMÁTICO AL CARGAR PÁGINA =====
// =====================================================
window.onload = function() {
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('fechaTransp').valueAsDate = new Date();
    document.getElementById('fechaKm').valueAsDate = new Date();
    document.getElementById('fechaTanqueo').valueAsDate = new Date();
    document.getElementById('fechaIngreso').valueAsDate = new Date();
    document.getElementById('fechaInicioMov').valueAsDate = new Date();
    document.getElementById('fechaFinMov').valueAsDate = new Date();
    document.getElementById('fechaInicioKm').valueAsDate = new Date();
    document.getElementById('fechaFinKm').valueAsDate = new Date();
    document.getElementById('fechaInicioTanqueo').valueAsDate = new Date();
    document.getElementById('fechaFinTanqueo').valueAsDate = new Date();
};
