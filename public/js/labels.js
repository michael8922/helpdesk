// Etiquetas de presentación: los valores de la API permanecen sin cambios.
export function statusLabel(status) {
  return ({ open: 'Abierto', in_progress: 'En progreso', closed: 'Cerrado' })[status] ?? status;
}

export function roleLabel(role) {
  return ({ admin: 'Administrador', agent: 'Agente', customer: 'Cliente', auditor: 'Auditor' })[role] ?? role;
}

// La traducción pertenece al cliente web; el contrato de la API no cambia.
export function errorLabel(message, status) {
  const messages = {
    'Invalid credentials': 'El correo o la contraseña no son correctos.',
    'Invalid or missing token': 'La sesión no es válida. Inicia sesión de nuevo.',
    'A unique value already exists': 'Ya existe una cuenta con esos datos.',
    'Internal server error': 'Ocurrió un error en el servidor. Inténtalo de nuevo.',
    'Ticket not found': 'No se encontró el ticket.',
    'User not found': 'No se encontró el usuario.',
    'Route not found': 'No se encontró el recurso solicitado.',
    'Attachment is required': 'Selecciona un archivo para adjuntar.',
    'Only one attachment is allowed': 'Solo puedes adjuntar un archivo.',
    'File extension is not allowed': 'La extensión del archivo no está permitida.',
    'File MIME type does not match the allowed type': 'El tipo de archivo no está permitido.',
    'Ticket has no attachment': 'El ticket no tiene un archivo adjunto.',
    'name, email and password are required': 'El nombre, el correo y la contraseña son obligatorios.',
    'email and password are required': 'El correo y la contraseña son obligatorios.',
  };
  return messages[message] ?? ({
    400: 'Revisa los datos ingresados e inténtalo de nuevo.',
    401: 'No se pudo iniciar sesión. Revisa tus credenciales.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'No se encontró el recurso solicitado.',
    413: 'El archivo es demasiado grande. El tamaño máximo es de 5 MB.',
    422: 'Revisa los datos ingresados e inténtalo de nuevo.',
    500: 'Ocurrió un error en el servidor. Inténtalo de nuevo.',
  })[status] ?? 'No se pudo completar la solicitud. Inténtalo de nuevo.';
}
