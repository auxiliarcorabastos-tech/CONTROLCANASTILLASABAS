// =====================================================
// ===== 📊 MÓDULO INFORMES =====
// ===== ⚠️ NO DECLARAR VARIABLES AQUÍ =====
// =====================================================
window.cargarModulo_informes = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido'); // ✅ CORREGIDO
    if (!c) return; // ✅ Protección
    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subpestaña activa" onclick="cambiarSubInforme('movimientos', event)">📦 Movimientos</button>
        <button class="btn-subpestaña" onclick="cambiarSubInforme('transportadora', event)">🚛 Transportadora</button>
        <button class="btn-subpestaña" onclick="cambiarSubInforme('combustible', event)">⛽ Combustible</button>
        <button class="btn-subpestaña" onclick="cambiarSubInforme('todos', event)">📋 Todos los Movimientos</button>
    </div>

    <!-- MOVIMIENTOS -->
    <div id="subinf-movimientos">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📦 Informe de Movimientos</h3>
            <div class="grid-2 mb-3">
                <div class="grupo"><label>Fecha Inicio</label><input type="date" id="fechaInicioMov" value="${hoy}"></div>
                <div class="grupo"><label>Fecha Fin</label><input type="date" id="fechaFinMov" value="${hoy}"></div>
            </div>
            <button class="btn btn-primario" onclick="consultarMovimientos()">🔍 Consultar</button>
            <button class="btn btn-exito ml-2" onclick="exportarExcelMovimientos()">📥 Exportar Excel</button>
            <div id="resultadoMovimientos" class="mt-4"></div>
        </div>
    </div>

    <!-- TRANSPORTADORA -->
    <div id="subinf-transportadora" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">🚛 Informe Transportadora</h3>
            <div class="grid-2 mb-3">
                <div class="grupo"><label>Fecha Inicio</label><input type="date" id="fechaInicioTransp" value="${hoy}"></div>
                <div class="grupo"><label>Fecha Fin</label><input type="date" id="fechaFinTransp" value="${hoy}"></div>
            </div>
            <button class="btn btn-primario" onclick="consultarTransporte()">🔍 Consultar</button>
            <button class="btn btn-exito ml-2" onclick="exportarExcelTransporte()">📥 Exportar Excel</button>
            <div id="resultadoTransporte" class="mt-4"></div>
        </div>
    </div>

    <!-- COMBUSTIBLE -->
    <div id="subinf-combustible" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⛽ Informe de Combustible</h3>
            <div class="grid-2 mb-3">
                <div class="grupo"><label>Fecha Inicio</label><input type="date" id="fechaInicioComb" value="${hoy}"></div>
                <div class="grupo"><label>Fecha Fin</label><input type="date" id="fechaFinComb" value="${hoy}"></div>
            </div>
            <button class="btn btn-primario" onclick="consultarCombustible()">🔍 Consultar</button>
            <button class="btn btn-exito ml-2" onclick="exportarExcelCombustible()">📥 Exportar Excel</button>
            <div id="resultadoCombustible" class="mt-4"></div>
        </div>
    </div>

    <!-- TODOS LOS MOVIMIENTOS -->
    <div id="subinf-todos" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📋 Todos los Movimientos Registrados</h3>
            <div class="grid-2 mb-3">
                <div class="grupo"><label>Fecha Inicio</label><input type="date" id="fechaInicioTodos" value="2026-01-01"></div>
                <div class="grupo"><label>Fecha Fin</label><input type="date" id="fechaFinTodos" value="${hoy}"></div>
            </div>
            <button class="btn btn-primario" onclick="consultarTodosMovimientos()">🔍 Consultar</button>
            <div id="resultadoTodos" class="mt-4"></div>
        </div>
    </div>
    `;
};

function cambiarSubInforme(nombre, evento) {
    document.querySelectorAll('#subinf-movimientos, #subinf-transportadora, #subinf-combustible, #subinf-todos').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenidoDinamico .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('activa');
    document.getElementById(`subinf-${nombre}`).classList.remove('oculto');
}

// ===== CONSULTAS =====
function consultarMovimientos() {
    const fi = document.getElementById('fechaInicioMov').value;
    const ff = document.getElementById('fechaFinMov').value;
    if (!fi || !ff) return alert('⚠️ Seleccione fechas de inicio y fin');
    const resultados = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.movimientos = resultados;
    const c = document.getElementById('resultadoMovimientos');
    if (!c) return;
    if (resultados.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
        return;
    }
    let totalCanSalida = 0, totalCanLlegada = 0, totalKilos = 0;
    resultados.forEach(m => {
        totalCanSalida += m.canastillasSalida || 0;
        totalCanLlegada += m.canastillasLlegada || 0;
        totalKilos += m.totalKilos || 0;
    });
    c.innerHTML = `
    <div class="resumen">
        <span>📄 Registros: ${resultados.length}</span>
        <span>📦 Salidas: ${totalCanSalida}</span>
        <span>📦 Llegadas: ${totalCanLlegada}</span>
        <span>⚖️ Kilos: ${totalKilos.toFixed(2)}</span>
    </div>
    <table class="tabla mt-3">
        <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th><th>Kilos</th></tr></thead>
        <tbody>
            ${resultados.map(m => `<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaborador}</td><td>${m.horaSalida}</td><td>${m.horaLlegada||'—'}</td><td>${m.canastillasSalida||0}</td><td>${m.canastillasLlegada||0}</td><td>${m.totalKilos||0}</td></tr>`).join('')}
        </tbody>
    </table>`;
}

function consultarTransporte() {
    const fi = document.getElementById('fechaInicioTransp').value;
    const ff = document.getElementById('fechaFinTransp').value;
    if (!fi || !ff) return alert('⚠️ Seleccione fechas de inicio y fin');
    const resultados = movimientosTransp.filter(m => m.fecha >= fi && m.fecha <= ff);
    ultimosResultados.transporte = resultados;
    const c = document.getElementById('resultadoTransporte');
    if (!c) return;
    if (resultados.length === 0) {
        c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>';
        return;
    }
    let totalSal = 0, totalLleg = 0;
    resultados.forEach(m => { totalSal += m.canastillasSalida||0; totalLleg += m.canastillasLlegada||0; });
    c.innerHTML = `
    <div class="resumen">
        <span>📄 Registros: ${resultados.length}</span>
        <span>📦 Salidas: ${totalSal}</span>
        <span>📦 Llegadas: ${totalLleg}</span>
    </div>
    <table class="tabla mt-3">
        <thead><tr><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th></tr></thead>
        <tbody>
            ${resultados.map(m => `<tr><td>${m.fecha}</td><td>${m.placa}</td><td>${m.conductor||'—'}</td><td>${m.horaSalida}</td><td>${m.horaLlegada||'—'}</td><td>${m.canastillasSalida||0}</td><td>${m.canastillasLlegada||0}</td></tr>`).join('')}
        </tbody>
    </table>`;
}

function consultarCombustible() {
    const fi = document.getElementById('fechaInicioComb').value;
    const ff = document.getElementById('fechaFinComb').value;
    if (!fi || !ff) return alert('⚠️ Seleccione fechas de inicio y fin');
    const resKm = kilometraje.filter(r => r.fecha >= fi && r.fecha <= ff);
    const resTanq = tanqueo.filter(r => r.fecha >= fi && r.fecha <= ff);
    ultimosResultados.kilometraje = resKm;
    ultimosResultados.tanqueo = resTanq;
    const c = document.getElementById('resultadoCombustible');
    if (!c) return;
    c.innerHTML = `
    <h4 class="font-bold mt-2 mb-2">📏 Kilometraje</h4>
    ${resKm.length===0?'<p>📭 Sin registros</p>':`
    <table class="tabla"><thead><tr><th>Fecha</th><th>Placa</th><th>KM Mañana</th><th>KM Tarde</th><th>Recorridos</th><th>Colaborador</th></tr></thead>
    <tbody>${resKm.map(r=>`<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.kmManana??'—'}</td><td>${r.kmTarde??'—'}</td><td>${r.kmRecorridos??'—'}</td><td>${r.colaborador}</td></tr>`).join('')}</tbody></table>`}

    <h4 class="font-bold mt-4 mb-2">⛽ Tanqueo</h4>
    ${resTanq.length===0?'<p>📭 Sin registros</p>':`
    <table class="tabla"><thead><tr><th>Fecha</th><th>Placa</th><th>Tipo</th><th>Cantidad</th><th>Quién tanqueó</th></tr></thead>
    <tbody>${resTanq.map(r=>`<tr><td>${r.fecha}</td><td>${r.placa}</td><td>${r.tipo}</td><td>${r.cantidad}</td><td>${r.colaborador}</td></tr>`).join('')}</tbody></table>`}
    `;
}

function consultarTodosMovimientos() {
    const fi = document.getElementById('fechaInicioTodos').value;
    const ff = document.getElementById('fechaFinTodos').value;
    if (!fi || !ff) return alert('⚠️ Seleccione fechas de inicio y fin');
    const mov1 = movimientos.filter(m => m.fecha >= fi && m.fecha <= ff);
    const mov2 = movimientosTransp.filter(m => m.fecha >= fi && m.fecha <= ff);
    const todos = [...mov1.map(m=>({...m, tipo:'Movimiento'})), ...mov2.map(m=>({...m, tipo:'Transporte'}))];
    todos.sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const c = document.getElementById('resultadoTodos');
    if (!c) return;
    if (todos.length === 0) { c.innerHTML = '<p class="text-center">📭 Sin movimientos en este período</p>'; return; }
    c.innerHTML = `
    <p class="mb-3 font-bold">Total registros: ${todos.length}</p>
    <table class="tabla">
        <thead><tr><th>Tipo</th><th>Fecha</th><th>Placa</th><th>Conductor</th><th>Salida</th><th>Llegada</th><th>Canast. Salida</th><th>Canast. Llegada</th><th>Kilos</th></tr></thead>
        <tbody>
            ${todos.map(m => `<tr><td>${m.tipo}</td><td>${m.fecha}</td><td>${m.placa}</td><td>${m.colaborador||m.conductor||'—'}</td><td>${m.horaSalida}</td><td>${m.horaLlegada||'—'}</td><td>${m.canastillasSalida||0}</td><td>${m.canastillasLlegada||0}</td><td>${m.totalKilos||'—'}</td></tr>`).join('')}
        </tbody>
    </table>`;
}

// ===== EXPORTAR EXCEL =====
function exportarExcelMovimientos() {
    if (!ultimosResultados.movimientos || ultimosResultados.movimientos.length === 0) return alert('⚠️ Primero consulte los datos');
    const datos = ultimosResultados.movimientos.map(m => ({
        Fecha: m.fecha, Placa: m.placa, Conductor: m.colaborador,
        HoraSalida: m.horaSalida, HoraLlegada: m.horaLlegada||'',
        CanastillasSalida: m.canastillasSalida||0, CanastillasLlegada: m.canastillasLlegada||0,
        Kilos: m.totalKilos||0
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');
    XLSX.writeFile(libro, `Movimientos_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportarExcelTransporte() {
    if (!ultimosResultados.transporte || ultimosResultados.transporte.length === 0) return alert('⚠️ Primero consulte los datos');
    const datos = ultimosResultados.transporte.map(m => ({
        Fecha: m.fecha, Placa: m.placa, Conductor: m.conductor||'',
        HoraSalida: m.horaSalida, HoraLlegada: m.horaLlegada||'',
        CanastillasSalida: m.canastillasSalida||0, CanastillasLlegada: m.canastillasLlegada||0
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Transporte');
    XLSX.writeFile(libro, `Transporte_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportarExcelCombustible() {
    if ((!ultimosResultados.kilometraje || ultimosResultados.kilometraje.length === 0) &&
        (!ultimosResultados.tanqueo || ultimosResultados.tanqueo.length === 0)) return alert('⚠️ Primero consulte los datos');
    const libro = XLSX.utils.book_new();
    if (ultimosResultados.kilometraje.length > 0) {
        const datosKm = ultimosResultados.kilometraje.map(r => ({
            Fecha: r.fecha, Placa: r.placa, KilometrajeMañana: r.kmManana||'', KilometrajeTarde: r.kmTarde||'',
            KilometrosRecorridos: r.kmRecorridos||'', Colaborador: r.colaborador
        }));
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosKm), 'Kilometraje');
    }
    if (ultimosResultados.tanqueo.length > 0) {
        const datosTq = ultimosResultados.tanqueo.map(r => ({
            Fecha: r.fecha, Placa: r.placa, Tipo: r.tipo, Cantidad: r.cantidad, Colaborador: r.colaborador
        }));
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosTq), 'Tanqueo');
    }
    XLSX.writeFile(libro, `Combustible_${new Date().toISOString().slice(0,10)}.xlsx`);
}