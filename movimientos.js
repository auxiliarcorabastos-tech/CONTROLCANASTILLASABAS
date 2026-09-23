// =====================================================
// ===== 📦 MÓDULO MOVIMIENTOS — COMPLETO Y ACTUALIZADO =====
// =====================================================
window.cargarModulo_movimientos = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido');
    if (!c) return;
    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaMov('crear', event)">📝 Crear / Editar</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('hoy', event)">📅 Movimientos del Día</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('pendientes', event)">⏳ Pendientes por Llegar</button>
    </div>

    <!-- CREAR / EDITAR -->
    <div id="submov-crear">
        <div class="tarjeta">
            <h3 id="tituloFormMov" class="font-bold mb-3">📝 Crear Movimiento</h3>
            <div class="grid-2">
                <div class="grupo">
                    <label>Fecha</label>
                    <input type="date" id="fechaMov" value="${hoy}">
                </div>
                <div class="grupo">
                    <label>Placa / Vehículo</label>
                    <select id="placaMov">
                        <option value="">-- Seleccione --</option>
                        ${vehiculosMov.filter(v => v.activa !== false).map(v => `<option value="${v.placa || v.nombre}">${v.placa || v.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Colaborador / Conductor</label>
                    <select id="colaboradorMov">
                        <option value="">-- Seleccione --</option>
                        ${colaboradores.filter(c => c.activa !== false).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Hora de Salida</label>
                    <input type="time" id="horaSalida">
                </div>
                <div class="grupo">
                    <label>Hora de Llegada</label>
                    <input type="time" id="horaLlegada">
                </div>
                <div class="grupo">
                    <label>Canastillas de Salida</label>
                    <input type="number" id="canastillasSalida" min="0" value="0">
                </div>
                <div class="grupo">
                    <label>Canastillas de Llegada</label>
                    <input type="number" id="canastillasLlegada" min="0" value="0">
                </div>
                <div class="grupo">
                    <label>⚖️ Total Kilos</label>
                    <input type="number" step="0.01" id="totalKilosMov" value="0" readonly style="font-weight:bold; background:#eef;">
                </div>
                <div class="grupo col-span-2">
                    <label>📝 Observaciones del Movimiento</label>
                    <textarea id="observacionesMov" rows="2" placeholder="Novedades, estado del vehículo, ruta, remisiones..."></textarea>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="font-bold mb-2">📋 Recogidas</h4>
                <button class="btn btn-primario btn-sm mb-3" onclick="agregarFilaRecogida()">+ Agregar Recogida</button>
                <div id="areaRecogidas"></div>
            </div>

            <div class="flex gap-2 mt-4">
                <button class="btn btn-exito" onclick="guardarMovimiento()">💾 Guardar</button>
                <button class="btn" onclick="limpiarFormularioMov()">🔄 Limpiar</button>
            </div>
        </div>
    </div>

    <!-- MOVIMIENTOS DEL DÍA -->
    <div id="submov-hoy" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📅 Movimientos de Hoy</h3>
            
            <div class="resumen mb-4 flex flex-wrap gap-3">
                <div class="bg-blue-50 px-3 py-2 rounded">📦 Salidas: <strong id="resumenSalidas">0</strong></div>
                <div class="bg-green-50 px-3 py-2 rounded">✅ Llegadas: <strong id="resumenLlegadas">0</strong></div>
                <div class="bg-yellow-50 px-3 py-2 rounded">⚖️ Kilos: <strong id="resumenKilos">0</strong></div>
            </div>
            
            <div class="grupo mb-3">
                <label>🔍 Buscar:</label>
                <input type="text" id="buscarHoy" placeholder="Placa, colaborador, observación..." oninput="filtrarMovimientosHoy()">
            </div>
            
            <div class="mb-3 flex flex-wrap gap-2 items-center">
                <label style="display:inline-flex;align-items:center;gap:6px;font-weight:normal;">
                    <input type="checkbox" onchange="seleccionarTodosMovimientos(this)"> Seleccionar todos
                </label>
                <button class="btn btn-exito btn-sm" onclick="completarSeleccionados()">✅ Completar seleccionados</button>
            </div>
            
            <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
                <table class="tabla w-full">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="p-2 text-center w-8"><input type="checkbox" disabled></th>
                            <th class="p-2 whitespace-nowrap">Hora</th>
                            <th class="p-2 whitespace-nowrap">Placa</th>
                            <th class="p-2 whitespace-nowrap">Colaborador</th>
                            <th class="p-2 whitespace-nowrap">Hora Llegada</th>
                            <th class="p-2 whitespace-nowrap text-center">Canast.<br>Salida</th>
                            <th class="p-2 whitespace-nowrap text-center">Canast.<br>Llegada</th>
                            <th class="p-2 whitespace-nowrap text-right">Kilos</th>
                            <th class="p-2 whitespace-nowrap">Observaciones</th>
                            <th class="p-2 whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaMovimientosHoyCuerpo"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- PENDIENTES POR LLEGAR -->
    <div id="submov-pendientes" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⏳ Pendientes por Llegar</h3>
            
            <div class="grupo mb-3">
                <label>🔍 Buscar:</label>
                <input type="text" id="buscarPendientes" placeholder="Placa, colaborador, observación..." oninput="filtrarPendientes()">
            </div>
            
            <div class="mb-3 flex flex-wrap gap-2 items-center">
                <label style="display:inline-flex;align-items:center;gap:6px;font-weight:normal;">
                    <input type="checkbox" onchange="seleccionarTodosPendientes(this)"> Seleccionar todos
                </label>
                <button class="btn btn-exito btn-sm" onclick="completarSeleccionados()">✅ Completar seleccionados</button>
            </div>
            
            <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
                <table class="tabla w-full">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="p-2 text-center w-8"><input type="checkbox" disabled></th>
                            <th class="p-2 whitespace-nowrap">Hora Salida</th>
                            <th class="p-2 whitespace-nowrap">Placa</th>
                            <th class="p-2 whitespace-nowrap">Colaborador</th>
                            <th class="p-2 whitespace-nowrap text-center">Canast.<br>Salida</th>
                            <th class="p-2 whitespace-nowrap">Observaciones</th>
                            <th class="p-2 whitespace-nowrap">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="tablaPendientesCuerpo"></tbody>
                </table>
            </div>
        </div>
    </div>
    `;
    
    setTimeout(() => calcularTotalKilos(), 50);
    dibujarMovimientosHoy();
    dibujarPendientes();
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaMov(nombre, evento) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento?.currentTarget) evento.currentTarget.classList.add('activa');
    document.querySelectorAll('[id^="submov-"]').forEach(d => d.classList.add('oculto'));
    document.getElementById(`submov-${nombre}`).classList.remove('oculto');
    
    if (nombre === 'hoy') dibujarMovimientosHoy();
    if (nombre === 'pendientes') dibujarPendientes();
}

