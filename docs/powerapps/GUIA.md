# Guía de construcción: ReservaViajes con Microsoft 365 E3

Esta guía arma la versión real de la app usando solo lo que trae una licencia **Microsoft 365 E3**, sin gastos extra y sin comprar dominio. Pasajeros y conductor la usan desde el celular.

## Arquitectura

```
Pasajero (celular, sin cuenta)          Conductor (celular, cuenta E3)
        │                                        │
  Microsoft Forms  ──►  Power Automate  ──►  Listas de SharePoint  ◄──  Power Apps (lienzo)
  (cualquiera puede      (flujo automático,      Viajes / Reservas         app "ReservaViajes
   responder)             conectores estándar)                              Conductor"
```

| Pieza | Para qué | ¿Incluido en E3? |
| --- | --- | --- |
| Microsoft Forms | Formulario público del pasajero (link o código QR). | Sí |
| Power Automate | Recibe cada respuesta, revisa si el asiento está libre, guarda la reserva y envía el correo. | Sí (conectores estándar: Forms, SharePoint, Outlook) |
| Listas de SharePoint | Base de datos compartida. | Sí |
| Power Apps (aplicación de lienzo) | App del conductor para validar o rechazar reservas y ver la van. | Sí (con conectores estándar) |

**Lo que no se usa porque E3 no lo incluye:** Power Pages, Dataverse y conectores premium (como el disparador HTTP).

### Límites conocidos y cómo se resuelven

| Límite | Solución en esta versión |
| --- | --- |
| Forms abierto a "cualquiera" **no permite subir archivos**. | El pasajero escribe **medio de pago, número de operación, monto y fecha**. El conductor lo comprueba en su app del banco, Yape o Plin. |
| Forms **no tiene mapa de asientos** y no puede ocultar los ocupados. | Se muestra la imagen `van-asientos.png` y una pregunta "Asiento 1–7". El flujo revisa si ese asiento ya está tomado y, si lo está, marca la reserva como **Conflicto** y avisa al pasajero por correo para que elija otro. |
| Las opciones de Forms no se pueden cambiar con un flujo. | Al abrir un viaje nuevo, el conductor agrega esa opción a mano en la pregunta "Viaje" (ver *Rutina para abrir un viaje*). |
| La Power App no puede ser pública. | Solo la usa el conductor o administrador, con su cuenta E3. |

---

## Paso 1. Crear el sitio y las listas de SharePoint

1. En SharePoint, crea un **sitio de grupo** llamado `ReservaViajes` (o usa uno existente).
2. Crea la lista **Viajes** (*Nuevo → Lista → Lista en blanco*) con estas columnas:

| Columna | Tipo | Notas |
| --- | --- | --- |
| Title (renómbrala a **Viaje**) | Una línea de texto | Código que verá el pasajero. Ej.: `25/10 Lima → Paracas 6:00`. Debe ser **idéntico** a la opción del Forms. |
| Fecha | Fecha y hora | Incluir hora. |
| Ruta | Una línea de texto | Ej.: `Lima → Paracas`. |
| Precio | Moneda (S/) | |
| Estado | Elección | `Abierto`, `Cerrado`, `Realizado`. Predeterminado: `Abierto`. |

3. Crea la lista **Reservas**:

| Columna | Tipo | Notas |
| --- | --- | --- |
| Title (renómbrala a **Codigo**) | Una línea de texto | `RV-XXXXXX`, lo genera el flujo. |
| Viaje | Una línea de texto | Copia del texto elegido en el Forms. |
| Asiento | Número | 0 decimales, mínimo 1, máximo 7. |
| NombreCompleto | Una línea de texto | |
| DNI | Una línea de texto | Texto, no número, para no perder ceros a la izquierda. |
| Edad | Número | |
| Correo | Una línea de texto | |
| Celular | Una línea de texto | |
| Origen | Una línea de texto | Punto de recojo. |
| Destino | Una línea de texto | |
| Retorno | Sí/No | |
| MedioPago | Elección | `Yape`, `Plin`, `Transferencia`, `Efectivo`. |
| NumeroOperacion | Una línea de texto | |
| Monto | Moneda (S/) | |
| FechaPago | Fecha | |
| Estado | Elección | `Pendiente`, `Validada`, `Rechazada`, `Conflicto`. Predeterminado: `Pendiente`. |
| Observacion | Varias líneas de texto | Motivo de rechazo o notas del conductor. |

