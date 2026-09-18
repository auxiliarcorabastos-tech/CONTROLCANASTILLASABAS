// =====================================================
// ===== 🔧 MÓDULO MANTENIMIENTO — SOLO VEHÍCULOS DE MOVIMIENTOS =====
// =====================================================
window.cargarModulo_mantenimiento = async function() {
    const c = document.getElementById('contenido');
    if (!c) {
        console.log('No se encontró el contenedor principal');
        return;
    }

    c.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-4">🔧 Control de Mantenimiento — Vehículos de Movimientos</h3>
        
        <!-- Selección de Vehículo -->
        <div class="grupo mb-4">
            <label>Seleccionar Vehículo</label>
            <select id="placaMantenimiento" onchange="cargarDatosVehiculo()">
                <option value="">-- Seleccione un vehículo --</option>
                ${vehiculosMov && vehiculosMov.length > 0 
                    ? vehiculosMov.map(v => `<option value="${v.placa || v.id}">${v.placa || v.id} — ${(v.tipo || 'Sin tipo')}</option>`).join('') 
                    : '<option value="" disabled>⚠️ No hay vehículos registrados</option>'
                }
            </select>
        </div>

        <!-- Área de Datos del Vehículo -->
        <div id="datosVehiculo" class="oculto">
            <div class="flex gap-2 mb-4 flex-wrap">
                <button class="btn-subpestaña activa" onclick="cambiarSubpestañaMant('general')">📋 Datos Generales</button>
                <button class="btn-subpestaña" onclick="cambiarSubpestañaMant('documentos')">📄 Documentos Legales</button>
                <button class="btn-subpestaña" onclick="cambiarSubpestañaMant('taller')">🏭 Ingreso a Taller</button>
                <button class="btn-subpestaña" onclick="cambiarSubpestañaMant('historial')">📜 Historial</button>
            </div>

            <!-- SUBPESTAÑA: DATOS GENERALES -->
            <div id="submant-general">
                <h4 class="font-bold mb-3">📋 Información del Vehículo</h4>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Placa</label>
                        <input type="text" id="mantPlaca" readonly style="background:#f3f4f6;">
                    </div>
                    <div class="grupo">
                        <label>Tipo / Marca</label>
                        <input type="text" id="mantTipoMarca" placeholder="Ej: Moto / Camión">
                    </div>
                    <div class="grupo">
                        <label>Color</label>
                        <input type="text" id="mantColor" placeholder="Color del vehículo">
                    </div>
                    <div class="grupo">
                        <label>Kilometraje Actual</label>
                        <input type="number" id="mantKmActual" min="0" placeholder="0">
                    </div>
                    <div class="grupo col-span-2">
                        <label>Observaciones Generales</label>
                        <textarea id="mantObservaciones" rows="3" placeholder="Estado general, novedades..."></textarea>
                    </div>
                </div>
                <button class="btn btn-primario mt-3" onclick="guardarDatosGenerales()">💾 Guardar Datos Generales</button>
            </div>

            <!-- SUBPESTAÑA: DOCUMENTOS LEGALES -->
            <div id="submant-documentos" class="oculto">
                <h4 class="font-bold mb-3">📄 Documentos Obligatorios — Bogotá / Colombia</h4>
                <div class="grid-2">
                    <div class="grupo">
                        <label>SOAT — Vencimiento</label>
                        <input type="date" id="mantSoat">
                    </div>
                    <div class="grupo">
                        <label>Tecnicomecánica — Vencimiento</label>
                        <input type="date" id="mantTecno">
                    </div>
                    <div class="grupo">
                        <label>Seguro — Vencimiento</label>
                        <input type="date" id="mantSeguro">
                    </div>
                    <div class="grupo">
                        <label>Tarjeta de Propiedad</label>
                        <input type="text" id="mantTarjeta" placeholder="Número o estado">
                    </div>
                </div>
                <div id="alertasVencimientos" class="mt-3"></div>
                <button class="btn btn-primario mt-3" onclick="guardarDocumentos()">💾 Guardar Documentos</button>
            </div>

            <!-- SUBPESTAÑA: INGRESO A TALLER -->
            <div id="submant-taller" class="oculto">
                <h4 class="font-bold mb-3">🏭 Ingreso y Salida de Taller</h4>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Fecha de Ingreso al Taller</label>
                        <input type="date" id="mantFechaIngresoTaller">
                    </div>
                    <div class="grupo">
                        <label>Quién entrega el vehículo</label>
                        <select id="mantQuienEntrega">
                            <option value="">-- Seleccione --</option>
                            ${colaboradores && colaboradores.length > 0 
                                ? colaboradores.map(c => `<option value="${c.nombre || c.name}">${c.nombre || c.name}</option>`).join('') 
                                : ''
                            }
                        </select>
                    </div>
                    <div class="grupo col-span-2">
                        <label>Diagnóstico / Falla Reportada</label>
                        <textarea id="mantDiagnostico" rows="3" placeholder="Describa la falla..."></textarea>
                    </div>
                    <div class="grupo">
                        <label>Fecha Estimada de Retorno</label>
                        <input type="date" id="mantFechaRetornoEstimada">
                    </div>
                    <div class="grupo">
                        <label>Fecha Real de Retorno</label>
                        <input type="date" id="mantFechaRetornoReal">
                    </div>
                    <div class="grupo">
                        <label>Quién recoge el vehículo</label>
                        <select id="mantQuienRecoge">
                            <option value="">-- Seleccione --</option>
                            ${colaboradores && colaboradores.length > 0 
                                ? colaboradores.map(c => `<option value="${c.nombre || c.name}">${c.nombre || c.name}</option>`).join('') 
                                : ''
                            }
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Costo Total ($)</label>
                        <input type="number" id="mantCosto" min="0" step="1000" placeholder="0">
                    </div>
                    <div class="grupo col-span-2">
                        <label>Trabajo Realizado / Observaciones</label>
                        <textarea id="mantTrabajoRealizado" rows="3" placeholder="Reparaciones, repuestos..."></textarea>
                    </div>
                </div>
                <button class="btn btn-primario mt-3" onclick="registrarIngresoTaller()">💾 Registrar</button>
                <p class="text-sm mt-2 text-gray-500">⚠️ Al registrar fecha de ingreso, el vehículo queda en mantenimiento</p>
            </div>

            <!-- SUBPESTAÑA: HISTORIAL -->
            <div id="submant-historial" class="oculto">
                <h4 class="font-bold mb-3">📜 Historial de Mantenimientos</h4>
                <div id="listadoHistorial"></div>
            </div>
        </div>
    </div>
    `;
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaMant(nombre) {
    document.querySelectorAll('[id^="submant-"]').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
    const seccion = document.getElementById(`submant-${nombre}`);
    if (seccion) seccion.classList.remove('oculto');

    if (nombre === 'historial') cargarHistorial();
    if (nombre === 'documentos') verificarVencimientos();
}

// =====================================================
// ===== CARGAR DATOS DEL VEHÍCULO SELECCIONADO =====
// =====================================================
let placaActual = null;
let datosVehiculoGuardados = null;

async function cargarDatosVehiculo() {
    const select = document.getElementById('placaMantenimiento');
    if (!select) return;
    
    placaActual = select.value;
    if (!placaActual) {
        document.getElementById('datosVehiculo').classList.add('oculto');
        return;
    }

    document.getElementById('datosVehiculo').classList.remove('oculto');

    try {
        const snap = await db.collection('mantenimiento_vehiculos').doc(placaActual).get();
        datosVehiculoGuardados = snap.exists ? snap.data() : { placa: placaActual };
    } catch (e) {
        console.log('Sin datos previos, nuevo registro');
        datosVehiculoGuardados = { placa: placaActual };
    }

    // Llenar formulario
    document.getElementById('mantPlaca').value = placaActual;
    document.getElementById('mantTipoMarca').value = datosVehiculoGuardados.tipoMarca || '';
    document.getElementById('mantColor').value = datosVehiculoGuardados.color || '';
    document.getElementById('mantKmActual').value = datosVehiculoGuardados.kmActual || '';
    document.getElementById('mantObservaciones').value = datosVehiculoGuardados.observaciones || '';

    // Documentos
    document.getElementById('mantSoat').value = datosVehiculoGuardados.vencimientoSoat || '';
    document.getElementById('mantTecno').value = datosVehiculoGuardados.vencimientoTecno || '';
    document.getElementById('mantSeguro').value = datosVehiculoGuardados.vencimientoSeguro || '';
    document.getElementById('mantTarjeta').value = datosVehiculoGuardados.tarjeta || '';

    // Taller
    document.getElementById('mantFechaIngresoTaller').value = datosVehiculoGuardados.fechaIngresoTaller || '';
    document.getElementById('mantQuienEntrega').value = datosVehiculoGuardados.quienEntrega || '';
    document.getElementById('mantDiagnostico').value = datosVehiculoGuardados.diagnostico || '';
    document.getElementById('mantFechaRetornoEstimada').value = datosVehiculoGuardados.fechaRetornoEstimada || '';
    document.getElementById('mantFechaRetornoReal').value = datosVehiculoGuardados.fechaRetornoReal || '';
    document.getElementById('mantQuienRecoge').value = datosVehiculoGuardados.quienRecoge || '';
    document.getElementById('mantCosto').value = datosVehiculoGuardados.costo || '';
    document.getElementById('mantTrabajoRealizado').value = datosVehiculoGuardados.trabajoRealizado || '';

    verificarVencimientos();
}

// =====================================================
// ===== GUARDAR DATOS GENERALES =====
// =====================================================
async function guardarDatosGenerales() {
    if (!placaActual) return alert('Seleccione un vehículo');

    const datos = {
        placa: placaActual,
        tipoMarca: document.getElementById('mantTipoMarca').value.trim(),
        color: document.getElementById('mantColor').value.trim(),
        kmActual: parseInt(document.getElementById('mantKmActual').value) || 0,
        observaciones: document.getElementById('mantObservaciones').value.trim(),
        ultimaActualizacion: new Date().toISOString()
    };

    await db.collection('mantenimiento_vehiculos').doc(placaActual).set(datos, { merge: true });
    alert('✅ Datos generales guardados');
}
// =====================================================
// ===== GUARDAR DOCUMENTOS =====
// =====================================================
async function guardarDocumentos() {
    if (!placaActual) return alert('Seleccione un vehículo');

    const datos = {
        vencimientoSoat: document.getElementById('mantSoat').value,
        vencimientoTecno: document.getElementById('mantTecno').value,
        vencimientoSeguro: document.getElementById('mantSeguro').value,
        tarjeta: document.getElementById('mantTarjeta').value.trim()
    };

    await db.collection('mantenimiento_vehiculos').doc(placaActual).set(datos, { merge: true });
    alert('✅ Documentos guardados');
    verificarVencimientos();
}

// =====================================================
// ===== VERIFICAR VENCIMIENTOS =====
// =====================================================
function verificarVencimientos() {
    const hoy = new Date();
    const alertas = [];
    const campos = [
        { nombre: 'SOAT', valor: document.getElementById('mantSoat').value },
        { nombre: 'Tecnicomecánica', valor: document.getElementById('mantTecno').value },
        { nombre: 'Seguro', valor: document.getElementById('mantSeguro').value }
    ];

    campos.forEach(c => {
        if (!c.valor) {
            alertas.push(`⚠️ ${c.nombre}: Sin fecha registrada`);
            return;
        }
        const fecha = new Date(c.valor);
        const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
        if (dias < 0) {
            alertas.push(`🔴 ${c.nombre}: VENCIDO hace ${Math.abs(dias)} días`);
        } else if (dias <= 30) {
            alertas.push(`🟡 ${c.nombre}: Vence en ${dias} días`);
        } else {
            alertas.push(`🟢 ${c.nombre}: Vigente (${dias} días restantes)`);
        }
    });

    const contenedor = document.getElementById('alertasVencimientos');
    if (contenedor) {
        contenedor.innerHTML = alertas.map(a => `<p class="text-sm py-1">${a}</p>`).join('');
    }
}

// =====================================================
// ===== REGISTRAR INGRESO/SALIDA DE TALLER =====
// =====================================================
async function registrarIngresoTaller() {
    if (!placaActual) return alert('Seleccione un vehículo');

    const fechaIngreso = document.getElementById('mantFechaIngresoTaller').value;
    if (!fechaIngreso) return alert('Ingrese la fecha de ingreso al taller');

    const datos = {
        placa: placaActual,
        fechaIngresoTaller: fechaIngreso,
        quienEntrega: document.getElementById('mantQuienEntrega').value,
        diagnostico: document.getElementById('mantDiagnostico').value.trim(),
        fechaRetornoEstimada: document.getElementById('mantFechaRetornoEstimada').value,
        fechaRetornoReal: document.getElementById('mantFechaRetornoReal').value || '',
        quienRecoge: document.getElementById('mantQuienRecoge').value,
        costo: parseInt(document.getElementById('mantCosto').value) || 0,
        trabajoRealizado: document.getElementById('mantTrabajoRealizado').value.trim(),
        enMantenimiento: !document.getElementById('mantFechaRetornoReal').value,
        fechaRegistro: new Date().toISOString()
    };

    await db.collection('mantenimiento_vehiculos').doc(placaActual).set(datos, { merge: true });

    await db.collection('historial_mantenimientos').add({
        ...datos,
        tipoMovimiento: datos.fechaRetornoReal ? 'salida_taller' : 'ingreso_taller'
    });

    alert(datos.fechaRetornoReal ? '✅ Vehículo retirado de taller — Disponible' : '✅ Ingreso registrado — Vehículo en mantenimiento');
    cargarHistorial();
}

// =====================================================
// ===== CARGAR HISTORIAL =====
// =====================================================
async function cargarHistorial() {
    if (!placaActual) return;

    const lista = document.getElementById('listadoHistorial');
    if (!lista) return;

    try {
        const snap = await db.collection('historial_mantenimientos')
            .where('placa', '==', placaActual)
            .orderBy('fechaRegistro', 'desc')
            .limit(20)
            .get();

        if (snap.empty) {
            lista.innerHTML = '<p class="text-center text-gray-500">Sin historial de mantenimiento</p>';
            return;
        }

        lista.innerHTML = snap.docs.map(doc => {
            const h = doc.data();
            const esIngreso = h.tipoMovimiento !== 'salida_taller';
            return `
            <div class="tarjeta p-3 mb-2 border-l-4 ${esIngreso ? 'border-yellow-500' : 'border-green-500'}">
                <p class="font-bold ${esIngreso ? 'text-yellow-700' : 'text-green-700'}">
                    ${esIngreso ? '🏭 EN MANTENIMIENTO' : '✅ RETIRADO'}
                </p>
                <p><strong>Fecha Ingreso:</strong> ${h.fechaIngresoTaller || '—'}</p>
                ${h.fechaRetornoReal ? `<p><strong>Fecha Retorno:</strong> ${h.fechaRetornoReal}</p>` : ''}
                <p><strong>Quién entrega:</strong> ${h.quienEntrega || '—'}</p>
                ${h.quienRecoge ? `<p><strong>Quién recoge:</strong> ${h.quienRecoge}</p>` : ''}
                <p><strong>Diagnóstico:</strong> ${h.diagnostico || 'Sin detalle'}</p>
                ${h.trabajoRealizado ? `<p><strong>Trabajo realizado:</strong> ${h.trabajoRealizado}</p>` : ''}
                ${h.costo ? `<p><strong>Costo:</strong> $${h.costo.toLocaleString()}</p>` : ''}
            </div>
            `;
        }).join('');
    } catch (e) {
        lista.innerHTML = '<p class="text-red-600">Error al cargar historial</p>';
    }
}