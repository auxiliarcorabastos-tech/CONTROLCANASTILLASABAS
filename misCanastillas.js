// =====================================================
// ===== 📦 MÓDULO MIS CANASTILLAS =====
// =====================================================
window.cargarModulo_misCanastillas = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    const c = document.getElementById('contenido');
    if (!c) return;

    // Obtener nombre del colaborador activo
    const colaboradorActual = usuarioActivo?.nombre || '';
    if (!colaboradorActual) {
        c.innerHTML = `<div class="tarjeta">⚠️ No se identificó el colaborador activo</div>`;
        return;
    }

    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaCanastillas('miControl', event)">📋 Mi Control</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaCanastillas('transferir', event)">🔄 Transferir</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaCanastillas('historial', event)">📜 Historial</button>
    </div>

    <!-- ===== MI CONTROL DE CANASTILLAS ===== -->
    <div id="subcanastillas-miControl">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📋 Mis Canastillas — ${colaboradorActual}</h3>
            
            <!-- RESUMEN ACTUAL -->
            <div class="resumen mb-4">
                <div>📦 En mi poder: <strong id="misCanastillasActuales">0</strong></div>
                <div>✅ Recibidas: <strong id="misCanastillasRecibidas">0</strong></div>
                <div>📤 Enviadas: <strong id="misCanastillasEnviadas">0</strong></div>
                <div>⚖️ Kilos enviados: <strong id="misKilosEnviados">0</strong></div>
                <div>📥 Kilos recibidos: <strong id="misKilosRecibidos">0</strong></div>
            </div>

            <!-- MOVIMIENTO ACTIVO -->
            <div id="miMovimientoActivo" class="mb-4" style="display:none;">
                <h4 class="font-bold text-blue-700 mb-2">🚗 Movimiento Activo</h4>
                <div class="tarjeta p-3 bg-blue-50">
                    <p><strong>Placa:</strong> <span id="miPlacaActiva">—</span></p>
                    <p><strong>Hora de salida:</strong> <span id="miHoraSalida">—</span></p>
                    <p><strong>Canastillas que salí con:</strong> <span id="misCanastillasSalida">0</span></p>
                </div>
            </div>

            <!-- TRANSFERENCIAS ACTIVAS -->
            <h4 class="font-bold mb-2">🔄 Con quién intercambié</h4>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Tipo</th>
                        <th>Colaborador</th>
                        <th>Cantidad</th>
                        <th>Kilos</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody id="tablaIntercambiosCuerpo"></tbody>
            </table>
        </div>
    </div>

    <!-- ===== TRANSFERIR CANASTILLAS ===== -->
    <div id="subcanastillas-transferir" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">🔄 Transferir Canastillas</h3>
            
            <div class="grupo mb-3">
                <label>📦 Mis canastillas disponibles: <strong id="dispCanastillas">0</strong></label>
            </div>

            <div class="grid-2">
                <div class="grupo">
                    <label>Colaborador destino (solo con salida activa)</label>
                    <select id="destinoTransferencia">
                        <option value="">-- Seleccione colaborador --</option>
                    </select>
                </div>
                <div class="grupo">
                    <label>Cantidad a transferir</label>
                    <input type="number" id="cantidadTransferir" min="1" value="1">
                </div>
                <div class="grupo" style="grid-column: span 2;">
                    <label>Observaciones</label>
                    <input type="text" id="obsTransferencia" placeholder="Motivo, lugar, etc.">
                </div>
            </div>

            <div class="flex gap-2 mt-4">
                <button class="btn btn-exito" onclick="confirmarTransferencia()">✅ Confirmar Transferencia</button>
                <button class="btn" onclick="cargarModulo_misCanastillas()">🔄 Cancelar</button>
            </div>
        </div>
    </div>

    <!-- ===== HISTORIAL ===== -->
    <div id="subcanastillas-historial" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📜 Historial de Movimientos</h3>
            <div class="grupo mb-3">
                <label>🔍 Buscar por fecha o colaborador:</label>
                <input type="text" id="buscarHistorialCan" placeholder="Escriba aquí..." oninput="filtrarHistorialCan()">
            </div>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Tipo</th>
                        <th>Con</th>
                        <th>Cantidad</th>
                        <th>Kilos</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody id="tablaHistorialCanCuerpo"></tbody>
            </table>
        </div>
    </div>
    `;

    // Cargar datos iniciales
    await actualizarVistaMisCanastillas();
    cargarColaboradoresDisponibles();
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaCanastillas(nombre, evento) {
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evento) evento.currentTarget.classList.add('activa');
    document.querySelectorAll('[id^="subcanastillas-"]').forEach(d => d.classList.add('oculto'));
    document.getElementById(`subcanastillas-${nombre}`).classList.remove('oculto');

    if (nombre === 'transferir') {
        cargarColaboradoresDisponibles();
        actualizarVistaMisCanastillas();
    }
    if (nombre === 'historial') dibujarHistorialCan();
}

// =====================================================
// ===== OBTENER ESTADO ACTUAL DEL COLABORADOR =====
// =====================================================
function obtenerEstadoColaborador(nombreColab) {
    // Movimientos donde salió este colaborador y NO ha llegado
    const movimientoActivo = movimientos.find(m => 
        m.colaborador === nombreColab && !m.horaLlegada
    );

    // Calcular saldo de canastillas:
    // Salidas propias + transferencias recibidas - transferencias enviadas
    const salidasPropias = movimientos
        .filter(m => m.colaborador === nombreColab)
        .reduce((s, m) => s + (m.canastillasSalida || 0), 0);

    const llegadasPropias = movimientos
        .filter(m => m.colaborador === nombreColab && m.horaLlegada)
        .reduce((s, m) => s + (m.canastillasLlegada || 0), 0);

    // Transferencias: leer del almacenamiento (se guarda junto con movimientos)
    const transferenciasRecibidas = (window.transferenciasCanastillas || [])
        .filter(t => t.destino === nombreColab)
        .reduce((s, t) => s + (t.cantidad || 0), 0);

    const transferenciasEnviadas = (window.transferenciasCanastillas || [])
        .filter(t => t.origen === nombreColab)
        .reduce((s, t) => s + (t.cantidad || 0), 0);

    // Kilos
    const kilosEnviados = (window.transferenciasCanastillas || [])
        .filter(t => t.origen === nombreColab)
        .reduce((s, t) => s + (t.kilos || 0), 0);

    const kilosRecibidos = (window.transferenciasCanastillas || [])
        .filter(t => t.destino === nombreColab)
        .reduce((s, t) => s + (t.kilos || 0), 0);

    // Canastillas actuales = salidas que no han regresado + recibidas - enviadas
    const salidasActivas = movimientos
        .filter(m => m.colaborador === nombreColab && !m.horaLlegada)
        .reduce((s, m) => s + (m.canastillasSalida || 0), 0);

    const canastillasActuales = salidasActivas + transferenciasRecibidas - transferenciasEnviadas;

    return {
        movimientoActivo,
        canastillasActuales,
        salidasPropias,
        llegadasPropias,
        transferenciasRecibidas,
        transferenciasEnviadas,
        kilosEnviados,
        kilosRecibidos
    };
}

// =====================================================
// ===== ACTUALIZAR VISTA PRINCIPAL =====
// =====================================================
async function actualizarVistaMisCanastillas() {
    const colaboradorActual = usuarioActivo?.nombre || '';
    if (!colaboradorActual) return;

    const estado = obtenerEstadoColaborador(colaboradorActual);

    // Actualizar resumen
    const elActual = document.getElementById('misCanastillasActuales');
    const elRecibidas = document.getElementById('misCanastillasRecibidas');
    const elEnviadas = document.getElementById('misCanastillasEnviadas');
    const elKilosEnviados = document.getElementById('misKilosEnviados');
    const elKilosRecibidos = document.getElementById('misKilosRecibidos');
    const elDisp = document.getElementById('dispCanastillas');

    if (elActual) elActual.textContent = estado.canastillasActuales;
    if (elRecibidas) elRecibidas.textContent = estado.transferenciasRecibidas;
    if (elEnviadas) elEnviadas.textContent = estado.transferenciasEnviadas;
    if (elKilosEnviados) elKilosEnviados.textContent = estado.kilosEnviados.toFixed(2);
    if (elKilosRecibidos) elKilosRecibidos.textContent = estado.kilosRecibidos.toFixed(2);
    if (elDisp) elDisp.textContent = estado.canastillasActuales;

    // Mostrar movimiento activo
    const divMovActivo = document.getElementById('miMovimientoActivo');
    if (estado.movimientoActivo) {
        if (divMovActivo) divMovActivo.style.display = 'block';
        const placa = document.getElementById('miPlacaActiva');
        const horaSalida = document.getElementById('miHoraSalida');
        const canSalida = document.getElementById('misCanastillasSalida');
        if (placa) placa.textContent = estado.movimientoActivo.placa;
        if (horaSalida) horaSalida.textContent = estado.movimientoActivo.horaSalida;
        if (canSalida) canSalida.textContent = estado.movimientoActivo.canastillasSalida || 0;
    } else {
        if (divMovActivo) divMovActivo.style.display = 'none';
    }

    // Tabla de intercambios recientes
    dibujarIntercambiosRecientes();
}

// =====================================================
// ===== CARGAR COLABORADORES CON SALIDA ACTIVA =====
// =====================================================
function cargarColaboradoresDisponibles() {
    const sel = document.getElementById('destinoTransferencia');
    if (!sel) return;

    const colaboradorActual = usuarioActivo?.nombre || '';
    
    // Colaboradores que tienen movimiento sin llegar y NO soy yo
    const conSalidaActiva = colaboradores.filter(c => {
        if (c.nombre === colaboradorActual) return false;
        return movimientos.some(m => m.colaborador === c.nombre && !m.horaLlegada);
    });

    sel.innerHTML = `<option value="">-- Seleccione colaborador --</option>` +
        conSalidaActiva.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

// =====================================================
// ===== CONFIRMAR TRANSFERENCIA =====
// =====================================================
async function confirmarTransferencia() {
    const origen = usuarioActivo?.nombre;
    const destino = document.getElementById('destinoTransferencia').value;
    const cantidad = parseInt(document.getElementById('cantidadTransferir').value) || 0;
    const observaciones = document.getElementById('obsTransferencia').value;

    if (!origen || !destino || cantidad <= 0) {
        return alert('⚠️ Complete todos los datos correctamente');
    }

    const estadoOrigen = obtenerEstadoColaborador(origen);
    if (cantidad > estadoOrigen.canastillasActuales) {
        return alert(`⚠️ Solo tiene ${estadoOrigen.canastillasActuales} canastillas disponibles`);
    }

    // Buscar si hay recogida asociada para traer los kilos
    // Encontrar movimiento activo del origen para extraer peso transportado
    const movActivoOrigen = movimientos.find(m => m.colaborador === origen && !m.horaLlegada);
    let kilosTransferidos = 0;
    if (movActivoOrigen && movActivoOrigen.recogidas) {
        // Si hay recogida "recoge a" = destino, asignar esos kilos
        const recogidaRelacionada = movActivoOrigen.recogidas.find(r => r.recogeA === destino);
        if (recogidaRelacionada) {
            kilosTransferidos = recogidaRelacionada.kilos || 0;
        }
    }

    if (!confirm(`¿Transferir ${cantidad} canastillas de ${origen} a ${destino}?`)) return;

    // Inicializar almacén de transferencias si no existe
    if (!window.transferenciasCanastillas) window.transferenciasCanastillas = [];

    const nuevaTransferencia = {
        id: Date.now().toString(36),
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }),
        origen,
        destino,
        cantidad,
        kilos: kilosTransferidos,
        observaciones,
        estado: 'completada',
        movimientoOrigenId: movActivoOrigen?.id || null
    };

    window.transferenciasCanastillas.push(nuevaTransferencia);
    
    // Persistir en localStorage (opcional, si usas Firestore puedes guardarlo también)
    localStorage.setItem('transferenciasCanastillas', JSON.stringify(window.transferenciasCanastillas));

    alert(`✅ Transferencia realizada:\n${cantidad} canastillas → ${destino}\n${kilosTransferidos.toFixed(2)} kg transportado`);
    
    // Recargar vista
    await actualizarVistaMisCanastillas();
    cargarColaboradoresDisponibles();
    
    // Limpiar formulario
    document.getElementById('cantidadTransferir').value = '1';
    document.getElementById('obsTransferencia').value = '';
    document.getElementById('destinoTransferencia').value = '';
}

// =====================================================
// ===== DIBUJAR INTERCAMBIOS RECIENTES =====
// =====================================================
function dibujarIntercambiosRecientes() {
    const tb = document.getElementById('tablaIntercambiosCuerpo');
    const colaboradorActual = usuarioActivo?.nombre;
    if (!tb || !colaboradorActual) return;

    const transferencias = window.transferenciasCanastillas || [];
    const misIntercambios = transferencias.filter(t => 
        t.origen === colaboradorActual || t.destino === colaboradorActual
    ).sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)).slice(0, 10);

    tb.innerHTML = misIntercambios.length === 0
        ? '<tr><td colspan="6" class="text-center">📭 Sin intercambios recientes</td></tr>'
        : misIntercambios.map(t => {
            const esSalida = t.origen === colaboradorActual;
            return `
            <tr>
                <td>${t.fecha} ${t.hora}</td>
                <td>${esSalida ? '<span style="color:red;">📤 Envié</span>' : '<span style="color:green;">📥 Recibí</span>'}</td>
                <td>${esSalida ? t.destino : t.origen}</td>
                <td><strong>${t.cantidad}</strong></td>
                <td>${t.kilos.toFixed(2)}</td>
                <td>${t.estado === 'completada' ? '✅ Completada' : '⏳ Pendiente'}</td>
            </tr>`;
        }).join('');
}

// =====================================================
// ===== DIBUJAR HISTORIAL COMPLETO =====
// =====================================================
function dibujarHistorialCan() {
    const tb = document.getElementById('tablaHistorialCanCuerpo');
    const colaboradorActual = usuarioActivo?.nombre;
    if (!tb || !colaboradorActual) return;

    const transferencias = window.transferenciasCanastillas || [];
    const textoBuscar = document.getElementById('buscarHistorialCan')?.value?.toLowerCase() || '';

    const registros = transferencias
        .filter(t => t.origen === colaboradorActual || t.destino === colaboradorActual)
        .filter(t => {
            if (!textoBuscar) return true;
            return t.fecha.includes(textoBuscar) ||
                   t.origen.toLowerCase().includes(textoBuscar) ||
                   t.destino.toLowerCase().includes(textoBuscar);
        })
        .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));

    tb.innerHTML = registros.length === 0
        ? '<tr><td colspan="7" class="text-center">📭 Sin registros en el historial</td></tr>'
        : registros.map(t => {
            const esSalida = t.origen === colaboradorActual;
            return `
            <tr>
                <td>${t.fecha}</td>
                <td>${t.hora}</td>
                <td>${esSalida ? '📤 Enviado' : '📥 Recibido'}</td>
                <td>${esSalida ? t.destino : t.origen}</td>
                <td>${t.cantidad}</td>
                <td>${t.kilos.toFixed(2)}</td>
                <td>${t.observaciones || '—'}</td>
            </tr>`;
        }).join('');
}

function filtrarHistorialCan() {
    dibujarHistorialCan();
}

// =====================================================
// ===== INTEGRACIÓN: ACTUALIZAR CANASTILLAS AL COMPLETAR MOVIMIENTO =====
// =====================================================
// Reemplaza la función existente para que sincronice el cierre
const completarMovimientoOriginal = completarMovimientoDirecto;
window.completarMovimientoDirecto = async function(id) {
    await completarMovimientoOriginal(id);
    // Al cerrar movimiento, refrescar vista de canastillas
    if (window.cargarModulo_misCanastillas) {
        await actualizarVistaMisCanastillas();
    }
};

const completarSeleccionadosOriginal = completarSeleccionados;
window.completarSeleccionados = async function() {
    await completarSeleccionadosOriginal();
    if (window.cargarModulo_misCanastillas) {
        await actualizarVistaMisCanastillas();
    }
};

// Cargar transferencias guardadas al iniciar
window.inicializarTransferenciasCanastillas = function() {
    const guardadas = localStorage.getItem('transferenciasCanastillas');
    if (guardadas) {
        try {
            window.transferenciasCanastillas = JSON.parse(guardadas);
        } catch {
            window.transferenciasCanastillas = [];
        }
    } else {
        window.transferenciasCanastillas = [];
    }
};
// Ejecutar al cargar el sistema
window.inicializarTransferenciasCanastillas();