// =====================================================
// ===== 🏪 MÓDULO: GESTIÓN DE DONANTES =====
// =====================================================
window.cargarModulo_donantes = async function() {
  const c = document.getElementById('contenido');
  if (!c) return;

  // 🔒 Control de acceso
  const tieneAcceso = ['admin', 'usuario'].includes(usuarioActivo?.rol);
  if (!tieneAcceso) {
    c.innerHTML = `<p class="text-center mt-4 text-lg">⛔ No tienes permiso para acceder a este módulo</p>`;
    return;
  }

  cargarFormularioDonante();
};

function cargarFormularioDonante(donanteEditar = null) {
  const c = document.getElementById('contenido');
  const donantes = JSON.parse(localStorage.getItem('donantes') || '[]');

  c.innerHTML = `
<div class="tarjeta">
  <h3 class="font-bold mb-4">🏪 Gestión de Donantes</h3>
  <p class="mb-4 text-sm text-gray-600">Registra los comerciantes para seleccionarlos rápidamente al crear anuncios</p>

  <div class="grid-2 mb-4">
    <div class="grupo">
      <label>Nombre / Razón Social *</label>
      <input type="text" id="donanteNombre" value="${donanteEditar?.nombre || ''}" placeholder="Ej: Frutas del Sol">
    </div>
    <div class="grupo">
      <label>Teléfono</label>
      <input type="tel" id="donanteTelefono" value="${donanteEditar?.telefono || ''}" placeholder="Teléfono de contacto">
    </div>
    <div class="grupo">
      <label>Bodega *</label>
      <input type="text" id="donanteBodega" value="${donanteEditar?.bodega || ''}" placeholder="Ej: Bodega Principal">
    </div>
    <div class="grupo">
      <label>Puesto / Local *</label>
      <input type="text" id="donantePuesto" value="${donanteEditar?.puesto || ''}" placeholder="Número o nombre del puesto">
    </div>
    <div class="grupo col-span-2">
      <label>Persona de contacto</label>
      <input type="text" id="donanteContacto" value="${donanteEditar?.contacto || ''}" placeholder="Quién llama o avisa">
    </div>
    <div class="grupo col-span-2">
      <label>Observaciones</label>
      <textarea id="donanteObs" rows="2" placeholder="Datos adicionales...">${donanteEditar?.observaciones || ''}</textarea>
    </div>
  </div>

  <div class="flex gap-2">
    <button class="btn btn-primario" onclick="guardarDonante(${donanteEditar?.id || 'null'})">
      ${donanteEditar ? '✏️ Actualizar' : '💾 Guardar'} Donante
    </button>
    ${donanteEditar ? `<button class="btn" onclick="cargarFormularioDonante()">❌ Cancelar</button>` : ''}
  </div>
</div>

<div class="tarjeta mt-4">
  <h4 class="font-bold mb-3">📋 Lista de Donantes (${donantes.length})</h4>
  ${donantes.length === 0 ? 
    '<p class="text-center text-gray-500 py-3">Sin donantes registrados</p>' :
    `<div style="overflow-x:auto;">
      <table>
        <tr>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Bodega</th>
          <th>Puesto</th>
          <th>Contacto</th>
          <th>Acciones</th>
        </tr>
        ${donantes.map(d => `
          <tr>
            <td><strong>${d.nombre}</strong></td>
            <td>${d.telefono || '—'}</td>
            <td>${d.bodega}</td>
            <td>${d.puesto}</td>
            <td>${d.contacto || '—'}</td>
            <td>
              <button class="btn btn-sm btn-amarillo" onclick="cargarFormularioDonante(${JSON.stringify(d).replace(/"/g, '&quot;')})">✏️ Editar</button>
              <button class="btn btn-sm btn-peligro" onclick="eliminarDonante('${d.id}')">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>`
  }
</div>
  `;
}

function guardarDonante(idEditar = null) {
  const nombre = document.getElementById('donanteNombre').value.trim();
  const telefono = document.getElementById('donanteTelefono').value.trim();
  const bodega = document.getElementById('donanteBodega').value.trim();
  const puesto = document.getElementById('donantePuesto').value.trim();
  const contacto = document.getElementById('donanteContacto').value.trim();
  const observaciones = document.getElementById('donanteObs').value.trim();

  if (!nombre || !bodega || !puesto) {
    return alert('⚠️ Complete los campos obligatorios: Nombre, Bodega y Puesto');
  }

  let donantes = JSON.parse(localStorage.getItem('donantes') || '[]');

  if (idEditar) {
    // Actualizar existente
    const index = donantes.findIndex(d => d.id === idEditar);
    if (index !== -1) {
      donantes[index] = {
        ...donantes[index],
        nombre, telefono, bodega, puesto, contacto, observaciones,
        fechaEdicion: new Date().toISOString()
      };
    }
    alert('✅ Donante actualizado');
  } else {
    // Nuevo
    donantes.unshift({
      id: Date.now().toString(),
      nombre, telefono, bodega, puesto, contacto, observaciones,
      fechaCreacion: new Date().toISOString(),
      creadoPor: usuarioActivo?.nombre
    });
    alert('✅ Donante guardado');
  }

  localStorage.setItem('donantes', JSON.stringify(donantes));
  cargarFormularioDonante();
}

function eliminarDonante(id) {
  if (!confirm('⚠️ ¿Eliminar este donante?\n\nEsto NO afecta los anuncios ya creados.')) return;
  
  let donantes = JSON.parse(localStorage.getItem('donantes') || '[]');
  donantes = donantes.filter(d => d.id !== id);
  localStorage.setItem('donantes', JSON.stringify(donantes));
  
  alert('✅ Donante eliminado');
  cargarFormularioDonante();
}