// =====================================================
// ===== ⛽ MÓDULO COMBUSTIBLE — CON BORRADO TOTAL =====
// =====================================================
window.cargarModulo_combustible = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subcombustible activa" onclick="cambiarSubpestañaCombustible('kilometraje')">📏 Kilometraje Diario</button>
        <button class="btn-subcombustible" onclick="cambiarSubpestañaCombustible('tanqueo')">⛽ Registro de Tanqueo</button>
        <button class="btn-subcombustible" onclick="cambiarSubpestañaCombustible('importar')">📥 Importar Excel</button>
        <button class="btn-subcombustible" style="background:#fee2e2; color:#b91c1c;" onclick="cambiarSubpestañaCombustible('herramientas')">🛠️ Herramientas</button>
    </div>

    <!-- ============================================== -->
    <!-- SUBPESTAÑA: HERRAMIENTAS (BORRADO TOTAL) -->
    <!-- ============================================== -->
    <div id="subcomb-herramientas" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-4 text-red-600">⚠️ Herramientas de Administración</h3>
            
            <div class="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <h4 class="font-bold text-red-700 mb-2">🗑️ Eliminar Todos los Registros de Kilometraje</h4>
                <p class="text-sm text-gray-600 mb-3">Esta acción borra <strong>TODOS</strong> los registros de kilometraje guardados. No se puede deshacer.</p>
                <button onclick="eliminarTodosKilometraje()" class="btn" style="background:#fecaca; color:#991b1b; border:1px solid #fca5a5;">
                    🗑️ Eliminar Todo
                </button>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h4 class="font-bold text-amber-700 mb-2">📊 Información</h4>
                <p class="text-sm text-gray-600">Los registros de <strong>Tanqueo</strong> no se ven afectados.</p>
                <p class="text-sm text-gray-500 mt-2">Opción temporal — usar con precaución</p>
            </div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBPESTAÑA: IMPORTAR DESDE EXCEL -->
    <!-- ============================================== -->
    <div id="subcomb-importar" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">📥 Importar Kilometraje desde Excel</h3>

            <div style="background:#eff6ff; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;">
                <p class="font-bold mb-2">📋 Formato del Excel</p>
                <table style="border-collapse:collapse; width:100%; font-size:0.9rem;">
                    <tr style="background:#dbeafe;">
                        <th style="border:1px solid #93c5fd; padding:6px; text-align:left;">FECHA</th>
                        <th style="border:1px solid #93c5fd; padding:6px; text-align:left;">PLACA</th>
                        <th style="border:1px solid #93c5fd; padding:6px; text-align:left;">KM INICIO</th>
                        <th style="border:1px solid #93c5fd; padding:6px; text-align:left;">KM FINAL</th>
                    </tr>
                    <tr>
                        <td style="border:1px solid #ccc; padding:6px;">03/08/2026</td>
                        <td style="border:1px solid #ccc; padding:6px;">352 AFK</td>
                        <td style="border:1px solid #ccc; padding:6px;">47452</td>
                        <td style="border:1px solid #ccc; padding:6px;">47520</td>
                    </tr>
                </table>
            </div>

            <div class="grupo">
                <label>Selecciona tu archivo Excel (.xlsx o .csv)</label>
                <input type="file" id="archivoExcelKm" accept=".xlsx,.csv" onchange="procesarExcelKilometraje(this)">
            </div>

            <div id="previewExcel" class="mt-4 oculto">
                <h4 class="font-bold mb-2">👀 Vista Previa</h4>
                <div id="contenidoPreview" style="overflow-x:auto;"></div>
                <button class="btn btn-exito mt-3" onclick="confirmarCargaExcel()">✅ Guardar Todos los Datos</button>
            </div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBPESTAÑA: KILOMETRAJE -->
    <!-- ============================================== -->
    <div id="subcomb-kilometraje">
        <div class="tarjeta">
            <h3 class="font-bold mb-3" id="tituloFormKm">📏 Registrar Kilometraje</h3>
            <form id="form-kilometraje">
                <input type="hidden" id="idEditarKm" value="">
                <div class="grid-2">
                    <div class="grupo">
                        <label>Fecha</label>
                        <input type="date" id="fechaKm" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="grupo">
                        <label>Placa del Vehículo</label>
                        <select id="vehiculoKm" required>
                            <option value="">-- Seleccione --</option>
                            ${vehiculosMov.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Kilometraje Inicio</label>
                        <input type="number" id="kmManana" min="0" placeholder="0">
                    </div>
                    <div class="grupo">
                        <label>Kilometraje Final</label>
                        <input type="number" id="kmTarde" min="0" placeholder="0" oninput="calcularRecorrido()">
                    </div>
                    <div class="grupo">
                        <label>Kilómetros Recorridos</label>
                        <input type="number" id="kmRecorridos" readonly style="background:#f3f4f6;" placeholder="Se calcula automático">
                    </div>
                    <div class="grupo">
                        <label>Colaborador</label>
                        <select id="colaboradorKm" required>
                            <option value="">-- Seleccione --</option>
                            ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button type="button" class="btn btn-primario" id="btnGuardarKm" onclick="guardarKilometrajeDiario()">💾 Guardar Registro</button>
                    <button type="reset" class="btn" id="btnCancelarEditarKm" onclick="cancelarEdicionKm()" style="display:none;">❌ Cancelar</button>
                </div>
            </form>
        </div>

        <div class="tarjeta mt-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-bold">📊 Historial — Mes Actual</h3>
                <span class="text-sm text-gray-500">Solo mes en curso</span>
            </div>
            <div id="listadoKilometraje"></div>
        </div>
    </div>

    <!-- ============================================== -->
    <!-- SUBPESTAÑA: TANQUEO -->
    <!-- ============================================== -->
    <div id="subcomb-tanqueo" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">⛽ Registro de Tanqueo</h3>
            <form id="form-tanqueo">
                <div class="grid-2">
                    <div class="grupo">
                        <label>Fecha</label>
                        <input type="date" id="fechaTanqueo" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="grupo">
                        <label>Placa</label>
                        <select id="placaTanqueo" required>
                            <option value="">-- Seleccione --</option>
                            ${vehiculosMov.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Nivel de Tanque</label>
                        <select id="nivelTanqueo">
                            <option value="full">✅ Lleno / Full</option>
                            <option value="75">🟢 3/4 — 75%</option>
                            <option value="50">🟡 1/2 — 50%</option>
                            <option value="25">🟠 1/4 — 25%</option>
                        </select>
                    </div>
                    <div class="grupo">
                        <label>Colaborador que tanqueó</label>
                        <select id="colaboradorTanqueo" required>
                            <option value="">-- Seleccione --</option>
                            ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="button" class="btn btn-primario mt-3" onclick="guardarTanqueo()">💾 Guardar Tanqueo</button>
            </form>
        </div>
    </div>
    `;

    dibujarKilometraje();
};

// =====================================================
// ===== ✅ ELIMINAR TODOS LOS REGISTROS =====
// =====================================================
async function eliminarTodosKilometraje() {
    // ⚠️ CONFIRMACIÓN TRIPLE para evitar errores
    const confirmar1 = confirm('⚠️ ¿Está SEGURO de eliminar TODOS los registros de kilometraje?\n\nEsta acción NO se puede deshacer.');
    if (!confirmar1) return;

    const confirmar2 = confirm('🔴 CONFIRMACIÓN 2:\n\nSe borrarán TODOS los registros de kilometraje de la base de datos.\n¿Continuar?');
    if (!confirmar2) return;

    const confirmar3 = prompt('Escribe BORRAR TODO para confirmar:');
    if (confirmar3 !== 'BORRAR TODO') {
        alert('❌ No coincide. Operación cancelada.');
        return;
    }

    try {
        const snap = await db.collection('kilometraje').get();
        
        if (snap.empty) {
            alert('ℹ️ No hay registros para eliminar.');
            return;
        }

        const cantidad = snap.docs.length;
        const borrar = [];
        snap.docs.forEach(doc => borrar.push(doc.ref.delete()));
        
        await Promise.all(borrar);
        
        alert(`✅ Se eliminaron ${cantidad} registros de kilometraje`);
        
        // Limpiar arreglo local y redibujar
        kilometraje = [];
        dibujarKilometraje();
        
    } catch (error) {
        alert('❌ Error al eliminar: ' + error.message);
    }
}

// =====================================================
// ===== FILTRO: SOLO MES ACTUAL =====
// =====================================================
function obtenerRangoMesActual() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    return { primerDiaMes, ultimoDiaMes };
}

// =====================================================
// ===== CONVERTIR FECHA DE EXCEL =====
// =====================================================
function convertirFechaExcel(valor) {
    if (!valor) return null;
    if (typeof valor === 'number' || (!isNaN(valor) && String(valor).length >= 5)) {
        const num = Number(valor);
        if (num > 25569) {
            const fecha = new Date((num - 25569) * 86400 * 1000);
            return fecha.toISOString().split('T')[0];
        }
    }
    if (typeof valor === 'string' && valor.includes('/')) {
        const partes = valor.split('/');
        if (partes.length === 3 && partes[2].length === 4) {
            return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
        }
    }
    if (typeof valor === 'string' && valor.includes('-') && valor.length === 10) {
        return valor;
    }
    return String(valor);
}

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaCombustible(nombre) {
    document.querySelectorAll('.btn-subcombustible').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('[id^="subcomb-"]').forEach(p => p.classList.add('oculto'));
    event.target.classList.add('activa');
    document.getElementById(`subcomb-${nombre}`).classList.remove('oculto');
    if (nombre === 'kilometraje') dibujarKilometraje();
}

// =====================================================
// ===== CALCULAR RECORRIDO =====
// =====================================================
function calcularRecorrido() {
    const mañana = parseFloat(document.getElementById('kmManana').value) || 0;
    const tarde = parseFloat(document.getElementById('kmTarde').value) || 0;
    document.getElementById('kmRecorridos').value = Math.max(0, tarde - mañana);
}

// =====================================================
// ===== GUARDAR: CREAR / ACTUALIZAR =====
// =====================================================
async function guardarKilometrajeDiario() {
    const idEditar = document.getElementById('idEditarKm').value;
    const fecha = document.getElementById('fechaKm').value;
    const placa = document.getElementById('vehiculoKm').value.trim();
    const kmInicio = parseFloat(document.getElementById('kmManana').value) || 0;
    const kmFinal = parseFloat(document.getElementById('kmTarde').value) || 0;
    const colaborador = document.getElementById('colaboradorKm').value.trim();

    if (!fecha || !placa || !colaborador) return alert('⚠️ Complete todos los campos');
    if (kmFinal < kmInicio) return alert('⚠️ KM Final no puede ser menor que KM Inicio');

    const datos = {
        fecha, placa, kmInicio, kmFinal,
        kmRecorridos: kmFinal - kmInicio,
        colaborador,
        fechaActualizacion: new Date().toISOString()
    };

    if (idEditar) {
        await db.collection('kilometraje').doc(idEditar).update(datos);
        alert('✅ Registro actualizado');
    } else {
        datos.fechaRegistro = new Date().toISOString();
        await db.collection('kilometraje').add(datos);
        alert('✅ Registro guardado');
    }
    cancelarEdicionKm();
    dibujarKilometraje();
}

// =====================================================
// ===== EDITAR / CANCELAR / ELIMINAR =====
// =====================================================
function editarKilometraje(id) {
    const registro = kilometraje.find(k => k.id === id);
    if (!registro) return alert('Registro no encontrado');

    document.getElementById('idEditarKm').value = id;
    document.getElementById('fechaKm').value = registro.fecha;
    document.getElementById('vehiculoKm').value = registro.placa;
    document.getElementById('kmManana').value = registro.kmInicio;
    document.getElementById('kmTarde').value = registro.kmFinal;
    document.getElementById('colaboradorKm').value = registro.colaborador;
    calcularRecorrido();

    document.getElementById('tituloFormKm').textContent = '✏️ Editar Kilometraje';
    document.getElementById('btnGuardarKm').textContent = '💾 Actualizar Registro';
    document.getElementById('btnCancelarEditarKm').style.display = 'inline-block';
    document.getElementById('tituloFormKm').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionKm() {
    document.getElementById('idEditarKm').value = '';
    document.getElementById('tituloFormKm').textContent = '📏 Registrar Kilometraje';
    document.getElementById('btnGuardarKm').textContent = '💾 Guardar Registro';
    document.getElementById('btnCancelarEditarKm').style.display = 'none';
    document.getElementById('form-kilometraje').reset();
    document.getElementById('fechaKm').value = new Date().toISOString().split('T')[0];
}

async function eliminarKilometraje(id) {
    if (!confirm('⚠️ ¿Eliminar este registro?')) return;
    await db.collection('kilometraje').doc(id).delete();
    alert('✅ Eliminado');
    dibujarKilometraje();
}

// =====================================================
// ===== PROCESAR EXCEL =====
// =====================================================
let datosPendientesExcel = [];

async function procesarExcelKilometraje(input) {
    const archivo = input.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const libro = XLSX.read(e.target.result, { type: 'binary' });
            const hoja = libro.Sheets[libro.SheetNames[0]];
            const filas = XLSX.utils.sheet_to_json(hoja, { header: ['fecha', 'placa', 'kmInicio', 'kmFinal'] });
            filas.shift();

            datosPendientesExcel = [];
            const errores = [];
            const { primerDiaMes, ultimoDiaMes } = obtenerRangoMesActual();

            filas.forEach((fila, indice) => {
                if (!fila.fecha || !fila.placa) return;
                const fecha = convertirFechaExcel(fila.fecha);

                if (fecha < primerDiaMes || fecha > ultimoDiaMes) {
                    errores.push(`Fila ${indice+2}: ${fecha} — Fuera del mes actual`);
                }

                const kmInicio = parseFloat(fila.kmInicio) || 0;
                const kmFinal = parseFloat(fila.kmFinal) || 0;

                if (kmFinal < kmInicio) {
                    errores.push(`Fila ${indice+2}: KM Final < Inicio — ${fila.placa}`);
                    return;
                }

                datosPendientesExcel.push({
                    fecha,
                    placa: String(fila.placa).trim().toUpperCase(),
                    kmInicio,
                    kmFinal,
                    kmRecorridos: kmFinal - kmInicio,
                    colaborador: usuarioActivo?.nombre || 'Importado de Excel'
                });
            });

            const contenedor = document.getElementById('contenidoPreview');
            document.getElementById('previewExcel').classList.remove('oculto');

            if (datosPendientesExcel.length === 0) {
                contenedor.innerHTML = '<p class="text-center text-red-600">⚠️ Sin datos válidos</p>';
                return;
            }

            contenedor.innerHTML = `
                <p class="mb-2">✅ ${datosPendientesExcel.length} registros listos para cargar:</p>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="background:#f3f4f6;">
                        <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                        <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                        <th style="border:1px solid #ccc; padding:6px;">KM Inicio</th>
                        <th style="border:1px solid #ccc; padding:6px;">KM Final</th>
                        <th style="border:1px solid #ccc; padding:6px;">Recorridos</th>
                    </tr>
                    ${datosPendientesExcel.map(d => `
                        <tr>
                            <td style="border:1px solid #ccc; padding:6px; font-weight:bold;">${d.fecha}</td>
                            <td style="border:1px solid #ccc; padding:6px;">${d.placa}</td>
                            <td style="border:1px solid #ccc; padding:6px;">${d.kmInicio}</td>
                            <td style="border:1px solid #ccc; padding:6px;">${d.kmFinal}</td>
                            <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:#2563eb;">${d.kmRecorridos}</td>
                        </tr>
                    `).join('')}
                </table>
                ${errores.length > 0 ? `<p class="text-amber-600 mt-2">⚠️ ${errores.length} filas con fechas fuera del mes</p>` : ''}
            `;
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };
    lector.readAsBinaryString(archivo);
}

async function confirmarCargaExcel() {
    if (datosPendientesExcel.length === 0) return alert('Sin datos para guardar');
    if (!confirm(`¿Guardar ${datosPendientesExcel.length} registros?`)) return;

    let guardados = 0;
    for (const d of datosPendientesExcel) {
        await db.collection('kilometraje').add({
            ...d,
            fechaRegistro: new Date().toISOString()
        });
        guardados++;
    }

    alert(`✅ ${guardados} registros guardados`);
    datosPendientesExcel = [];
    document.getElementById('previewExcel').classList.add('oculto');
    document.getElementById('archivoExcelKm').value = '';
}

// =====================================================
// ===== LISTADO SOLO MES ACTUAL =====
// =====================================================
function dibujarKilometraje() {
    const lista = document.getElementById('listadoKilometraje');
    if (!lista) return;

    const { primerDiaMes, ultimoDiaMes } = obtenerRangoMesActual();
    const delMes = kilometraje.filter(k => k.fecha >= primerDiaMes && k.fecha <= ultimoDiaMes);

    if (delMes.length === 0) {
        lista.innerHTML = `<p class="text-center text-gray-500">Sin registros este mes<br><small>(${primerDiaMes} al ${ultimoDiaMes})</small></p>`;
        return;
    }

    lista.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                <th style="border:1px solid #ccc; padding:6px;">Placa</th>
                <th style="border:1px solid #ccc; padding:6px;">KM Inicio</th>
                <th style="border:1px solid #ccc; padding:6px;">KM Final</th>
                <th style="border:1px solid #ccc; padding:6px;">Recorridos</th>
                <th style="border:1px solid #ccc; padding:6px;">Acciones</th>
            </tr>
            ${delMes.map(k => `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${k.fecha}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.placa}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.kmInicio}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${k.kmFinal}</td>
                    <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:#2563eb;">${k.kmRecorridos}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:center;">
                        <button onclick="editarKilometraje('${k.id}')" style="padding:2px 6px; background:#dbeafe; border:none; border-radius:4px; margin-right:4px;">✏️</button>
                        <button onclick="eliminarKilometraje('${k.id}')" style="padding:2px 6px; background:#fee2e2; border:none; border-radius:4px;">🗑️</button>
                    </td>
                </tr>
            `).join('')}
        </table>
    `;
}

// =====================================================
// ===== GUARDAR TANQUEO =====
// =====================================================
async function guardarTanqueo() {
    const fecha = document.getElementById('fechaTanqueo').value;
    const placa = document.getElementById('placaTanqueo').value.trim();
    const nivel = document.getElementById('nivelTanqueo').value;
    const colaborador = document.getElementById('colaboradorTanqueo').value.trim();

    if (!fecha || !placa || !colaborador) return alert('⚠️ Complete todos los campos');

    await db.collection('tanqueo').add({
        fecha, placa, nivel, colaborador,
        fechaRegistro: new Date().toISOString()
    });

    alert('✅ Tanqueo registrado');
    document.getElementById('form-tanqueo').reset();
    document.getElementById('fechaTanqueo').value = new Date().toISOString().split('T')[0];
}