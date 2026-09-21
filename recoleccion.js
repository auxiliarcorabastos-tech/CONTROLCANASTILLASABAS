// =====================================================
// ===== 📦 MÓDULO: RECOLECCIÓN DE PRODUCTO =====
// =====================================================
window.cargarModulo_recoleccion = async function() {
  const c = document.getElementById('contenido');
  if (!c) return;

  // 🔒 Cargar datos
  window.anunciosRegistrados = JSON.parse(localStorage.getItem('anuncios') || '[]');
  const usuarioActual = usuarioActivo?.nombre;

  // Filtrar: solo lo asignado a ESTE usuario + lo que le corresponda
  const asignados = window.anunciosRegistrados.filter(a => 
    ['asignado', 'en_proceso'].includes(a.estado) && 
    a.asignados?.includes(usuarioActual)
  );
  const terminados = window.anunciosRegistrados.filter(a => 
    a.estado === 'terminado' && 
    a.asignados?.includes(usuarioActual)
  );

  c.innerHTML = `
<div class="tarjeta">
  <h3 class="font-bold mb-4">📦 Recolección de Producto — ${usuarioActual}</h3>
  
  ${asignados.length === 0 ? 
    '<p class="text-center text-gray-500 py-4">✅ No tienes recogidas asignadas</p>' : 
    `<h4 class="font-bold mb-3">📍 Mis Recogidas</h4>
    ${asignados.map(p => `
      <div class="border rounded-lg p-4 mb-4 ${p.estado === 'en_proceso' ? 'bg-yellow-50' : 'bg-blue-50'}" id="rec-${p.id}">
        <div class="grid-2 mb-3">
          <div>
            <strong>${p.comerciante}</strong><br>
            📍 Bodega: ${p.bodega || '—'} | Puesto: ${p.puesto || '—'}<br>
            📞 ${p.telefono || 'Sin teléfono'}<br>
            📦 ${p.producto} — ${p.cantidad || ''}<br>
            👥 Asignado: ${p.asignados?.join(', ')}
          </div>
          <div>
            <p class="mb-2">
              Estado: <strong>${p.estado === 'asignado' ? '🔵 Pendiente de Llegada' : '🟠 En Proceso'}</strong>
            </p>
            
            ${p.estado === 'asignado' ? 
              `<button class="btn btn-amarillo w-full" onclick="marcarEnProceso(${p.id})">🚩 Ya llegué — Iniciar Recolección</button>` :
              `<div>
                <label>Número de Recibo *</label>
                <input type="text" id="recibo-${p.id}" placeholder="Ej: REC-001" value="${p.numeroRecibo || ''}" required>
                
                <label class="mt-2">Ubicación GPS</label>
                <div style="display:flex; gap:0.5rem;">
                  <input type="text" id="ubicacion-${p.id}" placeholder="Latitud, Longitud" value="${p.ubicacion || ''}" readonly style="flex:1;">
                  <button class="btn btn-sm" onclick="capturarUbicacion(${p.id})" id="btnGps-${p.id}">📍 Obtener</button>
                </div>
                <small id="estadoGps-${p.id}" class="text-green-600">${p.ubicacion ? '✅ Ubicación guardada' : ''}</small>
                
                <button class="btn btn-exito w-full mt-3" onclick="marcarTerminado(${p.id})">✅ Finalizar Recolección</button>
              </div>`
            }
          </div>
        </div>
      </div>
    `).join('')}`
  }
</div>

${terminados.length > 0 ? `
<div class="tarjeta mt-4">
  <h4 class="font-bold mb-3">✅ Mis Recogidas Terminadas (${terminados.length})</h4>
  <div style="overflow-x:auto;">
    <table>
      <tr>
        <th>Fecha</th>
        <th>Recibo N°</th>
        <th>Comerciante</th>
        <th>Bodega/Puesto</th>
        <th>Ubicación</th>
      </tr>
      ${terminados.map(r => `
        <tr>
          <td>${r.fechaTerminado?.split('T')[0] || r.fecha}</td>
          <td><strong>${r.numeroRecibo}</strong></td>
          <td>${r.comerciante}</td>
          <td>${r.bodega || '—'} / ${r.puesto || '—'}</td>
          <td>
            ${r.ubicacion ? 
              `<a href="https://www.google.com/maps?q=${r.ubicacion}" target="_blank" class="text-blue-600">📍 Ver mapa</a>` : 
              'Sin ubicación'}
          </td>
        </tr>
      `).join('')}
    </table>
  </div>
</div>` : ''}
  `;
};

// Marcar como EN PROCESO = llegué al lugar
window.marcarEnProceso = function(id) {
  if (!confirm('🚩 ¿Confirmas que ya llegaste al punto de recolección?')) return;
  
  const anuncio = window.anunciosRegistrados.find(a => a.id === id);
  if (!anuncio) return;
  
  anuncio.estado = 'en_proceso';
  anuncio.fechaLlegada = new Date().toISOString();
  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  
  alert('✅ Estado cambiado: EN PROCESO\nAhora puedes capturar ubicación y finalizar');
  cargarModulo_recoleccion();
};

// Capturar ubicación GPS
window.capturarUbicacion = function(idAnuncio) {
  const input = document.getElementById(`ubicacion-${idAnuncio}`);
  const estado = document.getElementById(`estadoGps-${idAnuncio}`);
  const btn = document.getElementById(`btnGps-${idAnuncio}`);
  
  if (!navigator.geolocation) {
    estado.textContent = '❌ GPS no soportado';
    return;
  }

  btn.disabled = true;
  btn.textContent = '🔄...';
  estado.textContent = 'Obteniendo...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      input.value = `${lat}, ${lon}`;
      estado.textContent = '✅ Ubicación capturada';
      btn.disabled = false;
      btn.textContent = '📍 Obtener';
    },
    (err) => {
      estado.textContent = `❌ Error: ${err.message}`;
      btn.disabled = false;
      btn.textContent = '📍 Obtener';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

// Marcar como TERMINADO
window.marcarTerminado = function(id) {
  const recibo = document.getElementById(`recibo-${id}`).value.trim();
  const ubicacion = document.getElementById(`ubicacion-${id}`).value.trim();
  
  if (!recibo) {
    return alert('⚠️ Ingrese el número de recibo');
  }

  const anuncio = window.anunciosRegistrados.find(a => a.id === id);
  if (!anuncio) return;

  anuncio.estado = 'terminado';
  anuncio.numeroRecibo = recibo;
  anuncio.ubicacion = ubicacion || null;
  anuncio.fechaTerminado = new Date().toISOString();
  anuncio.recogidoPor = usuarioActivo?.nombre;

  localStorage.setItem('anuncios', JSON.stringify(window.anunciosRegistrados));
  alert(`✅ Recolección FINALIZADA!\nRecibo: ${recibo}\n${ubicacion ? 'Ubicación guardada' : 'Sin ubicación'}`);
  
  cargarModulo_recoleccion();
};