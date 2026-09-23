// =====================================================
// ===== 📦 MÓDULO MOVIMIENTOS — COMPLETO =====
// =====================================================
window.cargarModulo_movimientos = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaMov('crear', event)">📝 Crear Movimiento</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('hoy', event)">📅 Movimientos del Día</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('pendientes', event)">⏳ Pendientes por Llegar</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('colaboradores', event)">👤 Colaboradores</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaMov('vehiculos', event)">🚗 Vehículos</button>
    </div>

    <!-- ===== CREAR / EDITAR MOVIMIENTO ===== -->
    <div id="submov-crear">
        <div class="tarjeta">
            <h3 class="font-bold mb-4">${idEdicion ? '✏️ Editar Movimiento' : '📝 Nuevo Movimiento'}</h3>
            
            <div class="grid-2">
                <div class="grupo">
                    <label>Fecha</label>
                    <input type="date" id="fechaMov" value="${hoy}">
                </div>
                <div class="grupo">
                    <label>Placa / Vehículo</label>
                    <select id="placa">
                        <option value="">-- Cargando vehículos... --</option>
                    </select>
                </div>
                <div class="grupo">
                    <label>Colaborador / Conductor</label>
                    <select id="colaborador">
                        <option value="">-- Cargando... --</option>
                    </select>
                </div>
                <div class="grupo">
                    <label>Hora de Salida</label>
                    <input type="time" id="horaSalida">
                </div>
                <div class="grupo">
                    <label>Canastillas de Salida</label>
                    <input type="number" id="canastillasSalida" min="0" value="0">
                </div>
                <div class="grupo">
                    <label>Hora de Llegada</label>
                    <input type="time" id="horaLlegada">
                </div>
                <div class="grupo">
                    <label>Canastillas de Llegada</label>
                    <input type="number" id="canastillasLlegada" min="0" value="0">
                </div>
                <div class="grupo">
                    <label>Total Kilos Recogidos</label>
                    <input type="number" step="0.01" id="totalKilos" min="0" value="0">
                </div>
                <div class="grupo col-span-2">
                    <label>Observaciones del Movimiento</label>
                    <textarea id="observaciones" rows="2" placeholder="Novedades, ruta, remisiones..."></textarea>
                </div>
            </div>

            <div class="mt-4 mb-2 flex justify-between items-center">
                <h4 class="font-bold">📦 Recogidas</h4>
                <button class="btn btn-sm btn-primario" onclick="agregarFilaRecogida()">+ Agregar Recogida</button>
            </div>
            <div class="overflow-x-auto mb-4">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>¿A quién?</th>
                            <th>Kilos</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpoRecogidas"></tbody>
                </table>
            </div>

            <div class="flex gap-3 mt-4">
                <button class="btn btn-primario" onclick="guardarMovimientoDesdeForm()">💾 ${idEdicion ? 'Actualizar' : 'Guardar'}</button>
                <button class="btn btn-amarillo" onclick="limpiarFormulario()">🔄 Limpiar</button>
                ${idEdicion ? `<button class="btn btn-peligro" onclick="eliminarMovimiento(idEdicion); idEdicion=null;">🗑️ Eliminar</button>` : ''}
            </div>
        </div>
    </div>

    <!-- ===== MOVIMIENTOS DEL DÍA ===== -->
    <div id="submov-hoy" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-4">📅 Movimientos del Día — ${hoy}</h3>
            <div class="mb-4 flex gap-2">
                <input type="text" id="buscarMovHoy" placeholder="🔍 Buscar por placa, colaborador..." 
                    oninput="filtrarMovimientosHoy()" style="max-width: 400px;">
                <button class="btn btn-sm btn-primario" onclick="exportarExcel()">📊 Exportar Excel</button>
            </div>
            <div class="grid-2 mb-4">
                <div class="tarjeta p-3">
                    <strong>🚚 Salidas:</strong> <span id="resumenSalidas">0</span> movimientos
                </div>
                <div class="tarjeta p-3">
                    <strong>✅ Completados:</strong> <span id="resumenCompletados">0</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Placa</th>
                            <th>Colaborador</th>
                            <th>Hora Salida</th>
                            <th>Hora Llegada</th>
                            <th>Canastillas Salida</th>
                            <th>Canastillas Llegada</th>
                            <th>Kilos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaMovHoyCuerpo"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ===== PENDIENTES POR LLEGAR ===== -->
    <div id="submov-pendientes" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-4">⏳ Pendientes por Llegar</h3>
            <div class="mb-4 flex gap-2">
                <button class="btn btn-sm btn-exito" onclick="completarSeleccionados()">✅ Completar Seleccionados</button>
                <button class="btn btn-sm btn-primario" onclick="marcarTodosPendientes()">☑️ Seleccionar Todos</button>
            </div>
            <div class="overflow-x-auto">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="chkTodosPend" onchange="alternarTodosPendientes(this)"></th>
                            <th>Fecha</th>
                            <th>Placa</th>
                            <th>Colaborador</th>
                            <th>Hora Salida</th>
                            <th>Canastillas Salida</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaPendientesCuerpo"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ===== GESTIÓN DE COLABORADORES ===== -->
    <div id="submov-colaboradores" class="oculto"></div>

    <!-- ===== GESTIÓN DE VEHÍCULOS ===== -->
    <div id="submov-vehiculos" class="oculto"></div>
    `;

    // Cargar selectores después de renderizar
    setTimeout(() => {
        if (window.actualizarSelectoresMov) actualizarSelectoresMov();
        dibujarTablaRecogidas();
    }, 50);
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaMov(nombre, evt) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evt) evt.target.classList.add('activa');

    document.querySelectorAll('[id^="submov-"]').forEach(p => p.classList.add('oculto'));
    const seccion = document.getElementById(`submov-${nombre}`);
    if (seccion) seccion.classList.remove('oculto');

    if (nombre === 'hoy') dibujarMovimientosHoy();
    if (nombre === 'pendientes') dibujarMovimientosPendientes();
    if (nombre === 'colaboradores') dibujarSubpestañaColaboradores();
    if (nombre === 'vehiculos') dibujarSubpestañaVehiculos();
}

// =====================================================
// ===== GUARDAR DESDE FORMULARIO =====
// =====================================================
async function guardarMovimientoDesdeForm() {
    const datos = {
        fecha: document.getElementById('fechaMov').value,
        placa: document.getElementById('placa').value,
        colaborador: document.getElementById('colaborador').value,
        horaSalida: document.getElementById('horaSalida').value,
        canastillasSalida: parseInt(document.getElementById('canastillasSalida').value) || 0,
        horaLlegada: document.getElementById('horaLlegada').value || null,
        canastillasLlegada: parseInt(document.getElementById('canastillasLlegada').value) || 0,
        totalKilos: parseFloat(document.getElementById('totalKilos').value) || 0,
        observaciones: document.getElementById('observaciones').value.trim() || '',
        recogidas: filasRecogida,
        completado: !!document.getElementById('horaLlegada').value
    };

    if (!datos.fecha || !datos.placa || !datos.colaborador || !datos.horaSalida) {
        return alert('⚠️ Complete fecha, placa, colaborador y hora de salida');
    }

    await guardarMovimiento(datos);
    limpiarFormulario();
}

function limpiarFormulario() {
    idEdicion = null;
    filasRecogida = [];
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('fechaMov')) document.getElementById('fechaMov').value = hoy;
    if (document.getElementById('placa')) document.getElementById('placa').value = '';
    if (document.getElementById('colaborador')) document.getElementById('colaborador').value = '';
    if (document.getElementById('horaSalida')) document.getElementById('horaSalida').value = '';
    if (document.getElementById('canastillasSalida')) document.getElementById('canastillasSalida').value = '0';
    if (document.getElementById('horaLlegada')) document.getElementById('horaLlegada').value = '';
    if (document.getElementById('canastillasLlegada')) document.getElementById('canastillasLlegada').value = '0';
    if (document.getElementById('totalKilos')) document.getElementById('totalKilos').value = '0';
    if (document.getElementById('observaciones')) document.getElementById('observaciones').value = '';
    dibujarTablaRecogidas();
}

// =====================================================
// ===== GESTIÓN DE FILAS DE RECOGIDA =====
// =====================================================
function agregarFilaRecogida() {
    filasRecogida.push({ tipo: 'canastilla', cantidad: 0, paraQuien: '', kilos: 0 });
    dibujarTablaRecogidas();
}

function dibujarTablaRecogidas() {
    const tb = document.getElementById('cuerpoRecogidas');
    if (!tb) return;
    tb.innerHTML = filasRecogida.map((f, i) => `
    <tr>
        <td>
            <select onchange="filasRecogida[${i}].tipo=this.value; recalcularTotalKilos()">
                <option value="canastilla" ${f.tipo==='canastilla'?'selected':''}>Canastilla</option>
                <option value="bulto" ${f.tipo==='bulto'?'selected':''}>Bulto</option>
                <option value="atado" ${f.tipo==='atado'?'selected':''}>Atado</option>
                <option value="caja" ${f.tipo==='caja'?'selected':''}>Caja</option>
                <option value="racimo" ${f.tipo==='racimo'?'selected':''}>Racimo</option>
            </select>
        </td>
        <td><input type="number" min="0" value="${f.cantidad}" onchange="filasRecogida[${i}].cantidad=parseInt(this.value)||0" style="width:80px;"></td>
        <td><input type="text" value="${f.paraQuien}" placeholder="Nombre" onchange="filasRecogida[${i}].paraQuien=this.value"></td>
        <td><input type="number" step="0.01" min="0" value="${f.kilos}" onchange="filasRecogida[${i}].kilos=parseFloat(this.value)||0; recalcularTotalKilos()" style="width:90px;"></td>
        <td><button class="btn btn-sm btn-peligro" onclick="filasRecogida.splice(${i},1); dibujarTablaRecogidas(); recalcularTotalKilos()">✕</button></td>
    </tr>`).join('');
    recalcularTotalKilos();
}

function recalcularTotalKilos() {
    const total = filasRecogida.reduce((s, f) => s + (f.kilos || 0), 0);
    const campo = document.getElementById('totalKilos');
    if (campo) campo.value = total.toFixed(2);
}

// =====================================================
// ===== DIBUJAR MOVIMIENTOS DEL DÍA =====
// =====================================================
function dibujarMovimientosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaMovHoyCuerpo');
    if (!tb) return console.log('⚠️ No se encontró tablaMovHoyCuerpo');

    const filtro = movimientos.filter(m => m.fecha === hoy);
    const buscar = (document.getElementById('buscarMovHoy')?.value || '').toLowerCase();
    const filtrado = buscar ? filtro.filter(m => 
        (m.placa||'').toLowerCase().includes(buscar) ||
        (m.colaborador||'').toLowerCase().includes(buscar)
    ) : filtro;

    // Ordenar: más reciente primero por hora de salida
    filtrado.sort((a, b) => (b.horaSalida || '').localeCompare(a.horaSalida || ''));

    const completados = filtrado.filter(m => m.horaLlegada).length;
    document.getElementById('resumenSalidas').textContent = filtrado.length;
    document.getElementById('resumenCompletados').textContent = completados;

    tb.innerHTML = filtrado.map(m => `
    <tr>
        <td>${m.fecha}</td>
        <td><strong>${m.placa}</strong></td>
        <td>${m.colaborador}</td>
        <td>${m.horaSalida}</td>
        <td>${m.horaLlegada || '—'}</td>
        <td>${m.canastillasSalida || 0}</td>
        <td>${m.canastillasLlegada || 0}</td>
        <td>${(m.totalKilos || 0).toFixed(2)}</td>
        <td>
            <button class="btn btn-sm btn-amarillo" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button>
        </td>
    </tr>`).join('');
}

function filtrarMovimientosHoy() {
    dibujarMovimientosHoy();
}

function irAEditarMovimiento(id) {
    idEdicion = id;
    cambiarSubpestañaMov('crear');
    setTimeout(() => {
        if (window.editarMovimiento) editarMovimiento(id);
    }, 100);
}

// =====================================================
// ===== DIBUJAR PENDIENTES POR LLEGAR =====
// =====================================================
let seleccionadosPendientes = [];

function dibujarMovimientosPendientes() {
    const hoy = new Date().toISOString().split('T')[0];
    const tb = document.getElementById('tablaPendientesCuerpo');
    if (!tb) return console.log('⚠️ No se encontró tablaPendientesCuerpo');

    const pendientes = movimientos.filter(m => m.fecha === hoy && !m.horaLlegada);
    pendientes.sort((a, b) => (b.horaSalida || '').localeCompare(a.horaSalida || ''));
    seleccionadosPendientes = [];

    tb.innerHTML = pendientes.map(m => `
    <tr>
        <td><input type="checkbox" class="chk-pendiente" data-id="${m.id}" onchange="toggleSeleccionPendiente('${m.id}', this.checked)"></td>
        <td>${m.fecha}</td>
        <td><strong>${m.placa}</strong></td>
        <td>${m.colaborador}</td>
        <td>${m.horaSalida}</td>
        <td>${m.canastillasSalida || 0}</td>
        <td>
            <button class="btn btn-sm btn-exito" onclick="completarMovimientoDirecto('${m.id}')">✅ Llegó</button>
            <button class="btn btn-sm btn-amarillo" onclick="irAEditarMovimiento('${m.id}')">✏️ Editar</button>
        </td>
    </tr>`).join('');
}

function toggleSeleccionPendiente(id, checked) {
    if (checked) {
        if (!seleccionadosPendientes.includes(id)) seleccionadosPendientes.push(id);
    } else {
        seleccionadosPendientes = seleccionadosPendientes.filter(i => i !== id);
    }
}

function marcarTodosPendientes() {
    const todos = document.querySelectorAll('.chk-pendiente');
    const todosSeleccionados = seleccionadosPendientes.length === todos.length;
    todos.forEach(chk => chk.checked = !todosSeleccionados);
    seleccionadosPendientes = !todosSeleccionados ? movimientos.filter(m => !m.horaLlegada).map(m => m.id) : [];
}

function alternarTodosPendientes(chk) {
    document.querySelectorAll('.chk-pendiente').forEach(c => c.checked = chk.checked);
    seleccionadosPendientes = chk.checked ? movimientos.filter(m => !m.horaLlegada).map(m => m.id) : [];
}

async function completarSeleccionados() {
    if (!seleccionadosPendientes.length) return alert('⚠️ Seleccione al menos uno');
    if (!confirm(`¿Completar ${seleccionadosPendientes.length} movimientos?`)) return;

    const ahora = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    for (const id of seleccionadosPendientes) {
        await db.collection('movimientos').doc(id).update({ horaLlegada: ahora });
    }
    alert(`✅ ${seleccionadosPendientes.length} movimientos completados`);
    seleccionadosPendientes = [];
}

// =====================================================
// ===== GESTIÓN DE COLABORADORES =====
// =====================================================
function dibujarSubpestañaColaboradores() {
    const cont = document.getElementById('submov-colaboradores');
    if (!cont) return;

    cont.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-4">👤 Registrar Colaborador / Conductor</h3>
        <div class="grid-2">
            <div class="grupo">
                <label>Nombre Completo *</label>
                <input type="text" id="col_nombre" placeholder="Nombre y apellidos">
            </div>
            <div class="grupo">
                <label>Teléfono</label>
                <input type="tel" id="col_telefono" placeholder="3XX XXX XXXX">
            </div>
            <div class="grupo">
                <label>Tipo</label>
                <select id="col_tipo">
                    <option value="colaborador">Colaborador</option>
                    <option value="conductor">Conductor</option>
                </select>
            </div>
            <div class="grupo">
                <label>Estado</label>
                <select id="col_activo">
                    <option value="true" selected>Activo</option>
                    <option value="false">Inactivo</option>
                </select>
            </div>
        </div>
        <div class="flex gap-3 mt-4">
            <button class="btn btn-primario" onclick="guardarColaborador()">💾 Guardar</button>
            <button class="btn btn-amarillo" onclick="limpiarFormColaborador()">🔄 Limpiar</button>
        </div>
    </div>

    <div class="tarjeta mt-6">
        <h3 class="font-bold mb-3">📋 Lista de Colaboradores</h3>
        <table class="tabla">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaColaboradoresCuerpo"></tbody>
        </table>
    </div>
    `;
    dibujarTablaColaboradores();
}

