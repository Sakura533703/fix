# Presentación técnica: MaxGrade

## Introducción (0-5 minutos)

**Presentador:** Buenos días, hoy les voy a mostrar MaxGrade, una aplicación web y móvil diseñada para facilitar el trabajo de los docentes del CECyT 9, especialmente aquellos de 40 a 60 años.

**Presentador:** Partimos de una problemática real: los profesores del plantel usan plataformas educativas, pero las sienten complicadas, confusas y poco amigables.

**Presentador:** En una encuesta aplicada a 30 docentes, 21 reportaron dificultades para configurar tareas, 20 dijeron que cometen errores porque no comprenden bien las herramientas, y 18 se confunden con los pasos.

**Presentador:** El objetivo de MaxGrade es resolver eso con una interfaz sencilla, iconografía clara, lenguaje en español y flujos de trabajo directos.

**Presentador:** No vamos a presentar el código completo; voy a mostrar la aplicación en funcionamiento y explicar en detalle cómo sus componentes técnicos sostienen esa experiencia.

---

## Fase 1: Qué hace la aplicación y para quién es (5-10 minutos)

**Presentador:** MaxGrade está pensada para dos roles principales: profesor y estudiante.

**Presentador:** El profesor puede crear clases, publicar tareas, calificar entregas, administrar rúbricas y manejar el acceso de los alumnos. El estudiante puede unirse a la clase con un código, entregar trabajos, revisar calificaciones y recibir retroalimentación.

**Presentador:** El sistema está compuesto por los siguientes módulos:

- Autenticación y sesión.
- Gestión de usuarios.
- Gestión de clases.
- Gestión de tareas y entregas.
- Rúbricas y evaluación.
- Soporte técnico.

**Presentador:** El valor principal es reducir el esfuerzo percibido para el docente. Si el usuario encuentra un flujo claro —crear clase, generar código, diseñar tarea y calificar— se minimiza la fatiga digital.

**Presentador:** En esta aplicación, cada función clave está pensada para que el docente toque lo mínimo necesario y siga un camino lógico. Eso es lo que hace funcional la experiencia.

---

## Fase 2: Arquitectura técnica general (10-15 minutos)

**Presentador:** Ahora explico cómo está construida MaxGrade desde el punto de vista técnico.

**Presentador:** El backend está implementado con Node.js y Express. La aplicación se inicia en `back/app.js`, donde se configura el servidor y los middlewares principales.

**Presentador:** Usamos `cors()` para permitir peticiones desde el frontend, `express.json()` para leer bodies JSON, `cookie-parser` para manejar cookies y `express-session` para sesiones en servidor.

**Presentador:** Además, la aplicación sirve archivos estáticos desde `front/public` y renderiza vistas con `EJS` en `front/views`.

**Presentador:** En el backend, los endpoints están organizados por responsabilidad. Por ejemplo:

- `/api/auth` maneja autenticación y sesión.
- `/api/classes` maneja la creación, unión y administración de clases.
- `/api/assignments` maneja tareas, entregas y calificaciones.
- `/api/rubrics` maneja rúbricas y niveles de evaluación.
- `/api/support` recibe reportes de soporte.

**Presentador:** El data access usa Supabase, que en su núcleo es una base de datos PostgreSQL. Con Supabase se usa el cliente `@supabase/supabase-js` y se establecen las credenciales a partir de variables de entorno (`SUPABASE_URL`, `SUPABASE_KEY`).

**Presentador:** La base de datos está modelada con tablas como:

- `usuarios`
- `clases`
- `inscripciones`
- `tareas`
- `entregas`
- `rubricas`
- `anuncios`

**Presentador:** En el archivo `back/config/db.js` vemos cómo se crea el cliente con `createClient(supabaseUrl, supabaseKey)`. Esto conecta al servidor Node.js con la base de datos PostgreSQL de Supabase.

**Presentador:** Sobre seguridad:

- Las contraseñas se procesan con `bcryptjs`.
- El método `bcrypt.hash(password, 12)` genera un hash con 12 rondas de sal, lo que dificulta ataques de fuerza bruta.
- Para autenticación se usa JSON Web Tokens con `jsonwebtoken`.
- En `authController.login`, se firma el JWT con `jwt.sign(userData, process.env.JWT_SECRET || 'tu_clave_secreta', { expiresIn: '24h' })`.

**Presentador:** El token se guarda en una cookie HTTP-only. Esto quiere decir que no es accesible desde JavaScript del cliente, lo que reduce el riesgo de robo por XSS. El cookie está configurado con `httpOnly: true`, `secure: false` en desarrollo y `maxAge: 24 * 60 * 60 * 1000`.

**Presentador:** Además, el middleware `authenticateToken` en `back/middleware/authMiddleware.js` valida cada petición que requiere protección. El flujo es:

