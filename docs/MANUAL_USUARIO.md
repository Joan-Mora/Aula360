# Manual de usuario

Aula 360 acompaña la permanencia. El observatorio dice quién necesita apoyo. El aula guarda la vida de clase, sin cambiar esa lectura.

## Entrar

Abre el sitio y pulsa **Entrar al aula**. Escribe el correo y la clave. Si la clave es temporal, el sistema pide una nueva: diez caracteres, con letras y números.

Tras ocho claves incorrectas hay que esperar quince minutos. El mensaje no indica si el correo existe.

La salida está en la barra superior, junto a **Órbita**.

## La órbita

No hay un menú de lado. Las estaciones del rol aparecen sobre un anillo. Elige una. Si el equipo reduce el movimiento, las mismas estaciones quedan en una cinta horizontal.

## Bienestar

### Cargar estudiantes

Entra a **Ingesta**. Descarga la plantilla si la necesitas. El archivo `.xlsx` es la única forma de registrar o actualizar datos académicos: no hay un formulario de notas ni de asistencia oficial.

Columnas obligatorias:

`codigo_estudiante`, `nombres`, `apellidos`, `correo`, `telefono`, `programa`, `semestre`, `porcentaje_asistencia`, `evaluaciones_programadas`, `evaluaciones_presentadas`, `evaluaciones_perdidas`, `promedio_acumulado`, `materias_reprobadas`, `semanas_sin_asistencia`, `docente_nombre`, `docente_correo`.

Opcionales: `curso`, `grupo`.

El promedio va de 0 a 5. Las evaluaciones presentadas más las perdidas deben coincidir con las programadas. Un código no puede repetirse dentro del mismo archivo.

Si algo falla, verás la fila, la columna y el motivo. Puedes descargar ese informe. En ese caso no se guarda ningún estudiante de ese archivo.

Si el archivo es válido, cada código nuevo crea la ficha y cada código conocido se actualiza. La fotografía anterior queda en el expediente.

La primera vez, el docente y el estudiante reciben un correo con una clave temporal.

### Leer el riesgo

El observatorio muestra cuántos estudiantes hay, cuántos están en riesgo (alto y crítico) y la distribución por banda y programa. La lista está ordenada por puntaje.

En el expediente ves el puntaje, la banda, los factores, las acciones, la narrativa y el historial de cargas. La actividad de aula, si existe, está marcada como no oficial.

Bandas:

- Bajo: seguimiento ordinario. No se envía alerta.
- Medio: el docente debería contactar en cinco días. El aviso depende del análisis.
- Alto: se abre caso de permanencia.
- Crítico: contacto inmediato. Siempre se avisa a Bienestar y al docente.

### Reportes

En **Reportes** descargas el PDF de quienes están en alto o crítico y el Excel con el estado de cada estudiante.

Desde el expediente puedes reenviar la clave temporal del estudiante. Llega por correo. No se muestra en pantalla.

## Docente

Ves solo a los estudiantes cuyo `docente_correo` es el tuyo.

En el aula abres el grupo, pasas lista y publicas una entrega. Eso no cambia el porcentaje de asistencia ni el puntaje del Excel.

En **Mensajes** envías la plantilla de WhatsApp. Cuando el estudiante responde, durante 24 horas puedes escribir con libertad desde el hilo. Si la ventana está cerrada, vuelves a enviar la plantilla.

Las alertas de tus estudiantes aparecen en **Alertas**. Ábrelas para ir al expediente. Puedes marcarlas como leídas.

## Estudiante

Ves tu expediente y tu aula. Subes la entrega en pdf, png, jpg o docx. El archivo queda en el almacén de la plataforma.

Si escribes al número de WhatsApp del aula y no hay un docente en turno, responde el acompañamiento automático. No te pide la clave ni inventa tus notas. Para saber tu banda, entra al expediente.

## Qué no hace el sistema

No permite digitar a mano la asistencia oficial, las evaluaciones ni el promedio. Si un dato académico cambió, se corrige en el Excel y se vuelve a cargar.
