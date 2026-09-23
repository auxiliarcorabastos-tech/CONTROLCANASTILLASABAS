// =====================================================
// ===== 👥 MÓDULO GESTIÓN DE USUARIOS — VERSIÓN FIJA =====
// =====================================================
window.cargarModulo_usuarios = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-4">👥 Gestión de Usuarios y Roles</h3>

        <!-- ============================================== -->
        <!-- PESTAÑAS PRINCIPALES — SIEMPRE FIJAS ARRIBA -->
        <!-- ============================================== -->
        <div class="flex gap-2 mb-4 flex-wrap border-b-2 border-gray-200 pb-3">
            <button class="btn-subpestaña activa" id="pestBtn_usuarios" onclick="cambiarPestPrincipal('usuarios')">👤 Usuarios</button>
            <button class="btn-subpestaña" id="pestBtn_roles" onclick="cambiarPestPrincipal('roles')">🔐 Roles y Permisos</button>
        </div>

        <!-- ============================================== -->
        <!-- PESTAÑA: USUARIOS — SUBPESTAÑAS SIEMPRE VISIBLES -->
        <!-- ============================================== -->
        <div id="pestCont_usuarios">
            <div class="flex gap-2 mb-4 flex-wrap bg-gray-50 p-2 rounded-lg">
                <button class="btn-subpestaña activa" id="subBtn_todos" onclick="cambiarSubUsu('todos')">📋 Todos los Usuarios</button>
                <button class="btn-subpestaña" id="subBtn_sistema" onclick="cambiarSubUsu('sistema')">⚙️ Usuarios del Sistema</button>
                <button class="btn-subpestaña" id="subBtn_crear" onclick="cambiarSubUsu('crear')">➕ Crear Usuario</button>
            </div>

            <!-- SUB: TODOS LOS USUARIOS -->
            <div id="subCont_todos">
                <div class="grupo mb-3">
                    <label>🔍 Buscar:</label>
                    <input type="text" id="buscarUsuario" placeholder="Nombre, usuario..." oninput="filtrarUsuarios()">
                </div>
                <div style="overflow-x:auto;">
                    <table class="tabla w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Vinculado</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tablaTodosUsuarios"></tbody>
                    </table>
                </div>
            </div>

            <!-- SUB: USUARIOS DEL SISTEMA -->
            <div id="subCont_sistema" class="oculto">
                <p class="text-sm text-gray-500 mb-3">🔒 Usuarios integrados en el sistema — datos de acceso configurados internamente</p>
                <div style="overflow-x:auto;">
                    <table class="tabla w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th>Nombre Completo</th>
                                <th>Usuario (Login)</th>
                                <th>Rol Asignado</th>
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuariosFijos.map(u => `
                            <tr class="border-b">
                                <td class="font-medium">${u.nombre}</td>
                                <td><code>${u.usuario}</code></td>
                                <td><span class="px-2 py-1 rounded text-xs ${u.rol==='admin'?'bg-blue-100 text-blue-700':u.rol==='personalizado'?'bg-purple-100 text-purple-700':'bg-gray-100'}">${u.rolNombre || u.rol}</span></td>
                                <td><span class="text-xs bg-blue-50 px-2 py-1 rounded">Sistema</span></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SUB: CREAR / EDITAR USUARIO -->
            <div id="subCont_crear" class="oculto">
                <h4 id="tituloFormUsu" class="font-bold mb-3">➕ Crear Nuevo Usuario</h4>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Nombre Completo *</label>
                        <input type="text" id="usuNombre" placeholder="Nombre completo">
                    </div>
                    <div class="grupo">
                        <label>Usuario (Login) *</label>
                        <input type="text" id="usuLogin" placeholder="ej: jperez">
                    </div>
                    <div class="grupo">
                        <label>Contraseña ${idEdicionUsuario ? '(vacío = no cambiar)' : '*'}</label>
                        <input type="password" id="usuClave" placeholder="Escriba contraseña">
                    </div>
                    <div class="grupo">
                        <label>Rol *</label>
                        <select id="usuRol" onchange="cambiarSeleccionRolUsuario()">
                            ${listaRoles.map(r => `<option value="${r.codigo}">${r.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grupo col-span-2 oculto" id="bloquePermisosPersonalizados">
                        <label class="font-bold text-purple-600">🎛️ Permisos Personalizados — Seleccione qué puede ver y editar:</label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div>
                                <p class="font-semibold text-sm text-green-600 mb-1">📂 Puede VER:</p>
                                <div id="chk-personal-ver" class="space-y-1 text-sm"></div>
                            </div>
                            <div>
                                <p class="font-semibold text-sm text-blue-600 mb-1">✏️ Puede EDITAR:</p>
                                <div id="chk-personal-editar" class="space-y-1 text-sm"></div>
                            </div>
                        </div>
                    </div>
                    <div class="grupo col-span-2">
                        <label>Vincular con Colaborador / Conductor</label>
                        <select id="usuVinculo">
                            <option value="">-- Ninguno --</option>
                            <optgroup label="Colaboradores">
                                ${colaboradores.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                            </optgroup>
                            <optgroup label="Conductores">
                                ${conductores.map(c => `<option value="${c.nombre}">${c.nombre} (Conductor)</option>`).join('')}
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button class="btn btn-exito" onclick="guardarUsuario()">💾 Guardar Usuario</button>
                    <button class="btn" onclick="limpiarFormUsuario()">Limpiar</button>
                </div>
            </div>
        </div>

        <!-- ============================================== -->
        <!-- PESTAÑA: ROLES — SUBPESTAÑAS SIEMPRE VISIBLES -->
        <!-- ============================================== -->
        <div id="pestCont_roles" class="oculto">
            <div class="flex gap-2 mb-4 flex-wrap bg-gray-50 p-2 rounded-lg">
                <button class="btn-subpestaña activa" id="subBtnTodos_roles" onclick="cambiarSubRoles('todos')">📋 Todos los Roles</button>
                <button class="btn-subpestaña" id="subBtnCrear_roles" onclick="cambiarSubRoles('crear')">➕ Crear Rol Fijo</button>
            </div>

            <!-- SUB: TODOS LOS ROLES -->
            <div id="subContTodos_roles">
                <p class="text-sm text-gray-500 mb-3">Roles del sistema — los marcados como "Predeterminado" no se pueden eliminar</p>
                <div class="grid-2" id="listaRolesTarjetas">
                    ${listaRoles.map(r => `
                    <div class="tarjeta border-2 ${r.predeterminado ? 'border-blue-200' : r.codigo==='personalizado'?'border-purple-200':'border-gray-100'}">
                        <h4 class="font-bold flex justify-between items-center">
                            ${r.nombre}
                            <span class="flex gap-1">
                                ${r.predeterminado ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Predeterminado</span>' : ''}
                                ${r.codigo==='personalizado' ? '<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Personalizado</span>' : ''}
                            </span>
                        </h4>
                        <p class="text-sm text-gray-500 mb-2">${r.descripcion || ''}</p>
                        <div class="text-sm space-y-2">
                            <div>
                                <p class="font-semibold text-green-600">Puede VER:</p>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${r.modulosVer.length>0?r.modulosVer.map(m=>`<span class="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">${nombresModulos[m]||m}</span>`).join(''):'<span class="text-gray-400 text-xs">Ninguno</span>'}
                                </div>
                            </div>
                            <div>
                                <p class="font-semibold text-blue-600">Puede EDITAR:</p>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${r.modulosEditar.length>0?r.modulosEditar.map(m=>`<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">${nombresModulos[m]||m}</span>`).join(''):'<span class="text-gray-400 text-xs">Ninguno</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <button class="btn btn-sm btn-amarillo" onclick="editarRol('${r.codigo}')">Editar</button>
                            ${!r.predeterminado && r.codigo!=='personalizado' ? `<button class="btn btn-sm btn-peligro" onclick="eliminarRol('${r.codigo}')">Eliminar</button>` : ''}
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- SUB: CREAR ROL FIJO -->
            <div id="subContCrear_roles" class="oculto">
                <h4 id="tituloFormRol" class="font-bold mb-3">➕ Crear Nuevo Rol Fijo</h4>
                <div class="grid-2">
                    <div class="grupo">
                        <label>Nombre del Rol *</label>
                        <input type="text" id="rolNombre" placeholder="ej: Encargado de Bodega">
                    </div>
                    <div class="grupo">
                        <label>Código identificador *</label>
                        <input type="text" id="rolCodigo" placeholder="ej: encargado_bodega" ${idEdicionRol?'readonly':''}>
                    </div>
                    <div class="grupo col-span-2">
                        <label>Descripción</label>
                        <input type="text" id="rolDescripcion" placeholder="Breve descripción de este rol">
                    </div>
                    <div class="grupo col-span-2">
                        <label class="font-semibold text-green-600">📂 Módulos que PUEDE VER:</label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            ${Object.entries(nombresModulos).map(([cod, nom]) => `
                            <label class="flex items-center gap-2 text-sm">
                                <input type="checkbox" class="chk-ver" value="${cod}"> ${nom}
                            </label>`).join('')}
                        </div>
                    </div>
                    <div class="grupo col-span-2">
                        <label class="font-semibold text-blue-600">✏️ Módulos que PUEDE EDITAR:</label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            ${Object.entries(nombresModulos).map(([cod, nom]) => `
                            <label class="flex items-center gap-2 text-sm">
                                <input type="checkbox" class="chk-editar" value="${cod}"> ${nom}
                            </label>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button class="btn btn-exito" onclick="guardarRol()">💾 Guardar Rol</button>
                    <button class="btn" onclick="limpiarFormRol()">Limpiar</button>
                </div>
            </div>
        </div>
    </div>
    `;

    actualizarChecksPersonalizados();
    cargarListaUsuariosDesdeDB();
};

// =====================================================
// ===== CONFIGURACIÓN DE MÓDULOS Y ROLES =====
// =====================================================
const nombresModulos = {
    movimientos: 'Movimientos',
    transportadora: 'Transportadora',
    misCanastillas: 'Mis Canastillas',
    recoleccion: 'Recolección',
    anuncios: 'Anuncios',
    donantes: 'Donantes',
    combustible: 'Combustible',
    mantenimiento: 'Mantenimiento',
    informes: 'Informes',
    usuarios: 'Gestión de Usuarios',
    admin: 'Administración'
};

let listaRoles = [
    {
        codigo: 'admin',
        nombre: '👑 Administrador',
        descripcion: 'Acceso total — ve y edita todo',
        predeterminado: true,
        modulosVer: Object.keys(nombresModulos),
        modulosEditar: Object.keys(nombresModulos)
    },
    {
        codigo: 'usuario',
        nombre: 'Usuario Estándar',
        descripcion: 'Operaciones diarias sin administración',
        predeterminado: true,
        modulosVer: ['movimientos','transportadora','misCanastillas','recoleccion','anuncios','donantes','combustible','mantenimiento','informes'],
        modulosEditar: ['movimientos','transportadora','misCanastillas','recoleccion','anuncios','donantes','combustible','mantenimiento']
    },
    {
        codigo: 'conductor',
        nombre: '🚚 Conductor',
        descripcion: 'Registro de recorridos y recogidas',
        predeterminado: true,
        modulosVer: ['movimientos','misCanastillas','recoleccion','anuncios'],
        modulosEditar: ['movimientos','recoleccion']
    },
    {
        codigo: 'encargado_bodega',
        nombre: '📦 Encargado de Bodega',
        descripcion: 'Control de existencias y donaciones',
        predeterminado: true,
        modulosVer: ['movimientos','misCanastillas','donantes','combustible','mantenimiento','informes'],
        modulosEditar: ['movimientos','misCanastillas','donantes','combustible']
    },
    {
        codigo: 'personalizado',
        nombre: '🎛️ Rol Personalizado',
        descripcion: 'Definir manualmente qué ve y edita cada usuario',
        predeterminado: true,
        modulosVer: [],
        modulosEditar: []
    }
];

let listaUsuarios = [];
let idEdicionUsuario = null;
let idEdicionRol = null;
let permisosPersonalizados = { ver: [], editar: [] };

// =====================================================
// ===== NAVEGACIÓN — PESTAÑAS SIEMPRE VISIBLES =====
// =====================================================
function cambiarPestPrincipal(nombre) {
    // Ocultar todo
    document.querySelectorAll('[id^="pestCont_"]').forEach(d => d.classList.add('oculto'));
    // Quitar activa de todos los botones
    document.querySelectorAll('[id^="pestBtn_"]').forEach(b => b.classList.remove('activa'));
    // Mostrar seleccionado
    document.getElementById(`pestCont_${nombre}`).classList.remove('oculto');
    document.getElementById(`pestBtn_${nombre}`).classList.add('activa');
    // Cargar datos si corresponde
    if (nombre === 'usuarios') dibujarListaUsuarios();
}

function cambiarSubUsu(nombre) {
    // Ocultar todo
    document.querySelectorAll('[id^="subCont_"]').forEach(d => d.classList.add('oculto'));
    // Quitar activa
    document.querySelectorAll('[id^="subBtn_"]').forEach(b => b.classList.remove('activa'));
    // Mostrar
    document.getElementById(`subCont_${nombre}`).classList.remove('oculto');
    document.getElementById(`subBtn_${nombre}`).classList.add('activa');
    // Acciones
    if (nombre === 'todos') dibujarListaUsuarios();
    if (nombre === 'crear') {
        idEdicionUsuario = null;
        limpiarFormUsuario();
    }
}

function cambiarSubRoles(nombre) {
    // Ocultar todo
    document.querySelectorAll('[id^="subContTodos_"], [id^="subContCrear_"]').forEach(d => d.classList.add('oculto'));
    // Quitar activa
    document.querySelectorAll('[id^="subBtnTodos_"], [id^="subBtnCrear_"]').forEach(b => b.classList.remove('activa'));
    // Mostrar
    document.getElementById(`subCont${nombre.charAt(0).toUpperCase() + nombre.slice(1)}_roles`).classList.remove('oculto');
    document.getElementById(`subBtn${nombre.charAt(0).toUpperCase() + nombre.slice(1)}_roles`).classList.add('activa');
    // Acciones
    if (nombre === 'crear') limpiarFormRol();
}

// =====================================================
// ===== ROLES — SELECCIÓN PERSONALIZADO =====
// =====================================================
function cambiarSeleccionRolUsuario() {
    const rolSel = document.getElementById('usuRol').value;
    const bloque = document.getElementById('bloquePermisosPersonalizados');
    if (rolSel === 'personalizado') {
        bloque.classList.remove('oculto');
    } else {
        bloque.classList.add('oculto');
        permisosPersonalizados = { ver: [], editar: [] };
    }
}

function actualizarChecksPersonalizados() {
    const contVer = document.getElementById('chk-personal-ver');
    const contEditar = document.getElementById('chk-personal-editar');
    if (!contVer || !contEditar) return;

    contVer.innerHTML = Object.entries(nombresModulos).map(([cod, nom]) => `
        <label class="flex items-center gap-2">
            <input type="checkbox" class="chk-perm-ver" value="${cod}" onchange="actualizarPermisosPersonalizados()">
            ${nom}
        </label>`).join('');

    contEditar.innerHTML = Object.entries(nombresModulos).map(([cod, nom]) => `
        <label class="flex items-center gap-2">
            <input type="checkbox" class="chk-perm-editar" value="${cod}" onchange="actualizarPermisosPersonalizados()">
            ${nom}
        </label>`).join('');
}

function actualizarPermisosPersonalizados() {
    permisosPersonalizados.ver = Array.from(document.querySelectorAll('.chk-perm-ver:checked')).map(c => c.value);
    permisosPersonalizados.editar = Array.from(document.querySelectorAll('.chk-perm-editar:checked')).map(c => c.value);
}

// =====================================================
// ===== USUARIOS — CRUD =====
// =====================================================
function dibujarListaUsuarios() {
    const tb = document.getElementById('tablaTodosUsuarios');
    if (!tb) return;
    const texto = document.getElementById('buscarUsuario')?.value?.toLowerCase() || '';
    const filtro = texto
        ? listaUsuarios.filter(u => u.nombre.toLowerCase().includes(texto) || u.usuario.toLowerCase().includes(texto))
        : listaUsuarios;

    tb.innerHTML = filtro.length === 0
        ? '<tr><td colspan="6" class="text-center py-4 text-gray-400">Sin usuarios registrados</td></tr>'
        : filtro.map(u => `
        <tr class="border-b">
            <td class="font-medium">${u.nombre}</td>
            <td><code>${u.usuario}</code></td>
            <td><span class="px-2 py-1 rounded text-xs ${u.rol==='personalizado'?'bg-purple-100 text-purple-700':'bg-gray-100'}">${listaRoles.find(r=>r.codigo===u.rol)?.nombre||u.rol}</span></td>
            <td>${u.vinculo||'—'}</td>
            <td><span class="px-2 py-1 rounded text-xs ${u.activo!==false?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}">${u.activo!==false?'Activo':'Inactivo'}</span></td>
            <td>
                <button class="btn btn-sm btn-amarillo" onclick="editarUsuario('${u.id}')">Editar</button>
                <button class="btn btn-sm ${u.activo!==false?'btn-peligro':'btn-exito'}" onclick="cambiarEstadoUsuario('${u.id}',${u.activo!==false})">
                    ${u.activo!==false?'Inactivar':'Activar'}
                </button>
            </td>
        </tr>`).join('');
}

function filtrarUsuarios() { dibujarListaUsuarios(); }

async function guardarUsuario() {
    const nombre = document.getElementById('usuNombre').value.trim();
    const usuario = document.getElementById('usuLogin').value.trim();
    const clave = document.getElementById('usuClave').value.trim();
    const rol = document.getElementById('usuRol').value;
    const vinculo = document.getElementById('usuVinculo').value;

    if (!nombre || !usuario) return alert('⚠️ Nombre y Usuario son obligatorios');
    if (!idEdicionUsuario && !clave) return alert('⚠️ Escriba contraseña');

    const datos = { nombre, usuario, rol, vinculo, activo: true };
    if (clave) datos.clave = clave;
    if (rol === 'personalizado') {
        datos.permisosVer = permisosPersonalizados.ver;
        datos.permisosEditar = permisosPersonalizados.editar;
    }

    try {
        if (idEdicionUsuario) {
            await db.collection('usuarios').doc(idEdicionUsuario).update(datos);
            alert('✅ Usuario actualizado');
        } else {
            await db.collection('usuarios').add(datos);
            alert('✅ Usuario creado');
        }
        cambiarSubUsu('todos');
        cargarListaUsuariosDesdeDB();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function limpiarFormUsuario() {
    idEdicionUsuario = null;
    document.getElementById('tituloFormUsu').textContent = '➕ Crear Nuevo Usuario';
    document.getElementById('usuNombre').value = '';
    document.getElementById('usuLogin').value = '';
    document.getElementById('usuLogin').readOnly = false;
    document.getElementById('usuClave').value = '';
    document.getElementById('usuRol').value = 'usuario';
    document.getElementById('usuVinculo').value = '';
    document.getElementById('bloquePermisosPersonalizados').classList.add('oculto');
    permisosPersonalizados = { ver: [], editar: [] };
    document.querySelectorAll('.chk-perm-ver, .chk-perm-editar').forEach(c => c.checked = false);
}

async function editarUsuario(id) {
    const doc = await db.collection('usuarios').doc(id).get();
    if (!doc.exists) return;
    const u = { id: doc.id, ...doc.data() };
    idEdicionUsuario = id;

    cambiarSubUsu('crear');
    document.getElementById('tituloFormUsu').textContent = '✏️ Editar Usuario';
    document.getElementById('usuNombre').value = u.nombre;
    document.getElementById('usuLogin').value = u.usuario;
    document.getElementById('usuLogin').readOnly = true;
    document.getElementById('usuClave').value = '';
    document.getElementById('usuRol').value = u.rol || 'usuario';
    document.getElementById('usuVinculo').value = u.vinculo || '';

    if (u.rol === 'personalizado') {
        document.getElementById('bloquePermisosPersonalizados').classList.remove('oculto');
        permisosPersonalizados = { ver: u.permisosVer || [], editar: u.permisosEditar || [] };
        document.querySelectorAll('.chk-perm-ver').forEach(c => c.checked = permisosPersonalizados.ver.includes(c.value));
        document.querySelectorAll('.chk-perm-editar').forEach(c => c.checked = permisosPersonalizados.editar.includes(c.value));
    } else {
        document.getElementById('bloquePermisosPersonalizados').classList.add('oculto');
    }
}

async function cambiarEstadoUsuario(id, estaActivo) {
    if (!confirm(`¿${estaActivo?'Inactivar':'Activar'} este usuario?`)) return;
    await db.collection('usuarios').doc(id).update({ activo: !estaActivo });
    cargarListaUsuariosDesdeDB();
}

async function cargarListaUsuariosDesdeDB() {
    const snap = await db.collection('usuarios').get();
    listaUsuarios = [];
    snap.forEach(d => listaUsuarios.push({ id: d.id, ...d.data() }));
    dibujarListaUsuarios();
}

// =====================================================
// ===== ROLES — CRUD =====
// =====================================================
function limpiarFormRol() {
    idEdicionRol = null;
    document.getElementById('tituloFormRol').textContent = '➕ Crear Nuevo Rol Fijo';
    document.getElementById('rolNombre').value = '';
    document.getElementById('rolCodigo').value = '';
    document.getElementById('rolCodigo').readOnly = false;
    document.getElementById('rolDescripcion').value = '';
    document.querySelectorAll('.chk-ver, .chk-editar').forEach(c => c.checked = false);
}

async function guardarRol() {
    const nombre = document.getElementById('rolNombre').value.trim();
    let codigo = document.getElementById('rolCodigo').value.trim().toLowerCase().replace(/\s+/g, '_');
    const descripcion = document.getElementById('rolDescripcion').value.trim();
    const modulosVer = Array.from(document.querySelectorAll('.chk-ver:checked')).map(c => c.value);
    const modulosEditar = Array.from(document.querySelectorAll('.chk-editar:checked')).map(c => c.value);

    if (!nombre || !codigo) return alert('⚠️ Nombre y Código son obligatorios');
    if (['admin','personalizado','usuario','conductor','encargado_bodega'].includes(codigo) && !idEdicionRol) {
        return alert('⚠️ Código reservado — elija otro');
    }

    const datos = { codigo, nombre, descripcion, modulosVer, modulosEditar, predeterminado: false };

    if (idEdicionRol) {
        const idx = listaRoles.findIndex(r => r.codigo === idEdicionRol);
        if (idx !== -1) listaRoles[idx] = { ...listaRoles[idx], ...datos };
        alert('✅ Rol actualizado');
    } else {
        if (listaRoles.some(r => r.codigo === codigo)) return alert('⚠️ Ya existe ese rol');
        listaRoles.push(datos);
        alert('✅ Rol creado');
    }

    limpiarFormRol();
    cambiarSubRoles('todos');
    cargarModulo_usuarios();
}

function editarRol(codigo) {
    const rol = listaRoles.find(r => r.codigo === codigo);
    if (!rol) return;
    if (rol.predeterminado) return alert('⚠️ Rol predeterminado — no se puede modificar');

    idEdicionRol = codigo;
    cambiarSubRoles('crear');
    document.getElementById('tituloFormRol').textContent = '✏️ Editar Rol';
    document.getElementById('rolNombre').value = rol.nombre;
    document.getElementById('rolCodigo').value = rol.codigo;
    document.getElementById('rolCodigo').readOnly = true;
    document.getElementById('rolDescripcion').value = rol.descripcion || '';

    document.querySelectorAll('.chk-ver').forEach(chk => chk.checked = rol.modulosVer.includes(chk.value));
    document.querySelectorAll('.chk-editar').forEach(chk => chk.checked = rol.modulosEditar.includes(chk.value));
}

function eliminarRol(codigo) {
    const rol = listaRoles.find(r => r.codigo === codigo);
    if (!rol) return;
    if (rol.predeterminado || rol.codigo === 'personalizado') return alert('⚠️ No se puede eliminar este rol');
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return;

    listaRoles = listaRoles.filter(r => r.codigo !== codigo);
    alert('✅ Rol eliminado');
    cargarModulo_usuarios();
}