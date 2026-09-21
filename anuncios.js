// =====================================================
// ===== 📢 MÓDULO: CONTROL DE ANUNCIOS — FINAL =====
// =====================================================
let idEnEdicion = null; // Declarada UNA SOLA VEZ — sin duplicados

window.cargarModulo_anuncios = async function () {
  const c = document.getElementById('contenido');
  if (!c) return;

  // 🔒 Control de acceso
  const tieneAcceso = ['admin', 'usuario'].includes(usuarioActivo?.rol);
  if (!tieneAcceso) {
    c.innerHTML = `<p class="text-center mt-4 text-lg">⛔ No tienes permiso para acceder a este módulo</p>`;
    return;
  }

  // Cargar datos
  window.anunciosRegistrados = JSON.parse(localStorage.getItem('anuncios') || '[]');
  const donantes = JSON.parse(localStorage.getItem('donantes') || '[]');
  const colaboradores = [
    "Juan Pérez", "María López", "Carlos Ruiz", "Ana García",
    "Julieth López", "J. Nonato", "Estudiante"
  ];
  const puedeAsignar = usuarioActivo?.rol === 'admin';

  c.innerHTML = `
<div class="tarjeta">
  <h3 class="font-bold mb-4">📢 Registro de Anuncios — Ofertas de Comerciantes</h3>
  
  <div class="grid-2 mb-4">
    <div class="grupo">
      <label>Fecha del Anuncio</label>
      <input type="date" id="anuncioFecha" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="grupo">
      <label>Seleccionar Donante 
        <button type="button" class="text-sm text-blue-600" onclick="cambiarPestaña('donantes')">+ Nuevo</button>
      </label>
      <select id="seleccionDonante" onchange="llenarDatosDonante(this.value)">
        <option value="">-- Escribir manualmente --</option>
        ${donantes.map(d => `<option value='${JSON.stringify(d).replace(/'/g, "&#39;")}'>${d.nombre} — ${d.bodega}/${d.puesto}</option>`).join('')}
      </select>
    </div>
    <div class="grupo">
      <label>Nombre / Razón Social del Comerciante *</label>
      <input type="text" id="anuncioComerciante" placeholder="Nombre del comercio">
    </div>
    <div class="grupo">
      <label>Bodega *</label>
      <input type="text" id="anuncioBodega" placeholder="Ej: Bodega Principal">
    </div>
    <div class="grupo">
      <label>Puesto / Local *</label>
      <input type="text" id="anuncioPuesto" placeholder="Número o nombre">
    </div>
    <div class="grupo">
      <label>Teléfono de Contacto</label>
      <input type="tel" id="anuncioTelefono" placeholder="Teléfono">
    </div>
    <div class="grupo col-span-2">
      <label>Persona que informa</label>
      <input type="text" id="anuncioContacto" placeholder="Quién llamó">
    </div>
    <div class="grupo col-span-2">
      <label>Descripción del Producto Ofrecido *</label>
      <textarea id="anuncioProducto" rows="3" placeholder="Tipo, cantidad aproximada, estado..."></textarea>
    </div>
    <div class="grupo">
      <label>Cantidad / Unidades</label>
      <input type="text" id="anuncioCantidad" placeholder="Ej: 50 canastillas, 200 kg">
    </div>
    <div class="grupo col-span-2">
      <label>Observaciones</label>
      <textarea id="anuncioObs" rows="2" placeholder="Datos adicionales..."></textarea>
    </div>
  </div>
  
  <button class="btn btn-primario" onclick="guardarAnuncio()">💾 Guardar Anuncio</button>
</div>