1. Lee el token desde `req.cookies.token`.
2. Verifica el token con `jwt.verify(token, secret)`.
3. Consulta `supabase.from('usuarios').select('*').eq('id', decoded.id).single()` para recuperar al usuario activo.
4. Si todo es válido, inyecta `req.user` y permite avanzar.

**Presentador:** Si no hay token, pero existe `req.session.user`, el middleware también deja pasar. Eso permite compatibilidad con sesiones de servidor en rutas que no usan solo JWT.

**Presentador:** Para la carga de archivos usamos `multer` en `back/config/multer.js`. La configuración es `multer.memoryStorage()` y un límite de archivo de 20 MB.

**Presentador:** Esto permite subir archivos en memoria y luego transferirlos al almacenamiento de Supabase. Las guías de tarea se guardan en el bucket `material-clases`, las entregas en `entregas` y los banners en `class-banners`.

**Presentador:** En resumen, la arquitectura combina:

- Express como servidor HTTP.
- JWT para autenticación.
- bcrypt para cifrado de contraseña.
- Supabase + PostgreSQL para datos relacionales.
- Supabase Storage para archivos.
- EJS para vistas dinámicas.

**Presentador:** Eso le da al sistema un stack completo y consistente para una aplicación educativa.

---

## Fase 3: Demo funcional guiada (15-27 minutos)

### 3.1 Inicio de sesión y registro (15-17 minutos)

**Presentador:** Comienzo con el registro y login.

**Presentador:** Cuando un docente se registra, el frontend envía la información a `POST /api/auth/register`.

**Presentador:** En `authController.register` se realizan validaciones de formulario:

- `email` no puede estar vacío.
- `email` debe coincidir con una expresión regular válida.
- `password` debe tener entre 8 y 16 caracteres, incluir mayúscula, minúscula y número.

**Presentador:** Luego se verifica si ya existe el correo con `supabase.from('usuarios').select('id').eq('email', email).single()`.

**Presentador:** Si el usuario es nuevo, se crea con `UserModel.create`, que internamente hace `supabase.from('usuarios').insert([ ... ]).select()`.

**Presentador:** El password no se guarda en claro: se aplica `bcrypt.hash(password, 12)`.

**Presentador:** En el login, el flujo es:

1. Buscar usuario por email: `UserModel.findByEmail(email)`.
2. Comparar la contraseña ingresada con el hash almacenado usando `bcrypt.compare(password, usuario.password)`.
3. Si coincide, generar JWT y guardarlo en cookie.

**Presentador:** Esta combinación de hash con sal y token firmado es la capa básica de seguridad para autenticación.

### 3.2 Dashboard principal (17-19 minutos)

**Presentador:** En el dashboard el usuario ve una navegación lateral y contenido por secciones.

**Presentador:** El script `front/public/js/dashboard.js` controla esta lógica. Por ejemplo, en `loadPendingAssignments()` se hace un fetch a `/api/assignments/pending/my-assignments`.

**Presentador:** El backend responde con tareas pendientes del usuario, ordenadas por fecha. El frontend agrupa los resultados por día y construye tarjetas con HTML seguro usando `escapeHtml`.

**Presentador:** Así se evita inyectar contenido peligroso en la página. Esa función reemplaza caracteres especiales como `<` y `>`.

**Presentador:** El dashboard también usa listeners de eventos para el menú móvil y la barra lateral responsiva, permitiendo que la experiencia funcione bien en pantallas pequeñas y grandes.

### 3.3 Gestión de clases (19-22 minutos)

**Presentador:** El módulo de clases usa rutas REST como `POST /api/classes/create`, `POST /api/classes/join`, `DELETE /api/classes/:classId`.

**Presentador:** Al crear una clase, `classController.createClass` valida los campos obligatorios y genera `codigo_acceso` con `crypto.randomBytes(3).toString('hex')`.

**Presentador:** Esa generación segura produce un token alfanumérico corto de seis caracteres hexadecimales.

**Presentador:** Después de crear la clase en `clases`, el sistema inserta una fila en `inscripciones` para registrar al profesor como miembro de la clase.

**Presentador:** Cuando un alumno se une, `classController.joinClass` busca la clase por `codigo_acceso` y verifica que no esté ya inscrito. Esto evita duplicados mediante la consulta `supabase.from('inscripciones').select('id').eq('clase_id', clase.id).eq('estudiante_id', usuario_id).single()`.

**Presentador:** El profesor también puede eliminar la clase o quitar alumnos. En esos métodos se verifica que `clase.profesor_id === user.id` para controlar permisos.

**Presentador:** El banner de clase se sube con `upload.single('banner')`; el archivo queda en el bucket `class-banners` y la URL pública se almacena en `clases.portada_url`.

### 3.4 Gestión de tareas y entregas (22-25 minutos)

**Presentador:** El módulo de tareas ofrece la creación, edición, listado y eliminación de tareas.

