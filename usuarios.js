// =====================================================
// ===== 👤 MÓDULO GESTIÓN DE USUARIOS =====
// =====================================================
window.cargarModulo_usuarios = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="tarjeta">
        <h2 class="text-xl font-bold mb-4">👤 Gestión de Usuarios</h2>
        
        <!-- Formulario Crear/Editar -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 class="font-bold mb-3" id="tituloFormUsuario">➕ Crear Nuevo Usuario</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-group">
                    <label>Origen del usuario</label>
                    <select id="origenUsuario" onchange="cambiarOrigenUsuario()">
                        <option value="">— Seleccionar —</option>
                        <option value="nuevo">✏️ Crear usuario NUEVO</option>
                        <option value="colaborador">👤 Desde COLABORADOR registrado</option>
                        <option value="conductor">🚛 Desde CONDUCTOR registrado</option>
                    </select>
                </div>
                
                <div class="form-group" id="seleccionColaborador" style="display:none;">
                    <label>Seleccionar Colaborador</label>
                    <select id="usuarioColaborador" onchange="cargarDatosColaborador()">
                        <option value="">— Elegir colaborador —</option>
                        ${colaboradores.map(c => `<option value="${c.id}" data-nombre="${c.nombre || c.nombreCompleto || ''}">${c.nombre || c.nombreCompleto || c.id}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group" id="seleccionConductor" style="display:none;">
                    <label>Seleccionar Conductor</label>
                    <select id="usuarioConductor" onchange="cargarDatosConductor()">
                        <option value="">— Elegir conductor —</option>
                        ${conductores.map(c => `<option value="${c.id}" data-nombre="${c.nombre || c.nombreCompleto || ''}">${c.nombre || c.nombreCompleto || c.id}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" id="nombreUsuarioForm" placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <label>Usuario / Identificador</label>
                    <input type="text" id="usuarioForm" placeholder="Ej: jperez">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" id="claveForm" placeholder="Contraseña">
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select id="rolForm">
                        <option value="">— Seleccionar Rol —</option>
                        ${listaRoles.map(r => `<option value="${r.clave}">${r.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group flex items-center gap-2">
                    <input type="checkbox" id="activoForm" checked>
                    <label for="activoForm" style="margin:0;">Usuario Activo</label>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="btn-primario" onclick="guardarUsuario()">💾 Guardar Usuario</button>
                <button class="bg-gray-200 px-4 py-2 rounded" onclick="limpiarFormUsuario()">🗑️ Limpiar</button>
            </div>
            <p id="mensajeUsuario" class="mt-2 text-sm"></p>
        </div>

        <!-- Lista de Usuarios -->
        <h3 class="font-bold mb-3">📋 Usuarios del Sistema</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-sm border">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border p-2 text-left">Nombre</th>
                        <th class="border p-2 text-left">Usuario</th>
                        <th class="border p-2 text-left">Rol</th>
                        <th class="border p-2 text-center">Estado</th>
                        <th class="border p-2 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaUsuariosCuerpo">
                    <tr><td colspan="5" class="p-4 text-center text-gray-500">Cargando usuarios...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `;

    await dibujarTablaUsuarios();
};

let idEdicionUsuario = null;

function cambiarOrigenUsuario() {
    const origen = document.getElementById('origenUsuario').value;
    document.getElementById('seleccionColaborador').style.display = origen === 'colaborador' ? 'block' : 'none';
    document.getElementById('seleccionConductor').style.display = origen === 'conductor' ? 'block' : 'none';
    
    if (origen !== 'colaborador') document.getElementById('usuarioColaborador').value = '';
    if (origen !== 'conductor') document.getElementById('usuarioConductor').value = '';
    if (origen === 'nuevo') {
        document.getElementById('nombreUsuarioForm').value = '';
        document.getElementById('usuarioForm').value = '';
    }
}

function cargarDatosColaborador() {
    const sel = document.getElementById('usuarioColaborador');
    const opt = sel.selectedOptions[0];
    if (opt && opt.dataset.nombre) {
        document.getElementById('nombreUsuarioForm').value = opt.dataset.nombre;
        document.getElementById('usuarioForm').value = sel.value;
    }
}

function cargarDatosConductor() {
    const sel = document.getElementById('usuarioConductor');
    const opt = sel.selectedOptions[0];
    if (opt && opt.dataset.nombre) {
        document.getElementById('nombreUsuarioForm').value = opt.dataset.nombre;
        document.getElementById('usuarioForm').value = sel.value;
    }
}

async function dibujarTablaUsuarios() {
    const cuerpo = document.getElementById('tablaUsuariosCuerpo');
    if (!cuerpo) return;

    let todos = [...usuariosFijos];
    if (typeof db !== 'undefined') {
        try {
            const snap = await db.collection('usuarios').get();
            snap.forEach(d => { todos.push({ id: d.id, ...d.data(), desdeFirebase: true }); });
        } catch (e) { console.log('Sin usuarios en Firebase'); }
    }

    cuerpo.innerHTML = todos.map(u => `
    <tr class="${u.activo === false ? 'bg-red-50' : ''}">
        <td class="border p-2">${u.nombre || '—'}</td>
        <td class="border p-2 font-mono text-xs">${u.usuario || u.id}</td>
        <td class="border p-2">${u.rol || 'usuario'}</td>
        <td class="border p-2 text-center">
            ${u.activo === false 
                ? '<span class="text-red-600 font-bold">❌ INACTIVO</span>' 
                : '<span class="text-green-600">✅ Activo</span>'}
        </td>
        <td class="border p-2 text-center">
            <button class="text-blue-600 text-xs px-1" onclick="editarUsuario('${u.usuario || u.id}', ${u.desdeFirebase || false})">✏️</button>
            <button class="text-red-600 text-xs px-1" onclick="cambiarEstadoUsuario('${u.usuario || u.id}', ${u.activo !== false}, ${u.desdeFirebase || false})">
                ${u.activo === false ? '✅ Activar' : '❌ Desactivar'}
            </button>
        </td>
    </tr>
    `).join('');
}

async function guardarUsuario() {
    const nombre = document.getElementById('nombreUsuarioForm').value.trim();
    const usuario = document.getElementById('usuarioForm').value.trim().toLowerCase();
    const clave = document.getElementById('claveForm').value;
    const rol = document.getElementById('rolForm').value || 'usuario';
    const activo = document.getElementById('activoForm').checked;
    const msj = document.getElementById('mensajeUsuario');

    if (!nombre || !usuario) return msj.textContent = '⚠️ Nombre y Usuario son obligatorios';
    if (!idEdicionUsuario && !clave) return msj.textContent = '⚠️ Ingrese contraseña';

    msj.textContent = 'Guardando...';

    const datos = { nombre, usuario, rol, activo };
    if (clave) datos.clave = clave;

    try {
        if (typeof db !== 'undefined') {
            await db.collection('usuarios').doc(usuario).set(datos);
        }
        if (idEdicionUsuario) {
            const idx = usuariosFijos.findIndex(u => u.usuario === idEdicionUsuario);
            if (idx >= 0) {
                if (clave) usuariosFijos[idx].clave = clave;
                usuariosFijos[idx].nombre = nombre;
                usuariosFijos[idx].rol = rol;
                usuariosFijos[idx].activo = activo;
            }
        } else {
            const existe = usuariosFijos.find(u => u.usuario === usuario);
            if (!existe) usuariosFijos.push({ ...datos });
        }
        msj.textContent = '✅ Usuario guardado';
        limpiarFormUsuario();
        await dibujarTablaUsuarios();
    } catch (e) {
        msj.textContent = '❌ Error: ' + e.message;
    }
}

function editarUsuario(usuarioId, desdeFirebase = false) {
    idEdicionUsuario = usuarioId;
    const msj = document.getElementById('mensajeUsuario');
    
    if (desdeFirebase && typeof db !== 'undefined') {
        db.collection('usuarios').doc(usuarioId).get().then(d => {
            if (d.exists) llenarFormUsuario(d.data());
        });
    } else {
        const u = usuariosFijos.find(x => x.usuario === usuarioId);
        if (u) llenarFormUsuario(u);
    }
    document.getElementById('tituloFormUsuario').textContent = '✏️ Editar Usuario';
    msj.textContent = '🔄 Puede cambiar contraseña si lo desea';
}

function llenarFormUsuario(u) {
    document.getElementById('origenUsuario').value = 'nuevo';
    cambiarOrigenUsuario();
    document.getElementById('nombreUsuarioForm').value = u.nombre || '';
    document.getElementById('usuarioForm').value = u.usuario || '';
    document.getElementById('claveForm').value = '';
    document.getElementById('rolForm').value = u.rol || 'usuario';
    document.getElementById('activoForm').checked = u.activo !== false;
}

function limpiarFormUsuario() {
    idEdicionUsuario = null;
    document.getElementById('tituloFormUsuario').textContent = '➕ Crear Nuevo Usuario';
    document.getElementById('origenUsuario').value = '';
    cambiarOrigenUsuario();
    document.getElementById('nombreUsuarioForm').value = '';
    document.getElementById('usuarioForm').value = '';
    document.getElementById('claveForm').value = '';
    document.getElementById('rolForm').value = '';
    document.getElementById('activoForm').checked = true;
    document.getElementById('mensajeUsuario').textContent = '';
}

async function cambiarEstadoUsuario(usuarioId, activoActual, desdeFirebase = false) {
    if (!confirm(`¿${activoActual ? 'DESACTIVAR' : 'ACTIVAR'} este usuario?`)) return;
    
    try {
        if (desdeFirebase && typeof db !== 'undefined') {
            await db.collection('usuarios').doc(usuarioId).update({ activo: !activoActual });
        } else {
            const idx = usuariosFijos.findIndex(u => u.usuario === usuarioId);
            if (idx >= 0) usuariosFijos[idx].activo = !activoActual;
        }
        await dibujarTablaUsuarios();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}