async function guardarColaborador() {
    const nombre = document.getElementById('col_nombre').value.trim();
    const telefono = document.getElementById('col_telefono').value.trim();
    const tipo = document.getElementById('col_tipo').value;
    const activo = document.getElementById('col_activo').value === 'true';

    if (!nombre) return alert('⚠️ Escriba el nombre');
    if (!db) return alert('❌ Sin conexión');

    try {
        const coleccion = tipo === 'conductor' ? 'conductores' : 'colaboradores';
        await db.collection(coleccion).add({ nombre, telefono, activo });
        alert('✅ Guardado correctamente');
        limpiarFormColaborador();
        dibujarTablaColaboradores();
        if (window.actualizarSelectoresMov) actualizarSelectoresMov();
    } catch (err) {
        console.error(err);
        alert('❌ Error al guardar');
    }
}

function limpiarFormColaborador() {
    document.getElementById('col_nombre').value = '';
    document.getElementById('col_telefono').value = '';
    document.getElementById('col_tipo').value = 'colaborador';
    document.getElementById('col_activo').value = 'true';
}

function dibujarTablaColaboradores() {
    const tb = document.getElementById('tablaColaboradoresCuerpo');
    if (!tb) return;

    const todos = [
        ...colaboradores.map(c => ({ ...c, tipo: 'colaborador' })),
        ...conductores.map(c => ({ ...c, tipo: 'conductor' }))
    ].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    tb.innerHTML = todos.map(c => `
    <tr>
        <td>${c.nombre || c.nombreCompleto || ''}</td>
        <td>${c.tipo === 'conductor' ? '🚛 Conductor' : '👤 Colaborador'}</td>
        <td>${c.telefono || '—'}</td>
        <td>${c.activo !== false ? '✅ Activo' : '❌ Inactivo'}</td>
        <td>
            <button class="btn btn-sm ${c.activo ? 'btn-amarillo' : 'btn-exito'}" 
                onclick="cambiarEstadoColaborador('${c.id}', '${c.tipo}', ${!c.activo})">
                ${c.activo ? 'Desactivar' : 'Activar'}
            </button>
        </td>
    </tr>`).join('');
}

