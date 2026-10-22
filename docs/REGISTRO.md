# Registro del proyecto ReservaViajes

Este documento guarda qué se construyó, qué decisiones se tomaron y qué quedó pendiente, para que cualquier cambio futuro parta de aquí. Agrega una entrada nueva en el **Historial** cada vez que algo cambie.

## Objetivo

Servicio de transporte para viajes y tours en van. Los pasajeros reservan su asiento desde el celular y el conductor (rol de administrador) gestiona, valida y visualiza esas reservas.

## Qué hay en el repositorio

| Ruta | Qué es | Estado |
| --- | --- | --- |
| `maqueta/reservaviajes.html` | **Maqueta visual** en un solo archivo HTML. Se abre con doble clic en cualquier navegador, sin instalar nada. | Entregable principal actual |
| `App.tsx`, `src/` | Prototipo de app móvil hecho con Expo (React Native + TypeScript). Hace lo mismo que la maqueta, pero puede correr en Android, iOS y web. | Base para cuando se pase a una app real |
| `docs/capturas/` | Capturas de pantalla de la maqueta y del prototipo Expo. | Referencia |
| `docs/powerapps/GUIA.md` | **Guía paso a paso** de la versión real con Microsoft 365 E3: listas de SharePoint, Forms, flujo de Power Automate y app del conductor en Power Apps. | Plan de construcción actual |
| `docs/powerapps/van-asientos.png` | Imagen de la van con los asientos numerados para insertar en el Forms. | Lista para usar |
| `docs/REGISTRO.md` | Este documento. | Mantener al día |

Vista previa en línea de la maqueta: https://claude.ai/artifact/Ccz8joiktDWjBcxAn1gy8P (es privada; se comparte desde el menú *Share* de la página).

## Requisitos originales (pedido del 17/10/2026)

1. **Panel 1, pasajero:** registro de datos con nombres completos, DNI, edad, punto de origen o recojo, punto de destino y si requiere retorno. En el mismo panel se carga el archivo o la foto de la boleta o factura del pago.
2. **Panel 2, asientos:** 7 asientos disponibles como botones seleccionables, sobre una maqueta de van vista desde el techo. Cada selección abre una ventana para confirmar el asiento; después se guarda el registro y se activa la reserva.
3. **Panel 3, conductor:** gestiona, valida y visualiza las solicitudes de reserva.
4. El panel de asientos debe seguir el formato de la imagen de referencia (van vista desde arriba, con el conductor y el timón adelante).

## Decisiones tomadas

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Tipo de entregable | Maqueta visual en HTML (más el prototipo Expo ya fusionado). | El usuario aclaró que el prototipo es una maqueta de cómo se vería. |
| Distribución de asientos | Adelante el conductor con el timón (no seleccionable) y el asiento 1. Atrás dos filas de 3 (asientos 2–4 y 5–7). | La imagen de referencia tiene más asientos que los 7 pedidos. Se mantuvo su estilo y se ajustó la cantidad. |
| Colores de asientos | Libre: naranja · Tu asiento: verde · Ocupado/validado: gris · Por validar (conductor): amarillo · Conductor: amarillo claro. | Tomados de la imagen de referencia, más los estados que necesita la app. |
| Validaciones del pasajero | Nombre con al menos 2 palabras, DNI de 8 dígitos, edad entre 1 y 120, origen y destino obligatorios, comprobante obligatorio, asiento confirmado. | DNI peruano de 8 dígitos. |
| Comprobante | Se acepta foto (JPG, PNG, etc.) o PDF. En la maqueta, máximo 4 MB. | Boleta o factura según el pedido. |
| Estados de reserva | `pendiente` al guardar → el conductor la pasa a `validada` o `rechazada`. Rechazar libera el asiento. En la versión de Microsoft se agrega `Conflicto`. | La reserva se “activa” al guardar y el pago lo confirma el conductor. |
| Acceso del conductor | PIN de demostración `1234`. | Solo para la maqueta; no es seguro para uso real. |
| Código de reserva | `RV-` más 6 caracteres hexadecimales (ej. `RV-4F2A91`). | Para que el pasajero tenga un comprobante de su reserva. |
| Datos | Se guardan solo en el navegador o dispositivo (localStorage / AsyncStorage). No hay servidor. | Alcance de maqueta. Pasajero y conductor deben usar el mismo navegador para ver los mismos datos. |
| Datos de ejemplo (maqueta) | Trae 2 reservas marcadas “Ejemplo” (asiento 2 validada, asiento 5 pendiente). “Reiniciar viaje” vuelve a ese estado. | Para que la maqueta no se vea vacía al abrirla. |
| Tecnología del prototipo | Expo SDK 58 + TypeScript. | Un solo código para Android, iOS y web. |
| Plataforma de la versión real (22/10/2026) | Microsoft Forms (pasajero) → Power Automate → listas de SharePoint → Power Apps de lienzo (conductor). Detalle en `docs/powerapps/GUIA.md`. | App pública para celular, sin gastos ni dominio, usando solo la licencia Microsoft 365 E3. Power Pages, Dataverse y conectores premium no están incluidos en E3. |
| Comprobante en la versión real | El pasajero escribe medio de pago, n.º de operación, monto y fecha; el conductor lo verifica. | Forms abierto a cualquiera no permite subir archivos. |
| Asiento en la versión real | Imagen de la van + pregunta "Asiento 1–7"; el flujo detecta asientos ya tomados y marca la reserva como `Conflicto`. | Forms no permite un mapa interactivo ni ocultar opciones. |

## Ideas en pausa

- **Datos compartidos en la nube (Supabase).** Se empezó y se pausó a pedido del usuario el 17/10/2026; no hay código de esto en el repositorio. El diseño que se planteó:
  - Tabla `reservas` con un índice único que impide dos reservas activas en el mismo asiento.
  - Los pasajeros registran la reserva con una función (`crear_reserva`) y solo pueden consultar qué asientos están ocupados, sin ver datos personales.
  - Los conductores entran con correo y contraseña (Supabase Auth) y solo ellos ven, validan o rechazan reservas.
  - Los comprobantes van a un almacenamiento privado (máx. 5 MB, imágenes y PDF) que solo ven los conductores.
- **Otras mejoras posibles:** viajes con fecha, hora y ruta; varias vans; notificaciones al pasajero cuando se valida su reserva.

## Historial

| Fecha | Cambio |
| --- | --- |
| 17/10/2026 | Prototipo Expo con los 3 paneles (PR #1, fusionado en `main`). |
| 17/10/2026 | Se empezó la integración con Supabase y se pausó a pedido del usuario. |
| 17/10/2026 | Maqueta en un solo archivo HTML (`maqueta/reservaviajes.html`) y este registro. |
| 22/10/2026 | Se decidió construir con Microsoft 365 E3 (Forms + Power Automate + SharePoint + Power Apps). Guía de construcción e imagen de asientos en `docs/powerapps/`. |
