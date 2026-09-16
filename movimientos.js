// =====================================================
// ===== 📦 MÓDULO MOVIMIENTOS — VERSIÓN ACTUALIZADA =====
// =====================================================
window.cargarModulo_movimientos = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaMov('crear', event)">📝 Crear / Editar</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('hoy', event)">📅 Movimientos del Día</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('pendientes', event)">⏳ Pendientes por Llegar</button>
    </div>

    <!-- CREAR / EDITAR MOVIMIENTO -->
    <div id="submov-crear">
        <div class="tarjeta">
            <h3 id="tituloFormMov" class="font-bold mb-3">📝 Crear Movimiento</h3>
            <form id="form-movimiento">
                <input type="hidden" id="idEdicionMov">
                <div class="grid-2 mb-3">
                    <div class="grupo">
                        <label>Fecha</label>
                        <input type="date" id="fechaMov" value="${hoy}">
                    </div>
                    <div class="grupo">
                        <label>Placa del Vehículo</label>
                        <select id="placaMov" required>
                            <option value="">-- Seleccione --</option>
                            ${vehiculosMov.map(v=>`<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Conductor / Colaborador</label>
                        <select id="colaboradorMov" required onchange="dibujarFilasRecogida()">
                            <option value="">-- Seleccione --</option>
                            ${colaboradores.map(c=>`<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Hora de Salida</label>
                        <input type="time" id="horaSalida" required>
                    </div>
                    <div class="grupo">
                        <label>Hora de Llegada</label>
                        <input type="time" id="horaLlegada" placeholder="Al completar">
                    </div>
                    <div class="grupo">
                        <label>Canastillas que Salieron</label>
                        <input type="number" id="canastillasSalida" min="0" value="0">
                    </div>
                    <div class="grupo">
                        <label>Canastillas que Llegaron</label>
                        <input type="number" id="canastillasLlegada" min="0" value="0" placeholder="Al completar">
                    </div>
                    <div class="grupo">
                        <label>Total Kilos Recogidos</label>
                        <input type="number" id="totalKilosMov" min="0" step="0.01" value="0" readonly style="background:#f3f4f6;">
                    </div>
                </div>

                <h4 class="font-bold mt-4 mb-2">📋 Registro de Recogidas</h4>
                <button type="button" class="btn btn-primario btn-sm mb-2" onclick="agregarFilaRecogida()">➕ Agregar Recogida</button>
                <div id="areaRecogidas"></div>

                <div class="flex gap-2 mt-4">
                    <button type="button" class="btn btn-exito" onclick="guardarMovimiento()">💾 Guardar Movimiento</button>
                    <button type="button" class="btn btn-amarillo" onclick="limpiarFormularioMov()">🔄 Limpiar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MOVIMIENTOS DEL DÍA -->
    <div id="submov-hoy" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📅 Movimientos del Día</h3>
            <table class="tabla">
                <thead>
                    <tr>
                        <th><input type="checkbox" onchange="seleccionarTodosMovimientos(this)"></th>
                        <th>Fecha</th>
                        <th>Placa</th>
                        <th>Conductor</th>
                        <th>Hora Salida</th>
                        <th>Hora Llegada</th>
                        <th>Canast. Salida</th>
                        <th>Canast. Llegada</th>
                        <th>Kilos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaMovimientosHoyCuerpo"></tbody>
            </table>
            <button class="btn btn-exito mt-3" onclick="completarSeleccionados()">✅ Completar Seleccionados</button>
        </div>
    </div>

    <!-- PENDIENTES POR LLEGAR -->
    <div id="submov-pendientes" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⏳ Pendientes por Llegar</h3>
            <table class="tabla">
                <thead>
                    <tr>
                        <th><input type="checkbox" onchange="seleccionarTodosPendientes(this)"></th>
                        <th>Fecha</th>
                        <th>Placa</th>
                        <th>Conductor</th>
                        <th>Hora Salida</th>
                        <th>Canast. Salida</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaPendientesCuerpo"></tbody>
            </table>
            <button class="btn btn-exito mt-3" onclick="completarPendientesSeleccionados()">✅ Completar Seleccionados</button>
        </div>
    </div>
    `;

    dibujarMovimientosHoy();
    dibujarPendientes();
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaMov(nombre, evento) {
    document.querySelectorAll('#submov-crear, #submov-hoy, #submov-pendientes').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenido .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('activa');
    document.getElementById(`submov-${nombre}`).classList.remove('oculto');

    if (nombre === 'hoy') dibujarMovimientosHoy();
    if (nombre === 'pendientes') dibujarPendientes();
}

// =====================================================
// ===== DIBUJAR MOVIMIENTOS DEL DÍA =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaMovimientosHoyCuerpo');
    if (!tb) return;

    const filtro = movimientos.filter(m => m.fecha === hoy);
    tb.innerHTML = filtro.map(m => `
        <tr>
            <td><input type="checkbox" class="chk-movimiento" data-id="${m.id}" ${m.horaLlegada ? 'checked disabled' : ''}></td>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador}</td>
            <td>${m.horaSalida}</td>
            <td>${m.horaLlegada || '— Pendiente —'}</td>
            <td>${m.canastillasSalida || 0}</td>
            <td>${m.canastillasLlegada || 0}</td>
            <td>${m.totalKilos || 0}</td>
            <td>
                <button class="btn btn-amarillo btn-sm" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button>
                ${!m.horaLlegada ? `<button class="btn btn-exito btn-sm" onclick="completarMovimientoDirecto('${m.id}')">✅ Completar</button>` : '<span class="text-green-600">✅ Listo</span>'}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="10" class="text-center">📭 Sin movimientos hoy</td></tr>';
}