> Usa exactamente estos nombres internos (sin tildes ni espacios) al crear cada columna; después puedes cambiar el nombre visible. Las fórmulas de esta guía usan los nombres internos.

4. Permisos: el conductor necesita permiso de **Edición** en el sitio. Los pasajeros **no** necesitan acceso a SharePoint.

## Paso 2. Crear el formulario del pasajero (Microsoft Forms)

1. Entra a forms.office.com con tu cuenta E3 → **Nuevo formulario** → título `Reserva tu asiento`.
2. En **Configuración** marca **Cualquier persona puede responder** (así no se pide iniciar sesión).
3. Agrega las preguntas en este orden (todas obligatorias salvo que se diga lo contrario):

| # | Pregunta | Tipo | Configuración |
| --- | --- | --- | --- |
| 1 | Viaje | Elección (desplegable) | Una opción por viaje abierto, con el mismo texto de la lista **Viajes**. |
| 2 | Nombres y apellidos completos | Texto | |
| 3 | DNI | Texto | Subtítulo: "8 dígitos". |
| 4 | Edad | Texto | *Restricciones → Número → Entre 1 y 120.* |
| 5 | Correo electrónico | Texto | Subtítulo: "Aquí te llegará la confirmación". |
| 6 | Celular | Texto | |
| 7 | Punto de origen o recojo | Texto | |
| 8 | Punto de destino | Texto | |
| 9 | ¿Requiere retorno? | Elección | `Sí`, `No`. |
| 10 | Elige tu asiento | Elección | Opciones `1` a `7`. Inserta la imagen **`van-asientos.png`** en la pregunta (icono de imagen). |
| 11 | Medio de pago | Elección | `Yape`, `Plin`, `Transferencia`, `Efectivo`. |
| 12 | Número de operación | Texto | Subtítulo: "Escribe 0 si pagas en efectivo". |
| 13 | Monto pagado (S/) | Texto | *Restricciones → Número → Mayor que 0.* |
| 14 | Fecha del pago | Fecha | |
| 15 | Autorizo el uso de mis datos personales para gestionar mi reserva | Elección | Única opción: `Acepto`. Recomendado por la Ley 29733 de protección de datos. |

4. En **Configuración → Personalizar mensaje de agradecimiento** escribe: "¡Gracias! Te enviaremos un correo con tu código de reserva. El conductor validará tu pago."
5. **Compartir**: botón *Recopilar respuestas* → copia el **enlace** o descarga el **código QR**. Eso reemplaza al dominio: se comparte por WhatsApp, redes o impreso en la van.

## Paso 3. Crear el flujo de Power Automate

Nombre sugerido: `ReservaViajes – Nueva reserva`. Tipo: **Flujo de nube automatizado**.

1. **Desencadenador:** *Microsoft Forms → Cuando se envía una respuesta nueva* → elige el formulario.
2. **Configura la concurrencia del desencadenador:** en los *… → Configuración* del desencadenador, activa **Control de simultaneidad** y pon **Grado de paralelismo = 1**. Así dos personas que eligen el mismo asiento al mismo tiempo se procesan una después de otra y no se duplican.
3. **Acción:** *Microsoft Forms → Obtener los detalles de la respuesta* (Id. de respuesta = el del desencadenador).
4. **Acción:** *Redactar*, renómbrala `Codigo`, con la expresión:
   ```
   concat('RV-', toUpper(substring(replace(guid(), '-', ''), 0, 6)))
   ```
5. **Acción:** *SharePoint → Obtener elementos* en la lista **Reservas**, renómbrala `AsientoOcupado`:
   - Consulta de filtro (reemplaza los valores dinámicos de Viaje y Asiento):
     ```
     Viaje eq '[Viaje]' and Asiento eq [Elige tu asiento] and (Estado eq 'Pendiente' or Estado eq 'Validada')
     ```
   - Recuento superior: `1`.
