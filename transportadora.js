// =====================================================
// ===== 🚛 MÓDULO TRANSPORTADORA COMPLETO =====
// =====================================================
window.cargarModulo_transportadora = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido');
    if (!c) return;
    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaTransp('crear', event)">📝 Registrar Llegada</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaTransp('hoy', event)">📅 Movimientos del Día</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaTransp('pendientes', event)">⏳ Pendientes por Salir</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaTransp('registro', event)">📋 Registro Vehículos/Conductores</button>
    </div>

    <!-- REGISTRAR LLEGADA / EDITAR SALIDA -->
    <div id="subtransp-crear">
        <div class="tarjeta">
            <h3 id="tituloFormTransp" class="font-bold mb-3">🚛 Registrar Llegada de Vehículo</h3>
            <div class="grid-2">
                <div class="grupo">
                    <label>Fecha</label>
                    <input type="date" id="fechaTransp" value="${hoy}">
                </div>
                <div class="grupo">
                    <label>Placa / Vehículo</label>
                    <select id="placaTransp">
                        <option value="">-- Seleccione --</option>
                        ${vehiculosTransp.filter(v => v.activa !== false).map(v => `<option value="${v.placa || v.nombre}">${v.placa || v.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Conductor</label>
                    <select id="conductorTransp">
                        <option value="">-- Seleccione --</option>
                        ${conductores.filter(c => c.activa !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Hora de Llegada</label>
                    <input type="time" id="horaLlegadaTransp">
                </div>
                <div class="grupo">
                    <label>Canastillas que LLEGARON</label>
                    <input type="number" id="canastillasLlegadaTransp" min="0" value="0">
                </div>
                <div class="grupo" id="bloqueSalidaTransp" style="opacity:0.5;">
                    <label>Hora de Salida</label>
                    <input type="time" id="horaSalidaTransp" placeholder="Se llena al salir">
                </div>
                <div class="grupo" id="bloqueCanastSalidaTransp" style="opacity:0.5;">
                    <label>Canastillas que SALEN</label>
                    <input type="number" id="canastillasSalidaTransp" min="0" value="0" placeholder="Se llena al salir">
                </div>
                <div class="grupo" style="grid-column: 1 / -1;">
                    <label>📝 Observaciones</label>
                    <input type="text" id="observacionesTransp" placeholder="Detalles, novedades, estado del vehículo...">
                </div>
            </div>
            <div class="flex gap-2 mt-4 flex-wrap">
                <button class="btn btn-exito" onclick="guardarTransp()">💾 Guardar</button>
                <button class="btn" onclick="limpiarFormularioTransp()">🔄 Limpiar</button>
                <button id="btnEliminarTransp" class="btn" style="background:#F53F3F; color:white; display:none;" onclick="eliminarTransp()">🗑️ Eliminar</button>
            </div>
        </div>
    </div>

    <!-- MOVIMIENTOS DEL DÍA -->
    <div id="subtransp-hoy" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📅 Movimientos de Hoy</h3>
            <div class="resumen mb-4">
                <div>✅ Llegadas: <strong id="resumenLlegadasTransp">0</strong></div>
                <div>➡️ Salidas: <strong id="resumenSalidasTransp">0</strong></div>
                <div>📦 Canast. Llegaron: <strong id="resumenCanLlegTransp">0</strong></div>
                <div>📦 Canast. Salieron: <strong id="resumenCanSalTransp">0</strong></div>
            </div>
            <div class="grupo mb-3">
                <label>🔍 Buscar:</label>
                <input type="text" id="buscarTranspHoy" placeholder="Placa, conductor, observación..." oninput="filtrarTranspHoy()">
            </div>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Hora Llegada</th>
                        <th>Placa</th>
                        <th>Conductor</th>
                        <th>Canast. Lleg.</th>
                        <th>Hora Salida</th>
                        <th>Canast. Sal.</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaTranspHoyCuerpo"></tbody>
            </table>
        </div>
    </div>

    <!-- PENDIENTES POR SALIR -->
    <div id="subtransp-pendientes" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⏳ Pendientes por Salir</h3>
            <div class="grupo mb-3">
                <label>🔍 Buscar:</label>
                <input type="text" id="buscarTranspPend" placeholder="Placa, conductor, observación..." oninput="filtrarTranspPendientes()">
            </div>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Hora Llegada</th>
                        <th>Placa</th>
                        <th>Conductor</th>
                        <th>Canast. Llegaron</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaTranspPendientesCuerpo"></tbody>
            </table>
        </div>
    </div>

    <!-- 🆕 REGISTRO DE VEHÍCULOS Y CONDUCTORES -->
    <div id="subtransp-registro" class="oculto">
        <div class="flex gap-2 mb-4">
            <button class="btn-subpestaña-reg activa" onclick="cambiarSubRegistroTransp('vehiculos', event)">🚗 Vehículos</button>
            <button class="btn-subpestaña-reg" onclick="cambiarSubRegistroTransp('conductores', event)">👤 Conductores</button>
        </div>

        <!-- VEHÍCULOS -->
        <div id="subreg-vehiculos">
            <div class="tarjeta mb-4">
                <h3 id="tituloVehiculo" class="font-bold mb-3">🚗 Registrar Vehículo</h3>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Placa</label>
                        <input type="text" id="placaNuevaTransp" placeholder="Ej: ABC-123" style="text-transform:uppercase;">
                    </div>
                    <div class="grupo">
                        <label>Marca / Modelo (opcional)</label>
                        <input type="text" id="modeloTransp" placeholder="Ej: Chevrolet NHR">
                    </div>
                    <div class="grupo col-span-2">
                        <label>Observaciones (opcional)</label>
                        <input type="text" id="obsVehiculoTransp" placeholder="Estado, SOAT, Tecnicomecánica...">
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button class="btn btn-exito" onclick="guardarVehiculoTransp()">💾 Guardar Vehículo</button>
                    <button class="btn" onclick="limpiarFormVehiculoTransp()">🔄 Limpiar</button>
                    <button id="btnCancelarVehTransp" class="btn" style="display:none;" onclick="limpiarFormVehiculoTransp()">❌ Cancelar</button>
                </div>
            </div>

            <div class="tarjeta">
                <h4 class="font-bold mb-3">📋 Lista de Vehículos</h4>
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Modelo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaVehiculosTranspCuerpo"></tbody>
                </table>
            </div>
        </div>

        <!-- CONDUCTORES -->
        <div id="subreg-conductores" class="oculto">
            <div class="tarjeta mb-4">
                <h3 id="tituloConductor" class="font-bold mb-3">👤 Registrar Conductor</h3>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Nombre Completo</label>
                        <input type="text" id="nombreConductorTransp" placeholder="Nombre y Apellido">
                    </div>
                    <div class="grupo">
                        <label>Documento / Teléfono (opcional)</label>
                        <input type="text" id="docConductorTransp" placeholder="Cédula o celular">
                    </div>
                    <div class="grupo col-span-2">
                        <label>Observaciones (opcional)</label>
                        <input type="text" id="obsConductorTransp" placeholder="Licencia, novedades...">
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button class="btn btn-exito" onclick="guardarConductorTransp()">💾 Guardar Conductor</button>
                    <button class="btn" onclick="limpiarFormConductorTransp()">🔄 Limpiar</button>
                    <button id="btnCancelarCondTransp" class="btn" style="display:none;" onclick="limpiarFormConductorTransp()">❌ Cancelar</button>
                </div>
            </div>

            <div class="tarjeta">
                <h4 class="font-bold mb-3">📋 Lista de Conductores</h4>
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Doc/Teléfono</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaConductoresTranspCuerpo"></tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    dibujarTranspHoy();
    dibujarTranspPendientes();
    dibujarListaVehiculosTransp();
    dibujarListaConductoresTransp();
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA PRINCIPAL =====
// =====================================================
function cambiarSubpestañaTransp(nombre, evento) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento?.currentTarget) evento.currentTarget.classList.add('activa');
    document.querySelectorAll('[id^="subtransp-"]').forEach(d => d.classList.add('oculto'));
    document.getElementById(`subtransp-${nombre}`).classList.remove('oculto');
    
    if (nombre === 'hoy') dibujarTranspHoy();
    if (nombre === 'pendientes') dibujarTranspPendientes();
    if (nombre === 'registro') {
        dibujarListaVehiculosTransp();
        dibujarListaConductoresTransp();
    }
}

// =====================================================
// ===== CAMBIAR SUB-REGISTRO =====
// =====================================================
function cambiarSubRegistroTransp(nombre, evento) {
    document.querySelectorAll('.btn-subpestaña-reg').forEach(b => b.classList.remove('activa'));
    if (evento?.currentTarget) evento.currentTarget.classList.add('activa');
    document.querySelectorAll('[id^="subreg-"]').forEach(d => d.classList.add('oculto'));
    document.getElementById(`subreg-${nombre}`).classList.remove('oculto');
}

// =====================================================
// ===== ORDENAR: MÁS RECIENTE PRIMERO =====
// =====================================================
function ordenarPorHoraLlegada(lista) {
    return [...lista].sort((a, b) => {
        const ha = a.horaLlegada || '00:00';
        const hb = b.horaLlegada || '00:00';
        return hb.localeCompare(ha);
    });
}

// =====================================================
// ===== DIBUJAR HOY =====
// =====================================================
function dibujarTranspHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaTranspHoyCuerpo');
    if (!tb) return;
    
    let filtro = movimientosTransp.filter(m => m.fecha === hoy);
    filtro = ordenarPorHoraLlegada(filtro);
    
    const totalLlegadas = filtro.length;
    const totalSalidas = filtro.filter(m => m.horaSalida).length;
    const totalCanLleg = filtro.reduce((s, m) => s + (m.canastillasLlegada || 0), 0);
    const totalCanSal = filtro.reduce((s, m) => s + (m.canastillasSalida || 0), 0);
    
    document.getElementById('resumenLlegadasTransp').textContent = totalLlegadas;
    document.getElementById('resumenSalidasTransp').textContent = totalSalidas;
    document.getElementById('resumenCanLlegTransp').textContent = totalCanLleg;
    document.getElementById('resumenCanSalTransp').textContent = totalCanSal;
    
    const texto = document.getElementById('buscarTranspHoy')?.value?.toLowerCase() || '';
    const res = texto 
        ? filtro.filter(m => 
            (m.placa||'').toLowerCase().includes(texto) ||
            (m.conductor||'').toLowerCase().includes(texto) ||
            (m.observaciones||'').toLowerCase().includes(texto))
        : filtro;
    
    tb.innerHTML = res.length === 0
        ? '<tr><td colspan="8" class="text-center">📭 Sin movimientos hoy</td></tr>'
        : res.map(m => `
        <tr>
            <td>${m.horaLlegada}</td>
            <td>${m.placa}</td>
            <td>${m.conductor}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${m.horaSalida || '<span style="color:orange;">Pendiente</span>'}</td>
            <td>${m.canastillasSalida || '<span style="color:orange;">—</span>'}</td>
            <td style="max-width:150px; font-size:12px;">${m.observaciones || '—'}</td>
            <td>
                <div class="flex gap-1">
                    ${!m.horaSalida 
                        ? `<button class="btn btn-exito btn-sm" onclick="irAEditarSalidaTransp('${m.id}')">➡️ Salida</button>` 
                        : `<button class="btn btn-amarillo btn-sm" onclick="irAEditarTransp('${m.id}')">✏️ Editar</button>`
                    }
                    <button class="btn btn-sm" style="background:#F53F3F; color:white;" onclick="eliminarRegistroTransp('${m.id}')">🗑️</button>
                </div>
            </td>
        </tr>`).join('');
}
function filtrarTranspHoy() { dibujarTranspHoy(); }

// =====================================================
// ===== DIBUJAR PENDIENTES POR SALIR =====
// =====================================================
function dibujarTranspPendientes() {
    const tb = document.getElementById('tablaTranspPendientesCuerpo');
    if (!tb) return;
    
    let pend = movimientosTransp.filter(m => !m.horaSalida);
    pend = ordenarPorHoraLlegada(pend);
    
    const texto = document.getElementById('buscarTranspPend')?.value?.toLowerCase() || '';
    const res = texto
        ? pend.filter(m => 
            (m.placa||'').toLowerCase().includes(texto) ||
            (m.conductor||'').toLowerCase().includes(texto) ||
            (m.observaciones||'').toLowerCase().includes(texto))
        : pend;
    
    tb.innerHTML = res.length === 0
        ? '<tr><td colspan="6" class="text-center">✅ Todos han salido</td></tr>'
        : res.map(m => `
        <tr>
            <td>${m.horaLlegada}</td>
            <td>${m.placa}</td>
            <td>${m.conductor}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td style="max-width:150px; font-size:12px;">${m.observaciones || '—'}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-exito btn-sm" onclick="irAEditarSalidaTransp('${m.id}')">➡️ Salida</button>
                    <button class="btn btn-sm" style="background:#F53F3F; color:white;" onclick="eliminarRegistroTransp('${m.id}')">🗑️</button>
                </div>
            </td>
        </tr>`).join('');
}
function filtrarTranspPendientes() { dibujarTranspPendientes(); }

// =====================================================
// ===== IR A EDITAR =====
// =====================================================
function irAEditarTransp(id) {
    cambiarSubpestañaTransp('crear', { currentTarget: document.querySelector('[onclick*="crear"]') });
    setTimeout(() => editarTransp(id, false), 50);
}
function irAEditarSalidaTransp(id) {
    cambiarSubpestañaTransp('crear', { currentTarget: document.querySelector('[onclick*="crear"]') });
    setTimeout(() => editarTransp(id, true), 50);
}
function editarTransp(id, modoSalida) {
    const m = movimientosTransp.find(x => x.id === id);
    if (!m) return alert('⚠️ Registro no encontrado');
    
    idEdicionTransp = id;
    
    document.getElementById('fechaTransp').value = m.fecha;
    document.getElementById('placaTransp').value = m.placa;
    document.getElementById('conductorTransp').value = m.conductor;
    document.getElementById('horaLlegadaTransp').value = m.horaLlegada;
    document.getElementById('canastillasLlegadaTransp').value = m.canastillasLlegada || 0;
    document.getElementById('horaSalidaTransp').value = m.horaSalida || '';
    document.getElementById('canastillasSalidaTransp').value = m.canastillasSalida || 0;
    document.getElementById('observacionesTransp').value = m.observaciones || '';
    
    document.getElementById('btnEliminarTransp').style.display = 'inline-block';
    
    if (modoSalida) {
        document.getElementById('tituloFormTransp').textContent = '➡️ Registrar Salida';
        document.getElementById('horaLlegadaTransp').disabled = true;
        document.getElementById('canastillasLlegadaTransp').disabled = true;
        document.getElementById('bloqueSalidaTransp').style.opacity = '1';
        document.getElementById('bloqueCanastSalidaTransp').style.opacity = '1';
    } else {
        document.getElementById('tituloFormTransp').textContent = '✏️ Editar Completo';
        document.getElementById('horaLlegadaTransp').disabled = false;
        document.getElementById('canastillasLlegadaTransp').disabled = false;
        document.getElementById('bloqueSalidaTransp').style.opacity = '1';
        document.getElementById('bloqueCanastSalidaTransp').style.opacity = '1';
    }
}

// =====================================================
// ===== ELIMINAR DESDE FORMULARIO =====
// =====================================================
async function eliminarTransp() {
    if (!idEdicionTransp) return;
    if (!confirm('⚠️ ¿Eliminar este registro?\n\nSe borrará permanentemente.')) return;
    
    try {
        await db.collection('movimientos_transportadora').doc(idEdicionTransp).delete();
        alert('✅ Registro eliminado');
        limpiarFormularioTransp();
        cambiarSubpestañaTransp('hoy', { currentTarget: null });
    } catch (e) {
        alert('❌ Error al eliminar: ' + e.message);
    }
}

// =====================================================
// ===== ELIMINAR DESDE TABLA =====
// =====================================================
async function eliminarRegistroTransp(id) {
    if (!confirm('⚠️ ¿Eliminar este registro?\n\nSe borrará permanentemente.')) return;
    
    try {
        await db.collection('movimientos_transportadora').doc(id).delete();
        if (idEdicionTransp === id) limpiarFormularioTransp();
        alert('✅ Registro eliminado');
    } catch (e) {
        alert('❌ Error al eliminar: ' + e.message);
    }
}

// =====================================================
// ===== GUARDAR MOVIMIENTO =====
// =====================================================
async function guardarTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const placa = document.getElementById('placaTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaTransp').value) || 0;
    const horaSalida = document.getElementById('horaSalidaTransp').value || '';
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaTransp').value) || 0;
    const observaciones = document.getElementById('observacionesTransp').value.trim();
    
    if (!fecha || !placa || !conductor || !horaLlegada) {
        return alert('⚠️ Complete fecha, placa, conductor y hora de llegada');
    }
    
    const datos = {
        fecha, placa, conductor,
        horaLlegada, canastillasLlegada,
        horaSalida, canastillasSalida,
        observaciones,
        usuario: usuarioActivo?.nombre || 'Anónimo'
    };
    
    try {
        if (idEdicionTransp) {
            await db.collection('movimientos_transportadora').doc(idEdicionTransp).update(datos);
            alert('✅ Registro actualizado');
        } else {
            const ref = await db.collection('movimientos_transportadora').add(datos);
            if (usuarioActivo?.rol === 'prueba') {
                idsCreadosPorPrueba.push({ coleccion: 'movimientos_transportadora', id: ref.id });
            }
            alert('✅ Llegada registrada — ahora puede registrar la salida');
        }
        limpiarFormularioTransp();
        cambiarSubpestañaTransp('hoy', { currentTarget: null });
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// =====================================================
// ===== LIMPIAR FORMULARIO MOVIMIENTO =====
// =====================================================
function limpiarFormularioTransp() {
    idEdicionTransp = null;
    const hoy = new Date().toISOString().split('T')[0];
    
    document.getElementById('fechaTransp').value = hoy;
    document.getElementById('placaTransp').value = '';
    document.getElementById('conductorTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canastillasLlegadaTransp').value = '0';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('canastillasSalidaTransp').value = '0';
    document.getElementById('observacionesTransp').value = '';
    
    document.getElementById('btnEliminarTransp').style.display = 'none';
    document.getElementById('tituloFormTransp').textContent = '🚛 Registrar Llegada de Vehículo';
    document.getElementById('horaLlegadaTransp').disabled = false;
    document.getElementById('canastillasLlegadaTransp').disabled = false;
    document.getElementById('bloqueSalidaTransp').style.opacity = '0.5';
    document.getElementById('bloqueCanastSalidaTransp').style.opacity = '0.5';
}

// =====================================================
// ===== 🚗 GESTIÓN DE VEHÍCULOS =====
// =====================================================
let idEditarVehiculo = null;

function dibujarListaVehiculosTransp() {
    const tb = document.getElementById('tablaVehiculosTranspCuerpo');
    if (!tb) return;
    
    tb.innerHTML = vehiculosTransp.length === 0
        ? '<tr><td colspan="4" class="text-center">📭 Sin vehículos registrados</td></tr>'
        : vehiculosTransp.map(v => `
        <tr>
            <td style="font-weight:bold;">${v.placa || v.nombre}</td>
            <td>${v.modelo || '—'}</td>
            <td>
                <span style="color:${v.activa !== false ? 'green' : 'red'}; font-weight:bold;">
                    ${v.activa !== false ? '✅ Activo' : '❌ Inactivo'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-amarillo btn-sm" onclick="editarVehiculoTransp('${v.id}')">✏️</button>
                    <button class="btn btn-sm" style="background:${v.activa !== false ? '#f97316' : '#22c55e'}; color:white;" 
                        onclick="cambiarEstadoVehiculoTransp('${v.id}', ${v.activa !== false})">
                        ${v.activa !== false ? '🔕 Inactivar' : '✅ Activar'}
                    </button>
                </div>
            </td>
        </tr>`).join('');
}

async function guardarVehiculoTransp() {
    const placa = (document.getElementById('placaNuevaTransp').value || '').trim().toUpperCase();
    const modelo = (document.getElementById('modeloTransp').value || '').trim();
    const observaciones = (document.getElementById('obsVehiculoTransp').value || '').trim();
    
    if (!placa) return alert('⚠️ Escriba la placa del vehículo');
    
    // Verificar duplicado
    const existe = vehiculosTransp.some(v => 
        (v.placa || v.nombre) === placa && v.id !== idEditarVehiculo
    );
    if (existe) return alert('⚠️ Esta placa ya está registrada');
    
    const datos = { placa, nombre: placa, modelo, observaciones, activa: true };
    
    try {
        if (idEditarVehiculo) {
            const idx = vehiculosTransp.findIndex(v => v.id === idEditarVehiculo);
            if (idx >= 0) {
                await db.collection('vehiculos_transportadora').doc(idEditarVehiculo).update(datos);
                Object.assign(vehiculosTransp[idx], datos);
            }
            alert('✅ Vehículo actualizado');
        } else {
            const ref = await db.collection('vehiculos_transportadora').add(datos);
            vehiculosTransp.push({ id: ref.id, ...datos });
            alert('✅ Vehículo registrado');
        }
        limpiarFormVehiculoTransp();
        dibujarListaVehiculosTransp();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function editarVehiculoTransp(id) {
    const v = vehiculosTransp.find(x => x.id === id);
    if (!v) return;
    
    idEditarVehiculo = id;
    document.getElementById('placaNuevaTransp').value = v.placa || v.nombre || '';
    document.getElementById('modeloTransp').value = v.modelo || '';
    document.getElementById('obsVehiculoTransp').value = v.observaciones || '';
    document.getElementById('tituloVehiculo').textContent = '✏️ Editar Vehículo';
    document.getElementById('btnCancelarVehTransp').style.display = 'inline-block';
}

async function cambiarEstadoVehiculoTransp(id, estaActivo) {
    const nuevoEstado = !estaActivo;
    if (!confirm(`¿${nuevoEstado ? '✅ Activar' : '🔕 Inactivar'} este vehículo?`)) return;
    
    try {
        await db.collection('vehiculos_transportadora').doc(id).update({ activa: nuevoEstado });
        const v = vehiculosTransp.find(x => x.id === id);
        if (v) v.activa = nuevoEstado;
        dibujarListaVehiculosTransp();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function limpiarFormVehiculoTransp() {
    idEditarVehiculo = null;
    document.getElementById('placaNuevaTransp').value = '';
    document.getElementById('modeloTransp').value = '';
    document.getElementById('obsVehiculoTransp').value = '';
    document.getElementById('tituloVehiculo').textContent = '🚗 Registrar Vehículo';
    document.getElementById('btnCancelarVehTransp').style.display = 'none';
}

// =====================================================
// ===== 👤 GESTIÓN DE CONDUCTORES =====
// =====================================================
let idEditarConductor = null;

function dibujarListaConductoresTransp() {
    const tb = document.getElementById('tablaConductoresTranspCuerpo');
    if (!tb) return;
    
    tb.innerHTML = conductores.length === 0
        ? '<tr><td colspan="4" class="text-center">📭 Sin conductores registrados</td></tr>'
        : conductores.map(c => `
        <tr>
            <td style="font-weight:bold;">${c.nombre}</td>
            <td>${c.documento || c.telefono || '—'}</td>
            <td>
                <span style="color:${c.activa !== false ? 'green' : 'red'}; font-weight:bold;">
                    ${c.activa !== false ? '✅ Activo' : '❌ Inactivo'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-amarillo btn-sm" onclick="editarConductorTransp('${c.id}')">✏️</button>
                    <button class="btn btn-sm" style="background:${c.activa !== false ? '#f97316' : '#22c55e'}; color:white;" 
                        onclick="cambiarEstadoConductorTransp('${c.id}', ${c.activa !== false})">
                        ${c.activa !== false ? '🔕 Inactivar' : '✅ Activar'}
                    </button>
                </div>
            </td>
        </tr>`).join('');
}

async function guardarConductorTransp() {
    const nombre = (document.getElementById('nombreConductorTransp').value || '').trim();
    const documento = (document.getElementById('docConductorTransp').value || '').trim();
    const observaciones = (document.getElementById('obsConductorTransp').value || '').trim();
    
    if (!nombre) return alert('⚠️ Escriba el nombre del conductor');
    
    const existe = conductores.some(c => c.nombre === nombre && c.id !== idEditarConductor);
    if (existe) return alert('⚠️ Este conductor ya está registrado');
    
    const datos = { nombre, documento, telefono: documento, observaciones, activa: true };
    
    try {
        if (idEditarConductor) {
            const idx = conductores.findIndex(c => c.id === idEditarConductor);
            if (idx >= 0) {
                await db.collection('conductores_transportadora').doc(idEditarConductor).update(datos);
                Object.assign(conductores[idx], datos);
            }
            alert('✅ Conductor actualizado');
        } else {
            const ref = await db.collection('conductores_transportadora').add(datos);
            conductores.push({ id: ref.id, ...datos });
            alert('✅ Conductor registrado');
        }
        limpiarFormConductorTransp();
        dibujarListaConductoresTransp();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function editarConductorTransp(id) {
    const c = conductores.find(x => x.id === id);
    if (!c) return;
    
    idEditarConductor = id;
    document.getElementById('nombreConductorTransp').value = c.nombre || '';
    document.getElementById('docConductorTransp').value = c.documento || c.telefono || '';
    document.getElementById('obsConductorTransp').value = c.observaciones || '';
    document.getElementById('tituloConductor').textContent = '✏️ Editar Conductor';
    document.getElementById('btnCancelarCondTransp').style.display = 'inline-block';
}

async function cambiarEstadoConductorTransp(id, estaActivo) {
    const nuevoEstado = !estaActivo;
    if (!confirm(`¿${nuevoEstado ? '✅ Activar' : '🔕 Inactivar'} este conductor?`)) return;
    
    try {
        await db.collection('conductores_transportadora').doc(id).update({ activa: nuevoEstado });
        const c = conductores.find(x => x.id === id);
        if (c) c.activa = nuevoEstado;
        dibujarListaConductoresTransp();
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

function limpiarFormConductorTransp() {
    idEditarConductor = null;
    document.getElementById('nombreConductorTransp').value = '';
    document.getElementById('docConductorTransp').value = '';
    document.getElementById('obsConductorTransp').value = '';
    document.getElementById('tituloConductor').textContent = '👤 Registrar Conductor';
    document.getElementById('btnCancelarCondTransp').style.display = 'none';
}