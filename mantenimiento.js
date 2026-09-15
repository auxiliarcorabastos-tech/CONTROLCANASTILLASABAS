// =====================================================
// ===== 🔧 MÓDULO MANTENIMIENTO =====
// ===== ⚠️ NO DECLARAR VARIABLES AQUÍ =====
// =====================================================
window.cargarModulo_mantenimiento = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido'); // ✅ CORREGIDO
    if (!c) return; // ✅ Protección
    c.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-3">🔧 Control de Mantenimiento Vehículos</h3>
        <p class="mb-3">Seleccione una placa para ver o registrar información:</p>
        <div class="grid-2 mb-4">
            <div class="grupo">
                <label>Placa del Vehículo</label>
                <select id="placaMantenimiento" onchange="cargarDatosVehiculo(this.value)">
                    <option value="">-- Seleccione una placa --</option>
                </select>
            </div>
            <div class="grupo">
                <label>Estado del Vehículo</label>
                <input type="text" id="estadoVehiculo" readonly placeholder="Disponible">
            </div>
        </div>
    </div>

    <div id="datosVehiculo" class="oculto">
        <div class="flex gap-2 mb-4">
            <button class="btn-subpestaña activa" onclick="cambiarSubMant('general', event)">📋 Info General</button>
            <button class="btn-subpestaña" onclick="cambiarSubMant('taller', event)">🏭 Taller</button>
            <button class="btn-subpestaña" onclick="cambiarSubMant('historial', event)">📜 Historial</button>
        </div>

        <!-- INFORMACIÓN GENERAL -->
        <div id="submant-general">
            <div class="tarjeta">
                <h4 class="font-bold mb-3">📋 Datos del Vehículo</h4>
                <div class="grid-2">
                    <div class="grupo"><label>Placa</label><input type="text" id="mantPlaca" readonly></div>
                    <div class="grupo"><label>Tipo de Vehículo</label><input type="text" id="mantTipo" placeholder="Ej: Camión"></div>
                    <div class="grupo"><label>Marca / Modelo</label><input type="text" id="mantMarca" placeholder="Ej: Toyota 2020"></div>
                    <div class="grupo"><label>Kilometraje Actual</label><input type="number" id="mantKmActual" placeholder="0"></div>
                    <div class="grupo"><label>Vencimiento SOAT</label><input type="date" id="mantVencSOAT"></div>
                    <div class="grupo"><label>Vencimiento Tecnicomecánica</label><input type="date" id="mantVencTecno"></div>
                    <div class="grupo"><label>Vencimiento Seguro</label><input type="date" id="mantVencSeguro"></div>
                </div>
                <button class="btn btn-primario mt-3" onclick="guardarDatosVehiculo()">💾 Guardar Datos</button>
            </div>
        </div>

        <!-- INGRESO A TALLER -->
        <div id="submant-taller" class="oculto">
            <div class="tarjeta">
                <h4 class="font-bold mb-3">🏭 Ingreso / Salida de Taller</h4>
                <div class="grid-2">
                    <div class="grupo"><label>Fecha Ingreso Taller</label><input type="date" id="fechaIngresoTaller" value="${hoy}"></div>
                    <div class="grupo"><label>Quién lo llevó</label><select id="quienLlevoTaller"></select></div>
                    <div class="grupo"><label>Diagnóstico / Trabajo a realizar</label><textarea id="diagnosticoTaller" rows="3" placeholder="Descripción del trabajo..."></textarea></div>
                    <div class="grupo"><label>Costo Estimado ($)</label><input type="number" id="costoTaller" placeholder="0"></div>
                    <div class="grupo"><label>Fecha Entrega Taller</label><input type="date" id="fechaEntregaTaller"></div>
                    <div class="grupo"><label>Quién lo recogió</label><select id="quienRecogioTaller"></select></div>
                    <div class="grupo"><label>Costo Final ($)</label><input type="number" id="costoFinalTaller" placeholder="0"></div>
                    <div class="grupo"><label>Observaciones</label><textarea id="obsTaller" rows="2" placeholder="Notas adicionales..."></textarea></div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button class="btn btn-primario" onclick="registrarIngresoTaller()">📥 Registrar Ingreso</button>
                    <button class="btn btn-exito" onclick="registrarSalidaTaller()">📤 Registrar Salida</button>
                </div>
            </div>
        </div>

        <!-- HISTORIAL -->
        <div id="submant-historial" class="oculto">
            <div class="tarjeta">
                <h4 class="font-bold mb-3">📜 Historial de Mantenimientos</h4>
                <div id="listaHistorialMant"></div>
                <div class="mt-3 font-bold">💰 COSTO TOTAL: $<span id="costoTotalMant">0</span></div>
            </div>
        </div>
    </div>
    `;

    llenarSelectoresMantenimiento();
};

function llenarSelectoresMantenimiento() {
    const selPlaca = document.getElementById('placaMantenimiento');
    const selPersona1 = document.getElementById('quienLlevoTaller');
    const selPersona2 = document.getElementById('quienRecogioTaller');

    const todasPlacas = [...vehiculosMov, ...vehiculosTransp];
    if (selPlaca) selPlaca.innerHTML = '<option value="">-- Seleccione --</option>' + todasPlacas.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');

    const opcionesCol = '<option value="">-- Seleccione --</option>' + colaboradores.filter(c => (c.estado||'activo')==='activo').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    if (selPersona1) selPersona1.innerHTML = opcionesCol;
    if (selPersona2) selPersona2.innerHTML = opcionesCol;
}

function cambiarSubMant(nombre, evento) {
    document.querySelectorAll('#submant-general, #submant-taller, #submant-historial').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenidoDinamico .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('activa');
    document.getElementById(`submant-${nombre}`).classList.remove('oculto');

    if (nombre === 'historial') cargarHistorialMant();
}

let placaActual = null;

async function cargarDatosVehiculo(placa) {
    if (!placa) {
        document.getElementById('datosVehiculo').classList.add('oculto');
        document.getElementById('estadoVehiculo').value = 'Disponible';
        placaActual = null;
        return;
    }
    placaActual = placa;
    document.getElementById('datosVehiculo').classList.remove('oculto');

    const doc = await db.collection('mantenimiento').doc(placa).get();
    if (doc.exists) {
        const d = doc.data();
        document.getElementById('mantPlaca').value = placa;
        document.getElementById('mantTipo').value = d.tipo || '';
        document.getElementById('mantMarca').value = d.marca || '';
        document.getElementById('mantKmActual').value = d.kmActual || '';
        document.getElementById('mantVencSOAT').value = d.vencSOAT || '';
        document.getElementById('mantVencTecno').value = d.vencTecnicomecanica || '';
        document.getElementById('mantVencSeguro').value = d.vencSeguro || '';
        document.getElementById('estadoVehiculo').value = d.enTaller ? '🔧 EN TALLER' : '✅ Disponible';
    } else {
        document.getElementById('mantPlaca').value = placa;
        document.getElementById('mantTipo').value = '';
        document.getElementById('mantMarca').value = '';
        document.getElementById('mantKmActual').value = '';
        document.getElementById('mantVencSOAT').value = '';
        document.getElementById('mantVencTecno').value = '';
        document.getElementById('mantVencSeguro').value = '';
        document.getElementById('estadoVehiculo').value = '✅ Disponible';
    }
}

async function guardarDatosVehiculo() {
    if (!placaActual) return alert('⚠️ Seleccione una placa');
    const datos = {
        tipo: document.getElementById('mantTipo').value,
        marca: document.getElementById('mantMarca').value,
        kmActual: parseFloat(document.getElementById('mantKmActual').value) || 0,
        vencSOAT: document.getElementById('mantVencSOAT').value,
        vencTecnicomecanica: document.getElementById('mantVencTecno').value,
        vencSeguro: document.getElementById('mantVencSeguro').value,
        fechaActualizacion: new Date()
    };
    await db.collection('mantenimiento').doc(placaActual).set(datos, { merge: true });
    alert('✅ Datos guardados');
    cargarDatosVehiculo(placaActual);
}

async function registrarIngresoTaller() {
    if (!placaActual) return alert('⚠️ Seleccione una placa');
    const fechaIngreso = document.getElementById('fechaIngresoTaller').value;
    const quienLlevo = document.getElementById('quienLlevoTaller').value;
    const diagnostico = document.getElementById('diagnosticoTaller').value;
    const costo = parseFloat(document.getElementById('costoTaller').value) || 0;

    if (!fechaIngreso || !quienLlevo || !diagnostico) return alert('⚠️ Complete Fecha, Quién llevó y Diagnóstico');

    const registro = {
        tipo: 'INGRESO_TALLER',
        fechaIngreso, quienLlevo, diagnostico, costoEstimado: costo,
        fechaRegistro: new Date(),
        usuario: usuarioActivo?.nombre || 'Desconocido'
    };

    await db.collection('mantenimiento').doc(placaActual).collection('historial').add(registro);
    await db.collection('mantenimiento').doc(placaActual).set({ enTaller: true, fechaIngresoTaller: fechaIngreso }, { merge: true });
    alert('✅ Ingreso a taller registrado\n🚫 Vehículo marcado EN TALLER');
    cargarDatosVehiculo(placaActual);
}

async function registrarSalidaTaller() {
    if (!placaActual) return alert('⚠️ Seleccione una placa');
    const fechaEntrega = document.getElementById('fechaEntregaTaller').value;
    const quienRecogio = document.getElementById('quienRecogioTaller').value;
    const costoFinal = parseFloat(document.getElementById('costoFinalTaller').value) || 0;
    const observaciones = document.getElementById('obsTaller').value;

    if (!fechaEntrega || !quienRecogio) return alert('⚠️ Complete Fecha de Entrega y Quién recogió');

    const registro = {
        tipo: 'SALIDA_TALLER',
        fechaEntrega, quienRecogio, costoFinal, observaciones,
        fechaRegistro: new Date(),
        usuario: usuarioActivo?.nombre || 'Desconocido'
    };

    await db.collection('mantenimiento').doc(placaActual).collection('historial').add(registro);
    await db.collection('mantenimiento').doc(placaActual).set({ enTaller: false, fechaEntregaTaller: fechaEntrega }, { merge: true });
    alert('✅ Salida de taller registrada\n✅ Vehículo DISPONIBLE');
    cargarDatosVehiculo(placaActual);
}

async function cargarHistorialMant() {
    if (!placaActual) return;
    const caja = document.getElementById('listaHistorialMant');
    const snap = await db.collection('mantenimiento').doc(placaActual).collection('historial').orderBy('fechaRegistro','desc').get();

    let total = 0;
    let html = '';
    snap.forEach(doc => {
        const r = doc.data();
        if (r.costoEstimado) total += r.costoEstimado;
        if (r.costoFinal) total += r.costoFinal;

        if (r.tipo === 'INGRESO_TALLER') {
            html += `
            <div class="p-3 mb-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <div class="font-bold text-yellow-800">🏭 INGRESO A TALLER — ${r.fechaIngreso}</div>
                <div>Quién llevó: ${r.quienLlevo || '—'}</div>
                <div>Diagnóstico: ${r.diagnostico || '—'}</div>
                <div>Costo estimado: $${r.costoEstimado || 0}</div>
            </div>`;
        } else {
            html += `
            <div class="p-3 mb-2 bg-green-50 rounded border-l-4 border-green-400">
                <div class="font-bold text-green-800">✅ SALIDA DE TALLER — ${r.fechaEntrega}</div>
                <div>Quién recogió: ${r.quienRecogio || '—'}</div>
                <div>Observaciones: ${r.observaciones || '—'}</div>
                <div>Costo final: $${r.costoFinal || 0}</div>
            </div>`;
        }
    });

    caja.innerHTML = html || '<p class="text-center">📭 Sin historial de mantenimiento</p>';
    document.getElementById('costoTotalMant').textContent = total.toLocaleString('es-CO');
}