async function cambiarEstadoColaborador(id, tipo, nuevoEstado) {
    if (!db) return;
    try {
        const coleccion = tipo === 'conductor' ? 'conductores' : 'colaboradores';
        await db.collection(coleccion).doc(id).update({ activo: nuevoEstado });
        alert(`✅ ${nuevoEstado ? 'Activado' : 'Desactivado'}`);
    } catch (err) {
        console.error(err);
    }
}

// =====================================================
// ===== GESTIÓN DE VEHÍCULOS =====
// =====================================================
function dibujarSubpestañaVehiculos() {
    const cont = document.getElementById('submov-vehiculos');
    if (!cont) return;

    cont.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-4">🚗 Registrar Vehículo</h3>
        <div class="grid-2">
            <div class="grupo">
                <label>Placa *</label>
                <input type="text" id="veh_placa" placeholder="Ej: ABC123" style="text-transform:uppercase;">
            </div>
            <div class="grupo">
                <label>Marca / Modelo</label>
                <input type="text" id="veh_modelo" placeholder="Ej: HINO Dutro">
            </div>
            <div class="grupo">
                <label>SOAT Vence</label>
                <input type="date" id="veh_soat">
            </div>
            <div class="grupo">
                <label>Tecnicomecánica Vence</label>
                <input type="date" id="veh_mecanica">
            </div>
            <div class="grupo col-span-2">
                <label>Observaciones</label>
                <textarea id="veh_obs" rows="2" placeholder="Estado, detalles..."></textarea>
            </div>
        </div>
        <div class="flex gap-3 mt-4">
            <button class="btn btn-primario" onclick="guardarVehiculo()">💾 Guardar</button>
            <button class="btn btn-amarillo" onclick="limpiarFormVehiculo()">🔄 Limpiar</button>
        </div>
    </div>

    <div class="tarjeta mt-6">
        <h3 class="font-bold mb-3">📋 Vehículos Registrados</h3>
        <table class="tabla">
            <thead>
                <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>SOAT</th>
                    <th>Tecnicomecánica</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaVehiculosCuerpo"></tbody>
        </table>
    </div>
    `;
    dibujarTablaVehiculos();
}

async function guardarVehiculo() {
    const placa = document.getElementById('veh_placa').value.trim().toUpperCase();
    const modelo = document.getElementById('veh_modelo').value.trim();
    const soat = document.getElementById('veh_soat').value;
    const mecanica = document.getElementById('veh_mecanica').value;
    const obs = document.getElementById('veh_obs').value.trim();

    if (!placa) return alert('⚠️ Escriba la placa');
    if (!db) return alert('❌ Sin conexión');

    try {
        const existe = vehiculosMov.find(v => v.placa === placa);
        if (existe) return alert('⚠️ Esta placa ya está registrada');

        await db.collection('vehiculos').add({ placa, modelo, soatVence: soat, mecanicaVence: mecanica, observaciones: obs });
        alert('✅ Vehículo guardado');
        limpiarFormVehiculo();
        if (window.actualizarSelectoresVehiculos) actualizarSelectoresVehiculos();
    } catch (err) {
        console.error(err);
        alert('❌ Error al guardar');
    }
}

function limpiarFormVehiculo() {
    document.getElementById('veh_placa').value = '';
    document.getElementById('veh_modelo').value = '';
    document.getElementById('veh_soat').value = '';
    document.getElementById('veh_mecanica').value = '';
    document.getElementById('veh_obs').value = '';
}

function dibujarTablaVehiculos() {
    const tb = document.getElementById('tablaVehiculosCuerpo');
    if (!tb) return;

    tb.innerHTML = vehiculosMov.map(v => `
    <tr>
        <td><strong>${v.placa}</strong></td>
        <td>${v.modelo || '—'}</td>
        <td>${v.soatVence || '—'}</td>
        <td>${v.mecanicaVence || '—'}</td>
        <td>
            <button class="btn btn-sm btn-peligro" onclick="eliminarVehiculo('${v.id}')">🗑️ Eliminar</button>
        </td>
    </tr>`).join('');
}

async function eliminarVehiculo(id) {
    if (!confirm('¿Eliminar este vehículo?')) return;
    if (!db) return;
    try {
        await db.collection('vehiculos').doc(id).delete();
        alert('✅ Eliminado');
    } catch (err) {
        console.error(err);
        alert('❌ Error al eliminar');
    }
}

console.log('✅ movimientos.js cargado completo');