// =====================================================
// ===== DIBUJAR PENDIENTES POR LLEGAR =====
// =====================================================
function dibujarPendientes() {
    const tb = document.getElementById('tablaPendientesCuerpo');
    if (!tb) return;

    const pendientes = movimientos.filter(m => !m.horaLlegada || m.horaLlegada === '');
    tb.innerHTML = pendientes.map(m => `
        <tr>
            <td><input type="checkbox" class="chk-pendiente" data-id="${m.id}"></td>
            <td>${m.fecha}</td>
            <td>${m.placa}</td>
            <td>${m.colaborador}</td>
            <td>${m.horaSalida}</td>
            <td>${m.canastillasSalida || 0}</td>
            <td>
                <button class="btn btn-amarillo btn-sm" onclick="irAEditarMovimiento('${m.id}')">✏️ Poner Llegada</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">✅ Sin movimientos pendientes — Todos completados ✅</td></tr>';
}

// =====================================================
// ===== SELECCIONAR TODOS =====
// =====================================================
function seleccionarTodosMovimientos(checkbox) {
    document.querySelectorAll('.chk-movimiento').forEach(chk => {
        if (!chk.disabled) chk.checked = checkbox.checked;
    });
}
function seleccionarTodosPendientes(checkbox) {
    document.querySelectorAll('.chk-pendiente').forEach(chk => chk.checked = checkbox.checked);
}

// =====================================================
// ===== COMPLETAR SELECCIONADOS =====
// =====================================================
async function completarSeleccionados() {
    const seleccionados = document.querySelectorAll('.chk-movimiento:checked:not([disabled])');
    if (seleccionados.length === 0) return alert('⚠️ Seleccione al menos un movimiento');

    if (!confirm(`¿Completar ${seleccionados.length} movimiento(s)?\nSe pondrá la hora actual y canastillas iguales a salida.`)) return;

    let contador = 0;
    const horaActual = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });

    for (const chk of seleccionados) {
        const id = chk.dataset.id;
        const mov = movimientos.find(m => m.id === id);
        if (!mov) continue;

        await db.collection('movimientos').doc(id).update({
            horaLlegada: horaActual,
            canastillasLlegada: mov.canastillasSalida || 0
        });
        contador++;
    }
    alert(`✅ ${contador} movimiento(s) completado(s)`);
}

async function completarPendientesSeleccionados() {
    const seleccionados = document.querySelectorAll('.chk-pendiente:checked');
    if (seleccionados.length === 0) return alert('⚠️ Seleccione al menos un movimiento');

    if (!confirm(`¿Completar ${seleccionados.length} movimiento(s)?`)) return;

    let contador = 0;
    const horaActual = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });

    for (const chk of seleccionados) {
        const id = chk.dataset.id;
        const mov = movimientos.find(m => m.id === id);
        if (!mov) continue;

        await db.collection('movimientos').doc(id).update({
            horaLlegada: horaActual,
            canastillasLlegada: mov.canastillasSalida || 0
        });
        contador++;
    }
    alert(`✅ ${contador} movimiento(s) completado(s)`);
}

async function completarMovimientoDirecto(id) {
    if (!confirm('¿Completar este movimiento?')) return;
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;

    const horaActual = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    await db.collection('movimientos').doc(id).update({
        horaLlegada: horaActual,
        canastillasLlegada: mov.canastillasSalida || 0
    });
    alert('✅ Movimiento completado');
}

// =====================================================
// ===== EDITAR MOVIMIENTO =====
// =====================================================
function irAEditarMovimiento(id) {
    cambiarSubpestañaMov('crear');
    setTimeout(() => editarMovimiento(id), 50);
}

function editarMovimiento(id) {
    const m = movimientos.find(x => x.id === id);
    if (!m) return;
    idEdicion = id;

    document.getElementById('fechaMov').value = m.fecha;
    document.getElementById('placaMov').value = m.placa;
    document.getElementById('colaboradorMov').value = m.colaborador;
    document.getElementById('horaSalida').value = m.horaSalida;
    document.getElementById('horaLlegada').value = m.horaLlegada || '';
    document.getElementById('canastillasSalida').value = m.canastillasSalida || 0;
    document.getElementById('canastillasLlegada').value = m.canastillasLlegada || 0;
    document.getElementById('totalKilosMov').value = m.totalKilos || 0;

    filasRecogida = (m.recogidas || []).map(r => ({
        tipo: r.tipo || 'canastilla',
        cantidad: r.cantidad || 0,
        kilos: r.kilos || 0,
        aQuien: r.aQuien || ''
    }));
    dibujarFilasRecogida();

    document.getElementById('tituloFormMov').textContent = '✏️ Editar Movimiento';
}

// =====================================================
// ===== GUARDAR MOVIMIENTO =====
// =====================================================
async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMov').value;
    const placa = document.getElementById('placaMov').value.trim().toUpperCase();
    const colaborador = document.getElementById('colaboradorMov').value.trim();
    const horaSalida = document.getElementById('horaSalida').value;
    const horaLlegada = document.getElementById('horaLlegada').value || '';
    const canastillasSalida = parseInt(document.getElementById('canastillasSalida').value) || 0;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegada').value) || 0;

    if (!fecha || !placa || !colaborador || !horaSalida) {
        return alert('⚠️ Complete Fecha, Placa, Conductor y Hora de Salida');
    }

    const datos = {
        fecha, placa, colaborador,
        horaSalida, horaLlegada,
        canastillasSalida, canastillasLlegada,
        totalKilos: calcularTotalKilos(),
        recogidas: filasRecogida.map(r => ({
            tipo: r.tipo,
            cantidad: r.cantidad,
            kilos: r.kilos,
            aQuien: r.aQuien,
            quienRecoge: colaborador // ← Se guarda automáticamente sin mostrarse
        }))
    };

    try {
        if (idEdicion) {
            await db.collection('movimientos').doc(idEdicion).update(datos);
            alert('✅ Movimiento ACTUALIZADO — Se completó y salió de Pendientes ✅');
        } else {
            if (usuarioActivo?.rol === 'prueba') {
                datos.esPrueba = true;
                datos.usuarioPrueba = usuarioActivo.usuario;
                const ref = await db.collection('movimientos').add(datos);
                if (typeof idsCreadosPorPrueba !== 'undefined') {
                    idsCreadosPorPrueba.push({ coleccion: 'movimientos', id: ref.id });
                }
            } else {
                await db.collection('movimientos').add(datos);
            }
            alert('✅ Movimiento GUARDADO');
        }

        limpiarFormularioMov();

    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function limpiarFormularioMov() {
    idEdicion = null;
    filasRecogida = [];
    document.getElementById('form-movimiento').reset();
    document.getElementById('fechaMov').value = new Date().toISOString().split('T')[0];
    document.getElementById('tituloFormMov').textContent = '📝 Crear Movimiento';
    document.getElementById('areaRecogidas').innerHTML = '';
}

// =====================================================
// ===== FILAS DE RECOGIDA — SOLO COLABORADORES =====
// =====================================================
function agregarFilaRecogida() {
    filasRecogida.push({
        tipo: 'canastilla',
        cantidad: 0,
        kilos: 0,
        aQuien: ''
    });
    dibujarFilasRecogida();
}

function dibujarFilasRecogida() {
    const area = document.getElementById('areaRecogidas');
    if (!area) return;

    area.innerHTML = filasRecogida.map((f, i) => `
        <div class="grid-2 tarjeta p-2 mb-2">
            <div>
                <label>Tipo</label>
                <select onchange="filasRecogida[${i}].tipo=this.value; calcularTotalKilos()">
                    <option value="canastilla" ${f.tipo==='canastilla'?'selected':''}>Canastilla</option>
                    <option value="bulto" ${f.tipo==='bulto'?'selected':''}>Bulto</option>
                    <option value="atado" ${f.tipo==='atado'?'selected':''}>Atado</option>
                    <option value="caja" ${f.tipo==='caja'?'selected':''}>Caja</option>
                    <option value="racimo" ${f.tipo==='racimo'?'selected':''}>Racimo</option>
                </select>
            </div>
            <div>
                <label>Cantidad</label>
                <input type="number" min="0" value="${f.cantidad}" onchange="filasRecogida[${i}].cantidad=parseInt(this.value)||0; calcularTotalKilos()">
            </div>
            <div>
                <label>Kilos</label>
                <input type="number" step="0.01" min="0" value="${f.kilos}" onchange="filasRecogida[${i}].kilos=parseFloat(this.value)||0; calcularTotalKilos()">
            </div>
            <div class="col-span-2">
                <label>Recoge a:</label>
                <select onchange="filasRecogida[${i}].aQuien=this.value">
                    <option value="">-- Seleccione colaborador --</option>
                    ${colaboradores.map(c => `<option value="${c.nombre}" ${f.aQuien===c.nombre?'selected':''}>${c.nombre}</option>`).join('')}
                    <!-- ✅ Solo colaboradores, sin conductores de transportadora -->
                </select>
            </div>
            <button type="button" class="btn btn-peligro btn-sm" onclick="filasRecogida.splice(${i},1); dibujarFilasRecogida(); calcularTotalKilos()">🗑️ Quitar</button>
        </div>
    `).join('');
}

function calcularTotalKilos() {
    const total = filasRecogida.reduce((sum, f) => sum + (parseFloat(f.kilos) || 0), 0);
    const input = document.getElementById('totalKilosMov');
    if (input) input.value = total.toFixed(2);
    return total;
}