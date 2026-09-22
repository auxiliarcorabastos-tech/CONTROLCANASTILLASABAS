// =====================================================
// ===== 🚛 MÓDULO TRANSPORTADORA =====
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
                        ${vehiculosTransp.map(v => `<option value="${v.placa || v.nombre}">${v.placa || v.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Conductor</label>
                    <select id="conductorTransp">
                        <option value="">-- Seleccione --</option>
                        ${conductores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
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
            
            <!-- RESUMEN -->
            <div class="resumen mb-4">
                <div>✅ Llegadas: <strong id="resumenLlegadasTransp">0</strong></div>
                <div>➡️ Salidas: <strong id="resumenSalidasTransp">0</strong></div>
                <div>📦 Canast. Llegaron: <strong id="resumenCanLlegTransp">0</strong></div>
                <div>📦 Canast. Salieron: <strong id="resumenCanSalTransp">0</strong></div>
            </div>
            
            <!-- BUSCADOR -->
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
            
            <!-- BUSCADOR -->
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
    `;

    dibujarTranspHoy();
    dibujarTranspPendientes();
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaTransp(nombre, evento) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento?.currentTarget) evento.currentTarget.classList.add('activa');
    document.querySelectorAll('[id^="subtransp-"]').forEach(d => d.classList.add('oculto'));
    document.getElementById(`subtransp-${nombre}`).classList.remove('oculto');
    
    if (nombre === 'hoy') dibujarTranspHoy();
    if (nombre === 'pendientes') dibujarTranspPendientes();
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
    
    // RESUMEN
    const totalLlegadas = filtro.length;
    const totalSalidas = filtro.filter(m => m.horaSalida).length;
    const totalCanLleg = filtro.reduce((s, m) => s + (m.canastillasLlegada || 0), 0);
    const totalCanSal = filtro.reduce((s, m) => s + (m.canastillasSalida || 0), 0);
    
    document.getElementById('resumenLlegadasTransp').textContent = totalLlegadas;
    document.getElementById('resumenSalidasTransp').textContent = totalSalidas;
    document.getElementById('resumenCanLlegTransp').textContent = totalCanLleg;
    document.getElementById('resumenCanSalTransp').textContent = totalCanSal;
    
    // BÚSQUEDA
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
    
    // Mostrar botón Eliminar
    document.getElementById('btnEliminarTransp').style.display = 'inline-block';
    
    // Título y bloques según modo
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
        
        // Si estamos editando justo este registro, limpiar formulario
        if (idEdicionTransp === id) {
            limpiarFormularioTransp();
        }
        
        alert('✅ Registro eliminado');
    } catch (e) {
        alert('❌ Error al eliminar: ' + e.message);
    }
}

// =====================================================
// ===== GUARDAR =====
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
// ===== LIMPIAR FORMULARIO =====
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
    
    // Ocultar botón Eliminar
    document.getElementById('btnEliminarTransp').style.display = 'none';
    
    // Restaurar estado
    document.getElementById('tituloFormTransp').textContent = '🚛 Registrar Llegada de Vehículo';
    document.getElementById('horaLlegadaTransp').disabled = false;
    document.getElementById('canastillasLlegadaTransp').disabled = false;
    document.getElementById('bloqueSalidaTransp').style.opacity = '0.5';
    document.getElementById('bloqueCanastSalidaTransp').style.opacity = '0.5';
}