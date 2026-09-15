// =====================================================
// ===== 🚛 MÓDULO TRANSPORTADORA =====
// ===== ⚠️ NO DECLARAR VARIABLES AQUÍ =====
// =====================================================
window.cargarModulo_transportadora = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido'); // ✅ CORREGIDO
    if (!c) return; // ✅ Protección
    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subpestaña activa" onclick="cambiarSubTransp('hoy', event)">📅 Hoy</button>
        <button class="btn-subpestaña" onclick="cambiarSubTransp('crear', event)">➕ Nuevo</button>
        <button class="btn-subpestaña" onclick="cambiarSubTransp('vehiculos', event)">🚛 Vehículos</button>
        <button class="btn-subpestaña" onclick="cambiarSubTransp('conductores', event)">👷 Conductores</button>
    </div>

    <div id="subtransp-hoy"></div>
    <div id="subtransp-crear" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">➕ Nuevo Movimiento Transportadora</h3>
            <div class="grid-2">
                <div class="grupo"><label>Fecha</label><input type="date" id="fechaTransp" value="${hoy}"></div>
                <div class="grupo"><label>Conductor</label><select id="conductorTransp"></select></div>
                <div class="grupo"><label>Placa</label><select id="vehiculoTransp"></select></div>
                <div class="grupo"><label>Hora Salida</label><input type="time" id="horaSalidaTransp"></div>
                <div class="grupo"><label>Canastillas Salida</label><input type="number" id="canastillasSalidaTransp" placeholder="0"></div>
                <div class="grupo"><label>Hora Llegada</label><input type="time" id="horaLlegadaTransp"></div>
                <div class="grupo"><label>Canastillas Llegada</label><input type="number" id="canastillasLlegadaTransp" placeholder="0"></div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn btn-primario" onclick="guardarMovimientoTransp()">💾 Guardar</button>
                <button class="btn btn-peligro" onclick="limpiarFormularioTransp()">🗑️ Limpiar</button>
            </div>
        </div>
    </div>

    <div id="subtransp-vehiculos" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">🚛 Vehículos Transportadora</h3>
            <div class="grid-2 mb-3">
                <div class="grupo"><label>Placa</label><input type="text" id="placaVehiculoTransp" placeholder="ABC-123"></div>
                <div class="grupo"><label>Tipo</label>
                    <select id="tipoVehiculoTransp">
                        <option value="Camión">Camión</option>
                        <option value="Carro">Carro</option>
                        <option value="Carguero" selected>Carguero</option>
                        <option value="Furgón">Furgón</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primario" onclick="agregarVehiculoTransp()">💾 Agregar Vehículo</button>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">Lista de Vehículos</h4>
            <table class="tabla"><thead><tr><th>Placa</th><th>Tipo</th></tr></thead><tbody id="tablaVehiculosTransp"></tbody></table>
        </div>
    </div>

    <div id="subtransp-conductores" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">👷 Conductores Transportadora</h3>
            <div class="grupo mb-3"><label>Nombre</label><input type="text" id="nombreConductorTransp" placeholder="Nombre completo"></div>
            <button class="btn btn-primario" onclick="agregarConductorTransp()">💾 Agregar Conductor</button>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">Lista de Conductores</h4>
            <table class="tabla"><thead><tr><th>Nombre</th><th>Estado</th></tr></thead><tbody id="tablaConductoresTransp"></tbody></table>
        </div>
    </div>
    `;

    llenarSelectoresTransp();
    setTimeout(() => cambiarSubTransp('hoy', null), 50);
};

function cambiarSubTransp(nombre, evento) {
    document.querySelectorAll('#subtransp-hoy, #subtransp-crear, #subtransp-vehiculos, #subtransp-conductores').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenidoDinamico .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('activa');
    document.getElementById(`subtransp-${nombre}`).classList.remove('oculto');

    if (nombre === 'hoy') dibujarMovimientosTranspHoy();
    if (nombre === 'vehiculos') dibujarTablaVehiculosTransp();
    if (nombre === 'conductores') dibujarTablaConductoresTransp();
}

function llenarSelectoresTransp() {
    const selCond = document.getElementById('conductorTransp');
    const selPlaca = document.getElementById('vehiculoTransp');
    if (selCond) selCond.innerHTML = '<option value="">-- Seleccione --</option>' + conductores.filter(c => (c.estado||'activo')==='activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    if (selPlaca) selPlaca.innerHTML = '<option value="">-- Seleccione --</option>' + vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa} - ${v.tipo}</option>`).join('');
}

function dibujarMovimientosTranspHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const caja = document.getElementById('subtransp-hoy');
    const filtro = movimientosTransp.filter(m => m.fecha === hoy);
    let totalSal=0, totalLleg=0;
    filtro.forEach(m=>{ totalSal += m.canastillasSalida||0; totalLleg += m.canastillasLlegada||0; });

    caja.innerHTML = `
    <div class="resumen">
        <div>📅 Fecha: <strong>${hoy}</strong></div>
        <div>📦 Salidas: <strong>${totalSal}</strong></div>
        <div>📦 Llegadas: <strong>${totalLleg}</strong></div>
    </div>
    <table class="tabla mt-3">
        <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th><th>Estado</th></tr></thead>
        <tbody>
            ${filtro.length===0?'<tr><td colspan="8" class="text-center">📭 Sin movimientos hoy</td></tr>':
              filtro.map(m=>`<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.conductor||'—'}</td><td>${m.horaSalida}</td><td>${m.horaLlegada||'—'}</td><td>${m.canastillasSalida||0}</td><td>${m.canastillasLlegada||0}</td><td>${m.horaLlegada?'✅ Completado':'<span style="color:#ca8a04;">⏳ Pendiente</span>'}</td></tr>`).join('')
            }
        </tbody>
    </table>`;
}

async function guardarMovimientoTransp() {
    const fecha = document.getElementById('fechaTransp').value;
    const conductor = document.getElementById('conductorTransp').value;
    const placa = document.getElementById('vehiculoTransp').value;
    const horaSalida = document.getElementById('horaSalidaTransp').value;
    const canastillasSalida = parseInt(document.getElementById('canastillasSalidaTransp').value)||0;
    const horaLlegada = document.getElementById('horaLlegadaTransp').value||null;
    const canastillasLlegada = parseInt(document.getElementById('canastillasLlegadaTransp').value)||0;

    if(!fecha||!conductor||!placa||!horaSalida) return alert('⚠️ Complete Fecha, Conductor, Placa y Hora de Salida');

    await db.collection('movimientos_transportadora').add({
        fecha, conductor, placa, horaSalida, canastillasSalida,
        horaLlegada, canastillasLlegada,
        estado: horaLlegada?'Completado':'Pendiente',
        usuarioRegistro: usuarioActivo?.nombre||'Desconocido',
        fechaCreacion: new Date()
    });
    alert('✅ Movimiento guardado');
    limpiarFormularioTransp();
}

function limpiarFormularioTransp() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaTransp').value = hoy;
    document.getElementById('conductorTransp').value = '';
    document.getElementById('vehiculoTransp').value = '';
    document.getElementById('horaSalidaTransp').value = '';
    document.getElementById('canastillasSalidaTransp').value = '';
    document.getElementById('horaLlegadaTransp').value = '';
    document.getElementById('canastillasLlegadaTransp').value = '';
}

async function agregarVehiculoTransp() {
    const placa = document.getElementById('placaVehiculoTransp').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoTransp').value;
    if(!placa||!tipo) return alert('⚠️ Complete Placa y Tipo');
    await db.collection('vehiculos_transportadora').add({placa, tipo, fechaCreacion: new Date()});
    alert('✅ Vehículo agregado');
    document.getElementById('placaVehiculoTransp').value = '';
}

function dibujarTablaVehiculosTransp() {
    const tb = document.getElementById('tablaVehiculosTransp');
    if(!tb) return;
    tb.innerHTML = vehiculosTransp.map(v=>`<tr><td>${v.placa}</td><td>${v.tipo}</td></tr>`).join('')||'<tr><td colspan="2" class="text-center">📭 Sin vehículos</td></tr>';
}

async function agregarConductorTransp() {
    const nombre = document.getElementById('nombreConductorTransp').value.trim();
    if(!nombre) return alert('⚠️ Escriba el nombre');
    await db.collection('conductores_transportadora').add({nombre, estado:'activo', fechaCreacion: new Date()});
    alert('✅ Conductor agregado');
    document.getElementById('nombreConductorTransp').value = '';
}

function dibujarTablaConductoresTransp() {
    const tb = document.getElementById('tablaConductoresTransp');
    if(!tb) return;
    tb.innerHTML = conductores.map(c=>`<tr><td>${c.nombre}</td><td>${(c.estado||'activo')==='activo'?'✅ Activo':'❌ Inactivo'}</td></tr>`).join('')||'<tr><td colspan="2" class="text-center">📭 Sin conductores</td></tr>';
}