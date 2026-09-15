// =====================================================
// ===== ⚙️ MÓDULO DE ADMINISTRACIÓN =====
// =====================================================

// =====================================================
// ===== CARGAR VISTA DE ADMINISTRACIÓN =====
// =====================================================
window.cargarModulo_administracion = async function() {
    const c = document.getElementById('contenido'); // ✅ CORREGIDO
    if (!c) return; // ✅ Protección
    c.innerHTML = `
    <div class="flex gap-2 mb-4">
        <button class="btn-subpestaña activa" onclick="cambiarSubAdmin('usuarios')">👤 Usuarios del Sistema</button>
        <button class="btn-subpestaña" onclick="cambiarSubAdmin('colaboradores')">👥 Colaboradores</button>
        <button class="btn-subpestaña" onclick="cambiarSubAdmin('vehiculos')">🚛 Vehículos</button>
        <button class="btn-subpestaña" onclick="cambiarSubAdmin('configuracion')">🔧 Configuración</button>
    </div>

    <!-- USUARIOS DEL SISTEMA -->
    <div id="subadmin-usuarios">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">👤 Gestionar Usuarios</h3>
            <div class="grid-2">
                <div class="grupo">
                    <label>Usuario (Inicio de sesión)</label>
                    <input type="text" id="usuarioNuevo" placeholder="jgarnica">
                </div>
                <div class="grupo">
                    <label>Contraseña</label>
                    <input type="text" id="claveNueva" placeholder="123456">
                </div>
                <div class="grupo">
                    <label>Nombre Completo</label>
                    <input type="text" id="nombreUsuarioNuevo" placeholder="Nombre Completo">
                </div>
                <div class="grupo">
                    <label>Rol</label>
                    <select id="rolNuevo">
                        <option value="usuario">Usuario Normal</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primario mt-2" onclick="agregarUsuario()">💾 Guardar Usuario</button>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">📋 Lista de Usuarios</h4>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaUsuariosSistema"></tbody>
            </table>
        </div>
    </div>

    <!-- COLABORADORES -->
    <div id="subadmin-colaboradores" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">👥 Gestionar Colaboradores</h3>
            <div class="grupo">
                <label>Nombre del Colaborador</label>
                <input type="text" id="nombreColaborador" placeholder="Nombre completo">
            </div>
            <button class="btn btn-primario mt-2" onclick="agregarColaborador()">💾 Guardar Colaborador</button>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">📋 Lista de Colaboradores</h4>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaColaboradoresAdmin"></tbody>
            </table>
        </div>
    </div>

    <!-- VEHÍCULOS -->
    <div id="subadmin-vehiculos" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">🚛 Registrar Vehículos de Movimientos</h3>
            <div class="grid-2">
                <div class="grupo">
                    <label>Placa</label>
                    <input type="text" id="placaVehiculoMov" placeholder="ABC-123" style="text-transform:uppercase;">
                </div>
                <div class="grupo">
                    <label>Tipo de Vehículo</label>
                    <select id="tipoVehiculoMov">
                        <option value="Motocicleta">Motocicleta</option>
                        <option value="Carro">Carro</option>
                        <option value="Camión">Camión</option>
                        <option value="Carguero">Carguero</option>
                        <option value="Furgón">Furgón</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primario mt-2" onclick="agregarVehiculoMov()">💾 Guardar Vehículo</button>
        </div>
        <div class="tarjeta mt-3">
            <h4 class="font-bold mb-2">📋 Lista de Vehículos</h4>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Tipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaVehiculosAdmin"></tbody>
            </table>
        </div>
    </div>

    <!-- CONFIGURACIÓN -->
    <div id="subadmin-configuracion" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-3">🔧 Información del Sistema</h3>
            <p><strong>Base de Datos:</strong> Firebase Firestore</p>
            <p><strong>Versión:</strong> 2.0 (Módulos Separados)</p>
            <p><strong>Usuario Conectado:</strong> ${usuarioActivo?.nombre || 'Desconocido'}</p>
            <p><strong>Rol:</strong> ${usuarioActivo?.rol || 'Sin rol'}</p>
            <hr class="my-3">
            <button class="btn btn-primario" onclick="cargarDatosGenerales()">🔄 Recargar Todos los Datos</button>
        </div>
    </div>
    `;

    dibujarTablaUsuarios();
    setTimeout(() => cambiarSubAdmin('usuarios'), 50);
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubAdmin(nombre) {
    document.querySelectorAll('[id^="subadmin-"]').forEach(d => d.classList.add('oculto'));
    document.querySelectorAll('#contenidoDinamico .btn-subpestaña').forEach(b => b.classList.remove('activa'));
    event.currentTarget.classList.add('activa');
    document.getElementById(`subadmin-${nombre}`).classList.remove('oculto');

    if (nombre === 'colaboradores') dibujarTablaColaboradoresAdmin();
    if (nombre === 'vehiculos') dibujarTablaVehiculosAdmin();
}

// =====================================================
// ===== USUARIOS DEL SISTEMA =====
// =====================================================
function dibujarTablaUsuarios() {
    const tb = document.getElementById('tablaUsuariosSistema');
    if (!tb) return;

    tb.innerHTML = usuariosFijos.map(u => `
        <tr>
            <td>${u.usuario}</td>
            <td>${u.nombre}</td>
            <td>${u.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}</td>
            <td>
                <button class="btn btn-amarillo btn-sm" onclick="alert('Editar desde el código: ${u.usuario}')">✏️ Editar</button>
            </td>
        </tr>
    `).join('');
}

async function agregarUsuario() {
    const usuario = document.getElementById('usuarioNuevo').value.trim();
    const clave = document.getElementById('claveNueva').value.trim();
    const nombre = document.getElementById('nombreUsuarioNuevo').value.trim();
    const rol = document.getElementById('rolNuevo').value;

    if (!usuario || !clave || !nombre) {
        return alert('⚠️ Complete todos los campos');
    }

    usuariosFijos.push({ usuario, clave, rol, nombre });
    alert('✅ Usuario agregado — Recargue la página para que surta efecto');
    dibujarTablaUsuarios();

    document.getElementById('usuarioNuevo').value = '';
    document.getElementById('claveNueva').value = '';
    document.getElementById('nombreUsuarioNuevo').value = '';
}

// =====================================================
// ===== COLABORADORES =====
// =====================================================
async function agregarColaborador() {
    const nombre = document.getElementById('nombreColaborador').value.trim();
    if (!nombre) return alert('⚠️ Escriba el nombre');

    await db.collection('colaboradores').add({ nombre, estado: 'activo', fechaCreacion: new Date() });
    alert('✅ Colaborador agregado');
    document.getElementById('nombreColaborador').value = '';
}

function dibujarTablaColaboradoresAdmin() {
    const tb = document.getElementById('tablaColaboradoresAdmin');
    if (!tb) return;
    tb.innerHTML = colaboradores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${(c.estado || 'activo') === 'activo' ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>
                <button class="btn btn-amarillo btn-sm" onclick="cambiarEstadoColaborador('${c.id}', '${c.estado || 'activo'}')">
                    ${(c.estado || 'activo') === 'activo' ? '❌ Inactivar' : '✅ Activar'}
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="text-center">📭 Sin colaboradores</td></tr>';
}

async function cambiarEstadoColaborador(id, estadoActual) {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    await db.collection('colaboradores').doc(id).update({ estado: nuevoEstado });
    alert(`✅ Colaborador ${nuevoEstado === 'activo' ? 'activado' : 'inactivado'}`);
}

// =====================================================
// ===== VEHÍCULOS DE MOVIMIENTOS =====
// =====================================================
async function agregarVehiculoMov() {
    const placa = document.getElementById('placaVehiculoMov').value.trim().toUpperCase();
    const tipo = document.getElementById('tipoVehiculoMov').value;
    if (!placa || !tipo) return alert('⚠️ Complete Placa y Tipo');

    await db.collection('vehiculos_movimientos').add({ placa, tipo, fechaCreacion: new Date() });
    alert('✅ Vehículo agregado');
    document.getElementById('placaVehiculoMov').value = '';
}

function dibujarTablaVehiculosAdmin() {
    const tb = document.getElementById('tablaVehiculosAdmin');
    if (!tb) return;
    tb.innerHTML = vehiculosMov.map(v => `
        <tr>
            <td>${v.placa}</td>
            <td>${v.tipo}</td>
            <td><button class="btn btn-peligro btn-sm" onclick="eliminarVehiculoMov('${v.id}')">🗑️ Eliminar</button></td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="text-center">📭 Sin vehículos</td></tr>';
}

async function eliminarVehiculoMov(id) {
    if (!confirm('¿Seguro desea eliminar este vehículo?')) return;
    await db.collection('vehiculos_movimientos').doc(id).delete();
    alert('✅ Vehículo eliminado');
}