6. **Condición:** `length(body('AsientoOcupado')?['value'])` **es igual a** `0`.

   **Si es verdadero (asiento libre):**
   - *SharePoint → Crear elemento* en **Reservas**: Codigo = salida de `Codigo`; mapea cada respuesta a su columna; Estado = `Pendiente`; Retorno = expresión `equals(<respuesta ¿Requiere retorno?>, 'Sí')`.
   - *Office 365 Outlook → Enviar un correo electrónico (V2)* a la respuesta *Correo electrónico*:
     - Asunto: `Reserva recibida – [Codigo]`
     - Cuerpo: "Hola [Nombres], recibimos tu reserva del asiento [Asiento] para [Viaje]. Tu código es [Codigo]. El conductor validará tu pago y te avisaremos por este medio."

   **Si es falso (asiento ocupado):**
   - *Crear elemento* igual que arriba, pero con Estado = `Conflicto` y Observacion = `Asiento ya ocupado al registrar`.
   - *Enviar un correo electrónico (V2)*: Asunto `Asiento no disponible – [Codigo]`, cuerpo: "El asiento [Asiento] ya fue tomado. Vuelve a llenar el formulario eligiendo otro asiento: [enlace del Forms]. Si ya pagaste, el conductor te contactará."
7. Guarda y prueba llenando el Forms desde el celular.

> Si quieres que los correos salgan de una dirección general (ej. `reservas@tuempresa.com`), crea un **buzón compartido** en el centro de administración de Exchange (no consume licencia) y usa la acción *Enviar un correo electrónico desde un buzón compartido (V2)*.

## Paso 4. Crear la app del conductor (Power Apps)

1. En make.powerapps.com → **Crear → Aplicación de lienzo en blanco** → formato **Teléfono** → nombre `ReservaViajes Conductor`.
2. **Datos → Agregar datos:** SharePoint (listas **Viajes** y **Reservas**) y **Office 365 Outlook**.
3. *Configuración → General → Límite de filas de datos* = `2000`.

### Pantalla 1: `scrViajes`

- Galería vertical `galViajes`:
  - `Items`:
    ```
    SortByColumns(Filter(Viajes, Estado.Value = "Abierto"), "Fecha", SortOrder.Ascending)
    ```
  - Etiqueta título: `ThisItem.Title`
  - Etiqueta ocupación:
    ```
    CountRows(Filter(Reservas, Viaje = ThisItem.Title, Estado.Value = "Validada")) & " / 7 validadas · " &
    CountRows(Filter(Reservas, Viaje = ThisItem.Title, Estado.Value = "Pendiente")) & " por validar"
    ```
  - `OnSelect`:
    ```
    Set(varViaje, ThisItem); Navigate(scrVan, ScreenTransition.Cover)
    ```

### Pantalla 2: `scrVan` (mapa de la van y lista de reservas)

- `OnVisible` de la pantalla:
  ```
  ClearCollect(colReservas, Filter(Reservas, Viaje = varViaje.Title))
  ```
- Dibuja la van con un rectángulo redondeado y coloca **7 botones** (`btnAsiento1` … `btnAsiento7`) en la misma distribución de la maqueta: chofer y asiento 1 adelante, 2–4 en la segunda fila y 5–7 en la tercera. Un rectángulo amarillo claro con el texto "CHOFER" marca al conductor.
- En cada botón (cambia el `1` por el número del asiento):
  - `Text`: `"1"`
  - `Fill`:
    ```
    With(
        {r: LookUp(colReservas, Asiento = 1 && Estado.Value in ["Pendiente", "Validada"])},
        If(IsBlank(r), RGBA(240, 90, 40, 1),
           r.Estado.Value = "Validada", RGBA(160, 164, 171, 1),
           RGBA(242, 201, 76, 1))
    )
    ```
    (naranja = libre, gris = validada, amarillo = por validar; los mismos colores de la maqueta).
  - `OnSelect`:
    ```
    With(
        {r: LookUp(colReservas, Asiento = 1 && Estado.Value in ["Pendiente", "Validada"])},
        If(!IsBlank(r), Set(varReserva, r); Navigate(scrDetalle, ScreenTransition.Cover))
    )
    ```