<div class="tarjeta mt-4">
  <h4 class="font-bold mb-3">📋 Lista de Anuncios (${window.anunciosRegistrados.length})</h4>
  <div style="overflow-x:auto;">
    <table>
      <tr>
        <th>Fecha</th>
        <th>Comerciante</th>
        <th>Bodega/Puesto</th>
        <th>Producto</th>
        <th>Asignado a</th>
        <th>Estado</th>
        ${puedeAsignar ? '<th>Acciones</th>' : ''}
      </tr>
      ${window.anunciosRegistrados.length === 0 
        ? `<tr><td colspan="${puedeAsignar ? 7 : 6}" class="text-center py-4 text-gray-500">Sin anuncios registrados</td></tr>` 
        : window.anunciosRegistrados.map(a => `
        <tr>
          <td>${a.fecha}</td>
          <td><strong>${a.comerciante}</strong><br><small>${a.telefono || ''}</small></td>
          <td>${a.bodega || '—'} / ${a.puesto || '—'}</td>
          <td>${a.producto.substring(0, 25)}${a.producto.length > 25 ? '...' : ''}<br><small>${a.cantidad || ''}</small></td>
          <td>${a.asignados?.length ? a.asignados.join(', ') : '<span class="text-gray-400">Sin asignar</span>'}</td>
          <td>
            ${a.estado === 'pendiente' ? '🟡 Pendiente' : 
              a.estado === 'asignado' ? '🔵 Asignado' : 
              a.estado === 'en_proceso' ? '🟠 En Proceso' : 
              a.estado === 'terminado' ? '✅ Terminado' : '❌ Cancelado'}
          </td>
          ${puedeAsignar ? `<td>
            ${a.estado === 'pendiente' 
              ? `<button class="btn btn-sm btn-primario" onclick="abrirAsignar(${a.id})">Asignar</button>` 
              : a.estado === 'asignado' ? `<span class="text-sm text-gray-500">Asignado</span>` : ''}
          </td>` : ''}
        </tr>
        `).join('')
      }
    </table>
  </div>
</div>

