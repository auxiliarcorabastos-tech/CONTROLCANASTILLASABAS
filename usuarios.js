// =====================================================
// ===== 👥 GESTIÓN DE USUARIOS =====
// =====================================================
window.cargarModulo_usuarios = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn-subpestaña activa" onclick="cambiarSubpestañaUsu('listar', event)">📋 Lista de Usuarios</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaUsu('crear', event)">➕ Crear Usuario</button>
        <button class="btn-subpestaña" onclick="cambiarSubpestañaUsu('roles', event)">⚙️ Gestión de Roles</button>
    </div>

    <!-- LISTA DE USUARIOS -->
    <div id="subusu-listar" class="">
        <div class="tarjeta">
            <h3 class="font-bold mb-4">👥 Usuarios del Sistema</h3>
            <div class="mb-3">
                <input type="text" id="buscarUsuario" placeholder="🔍 Buscar por nombre o usuario..." oninput="filtrarUsuarios()">
            </div>
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaUsuariosCuerpo"></tbody>
            </table>
        </div>
    </div>

    <!-- CREAR/EDITAR USUARIO -->
    <div id="subusu-crear" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-4" id="tituloFormUsu">➕ Nuevo Usuario</h3>
            <div class="grid-2">
                <div class="grupo">
                    <label>👤 Usuario (login) *</label>
                    <input type="text" id="usu_usuario" placeholder="ej: jperez">
                </div>
                <div class="grupo">
                    <label>🔑 Contraseña *</label>
                    <input type="password" id="usu_clave" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="grupo col-span-2">
                    <label>📝 Nombre Completo *</label>
                    <input type="text" id="usu_nombre" placeholder="Nombre y apellidos">
                </div>
                <div class="grupo col-span-2">
                    <label>🔗 Vincular a Colaborador/Conductor</label>
                    <select id="usu_colaborador_vinculo">
                        <option value="">-- No vincular — crear usuario independiente --</option>
                        <optgroup label="Colaboradores">
                            ${colaboradores.map(c => `<option value="${c.id}||colaborador">${c.nombre || c.nombreCompleto}</option>`).join('')}
                        </optgroup>
                        <optgroup label="Conductores">
                            ${conductores.map(c => `<option value="${c.id}||conductor">${c.nombre || c.nombreCompleto}</option>`).join('')}
                        </optgroup>
                    </select>
                    <small style="color:#666;">Selecciona para copiar el nombre y enlazar sus datos</small>
                </div>
                <div class="grupo">
                    <label>🎭 Rol *</label>
                    <select id="usu_rol">
                        <option value="">-- Seleccionar Rol --</option>
                        <option value="admin">🔧 Administrador</option>
                        <option value="editor">✏️ Editor</option>
                        <option value="usuario">👤 Usuario</option>
                        ${listaRoles.map(r => `<option value="${r.nombre}">${r.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="grupo">
                    <label>✅ Estado</label>
                    <select id="usu_activo">
                        <option value="true" selected>Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                </div>
                <div class="grupo col-span-2">
                    <label>📋 Permisos de Módulos</label>
                    <div id="checkModulosPermisos" class="grid-2" style="max-height:250px; overflow-y:auto; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                        ${generarCheckModulos()}
                    </div>
                </div>
            </div>
            <div class="flex gap-3 mt-6">
                <button class="btn btn-primario" onclick="guardarUsuario()">💾 Guardar</button>
                <button class="btn btn-amarillo" onclick="limpiarFormUsuario()">🔄 Limpiar</button>
                <button class="btn btn-peligro" onclick="cambiarSubpestañaUsu('listar')">❌ Cancelar</button>
            </div>
        </div>
    </div>

    <!-- GESTIÓN DE ROLES -->
    <div id="subusu-roles" class="oculto">
        <div class="tarjeta">
            <h3 class="font-bold mb-4">⚙️ Crear y Configurar Roles</h3>
            <div class="grupo">
                <label>Nombre del Nuevo Rol</label>
                <input type="text" id="nuevoRolNombre" placeholder="ej: Supervisor">
            </div>
            <div class="grupo">
                <label>Permisos para este Rol</label>
                <div id="checkModulosRol" class="grid-2" style="max-height:250px; overflow-y:auto; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                    ${generarCheckModulos()}
                </div>
            </div>
            <button class="btn btn-exito mb-4" onclick="guardarNuevoRol()">✅ Crear Rol</button>
            
            <hr style="margin: 1.5rem 0; border-color:#eee;">
            
            <h4 class="font-bold mb-3">Roles Creados</h4>
            <div id="listaRolesCreados">
                ${listaRoles.length === 0 ? '<p style="color:#666;">Aún no hay roles personalizados</p>' : ''}
            </div>
        </div>
    </div>
    `;

    dibujarTablaUsuarios();
    dibujarListaRoles();
    
    // Auto-copiar nombre si se selecciona colaborador
    setTimeout(() => {
        const sel = document.getElementById('usu_colaborador_vinculo');
        if (sel) sel.addEventListener('change', autoCompletarNombreVinculado);
    }, 50);
};

// =====================================================
// ===== CAMBIAR SUBPESTAÑA =====
// =====================================================
function cambiarSubpestañaUsu(nombre, evt) {
    document.querySelectorAll('[id^="subusu-"]').forEach(p => p.classList.add('oculto'));
    document.querySelectorAll('.btn-subpestaña').forEach(b => b.classList.remove('activa'));
    if (evt) evt.target.classList.add('activa');
    document.getElementById(`subusu-${nombre}`).classList.remove('oculto');
    if (nombre === 'crear') {
        document.getElementById('tituloFormUsu').textContent = idEdicion ? '✏️ Editar Usuario' : '➕ Nuevo Usuario';
    }
}

// =====================================================
// ===== GENERAR CHECKBOX DE MÓDULOS =====
// =====================================================
function generarCheckModulos() {
    const modulos = [
        { id: 'movimientos', nombre: '🚚 Movimientos' },
        { id: 'transportadora', nombre: '🚛 Transportadora' },
        { id: 'misCanastillas', nombre: '📋 Mis Canastillas' },
        { id: 'recoleccion', nombre: '📥 Recolección' },
        { id: 'anuncios', nombre: '📢 Anuncios' },
        { id: 'donantes', nombre: '🤝 Donantes' },
        { id: 'combustible', nombre: '⛽ Combustible' },
        { id: 'mantenimiento', nombre: '🔧 Mantenimiento' },
        { id: 'informes', nombre: '📊 Informes' },
        { id: 'usuarios', nombre: '👥 Gestión Usuarios' },
        { id: 'admin', nombre: '⚙️ Administración' }
    ];
    
    return modulos.map(m => `
        <div style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0;">
            <input type="checkbox" id="perm_${m.id}" data-modulo="${m.id}">
            <label for="perm_${m.id}" style="margin:0; font-size:0.9rem;">${m.nombre}</label>
        </div>
    `).join('');
}

// =====================================================
// ===== AUTO-COMPLETAR NOMBRE AL VINCULAR =====
// =====================================================
function autoCompletarNombreVinculado() {
    const valor = document.getElementById('usu_colaborador_vinculo').value;
    if (!valor) return;
    
    const [id, tipo] = valor.split('||');
    let persona = null;
    
    if (tipo === 'colaborador') {
        persona = colaboradores.find(c => c.id === id);
    } else {
        persona = conductores.find(c => c.id === id);
    }
    
    if (persona) {
        const nombre = persona.nombre || persona.nombreCompleto || '';
        document.getElementById('usu_nombre').value = nombre;
        document.getElementById('usu_usuario').value = nombre.toLowerCase().replace(/\s+/g, '.');
    }
}

// =====================================================
// ===== DIBUJAR TABLA =====
// =====================================================
function dibujarTablaUsuarios() {
    const tb = document.getElementById('tablaUsuariosCuerpo');
    if (!tb) return;

    // Combinar fijos + de la base
    const todos = [...usuariosFijos.map(u => ({ ...u, esFijo: true }))];
    // Aquí se pueden agregar usuarios desde Firestore si los guardas

    tb.innerHTML = todos.map(u => `
    <tr>
        <td><strong>${u.usuario}</strong>${u.esFijo ? '<span style="color:green; font-size:0.7rem; margin-left:0.3rem;">✓</span>' : ''}</td>
        <td>${u.nombre}</td>
        <td><span style="background:${u.rol==='admin'?'#D1FAE5':'#E0E7FF'}; padding:0.2rem 0.6rem; border-radius:1rem; font-size:0.85rem; font-weight:600;">${u.rol}</span></td>
        <td>${u.activo ? '<span style="color:green; font-weight:bold;">✅ Activo</span>' : '<span style="color:red; font-weight:bold;">❌ Inactivo</span>'}</td>
        <td>
            ${!u.esFijo ? `<button class="btn btn-sm btn-primario" onclick="editarUsuario('${u.usuario}')">✏️</button>` : ''}
            <button class="btn btn-sm ${u.activo ? 'btn-amarillo' : 'btn-exito'}" onclick="cambiarEstadoUsuario('${u.usuario}', ${!u.activo})">
                ${u.activo ? '🔇 Desactivar' : '🔊 Activar'}
            </button>
        </td>
    </tr>`).join('');
}

function filtrarUsuarios() {
    const b = (document.getElementById('buscarUsuario')?.value || '').toLowerCase();
    const filas = document.querySelectorAll('#tablaUsuariosCuerpo tr');
    filas.forEach(f => {
        const t = f.textContent.toLowerCase();
        f.style.display = !b || t.includes(b) ? '' : 'none';
    });
}

// =====================================================
// ===== GUARDAR USUARIO =====
// =====================================================
function guardarUsuario() {
    const datos = {
        usuario: document.getElementById('usu_usuario').value.trim(),
        clave: document.getElementById('usu_clave').value,
        nombre: document.getElementById('usu_nombre').value.trim(),
        rol: document.getElementById('usu_rol').value,
        activo: document.getElementById('usu_activo').value === 'true',
        vinculadoA: document.getElementById('usu_colaborador_vinculo').value || null,
        permisos: obtenerPermisosSeleccionados()
    };

    if (!datos.usuario || !datos.clave || !datos.nombre || !datos.rol) {
        return alert('⚠️ Complete todos los campos obligatorios');
    }
    if (datos.clave.length < 6) {
        return alert('⚠️ La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar duplicado
    const existe = usuariosFijos.find(u => u.usuario === datos.usuario);
    if (existe && !idEdicion) {
        return alert('⚠️ Este nombre de usuario ya existe');
    }

    if (idEdicion) {
        const idx = usuariosFijos.findIndex(u => u.usuario === idEdicion);
        if (idx !== -1) usuariosFijos[idx] = { ...usuariosFijos[idx], ...datos };
        alert('✅ Usuario actualizado');
    } else {
        usuariosFijos.push(datos);
        alert('✅ Usuario creado correctamente');
    }

    limpiarFormUsuario();
    cambiarSubpestañaUsu('listar');
    dibujarTablaUsuarios();
}

function obtenerPermisosSeleccionados() {
    const permisos = {};
    document.querySelectorAll('#checkModulosPermisos input[type="checkbox"]').forEach(cb => {
        permisos[cb.dataset.modulo] = cb.checked;
    });
    return permisos;
}

function limpiarFormUsuario() {
    idEdicion = null;
    document.getElementById('usu_usuario').value = '';
    document.getElementById('usu_clave').value = '';
    document.getElementById('usu_nombre').value = '';
    document.getElementById('usu_colaborador_vinculo').value = '';
    document.getElementById('usu_rol').value = '';
    document.getElementById('usu_activo').value = 'true';
    document.querySelectorAll('#checkModulosPermisos input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function editarUsuario(usuario) {
    const u = usuariosFijos.find(x => x.usuario === usuario);
    if (!u) return;
    idEdicion = usuario;
    cambiarSubpestañaUsu('crear');
    
    setTimeout(() => {
        document.getElementById('usu_usuario').value = u.usuario;
        document.getElementById('usu_clave').value = u.clave;
        document.getElementById('usu_nombre').value = u.nombre;
        document.getElementById('usu_rol').value = u.rol;
        document.getElementById('usu_activo').value = String(u.activo);
    }, 50);
}

function cambiarEstadoUsuario(usuario, nuevoEstado) {
    const idx = usuariosFijos.findIndex(u => u.usuario === usuario);
    if (idx !== -1) {
        usuariosFijos[idx].activo = nuevoEstado;
        dibujarTablaUsuarios();
        alert(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
    }
}

// =====================================================
// ===== GESTIÓN DE ROLES =====
// =====================================================
function guardarNuevoRol() {
    const nombre = document.getElementById('nuevoRolNombre').value.trim();
    if (!nombre) return alert('⚠️ Escriba un nombre para el rol');
    
    const existe = listaRoles.find(r => r.nombre === nombre);
    if (existe) return alert('⚠️ Este rol ya existe');

    const permisos = {};
    document.querySelectorAll('#checkModulosRol input[type="checkbox"]').forEach(cb => {
        permisos[cb.dataset.modulo] = cb.checked;
    });

    listaRoles.push({ nombre, permisos });
    alert(`✅ Rol "${nombre}" creado`);
    document.getElementById('nuevoRolNombre').value = '';
    document.querySelectorAll('#checkModulosRol input[type="checkbox"]').forEach(cb => cb.checked = false);
    dibujarListaRoles();
}

function dibujarListaRoles() {
    const cont = document.getElementById('listaRolesCreados');
    if (!cont) return;
    
    cont.innerHTML = listaRoles.length === 0 
        ? '<p style="color:#666;">Aún no hay roles personalizados</p>'
        : listaRoles.map((r, i) => `
        <div class="tarjeta" style="padding:1rem; margin-bottom:0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 class="font-bold">${r.nombre}</h4>
                <button class="btn btn-sm btn-peligro" onclick="eliminarRol(${i})">🗑️ Eliminar</button>
            </div>
            <div style="margin-top:0.5rem; font-size:0.85rem; color:#555;">
                Módulos: ${Object.entries(r.permisos).filter(([_,v])=>v).map(([m])=>m).join(', ') || 'Ninguno seleccionado'}
            </div>
        </div>`).join('');
}

function eliminarRol(indice) {
    if (!confirm('¿Eliminar este rol?')) return;
    listaRoles.splice(indice, 1);
    dibujarListaRoles();
}

console.log('✅ usuarios.js cargado completo');