**Presentador:** En `assigmentController.createAssignment` se reciben campos como `titulo`, `descripcion`, `puntos_maximos`, `fecha_entrega`, `clase_id`, `rubrica_ids`, `unidad_id`.

**Presentador:** La función `parseMexicoCityDateTime(fecha_entrega)` convierte la fecha y hora en una fecha válida con la zona horaria de Ciudad de México. Eso es importante porque el servidor puede estar en otra zona y debemos comparar la fecha de entrega con la hora local correcta.

**Presentador:** Se valida que la fecha sea posterior al momento actual y que los puntos estén entre 1 y 100.

**Presentador:** Si el profesor adjunta un archivo guía, `multer` lo pone en memoria y luego se sube con `supabase.storage.from('material-clases').upload(fileName, file.buffer, { contentType: file.mimetype })`.

**Presentador:** Si se seleccionan rúbricas, el backend consulta sus puntos y valida que la suma total sea entre 1 y 100.

**Presentador:** Las tareas se crean en la tabla `tareas` y si hay rúbricas asociadas, se asignan con `RubricModel.assignRubricToTask(tareaId, rubricaId)`.

**Presentador:** Para las entregas de los alumnos, `submitSubmission` recibe el archivo del estudiante, genera un nombre único con `Date.now()` y sube el archivo a `Supabase Storage` en el bucket `entregas`.

**Presentador:** La ruta de entrega también guarda `comentario_alumno`, `tarea_id`, `estudiante_id` y la URL del archivo en la tabla `entregas`.

**Presentador:** El estudiante puede cancelar la entrega o actualizarla, mientras que el profesor puede calificarla con `PUT /api/assignments/grade/:id`.

**Presentador:** El dashboard de entregas se construye con datos de `entregas` y muestra:

- Fecha de envío.
- Estado de la entrega.
- Nota asignada.
- Comentarios del profesor.

**Presentador:** Todo esto se hace con consultas SQL indirectas a través del cliente de Supabase, lo que mantiene la lógica de negocio separada del renderizado.

### 3.5 Rúbricas y calificaciones (25-27 minutos)

**Presentador:** Las rúbricas son un componente clave para evaluar con criterio.

**Presentador:** El módulo de rúbricas expone rutas como `GET /api/rubrics/class/:claseId`, `POST /api/rubrics/`, `GET /api/rubrics/task/:tareaId`, `POST /api/rubrics/:rubricaId/levels`.

**Presentador:** Cuando se crea una rúbrica, el backend verifica permisos de profesor en la clase o en la tarea asociada.

**Presentador:** El método `createRubric` valida que la rúbrica pertenece a una tarea y que el usuario es el profesor de esa clase.

**Presentador:** Los niveles de rúbrica también se crean con `createRubricLevel`, y cada nivel tiene `puntos`, `titulo` y `descripcion`.

**Presentador:** Para calificar por rúbrica, la aplicación usa `gradeSubmissionRubrics`, que asocia puntajes a los criterios de un entregable.

**Presentador:** Esto permite que la calificación no sea solo un número, sino un conjunto de criterios evaluados. Es un enfoque más técnico y profesional que la típica nota plana.

---

## Fase 4: Valor diferencial y conclusiones (27-30 minutos)

**Presentador:** Para cerrar, destaco algunos puntos técnicos que hacen a MaxGrade diferente.

**Presentador:** 1. Arquitectura modular:

- Controladores separados por dominio.
- Modelos que encapsulan consultas a Supabase.
- Rutas REST bien definidas.

**Presentador:** 2. Seguridad sólida:

- Hash con `bcryptjs` y 12 rondas de sal.
- JWT firmado con clave secreta y expiración de 24 horas.
- Cookies HTTP-only para reducir riesgos de XSS.

**Presentador:** 3. Base de datos relacional:

- PostgreSQL bajo Supabase.
- Tablas normalizadas para usuarios, clases, tareas, entregas y rúbricas.
- Consultas con `supabase.from(...).select(...)` que respetan restricciones de integridad.

**Presentador:** 4. Manejo de archivos:

- `multer.memoryStorage()` para procesar documentos en memoria.
- Storage de Supabase para archivos grandes.
- URLs públicas controladas para acceder a guías, entregas y banners.

**Presentador:** 5. Experiencia de usuario:

- EJS para vistas server-side que se pueden proteger mejor que un frontend SPA desordenado.
- JavaScript ligero para interactividad sin sobrecargar al docente.
- Secciones claras, mensajes de error legibles y validaciones front/backend.

**Presentador:** En conclusión, MaxGrade no es solo una app funcional. Es una aplicación técnica diseñada para que el docente pueda concentrarse en su trabajo educativo sin luchar con la tecnología.

**Presentador:** Gracias por su atención. Si tienen preguntas técnicas sobre cualquier componente, con gusto las respondo.
