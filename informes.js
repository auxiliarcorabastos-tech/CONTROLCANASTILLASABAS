// =====================================================
// ===== 📊 MÓDULO INFORMES — COMPLETO =====
// =====================================================
window.cargarModulo_informes = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subinforme activa" onclick="cambiarSubinforme('movimientos')">📦 Movimientos</button>
        <button class="btn-subinforme" onclick="cambiarSubinforme('kilometraje')">📏 Kilometraje</button>
        <button class="btn-subinforme" onclick="cambiarSubinforme('combustible')">⛽ Combustible</button>
        <button class="btn-subinforme" onclick="cambiarSubinforme('transportadora')">🚛 Transportadora</button>
    </div>

    <!-- ============================================== -->
    <!-- SUBINFORME: MOVIMIENTOS -->
    <!-- ============================================== -->
    <div id="informe-movimientos">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📊 Consulta de Movimientos</h3>
            <div class="grid-2 mb-4">
                <div class="grupo">
                    <label>Fecha Inicio</label>
                    <input type="date" id="infMovFechaInicio">
                </div>
                <div class="grupo">
                    <label>Fecha Fin</label>
                    <input type="date" id="infMovFechaFin">
                </div>
                <div class="grupo">
                    <label>Placa</label>
                    <select id="infMovPlaca">
                        <option value="">— Todas las placas —</option>
                        ${vehiculosMov.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Colaborador</label>
                    <select id="infMovColaborador">
                        <option value="">— Todos —</option>
                        ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button class="btn btn-primario" onclick="ejecutarConsultaMovimientos()">🔍 Buscar</button>
            
            <div id="resultadoMovimientos" class="mt-4"></div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBINFORME: KILOMETRAJE ✅ NUEVO -->
    <!-- ============================================== -->
    <div id="informe-kilometraje" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📊 Consulta de Kilometraje</h3>
            <div class="grid-2 mb-4">
                <div class="grupo">
                    <label>Fecha Inicio</label>
                    <input type="date" id="infKmFechaInicio">
                </div>
                <div class="grupo">
                    <label>Fecha Fin</label>
                    <input type="date" id="infKmFechaFin">
                </div>
                <div class="grupo">
                    <label>Placa</label>
                    <select id="infKmPlaca">
                        <option value="">— Todas las placas —</option>
                        ${vehiculosMov.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Colaborador</label>
                    <select id="infKmColaborador">
                        <option value="">— Todos —</option>
                        ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button class="btn btn-primario" onclick="ejecutarConsultaKilometraje()">🔍 Buscar</button>
            
            <div id="resultadoKilometraje" class="mt-4"></div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBINFORME: COMBUSTIBLE / TANQUEO -->
    <!-- ============================================== -->
    <div id="informe-combustible" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📊 Consulta de Tanqueo</h3>
            <div class="grid-2 mb-4">
                <div class="grupo">
                    <label>Fecha Inicio</label>
                    <input type="date" id="infTanqFechaInicio">
                </div>
                <div class="grupo">
                    <label>Fecha Fin</label>
                    <input type="date" id="infTanqFechaFin">
                </div>
                <div class="grupo">
                    <label>Placa</label>
                    <select id="infTanqPlaca">
                        <option value="">— Todas las placas —</option>
                        ${vehiculosMov.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Colaborador</label>
                    <select id="infTanqColaborador">
                        <option value="">— Todos —</option>
                        ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button class="btn btn-primario" onclick="ejecutarConsultaTanqueo()">🔍 Buscar</button>
            
            <div id="resultadoTanqueo" class="mt-4"></div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBINFORME: TRANSPORTADORA -->
    <!-- ============================================== -->
    <div id="informe-transportadora" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📊 Consulta de Transportadora</h3>
            <div class="grid-2 mb-4">
                <div class="grupo">
                    <label>Fecha Inicio</label>
                    <input type="date" id="infTransFechaInicio">
                </div>
                <div class="grupo">
                    <label>Fecha Fin</label>
                    <input type="date" id="infTransFechaFin">
                </div>
                <div class="grupo">
                    <label>Placa</label>
                    <select id="infTransPlaca">
                        <option value="">— Todas las placas —</option>
                        ${vehiculosTransp.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>Conductor</label>
                    <select id="infTransConductor">
                        <option value="">— Todos —</option>
                        ${conductores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button class="btn btn-primario" onclick="ejecutarConsultaTransportadora()">🔍 Buscar</button>
            
            <div id="resultadoTransportadora" class="mt-4"></div>
        </div>
    </div>
    `;
};

// =====================================================
// ===== CAMBIAR SUBINFORME =====
// =====================================================
function cambiarSubinforme(nombre) {
    document.querySelectorAll('.btn-subinforme').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('[id^="informe-"]').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`informe-${nombre}`).classList.remove('oculto');
}

// =====================================================
// ===== 📦 CONSULTA MOVIMIENTOS =====
// =====================================================
function ejecutarConsultaMovimientos() {
    const fi = document.getElementById('infMovFechaInicio').value;
    const ff = document.getElementById('infMovFechaFin').value;
    const placa = document.getElementById('infMovPlaca').value;
    const colaborador = document.getElementById('infMovColaborador').value;

    if (!fi || !ff) return alert('Ingrese fechas de inicio y fin');

    let res = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    if (placa) res = res.filter(m => m.placa === placa);
    if (colaborador) res = res.filter(m => m.colaborador === colaborador);

    ultimosResultados.movimientos = res;
    dibujarResultadoMovimientos(res);
}

function dibujarResultadoMovimientos(datos) {
    const c = document.getElementById('resultadoMovimientos');
    if (datos.length === 0) {
        c.innerHTML = '<p class="text-center text-gray-500">📭 Sin resultados</p>';
        return;
    }

    c.innerHTML = `
        <div class="mb-3 flex gap-2 flex-wrap">
            <strong>${datos.length} registros encontrados</strong>
            <button onclick="exportarExcel('movimientos')" class="btn" style="background:#dcfce7; color:#166534;">📥 Excel</button>
            <button onclick="exportarPDF('movimientos')" class="btn" style="background:#fef3c7; color:#92400e;">📄 PDF</button>
            <button onclick="exportarWord('movimientos')" class="btn" style="background:#dbeafe; color:#1e40af;">📝 Word</button>
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                <th style="border:1px solid #ccc; padding:6px;">Colaborador</th>
                <th style="border:1px solid #ccc; padding:6px;">Hora Salida</th>
                <th style="border:1px solid #ccc; padding:6px;">Hora Llegada</th>
                <th style="border:1px solid #ccc; padding:6px;">Canastillas Salida</th>
                <th style="border:1px solid #ccc; padding:6px;">Canastillas Llegada</th>
                <th style="border:1px solid #ccc; padding:6px;">Kilos Totales</th>
            </tr>
            ${datos.map(m => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${m.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.colaborador}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.totalKilos || 0}</td>
                </tr>
            `).join('')}
        </table>
        </div>
    `;
}

// =====================================================
// ===== 📏 CONSULTA KILOMETRAJE ✅ NUEVO =====
// =====================================================
function ejecutarConsultaKilometraje() {
    const fi = document.getElementById('infKmFechaInicio').value;
    const ff = document.getElementById('infKmFechaFin').value;
    const placa = document.getElementById('infKmPlaca').value;
    const colaborador = document.getElementById('infKmColaborador').value;

    if (!fi || !ff) return alert('Ingrese fechas de inicio y fin');

    let res = kilometraje.filter(k => k.fecha >= fi && k.fecha <= ff);
    if (placa) res = res.filter(k => k.placa === placa);
    if (colaborador) res = res.filter(k => k.colaborador === colaborador);

    ultimosResultados.kilometraje = res;
    dibujarResultadoKilometraje(res);
}

function dibujarResultadoKilometraje(datos) {
    const c = document.getElementById('resultadoKilometraje');
    if (datos.length === 0) {
        c.innerHTML = '<p class="text-center text-gray-500">📭 Sin resultados</p>';
        return;
    }

    const totalRecorrido = datos.reduce((s, k) => s + (k.kmRecorridos || 0), 0);

    c.innerHTML = `
        <div class="mb-3 flex gap-2 flex-wrap items-center">
            <strong>${datos.length} registros — Total: ${totalRecorrido.toLocaleString()} km</strong>
            <button onclick="exportarExcel('kilometraje')" class="btn" style="background:#dcfce7; color:#166534;">📥 Excel</button>
            <button onclick="exportarPDF('kilometraje')" class="btn" style="background:#fef3c7; color:#92400e;">📄 PDF</button>
            <button onclick="exportarWord('kilometraje')" class="btn" style="background:#dbeafe; color:#1e40af;">📝 Word</button>
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                <th style="border:1px solid #ccc; padding:6px;">KM Inicio</th>
                <th style="border:1px solid #ccc; padding:6px;">KM Final</th>
                <th style="border:1px solid #ccc; padding:6px;">Recorridos</th>
                <th style="border:1px solid #ccc; padding:6px;">Colaborador</th>
            </tr>
            ${datos.map(k => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${k.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${k.kmInicio}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${k.kmFinal}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right; font-weight:bold; color:#2563eb;">${k.kmRecorridos}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.colaborador}</td>
                </tr>
            `).join('')}
            <tr style="background:#eff6ff; font-weight:bold;">
                <td colspan="4" style="border:1px solid #ccc; padding:6px; text-align:right;">TOTAL RECORRIDO:</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:right;">${totalRecorrido.toLocaleString()}</td>
                <td style="border:1px solid #ccc; padding:6px;"></td>
            </tr>
        </table>
        </div>
    `;
}

// =====================================================
// ===== ⛽ CONSULTA TANQUEO =====
// =====================================================
function ejecutarConsultaTanqueo() {
    const fi = document.getElementById('infTanqFechaInicio').value;
    const ff = document.getElementById('infTanqFechaFin').value;
    const placa = document.getElementById('infTanqPlaca').value;
    const colaborador = document.getElementById('infTanqColaborador').value;

    if (!fi || !ff) return alert('Ingrese fechas de inicio y fin');

    let res = tanqueo.filter(t => t.fecha >= fi && t.fecha <= ff);
    if (placa) res = res.filter(t => t.placa === placa);
    if (colaborador) res = res.filter(t => t.colaborador === colaborador);

    ultimosResultados.tanqueo = res;
    dibujarResultadoTanqueo(res);
}

function dibujarResultadoTanqueo(datos) {
    const c = document.getElementById('resultadoTanqueo');
    if (datos.length === 0) {
        c.innerHTML = '<p class="text-center text-gray-500">📭 Sin resultados</p>';
        return;
    }

    c.innerHTML = `
        <div class="mb-3 flex gap-2 flex-wrap">
            <strong>${datos.length} registros encontrados</strong>
            <button onclick="exportarExcel('tanqueo')" class="btn" style="background:#dcfce7; color:#166534;">📥 Excel</button>
            <button onclick="exportarPDF('tanqueo')" class="btn" style="background:#fef3c7; color:#92400e;">📄 PDF</button>
            <button onclick="exportarWord('tanqueo')" class="btn" style="background:#dbeafe; color:#1e40af;">📝 Word</button>
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                <th style="border:1px solid #ccc; padding:6px;">Nivel</th>
                <th style="border:1px solid #ccc; padding:6px;">Colaborador</th>
            </tr>
            ${datos.map(t => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${t.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.nivel === 'full' ? '✅ Lleno' : t.nivel + '%'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.colaborador}</td>
                </tr>
            `).join('')}
        </table>
        </div>
    `;
}

// =====================================================
// ===== 🚛 CONSULTA TRANSPORTADORA =====
// =====================================================
function ejecutarConsultaTransportadora() {
    const fi = document.getElementById('infTransFechaInicio').value;
    const ff = document.getElementById('infTransFechaFin').value;
    const placa = document.getElementById('infTransPlaca').value;
    const conductor = document.getElementById('infTransConductor').value;

    if (!fi || !ff) return alert('Ingrese fechas de inicio y fin');

    let res = movimientosTransp.filter(m => m.fecha >= fi && m.fecha <= ff);
    if (placa) res = res.filter(m => m.placa === placa);
    if (conductor) res = res.filter(m => m.conductor === conductor);

    ultimosResultados.transportadora = res;
    dibujarResultadoTransportadora(res);
}

function dibujarResultadoTransportadora(datos) {
    const c = document.getElementById('resultadoTransportadora');
    if (datos.length === 0) {
        c.innerHTML = '<p class="text-center text-gray-500">📭 Sin resultados</p>';
        return;
    }

    c.innerHTML = `
        <div class="mb-3 flex gap-2 flex-wrap">
            <strong>${datos.length} registros encontrados</strong>
            <button onclick="exportarExcel('transportadora')" class="btn" style="background:#dcfce7; color:#166534;">📥 Excel</button>
            <button onclick="exportarPDF('transportadora')" class="btn" style="background:#fef3c7; color:#92400e;">📄 PDF</button>
            <button onclick="exportarWord('transportadora')" class="btn" style="background:#dbeafe; color:#1e40af;">📝 Word</button>
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                <th style="border:1px solid #ccc; padding:6px;">Conductor</th>
                <th style="border:1px solid #ccc; padding:6px;">Hora Salida</th>
                <th style="border:1px solid #ccc; padding:6px;">Hora Llegada</th>
                <th style="border:1px solid #ccc; padding:6px;">Canastillas Salida</th>
                <th style="border:1px solid #ccc; padding:6px;">Canastillas Llegada</th>
            </tr>
            ${datos.map(m => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${m.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.conductor || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                </tr>
            `).join('')}
        </table>
        </div>
    `;
}

// =====================================================
// ===== 📥 EXPORTAR EXCEL =====
// =====================================================
function exportarExcel(tipo) {
    const datos = ultimosResultados[tipo];
    if (!datos || datos.length === 0) return alert('Sin datos para exportar');

    let filas = [];
    let nombre = '';

    switch(tipo) {
        case 'movimientos':
            nombre = 'Movimientos';
            filas = datos.map(m => ({
                Fecha: m.fecha, Placa: m.placa, Colaborador: m.colaborador,
                HoraSalida: m.horaSalida || '', HoraLlegada: m.horaLlegada || '',
                CanastillasSalida: m.canastillasSalida || 0, CanastillasLlegada: m.canastillasLlegada || 0,
                KilosTotales: m.totalKilos || 0
            }));
            break;
        case 'kilometraje':
            nombre = 'Kilometraje';
            filas = datos.map(k => ({
                Fecha: k.fecha, Placa: k.placa,
                KMInicio: k.kmInicio, KMFinal: k.kmFinal,
                KMRecorridos: k.kmRecorridos, Colaborador: k.colaborador
            }));
            break;
        case 'tanqueo':
            nombre = 'Tanqueo';
            filas = datos.map(t => ({
                Fecha: t.fecha, Placa: t.placa,
                NivelTanque: t.nivel === 'full' ? 'Lleno' : t.nivel + '%',
                Colaborador: t.colaborador
            }));
            break;
        case 'transportadora':
            nombre = 'Transportadora';
            filas = datos.map(m => ({
                Fecha: m.fecha, Placa: m.placa, Conductor: m.conductor || '',
                HoraSalida: m.horaSalida || '', HoraLlegada: m.horaLlegada || '',
                CanastillasSalida: m.canastillasSalida || 0, CanastillasLlegada: m.canastillasLlegada || 0
            }));
            break;
    }

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombre);
    XLSX.writeFile(libro, `${nombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// =====================================================
// ===== 📄 EXPORTAR PDF =====
// =====================================================
function exportarPDF(tipo) {
    const datos = ultimosResultados[tipo];
    if (!datos || datos.length === 0) return alert('Sin datos para exportar');

    let tablaHTML = '';
    let titulo = '';

    switch(tipo) {
        case 'movimientos':
            titulo = 'REPORTE DE MOVIMIENTOS';
            tablaHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="border:1px solid #999; padding:8px;">Fecha</th>
                    <th style="border:1px solid #999; padding:8px;">Placa</th>
                    <th style="border:1px solid #999; padding:8px;">Colaborador</th>
                    <th style="border:1px solid #999; padding:8px;">Hora Salida</th>
                    <th style="border:1px solid #999; padding:8px;">Hora Llegada</th>
                    <th style="border:1px solid #999; padding:8px;">Canastillas Salida</th>
                    <th style="border:1px solid #999; padding:8px;">Canastillas Llegada</th>
                    <th style="border:1px solid #999; padding:8px;">Kilos Totales</th>
                </tr>
                ${datos.map(m => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${m.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.colaborador}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.totalKilos || 0}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
        case 'kilometraje':
            titulo = 'REPORTE DE KILOMETRAJE';
            const totalKm = datos.reduce((s, k) => s + (k.kmRecorridos || 0), 0);
            tablaHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="border:1px solid #999; padding:8px;">Fecha</th>
                    <th style="border:1px solid #999; padding:8px;">Placa</th>
                    <th style="border:1px solid #999; padding:8px;">KM Inicio</th>
                    <th style="border:1px solid #999; padding:8px;">KM Final</th>
                    <th style="border:1px solid #999; padding:8px;">Recorridos</th>
                    <th style="border:1px solid #999; padding:8px;">Colaborador</th>
                </tr>
                ${datos.map(k => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${k.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${k.kmInicio}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${k.kmFinal}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right; font-weight:bold;">${k.kmRecorridos}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.colaborador}</td>
                </tr>
                `).join('')}
                <tr style="background:#dbeafe; font-weight:bold;">
                    <td colspan="4" style="border:1px solid #ccc; padding:8px; text-align:right;">TOTAL:</td>
                    <td style="border:1px solid #ccc; padding:8px; text-align:right;">${totalKm.toLocaleString()}</td>
                    <td style="border:1px solid #ccc; padding:8px;"></td>
                </tr>
            </table>`;
            break;
        case 'tanqueo':
            titulo = 'REPORTE DE TANQUEO';
            tablaHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="border:1px solid #999; padding:8px;">Fecha</th>
                    <th style="border:1px solid #999; padding:8px;">Placa</th>
                    <th style="border:1px solid #999; padding:8px;">Nivel de Tanque</th>
                    <th style="border:1px solid #999; padding:8px;">Colaborador</th>
                </tr>
                ${datos.map(t => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${t.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.nivel === 'full' ? '✅ Lleno' : t.nivel + '%'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${t.colaborador}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
        case 'transportadora':
            titulo = 'REPORTE DE TRANSPORTADORA';
            tablaHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="border:1px solid #999; padding:8px;">Fecha</th>
                    <th style="border:1px solid #999; padding:8px;">Placa</th>
                    <th style="border:1px solid #999; padding:8px;">Conductor</th>
                    <th style="border:1px solid #999; padding:8px;">Hora Salida</th>
                    <th style="border:1px solid #999; padding:8px;">Hora Llegada</th>
                    <th style="border:1px solid #999; padding:8px;">Canastillas Salida</th>
                    <th style="border:1px solid #999; padding:8px;">Canastillas Llegada</th>
                </tr>
                ${datos.map(m => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${m.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.conductor || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
    }

    const ventana = window.open('', '_blank');
    ventana.document.write(`
    <html>
    <head>
        <title>${titulo}</title>
        <style>
            body { font-family:Arial; padding:20px; }
            h1 { text-align:center; color:#1f2937; }
            .fecha { text-align:right; color:#6b7280; font-size:10pt; margin-bottom:20px; }
        </style>
    </head>
    <body>
        <h1>${titulo}</h1>
        <p class="fecha">Generado: ${new Date().toLocaleString('es-CO')}</p>
        ${tablaHTML}
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
    `);
    ventana.document.close();
}

// =====================================================
// ===== 📝 EXPORTAR WORD =====
// =====================================================
function exportarWord(tipo) {
    const datos = ultimosResultados[tipo];
    if (!datos || datos.length === 0) return alert('Sin datos para exportar');

    let tablaHTML = '';
    let titulo = '';

    switch(tipo) {
        case 'movimientos':
            titulo = 'REPORTE DE MOVIMIENTOS';
            tablaHTML = `
            <table border="1" style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="padding:8px;">Fecha</th>
                    <th style="padding:8px;">Placa</th>
                    <th style="padding:8px;">Colaborador</th>
                    <th style="padding:8px;">Hora Salida</th>
                    <th style="padding:8px;">Hora Llegada</th>
                    <th style="padding:8px;">Canastillas Salida</th>
                    <th style="padding:8px;">Canastillas Llegada</th>
                    <th style="padding:8px;">Kilos Totales</th>
                </tr>
                ${datos.map(m => `
                <tr>
                    <td style="padding:6px;">${m.fecha}</td>
                    <td style="padding:6px;">${m.placa}</td>
                    <td style="padding:6px;">${m.colaborador}</td>
                    <td style="padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                    <td style="padding:6px; text-align:right;">${m.totalKilos || 0}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
        case 'kilometraje':
            titulo = 'REPORTE DE KILOMETRAJE';
            const totalKm = datos.reduce((s, k) => s + (k.kmRecorridos || 0), 0);
            tablaHTML = `
            <table border="1" style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="padding:8px;">Fecha</th>
                    <th style="padding:8px;">Placa</th>
                    <th style="padding:8px;">KM Inicio</th>
                    <th style="padding:8px;">KM Final</th>
                    <th style="padding:8px;">Recorridos</th>
                    <th style="padding:8px;">Colaborador</th>
                </tr>
                ${datos.map(k => `
                <tr>
                    <td style="padding:6px;">${k.fecha}</td>
                    <td style="padding:6px;">${k.placa}</td>
                    <td style="padding:6px; text-align:right;">${k.kmInicio}</td>
                    <td style="padding:6px; text-align:right;">${k.kmFinal}</td>
                    <td style="padding:6px; text-align:right; font-weight:bold;">${k.kmRecorridos}</td>
                    <td style="padding:6px;">${k.colaborador}</td>
                </tr>
                `).join('')}
                <tr style="background:#dbeafe; font-weight:bold;">
                    <td colspan="4" style="padding:8px; text-align:right;">TOTAL RECORRIDO:</td>
                    <td style="padding:8px; text-align:right;">${totalKm.toLocaleString()}</td>
                    <td style="padding:8px;"></td>
                </tr>
            </table>`;
            break;
        case 'tanqueo':
            titulo = 'REPORTE DE TANQUEO';
            tablaHTML = `
            <table border="1" style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="padding:8px;">Fecha</th>
                    <th style="padding:8px;">Placa</th>
                    <th style="padding:8px;">Nivel de Tanque</th>
                    <th style="padding:8px;">Colaborador</th>
                </tr>
                ${datos.map(t => `
                <tr>
                    <td style="padding:6px;">${t.fecha}</td>
                    <td style="padding:6px;">${t.placa}</td>
                    <td style="padding:6px;">${t.nivel === 'full' ? 'Lleno' : t.nivel + '%'}</td>
                    <td style="padding:6px;">${t.colaborador}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
        case 'transportadora':
            titulo = 'REPORTE DE TRANSPORTADORA';
            tablaHTML = `
            <table border="1" style="width:100%; border-collapse:collapse; font-size:11pt;">
                <tr style="background:#e5e7eb;">
                    <th style="padding:8px;">Fecha</th>
                    <th style="padding:8px;">Placa</th>
                    <th style="padding:8px;">Conductor</th>
                    <th style="padding:8px;">Hora Salida</th>
                    <th style="padding:8px;">Hora Llegada</th>
                    <th style="padding:8px;">Canastillas Salida</th>
                    <th style="padding:8px;">Canastillas Llegada</th>
                </tr>
                ${datos.map(m => `
                <tr>
                    <td style="padding:6px;">${m.fecha}</td>
                    <td style="padding:6px;">${m.placa}</td>
                    <td style="padding:6px;">${m.conductor || '—'}</td>
                    <td style="padding:6px;">${m.horaSalida || '—'}</td>
                    <td style="padding:6px;">${m.horaLlegada || '—'}</td>
                    <td style="padding:6px; text-align:right;">${m.canastillasSalida || 0}</td>
                    <td style="padding:6px; text-align:right;">${m.canastillasLlegada || 0}</td>
                </tr>
                `).join('')}
            </table>`;
            break;
    }

    const contenido = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<style>
    body { font-family:Arial; }
    h1 { text-align:center; color:#1f2937; }
</style>
</head>
<body>
    <h1>${titulo}</h1>
    <p style="text-align:right; color:#666; font-size:10pt;">Generado: ${new Date().toLocaleString('es-CO')}</p>
    ${tablaHTML}
</body>
</html>`;

    const blob = new Blob([contenido], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
}