// =====================================================
// ===== ORDENAR: MÁS RECIENTE PRIMERO =====
// =====================================================
function ordenarPorHoraDescendente(lista, campoHora) {
    return [...lista].sort((a, b) => {
        const ha = a[campoHora] || '00:00';
        const hb = b[campoHora] || '00:00';
        return hb.localeCompare(ha);
    });
}

// =====================================================
// ===== DIBUJAR MOVIMIENTOS HOY — TABLA RESPONSIVA =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaMovimientosHoyCuerpo');
    if (!tb) return;
    
    let filtro = movimientos.filter(m => m.fecha === hoy);
    filtro = ordenarPorHoraDescendente(filtro, 'horaSalida');
    
    const totalSalidas = filtro.reduce((s, m) => s + (m.canastillasSalida || 0), 0);
    const totalLlegadas = filtro.filter(m => m.horaLlegada).reduce((s, m) => s + (m.canastillasLlegada || 0), 0);
    const totalKilos = filtro.reduce((s, m) => s + (Number(m.totalKilos) || 0), 0);
    
    const elResumenSalidas = document.getElementById('resumenSalidas');
    const elResumenLlegadas = document.getElementById('resumenLlegadas');
    const elResumenKilos = document.getElementById('resumenKilos');
    if (elResumenSalidas) elResumenSalidas.textContent = totalSalidas;
    if (elResumenLlegadas) elResumenLlegadas.textContent = totalLlegadas;
    if (elResumenKilos) elResumenKilos.textContent = totalKilos.toFixed(2);
    
    const textoBuscar = document.getElementById('buscarHoy')?.value?.toLowerCase() || '';
    const resultados = textoBuscar 
        ? filtro.filter(m => 
            (m.placa || '').toLowerCase().includes(textoBuscar) ||
            (m.colaborador || '').toLowerCase().includes(textoBuscar) ||
            (m.observaciones || '').toLowerCase().includes(textoBuscar))
        : filtro;
    
    tb.innerHTML = resultados.length === 0 
        ? '<tr><td colspan="10" class="text-center py-4">📭 Sin movimientos hoy</td></tr>'
        : resultados.map(m => `
        <tr class="border-b border-gray-100 ${m.horaLlegada ? 'bg-green-50/30' : ''} hover:bg-gray-50">
            <td class="p-2 text-center">
                <input type="checkbox" class="chk-movimiento" data-id="${m.id}" ${m.horaLlegada ? 'checked disabled' : ''}>
            </td>
            <td class="p-2 whitespace-nowrap font-medium">${m.horaSalida}</td>
            <td class="p-2 font-bold whitespace-nowrap">${m.placa}</td>
            <td class="p-2 whitespace-nowrap">${m.colaborador}</td>
            <td class="p-2 whitespace-nowrap ${!m.horaLlegada ? 'text-orange-500 font-medium' : 'text-green-600'}">
                ${m.horaLlegada || 'Pendiente'}
            </td>
            <td class="p-2 text-center">
                <span class="inline-block min-w-[40px] bg-blue-50 px-2 py-1 rounded font-medium">
                    ${m.canastillasSalida || 0}
                </span>
            </td>
            <td class="p-2 text-center">
                <span class="inline-block min-w-[40px] bg-green-50 px-2 py-1 rounded font-medium">
                    ${m.canastillasLlegada || 0}
                </span>
            </td>
            <td class="p-2 text-right font-semibold text-gray-700">
                ${(Number(m.totalKilos) || 0).toFixed(2)}
            </td>
            <td class="p-2 max-w-[120px] text-sm text-gray-500 truncate">
                ${m.observaciones || '—'}
            </td>
            <td class="p-2 whitespace-nowrap">
                <div class="flex flex-col sm:flex-row gap-1">
                    <button class="btn btn-amarillo btn-sm px-2 py-1 text-xs" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button>
                    ${!m.horaLlegada 
                        ? `<button class="btn btn-exito btn-sm px-2 py-1 text-xs" onclick="completarMovimientoDirecto('${m.id}')">✅ Completar</button>` 
                        : `<span class="text-green-600 text-xs font-medium px-2 py-1">✅ Listo</span>`
                    }
                </div>
            </td>
        </tr>`).join('');
}
function filtrarMovimientosHoy() { dibujarMovimientosHoy(); }