- Debajo, una galería `galReservas` para ver también los conflictos y rechazos:
  - `Items`: `SortByColumns(colReservas, "Asiento", SortOrder.Ascending)`
  - Texto: `"Asiento " & ThisItem.Asiento & " · " & ThisItem.NombreCompleto & " · " & ThisItem.Estado.Value`
  - `OnSelect`: `Set(varReserva, ThisItem); Navigate(scrDetalle, ScreenTransition.Cover)`
- Botón **Actualizar**: `OnSelect` = `Refresh(Reservas); ClearCollect(colReservas, Filter(Reservas, Viaje = varViaje.Title))`

### Pantalla 3: `scrDetalle`

- Un **formulario de presentación** (`Display form`) con `DataSource = Reservas` e `Item = varReserva`, mostrando todos los campos.
- Etiqueta de alerta de DNI (visible solo si está mal escrito):
  - `Text`: `"Revisa el DNI: debe tener 8 dígitos"`
  - `Visible`: `!IsMatch(varReserva.DNI, "\d{8}")`
- Caja de texto `txtObservacion` para el motivo de rechazo.
- Botón **Validar**:
  ```
  Patch(Reservas, varReserva, {Estado: {Value: "Validada"}});
  Office365Outlook.SendEmailV2(
      varReserva.Correo,
      "Reserva confirmada – " & varReserva.Title,
      "Hola " & varReserva.NombreCompleto & ", tu pago fue validado. Asiento " & varReserva.Asiento &
      " para " & varReserva.Viaje & ". Tu código es " & varReserva.Title & ". ¡Buen viaje!"
  );
  Notify("Reserva validada", NotificationType.Success);
  Back()
  ```
- Botón **Rechazar** (libera el asiento):
  ```
  Patch(Reservas, varReserva, {Estado: {Value: "Rechazada"}, Observacion: txtObservacion.Text});
  Office365Outlook.SendEmailV2(
      varReserva.Correo,
      "Reserva no aprobada – " & varReserva.Title,
      "Hola " & varReserva.NombreCompleto & ", no pudimos validar tu reserva. Motivo: " & txtObservacion.Text
  );
  Notify("Reserva rechazada", NotificationType.Warning);
  Back()
  ```
- `OnVisible` de `scrVan` ya recarga la colección al volver, así que los colores se actualizan solos.

### Publicar y compartir

1. **Archivo → Guardar → Publicar**.
2. **Compartir** la app con la cuenta del conductor (o un grupo de conductores).
3. El conductor instala **Power Apps** desde Play Store o App Store, inicia sesión con su cuenta E3 y abre `ReservaViajes Conductor`. Puede anclarla a la pantalla de inicio.

---

## Rutina para abrir un viaje

1. En la lista **Viajes**, agrega el viaje con Estado `Abierto`.
2. En el Forms, pregunta **Viaje**, agrega una opción con **exactamente** el mismo texto.
3. Cuando el viaje se llene o pase, cambia su Estado a `Cerrado` o `Realizado` y **borra la opción** del Forms.

## Pruebas antes de publicar el enlace

| Prueba | Resultado esperado |
| --- | --- |
| Llenar el Forms desde un celular sin iniciar sesión. | Llega el correo "Reserva recibida" y aparece la reserva `Pendiente` en la lista. |
| Enviar otra reserva al mismo viaje y asiento. | Se guarda como `Conflicto` y llega el correo "Asiento no disponible". |
| En la app, validar la primera reserva. | El asiento pasa a gris y el pasajero recibe "Reserva confirmada". |
| Rechazar una reserva. | El asiento vuelve a naranja y llega el correo con el motivo. |
| Escribir un DNI de 7 dígitos. | La app muestra la alerta de DNI en el detalle. |

## Posibles mejoras más adelante

- Si en el futuro se obtiene una licencia de **Power Pages** o **Power Apps Premium**, se podría reemplazar el Forms por un sitio público con mapa de asientos interactivo y subida de comprobantes (la maqueta `maqueta/reservaviajes.html` sirve de base para el diseño).
- Un segundo flujo programado que cada noche marque como `Realizado` los viajes con fecha pasada.
