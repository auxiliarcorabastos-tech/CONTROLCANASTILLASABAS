// =====================================================
// ===== ⛽ MÓDULO COMBUSTIBLE =====
// ===== ⚠️ NO DECLARAR VARIABLES AQUÍ =====
// =====================================================
window.cargarModulo_combustible = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido'); // ✅ CORREGIDO
    if (!c) return; // ✅ Protección
    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subpestaña activa" onclick="cambiarSubCombustible('kilometraje', event)">📏 Kilometraje</button>
        <button class="btn-subpestaña" onclick="cambiarSubCombustible('tanqueo', event)">⛽ Tanqueo</button>
    </div>

    <div id="subcomb-kilometraje">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📏 Registro de Kilometraje Diario</h3>
            <div class="grid-2">
                <div class="grupo"><label>Fecha</label><input type="date" id="fechaKm" value="${hoy}"></div>
                <div class="grupo"><label>Placa del Vehículo</label><select id="vehiculoKm"></select></div>
                <div class="grupo"><label>Kilometraje Mañana</label><input type="number" id="kmManana" placeholder="0"></div>
                <div class="grupo"><label>Kilometraje Tarde</label><input type="number" id="kmTarde" placeholder="0"></div>
                <div class="grupo"><label>Colaborador que registra</label><select id="colaboradorKm"></select></div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn btn-primario" onclick="guardarKilometraje()">💾 Guardar</button>
                <button class="btn btn-peligro" onclick="limpiarFormularioKm()">🗑️ Limpiar</button>
            </div>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">📋 Historial de Kilometraje</h4>
            <table class="tabla">
                <thead><tr><th>Fecha</th><th>Placa</th><th>KM Mañana</th><th>KM Tarde</th><th>Recorridos</th><th>Colaborador</th></tr></thead>
                <tbody id="tablaKilometraje"></tbody>
            </table>
        </div>
    </div>

    <div id="subcomb-tanqueo" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⛽ Registro de Tanqueo</h3>
            <div class="grid-2">
                <div class="grupo"><label>Fecha</label><input type="date" id="fechaTanqueo" value="${hoy}"></div>
                <div class="grupo"><label>Placa del Vehículo</label><select id="vehiculoTanqueo"></select></div>
                <div class="grupo"><label>Tipo de Tanqueo</label>
                    <select id="tipoTanqueo">
                        <option value="Completo">✅ Tanque Completo</option>
                        <option value="Parcial">⚠️ Parcial / Porcentaje</option>
                    </select>
                </div>
                <div class="grupo"><label>Porcentaje / Cantidad</label><input type="text" id="cantidadTanqueo" placeholder="Ej: 50% o 20 litros"></div>
                <div class="grupo"><label>Quién tanqueó</label><select id="colaboradorTanqueo"></select></div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn btn-primario" onclick="guardarTanqueo()">💾 Guardar</button>
                <button class="btn btn-peligro" onclick="limpiarFormularioTanqueo()">🗑️ Limpiar</button>
            </div>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">📋 Historial de Tanqueo</h4>
            <table class="tabla">
                <thead><tr><th>Fecha</th><th>Placa</th><th>Tipo</th><th>Cantidad</th><th>Quién tanqueó</th></tr></thead>
                <tbody id="tablaTanqueo"></tbody>
            </table>
        </div>
    </div>
    `;

    llenarSelectoresCombustible();
    dibujarTablaKilometraje();
    dibujarTablaTanqueo();
};

function cambiarSubCombustible(nombre, evento) {
    document.querySelectorAll('#subcomb-kilometraje, #subcomb-tanqueo').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenidoDinamico .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
}

function llenarSelectoresCombustible() {
    const selVehKm = document.getElementById('vehiculoKm');
    const selColKm = document.getElementById('colaboradorKm');
    const selVehTanq = document.getElementById('vehiculoTanqueo');
    const selColTanq = document.getElementById('colaboradorTanqueo');

    const opcionesVeh = '<option value="">-- Seleccione --</option>' + [...vehiculosMov, ...vehiculosTransp].map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');
    const opcionesCol = '<option value="">-- Seleccione --</option>' + colaboradores.filter(c => (c.estado||'activo')==='activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

    if (selVehKm) selVehKm.innerHTML = opcionesVeh;
    if (selColKm) selColKm.innerHTML = opcionesCol;
    if (selVehTanq) selVehTanq.innerHTML = opcionesVeh;
    if (selColTanq) selColTanq.innerHTML = opcionesCol;
}

async function guardarKilometraje() {
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value;
    const kmMañana = parseFloat(document.getElementById('kmManana').value) || null;
    const kmTarde = parseFloat(document.getElementById('kmTarde').value) || null;
    const colaborador = document.getElementById('colaboradorKm').value;

    if (!fecha || !placa || !colaborador) return alert('⚠️ Complete Fecha, Placa y Colaborador');
    if (kmMañana === null && kmTarde === null) return alert('⚠️ Ingrese al menos un valor de kilometraje');

    const kmRecorridos = (kmMañana !== null && kmTarde !== null) ? (kmTarde - kmMañana).toFixed(1) : null;

    await db.collection('kilometraje').add({
        fecha, placa, kmManana: kmMañana, kmTarde: kmTarde, kmRecorridos, colaborador,
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaCreacion: new Date()
    });
    alert('✅ Kilometraje guardado');
    limpiarFormularioKm();
}

function dibujarTablaKilometraje() {
    const tb = document.getElementById('tablaKilometraje');
    if (!tb) return;
    tb.innerHTML = kilometraje.map(k => `
        <tr>
            <td>${k.fecha}</td><td>${k.placa}</td><td>${k.kmManana ?? '—'}</td><td>${k.kmTarde ?? '—'}</td>
            <td>${k.kmRecorridos ?? '—'}</td><td>${k.colaborador}</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">📭 Sin registros</td></tr>';
}

function limpiarFormularioKm() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaKm').value = hoy;
    document.getElementById('vehiculoKm').value = '';
    document.getElementById('kmManana').value = '';
    document.getElementById('kmTarde').value = '';
    document.getElementById('colaboradorKm').value = '';
}

async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('vehiculoTanqueo').value;
    const tipo = document.getElementById('tipoTanqueo').value;
    const cantidad = document.getElementById('cantidadTanqueo').value.trim();
    const colaborador = document.getElementById('colaboradorTanqueo').value;

    if (!fecha || !placa || !cantidad || !colaborador) return alert('⚠️ Complete todos los campos');

    await db.collection('tanqueo').add({
        fecha, placa, tipo, cantidad, colaborador,
        usuarioRegistro: usuarioActivo?.nombre || 'Desconocido',
        fechaCreacion: new Date()
    });
    alert('✅ Tanqueo guardado');
    limpiarFormularioTanqueo();
}

function dibujarTablaTanqueo() {
    const tb = document.getElementById('tablaTanqueo');
    if (!tb) return;
    tb.innerHTML = tanqueo.map(t => `
        <tr>
            <td>${t.fecha}</td><td>${t.placa}</td><td>${t.tipo}</td><td>${t.cantidad}</td><td>${t.colaborador}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">📭 Sin registros</td></tr>';
}

function limpiarFormularioTanqueo() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaTanqueo').value = hoy;
    document.getElementById('vehiculoTanqueo').value = '';
    document.getElementById('tipoTanqueo').value = 'Completo';
    document.getElementById('cantidadTanqueo').value = '';
    document.getElementById('colaboradorTanqueo').value = '';
}