// =====================================================
// ===== DIBUJAR PENDIENTES =====
// =====================================================
function dibujarPendientes() {
    const tb = document.getElementById('tablaPendientesCuerpo');
    if (!tb) return;
    
    let pendientes = movimientos.filter(m => !m.horaLlegada);
    pendientes = ordenarPorHoraDescendente(pendientes, 'horaSalida');
    
    const textoBuscar = document.getElementById('buscarPendientes')?.value?.toLowerCase() || '';
    const resultados = textoBuscar
        ? pendientes.filter(m =>
            (m.placa || '').toLowerCase().includes(textoBuscar) ||
            (m.colaborador || '').toLowerCase().includes(textoBuscar) ||
            (m.observaciones || '').toLowerCase().includes(textoBuscar))
        : pendientes;
    
    tb.innerHTML = resultados.length === 0
        ? '<tr><td colspan="7" class="text-center py-4">✅ Sin pendientes por llegar</td></tr>'
        : resultados.map(m => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-2 text-center">
                <input type="checkbox" class="chk-pendiente" data-id="${m.id}">
            </td>
            <td class="p-2 whitespace-nowrap">${m.horaSalida}</td>
            <td class="p-2 font-bold whitespace-nowrap">${m.placa}</td>
            <td class="p-2 whitespace-nowrap">${m.colaborador}</td>
            <td class="p-2 text-center">
                <span class="inline-block min-w-[40px] bg-blue-50 px-2 py-1 rounded font-medium">
                    ${m.canastillasSalida || 0}
                </span>
            </td>
            <td class="p-2 max-w-[120px] text-sm text-gray-500 truncate">
                ${m.observaciones || '—'}
            </td>
            <td class="p-2 whitespace-nowrap">
                <button class="btn btn-exito btn-sm px-2 py-1 text-xs" onclick="irAEditarMovimiento('${m.id}')">⏰ Poner Llegada</button>
            </td>
        </tr>`).join('');
}
function filtrarPendientes() { dibujarPendientes(); }

// =====================================================
// ===== IR A EDITAR =====
// =====================================================
function irAEditarMovimiento(id) {
    cambiarSubpestañaMov('crear', { currentTarget: document.querySelector('[onclick*="crear"]') });
    setTimeout(() => editarMovimiento(id), 50);
}
function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return alert('⚠️ Movimiento no encontrado');
    
    idEdicion = id;
    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('placaMov').value = m.placa;
    document.getElementById('colaboradorMov').value = m.colaborador;
    document.getElementById('horaSalida').value = m.horaSalida;
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canastillasSalida').value = m.canastillasSalida || 0;
    document.getElementById('canastillasLlegada').value = m.canastillasLlegada || 0;
    document.getElementById('totalKilosMov').value = (Number(m.totalKilos) || 0).toFixed(2);
    document.getElementById('observacionesMov').value = m.observaciones || '';
    
    filasRecogida = m.recogidas || [];
    dibujarFilasRecogida();
    setTimeout(() => calcularTotalKilos(), 30);
    
    document.getElementById('tituloFormMov').textContent = '✏️ Editar Movimiento';
}

// =====================================================
// ===== RECOGIDAS =====
// =====================================================
function agregarFilaRecogida() {
    filasRecogida.push({ 
        tipo: 'canastilla', 
        cantidad: 0, 
        kilos: 0, 
        recogeA: '',
        observaciones: ''
    });
    dibujarFilasRecogida();
}

function dibujarFilasRecogida() {
    const area = document.getElementById('areaRecogidas');
    if (!area) return;
    
    area.innerHTML = filasRecogida.map((f, i) => `
        <div class="grid-2 tarjeta p-3 mb-2">
            <div class="grupo">
                <label>Tipo</label>
                <select onchange="filasRecogida[${i}].tipo=this.value; calcularTotalKilos()">
                    <option value="canastilla" ${f.tipo==='canastilla'?'selected':''}>Canastilla</option>
                    <option value="bulto" ${f.tipo==='bulto'?'selected':''}>Bulto</option>
                    <option value="atado" ${f.tipo==='atado'?'selected':''}>Atado</option>
                    <option value="caja" ${f.tipo==='caja'?'selected':''}>Caja</option>
                    <option value="racimo" ${f.tipo==='racimo'?'selected':''}>Racimo</option>
                </select>
            </div>
            <div class="grupo">
                <label>Cantidad</label>
                <input type="number" min="0" value="${f.cantidad}" 
                    oninput="filasRecogida[${i}].cantidad=parseFloat(this.value)||0; calcularTotalKilos()">
            </div>
            <div class="grupo">
                <label>⚖️ Kilos</label>
                <input type="number" step="0.01" min="0" value="${f.kilos}" 
                    oninput="filasRecogida[${i}].kilos=parseFloat(this.value)||0; calcularTotalKilos()">
            </div>
            <div class="grupo">
                <label>Recoge a</label>
                <select onchange="filasRecogida[${i}].recogeA=this.value">
                    <option value="">-- Seleccione --</option>
                    ${colaboradores.map(c => `<option value="${c.nombre}" ${f.recogeA===c.nombre?'selected':''}>${c.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="grupo col-span-2">
                <label>📝 Observaciones de la Recogida</label>
                <input type="text" value="${f.observaciones || ''}" placeholder="Detalles, remisión, estado..." 
                    oninput="filasRecogida[${i}].observaciones=this.value">
            </div>
            <button class="btn btn-peligro btn-sm" style="align-self:flex-end;" 
                onclick="filasRecogida.splice(${i},1); dibujarFilasRecogida(); calcularTotalKilos()">🗑️ Eliminar</button>
        </div>`).join('');
    
    calcularTotalKilos();
}

// =====================================================
// ===== SUMA DE KILOS CORREGIDA =====
// =====================================================
function calcularTotalKilos() {
    if (!filasRecogida) filasRecogida = [];
    
    const total = filasRecogida.reduce((s, f) => {
        const valor = Number(f.kilos);
        return s + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    const input = document.getElementById('totalKilosMov');
    if (input) input.value = total.toFixed(2);
    
    console.log('🧮 Recogidas:', filasRecogida);
    console.log('✅ Total kilos:', total.toFixed(2));
}

// =====================================================
// ===== GUARDAR =====
// =====================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const placa = document.getElementById('placaMov').value;
    const colaborador = document.getElementById('colaboradorMov').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value || '';
    const canastillasSalida = parseInt(document.getElementById('canastillasSalida').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegada').value) || 0;
    const totalKilos = Number(document.getElementById('totalKilosMov').value) || 0;
    const observaciones = document.getElementById('observacionesMov').value.trim();
    
    if (!fecha || !placa || !colaborador || !horaSalida) {
        return alert('⚠️ Complete los campos obligatorios');
    }
    
    const datos = {
        fecha, placa, colaborador,
        horaSalida, horaLlegada,
        canastillasSalida, canastillasLlegada,
        totalKilos,
        observaciones,
        recogidas: filasRecogida,
        usuario: usuarioActivo?.nombre || 'Anónimo'
    };
    
    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento actualizado');
        } else {
            const ref = await db.collection('movimientos').add(datos);
            if (usuarioActivo?.rol === 'prueba') {
                idsCreadosPorPrueba.push({ coleccion: 'movimientos', id: ref.id });
            }
            alert('✅ Movimiento guardado');
        }
        limpiarFormularioMov();
        cambiarSubpestañaMov('hoy', { currentTarget: null });
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// =====================================================
// ===== LIMPIAR =====
// =====================================================
function limpiarFormularioMov() {
    idEdicion = null;
    filasRecogida = [];
    const hoy = new Date().toISOString().split('T')[0];
    
    document.getElementById('fechaMov').value = hoy;
    document.getElementById('placaMov').value = '';
    document.getElementById('colaboradorMov').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaLlegada').value = '';
    document.getElementById('canastillasSalida').value = '0';
    document.getElementById('canastillasLlegada').value = '0';
    document.getElementById('totalKilosMov').value = '0.00';
    document.getElementById('observacionesMov').value = '';
    
    const area = document.getElementById('areaRecogidas');
    if (area) area.innerHTML = '';
    
    document.getElementById('tituloFormMov').textContent = '📝 Crear Movimiento';
}

// =====================================================
// ===== SELECCIÓN MÚLTIPLE =====
// =====================================================
function seleccionarTodosMovimientos(chk) {
    document.querySelectorAll('.chk-movimiento').forEach(c => {
        if (!c.disabled) c.checked = chk.checked;
    });
}
function seleccionarTodosPendientes(chk) {
    document.querySelectorAll('.chk-pendiente').forEach(c => c.checked = chk.checked);
}

async function completarSeleccionados() {
    const sel = document.querySelectorAll('.chk-movimiento:checked:not([disabled]), .chk-pendiente:checked');
    if (!sel.length) return alert('⚠️ Seleccione al menos un movimiento');
    if (!confirm(`¿Completar ${sel.length} movimiento(s)?`)) return;
    
    const hora = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    let n = 0;
    
    for (const c of sel) {
        const m = movimientos.find(x => x.id === c.dataset.id);
        if (!m) continue;
        
        await db.collection('movimientos').doc(c.dataset.id).update({
            horaLlegada: hora,
            canastillasLlegada: m.canastillasSalida || 0
        });
        n++;
    }
    
    alert(`✅ ${n} movimiento(s) completado(s)`);
}

async function completarMovimientoDirecto(id) {
    if (!confirm('¿Completar este movimiento?')) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    const m = movimientos.find(x => x.id === id);
    
    await db.collection('movimientos').doc(id).update({
        horaLlegada: hora,
        canastillasLlegada: m.canastillasSalida || 0
    });
    
    alert('✅ Movimiento completado');
}