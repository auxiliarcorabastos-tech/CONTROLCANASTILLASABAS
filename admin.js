// =====================================================
// ===== ⚙️ MÓDULO ADMINISTRACIÓN COMPLETO =====
// =====================================================
window.cargarModulo_admin = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    c.innerHTML = `
    <div class="tarjeta">
        <h2 class="text-xl font-bold mb-4">⚙️ Gestión de Roles y Permisos</h2>
        
        <!-- Formulario Crear/Editar Rol -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 class="font-bold mb-3" id="tituloRol">➕ Crear Nuevo Rol</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                    <label>Clave del Rol (sin espacios)</label>
                    <input type="text" id="rolClave" placeholder="Ej: bodeguero">
                </div>
                <div>
                    <label>Nombre del Rol</label>
                    <input type="text" id="rolNombre" placeholder="Ej: Bodeguero Principal">
                </div>
            </div>

            <h4 class="font-semibold mb-2">🔐 Permisos por Módulo</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${MODULOS_SISTEMA.map(m => `
                <div class="border p-3 rounded bg-white">
                    <p class="font-semibold mb-2">${m.nombre}</p>
                    <label class="inline-flex items-center gap-2 mr-3">
                        <input type="checkbox" class="permiso-ver" data-modulo="${m.id}" checked>
                        ✅ Ver
                    </label>
                    <label class="inline-flex items-center gap-2">
                        <input type="checkbox" class="permiso-editar" data-modulo="${m.id}">
                        ✏️ Editar / Modificar
                    </label>
                </div>
                `).join('')}
            </div>

            <div class="flex gap-2 mt-4">
                <button class="btn-primario" onclick="guardarRol()">💾 Guardar Rol</button>
                <button class="bg-gray-200 px-4 py-2 rounded" onclick="limpiarFormRol()">🗑️ Limpiar</button>
            </div>
            <p id="mensajeRol" class="mt-2 text-sm"></p>
        </div>

        <!-- Lista de Roles -->
        <h3 class="font-bold mb-3">📋 Roles del Sistema</h3>
        <div class="space-y-3">
            ${listaRoles.map(r => `
            <div class="border p-3 rounded-lg bg-white">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg">${r.nombre}</p>
                        <p class="text-sm text-gray-500">Clave: <code>${r.clave}</code></p>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-blue-600 px-2 py-1 rounded hover:bg-blue-50" onclick="editarRol('${r.clave}')">✏️ Editar</button>
                        ${!['admin', 'usuario'].includes(r.clave) 
                            ? `<button class="text-red-600 px-2 py-1 rounded hover:bg-red-50" onclick="eliminarRol('${r.clave}')">🗑️ Eliminar</button>` 
                            : `<span class="text-xs text-gray-400 px-2">🔒 Sistema</span>`}
                    </div>
                </div>
                <div class="mt-3 text-sm text-gray-600 flex flex-wrap gap-2">
                    ${MODULOS_SISTEMA.map(m => {
                        const p = r.permisos?.[m.id] || { ver: false, editar: false };
                        const estado = [];
                        if (p.ver) estado.push('👁️ Ver');
                        if (p.editar) estado.push('✏️ Editar');
                        return `<span class="bg-gray-50 px-2 py-1 rounded text-xs">${m.nombre.split(' ')[0]}: ${estado.length ? estado.join(' · ') : '❌ Sin acceso'}</span>`;
                    }).join('')}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    `;
};

let idEdicionRol = null;

// =====================================================
// ===== GUARDAR ROL =====
// =====================================================
async function guardarRol() {
    const clave = document.getElementById('rolClave').value.trim().toLowerCase().replace(/\s+/g, '_');
    const nombre = document.getElementById('rolNombre').value.trim();
    const msj = document.getElementById('mensajeRol');

    // Validaciones
    if (!clave || !nombre) {
        msj.textContent = '⚠️ Complete clave y nombre del rol';
        msj.style.color = '#F53F3F';
        return;
    }
    if (!/^[a-z0-9_]+$/.test(clave)) {
        msj.textContent = '⚠️ Solo minúsculas, números y guion bajo (_) sin espacios';
        msj.style.color = '#F53F3F';
        return;
    }

    // Recopilar permisos
    const permisos = {};
    MODULOS_SISTEMA.forEach(m => {
        permisos[m.id] = {
            ver: document.querySelector(`.permiso-ver[data-modulo="${m.id}"]`).checked,
            editar: document.querySelector(`.permiso-editar[data-modulo="${m.id}"]`).checked
        };
    });

    const datosRol = {
        clave,
        nombre,
        permisos,
        fechaActualizacion: new Date()
    };

    try {
        // Guardar en Firebase
        if (typeof db !== 'undefined') {
            await db.collection('roles').doc(clave).set(datosRol);
        }

        // Actualizar lista local
        const indice = listaRoles.findIndex(r => r.clave === clave);
        if (indice >= 0) {
            listaRoles[indice] = datosRol;
        } else {
            listaRoles.push(datosRol);
        }

        // Éxito
        msj.textContent = '✅ Rol guardado correctamente';
        msj.style.color = '#00B42A';
        
        // Recargar la página del módulo
        setTimeout(() => {
            cambiarPestaña('admin');
        }, 800);

    } catch (error) {
        msj.textContent = '❌ Error al guardar: ' + error.message;
        msj.style.color = '#F53F3F';
        console.error('Error guardando rol:', error);
    }
}

// =====================================================
// ===== EDITAR ROL =====
// =====================================================
function editarRol(claveRol) {
    const rol = listaRoles.find(r => r.clave === claveRol);
    if (!rol) {
        alert('Rol no encontrado');
        return;
    }

    idEdicionRol = claveRol;
    
    // Actualizar formulario
    document.getElementById('tituloRol').textContent = `✏️ Editar Rol: ${rol.nombre}`;
    document.getElementById('rolClave').value = rol.clave;
    
    // Bloquear clave si es rol protegido
    if (['admin', 'usuario'].includes(claveRol)) {
        document.getElementById('rolClave').disabled = true;
        document.getElementById('rolClave').style.background = '#f3f4f6';
    } else {
        document.getElementById('rolClave').disabled = false;
        document.getElementById('rolClave').style.background = '';
    }
    
    document.getElementById('rolNombre').value = rol.nombre;

    // Cargar permisos actuales
    MODULOS_SISTEMA.forEach(m => {
        const permiso = rol.permisos?.[m.id] || { ver: false, editar: false };
        const checkVer = document.querySelector(`.permiso-ver[data-modulo="${m.id}"]`);
        const checkEditar = document.querySelector(`.permiso-editar[data-modulo="${m.id}"]`);
        
        if (checkVer) checkVer.checked = permiso.ver;
        if (checkEditar) checkEditar.checked = permiso.editar;
    });

    // Limpiar mensaje
    const msj = document.getElementById('mensajeRol');
    if (msj) msj.textContent = '';
}

// =====================================================
// ===== LIMPIAR FORMULARIO =====
// =====================================================
function limpiarFormRol() {
    idEdicionRol = null;
    
    document.getElementById('tituloRol').textContent = '➕ Crear Nuevo Rol';
    document.getElementById('rolClave').value = '';
    document.getElementById('rolClave').disabled = false;
    document.getElementById('rolClave').style.background = '';
    document.getElementById('rolNombre').value = '';
    
    // Restablecer permisos por defecto: Ver = Sí, Editar = No
    document.querySelectorAll('.permiso-ver').forEach(cb => cb.checked = true);
    document.querySelectorAll('.permiso-editar').forEach(cb => cb.checked = false);
    
    const msj = document.getElementById('mensajeRol');
    if (msj) msj.textContent = '';
}

// =====================================================
// ===== ELIMINAR ROL =====
// =====================================================
async function eliminarRol(claveRol) {
    // Proteger roles del sistema
    if (['admin', 'usuario'].includes(claveRol)) {
        alert('🔒 Este rol es del sistema y no se puede eliminar');
        return;
    }

    if (!confirm(`⚠️ ¿Eliminar el rol "${claveRol}"?\n\nLos usuarios que tengan este rol perderán todos sus permisos hasta que se les asigne uno nuevo.\n\n¿Continuar?`)) {
        return;
    }

    try {
        // Eliminar de Firebase
        if (typeof db !== 'undefined') {
            await db.collection('roles').doc(claveRol).delete();
        }

        // Eliminar de la lista local
        listaRoles = listaRoles.filter(r => r.clave !== claveRol);

        alert('✅ Rol eliminado correctamente');
        
        // Recargar vista
        cambiarPestaña('admin');

    } catch (error) {
        alert('❌ Error al eliminar: ' + error.message);
        console.error('Error eliminando rol:', error);
    }
}