// =====================================================
// ===== ⚙️ MÓDULO ADMINISTRACIÓN =====
// =====================================================
window.cargarModulo_admin = async function() {
    const c = document.getElementById('contenido');
    if (!c) return;

    // Solo admin
    if (usuarioActivo?.rol !== 'admin') {
        c.innerHTML = `<div class="tarjeta text-center py-8 text-red-500">🔒 Solo administradores pueden acceder</div>`;
        return;
    }

    c.innerHTML = `
    <div class="tarjeta">
        <h3 class="font-bold mb-4">⚙️ Panel de Administración</h3>
        
        <div class="grid-2 mb-6">
            <div class="tarjeta border-2 border-blue-100">
                <h4 class="font-bold mb-3">👤 Datos del Sistema</h4>
                <p class="mb-1"><strong>Colaboradores:</strong> ${colaboradores.length}</p>
                <p class="mb-1"><strong>Conductores:</strong> ${conductores.length}</p>
                <p class="mb-1"><strong>Vehículos (Mov):</strong> ${vehiculosMov.length}</p>
                <p class="mb-1"><strong>Vehículos (Transp):</strong> ${vehiculosTransp.length}</p>
                <p class="mb-1"><strong>Movimientos:</strong> ${movimientos.length}</p>
                <p><strong>Donantes:</strong> ${donantes.length}</p>
            </div>
            
            <div class="tarjeta border-2 border-green-100">
                <h4 class="font-bold mb-3">🔧 Acciones Rápidas</h4>
                <button class="btn btn-primario w-full mb-2" style="width:100%;" onclick="limpiarCache()">🔄 Actualizar Datos</button>
                <button class="btn btn-amarillo w-full mb-2" style="width:100%;" onclick="respaldoDatos()">📤 Respaldo</button>
                <button class="btn btn-peligro w-full" style="width:100%;" onclick="confirmarLimpiezaPrueba()">🗑️ Borrar Datos de Prueba</button>
            </div>
        </div>

        <h4 class="font-bold mb-3">📋 Usuarios Fijos del Sistema</h4>
        <div class="overflow-x-auto">
            <table class="tabla w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Acceso</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuariosFijos.map(u => `
                    <tr class="border-b">
                        <td class="font-medium">${u.nombre}</td>
                        <td><code>${u.usuario}</code></td>
                        <td><span class="px-2 py-1 rounded text-xs ${u.rol==='admin'?'bg-blue-100 text-blue-700':u.rol==='prueba'?'bg-yellow-100':'bg-gray-100'}">${u.rol}</span></td>
                        <td>✅ Acceso directo</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;
};

function limpiarCache() {
    localStorage.removeItem('usuarioActivo');
    alert('✅ Cache limpiado — recargando...');
    location.reload();
}

function respaldoDatos() {
    const datos = {
        fecha: new Date().toLocaleString('es-CO'),
        colaboradores,
        conductores,
        vehiculosMov,
        vehiculosTransp,
        movimientos,
        donantes,
        anuncios
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Respaldo descargado');
}

async function confirmarLimpiezaPrueba() {
    if (!confirm('⚠️ ¿Borrar TODOS los datos creados por usuarios de prueba? Esta acción no se puede deshacer.')) return;
    
    let borrados = 0;
    for (const ref of idsCreadosPorPrueba) {
        try {
            await db.collection(ref.coleccion).doc(ref.id).delete();
            borrados++;
        } catch (e) { console.log('No se pudo borrar:', ref.id); }
    }
    
    idsCreadosPorPrueba = [];
    alert(`✅ ${borrados} registro(s) borrado(s)`);
}