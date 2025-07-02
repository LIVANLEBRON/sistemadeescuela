/**
 * Utilidad para manejar errores globalmente en la aplicación
 * Esto ayuda a evitar errores del tipo [object Object] en la consola
 */

// Función para convertir cualquier error a un formato legible
export const formatError = (error) => {
  if (!error) return 'Error desconocido';
  
  try {
    // Si es un objeto, intentar convertirlo a string de forma segura
    if (typeof error === 'object') {
      // Extraer propiedades comunes de errores
      const details = {
        message: error.message || 'Sin mensaje',
        name: error.name || 'Error',
        code: error.code || 'Sin código',
        details: error.details || 'Sin detalles',
        stack: error.stack || 'Sin stack'
      };
      
      return JSON.stringify(details, null, 2);
    }
    
    // Si no es un objeto, convertirlo a string
    return String(error);
  } catch (e) {
    console.error('Error al formatear el error:', e);
    return 'Error no procesable';
  }
};

// Configurar manejadores globales de errores
export const setupGlobalErrorHandlers = () => {
  // Capturar errores no manejados en promesas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Error no manejado en promesa:');
    console.error(formatError(event.reason));
    event.preventDefault();
  });

  // Sobrescribir el manejador de errores global
  const originalErrorHandler = console.error;
  console.error = (...args) => {
    // Formatear objetos de error para evitar [object Object]
    const formattedArgs = args.map(arg => 
      (typeof arg === 'object' && arg !== null) ? formatError(arg) : arg
    );
    
    originalErrorHandler.apply(console, formattedArgs);
  };
  
  console.log('Manejadores globales de errores configurados');
};

// Función para mostrar errores en la UI (puede expandirse según necesidades)
export const showErrorNotification = (message) => {
  // Esta función podría mostrar un toast, alert, o actualizar un componente de notificación
  alert(`Error: ${message}`);
};