${puedeAsignar ? `
<!-- Modal Asignar Colaboradores -->
<div id="modalAsignar" class="oculto fixed inset-0 bg-black-50 flex items-center justify-center z-150">
  <div class="bg-white p-5 rounded-lg max-w-md w-9-10 max-h-80vh overflow-y-auto">
    <h4 class="font-bold mb-3">👥 Asignar Colaboradores</h4>
    <p class="mb-3 text-sm text-gray-500">Selecciona uno o varios colaboradores para esta recolección:</p>
    <div id="listaColaboradores" class="mb-4">
      ${colaboradores.map(n => `
        <label class="flex gap-2 items-center mb-2 cursor-pointer">
          <input type="checkbox" value="${n}" class="check-colaborador"> ${n}
        </label>
      `).join('')}
    </div>
    <div class="flex gap-2 justify-end">
      <button class="btn" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-exito" onclick="confirmarAsignacion()">✅ Asignar</button>
    </div>
  </div>
</div>
` : ''}
  `;
};

// Llenar automáticamente datos del donante seleccionado
window.llenarDatosDonante = function (valor) {
  if (!valor) {
    document.getElementById('anuncioComerciante').value = '';
    document.getElementById('anuncioBodega').value = '';
    document.getElementById('anuncioPuesto').value = '';
    document.getElementById('anuncioTelefono').value = '';
    document.getElementById('anuncioContacto').value = '';
    return;
  }

  try {
    const d = JSON.parse(valor);
    document.getElementById('anuncioComerciante').value = d.nombre || '';
    document.getElementById('anuncioBodega').value = d.bodega || '';
    document.getElementById('anuncioPuesto').value = d.puesto || '';
    document.getElementById('anuncioTelefono').value = d.telefono || '';
    document.getElementById('anuncioContacto').value = d.contacto || '';
  } catch (e) {
    console.error('Error al cargar donante:', e);
  }
};

// Guardar nuevo anuncio
function guardarAnuncio() {
  const comerciante = document.getElementById('anuncioComerciante').value.trim();
  const bodega = document.getElementById('anuncioBodega').value.trim();
  const puesto = document.getElementById('anuncioPuesto').value.trim();
  const producto = document.getElementById('anuncioProducto').value.trim();

  if (!comerciante || !bodega || !puesto || !producto) {
    return alert('⚠️ Complete los campos obligatorios: Comerciante, Bodega, Puesto y Producto');
  }

  const datos = {
    id: Date.now(),
    fecha: document.getElementById('anuncioFecha').value,
    comerciante,
    bodega,
    puesto,
    telefono: document.getElementById('anuncioTelefono').value.trim(),
    contacto: document.getElementById('anuncioContacto').value.trim(),
    producto,
    cantidad: document.getElementById('anuncioCantidad').value.trim(),
    observaciones: document.getElementById('anuncioObs').value.trim(),
    estado: 'pendiente',
    asignados: [],
    creadoPor: usuarioActivo?.nombre || 'Desconocido',
    fechaCreacion: new Date().toISOString()
  };

  window.anunciosRegistrados.unshift(datos);
  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  alert('✅ Anuncio guardado correctamente');

  // Limpiar formulario
  document.getElementById('seleccionDonante').value = '';
  document.getElementById('anuncioComerciante').value = '';
  document.getElementById('anuncioBodega').value = '';
  document.getElementById('anuncioPuesto').value = '';
  document.getElementById('anuncioTelefono').value = '';
  document.getElementById('anuncioContacto').value = '';
  document.getElementById('anuncioProducto').value = '';
  document.getElementById('anuncioCantidad').value = '';
  document.getElementById('anuncioObs').value = '';

  cargarModulo_anuncios();
}

// Abrir modal de asignación
function abrirAsignar(id) {
  idEnEdicion = id;
  document.getElementById('modalAsignar').classList.remove('oculto');
  // Limpiar selecciones previas
  document.querySelectorAll('.check-colaborador').forEach(c => c.checked = false);
}

function cerrarModal() {
  document.getElementById('modalAsignar').classList.add('oculto');
  idEnEdicion = null;
}

function confirmarAsignacion() {
  const seleccionados = Array.from(document.querySelectorAll('.check-colaborador:checked')).map(c => c.value);

  if (!seleccionados.length) {
    return alert('⚠️ Selecciona al menos un colaborador');
  }

  const anuncio = window.anunciosRegistrados.find(a => a.id === idEnEdicion);
  if (!anuncio) return;

  anuncio.asignados = seleccionados;
  anuncio.estado = 'asignado';
  anuncio.fechaAsignacion = new Date().toISOString();
  anuncio.asignadoPor = usuarioActivo?.nombre;

  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  alert(`✅ Asignado a: ${seleccionados.join(', ')}`);
  cerrarModal();
  cargarModulo_anuncios();
}

window.anunciosRegistrados = window.anunciosRegistrados || [];
// ✅ AGREGAR AL FINAL DE anuncios.js — Cambiar estado a Recogido
window.marcarComoRecogido = function(id, colaboradores) {
  const anuncio = window.anunciosRegistrados.find(a => a.id === id);
  if (!anuncio) return;

  anuncio.estado = 'terminado';
  anuncio.recogidoPor = colaboradores || anuncio.asignados;
  anuncio.fechaRecoleccion = new Date().toISOString();
  
  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  alert('✅ Anuncio marcado como RECOGIDO');
  cargarModulo_anuncios();
};

// ✅ Marcar como NO recogido
window.marcarComoNoRecogido = function(id, motivo = '') {
  const anuncio = window.anunciosRegistrados.find(a => a.id === id);
  if (!anuncio) return;

  anuncio.estado = 'cancelado';
  anuncio.observaciones = anuncio.observaciones 
    ? `${anuncio.observaciones}\nMotivo no recogido: ${motivo}`
    : `Motivo no recogido: ${motivo}`;
  
  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  alert('✅ Anuncio marcado como NO RECOGIDO');
  cargarModulo_anuncios();
};