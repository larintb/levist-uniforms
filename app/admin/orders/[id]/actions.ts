// @/app/admin/orders/[id]/actions.ts
'use server';

import { Twilio } from 'twilio';

interface ActionResult {
    success: boolean;
    message: string;
}

interface TwilioError {
    code?: number;
    message?: string;
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM;

// Validamos que las variables de entorno estén presentes
if (!accountSid || !authToken || !fromWhatsAppNumber) {
    throw new Error('Missing required Twilio environment variables');
}

// No necesitamos el templateSid para este método
const client = new Twilio(accountSid, authToken);

/**
 * Envía una notificación de recogida de pedido a través de WhatsApp usando un mensaje de formato libre (body).
 * IMPORTANTE: Este método solo funcionará si el cliente ha enviado un mensaje en las últimas 24 horas.
 * @param customerPhone - El número de teléfono del cliente (ej: 521XXXXXXXXXX).
 * @param customerName - El nombre completo del cliente.
 * @param orderId - El ID completo del pedido.
 */
export async function sendWhatsAppNotification(
    customerPhone: string, 
    customerName: string,
    orderId: string
): Promise<ActionResult> {

    if (!accountSid || !authToken || !fromWhatsAppNumber) {
        console.error('Error: Faltan variables de entorno de Twilio en el servidor.');
        return { success: false, message: 'La configuración de Twilio en el servidor es incorrecta.' };
    }
    
    const toWhatsAppNumber = `whatsapp:${customerPhone}`;
    const firstName = customerName.split(' ')[0];
    const partialOrderId = orderId.slice(0, 8);

    // Creamos el cuerpo del mensaje amigable dinámicamente
    const messageBody = `¡Hola, ${firstName}! 👋 Tu pedido #${partialOrderId} de Levist Uniforms está listo para que pases a recogerlo. Presenta tu ticket para una entrega rápida. ¡Estamos emocionados de que veas tus nuevos uniformes! ✨ Te esperamos pronto.`;

    try {
        await client.messages.create({
            body: messageBody, // Usamos el parámetro 'body' para el mensaje de formato libre
            from: fromWhatsAppNumber,
            to: toWhatsAppNumber,
        });

        console.log(`Mensaje de formato libre enviado a ${toWhatsAppNumber} para la orden #${partialOrderId}`);
        return { success: true, message: `Notificación enviada a ${customerName}.` };

    } catch (error) {
        console.error('Error al enviar el mensaje de Twilio:', error);

        // Type guard para verificar si el error tiene la estructura esperada
        const twilioError = error as TwilioError;

        // Capturamos el error específico de la ventana de 24 horas para dar un mensaje claro.
        if (twilioError.code === 63016) {
             return { success: false, message: 'No se pudo enviar. Han pasado más de 24 horas desde el último mensaje del cliente. Se requiere usar una plantilla.' };
        }

        return { success: false, message: `No se pudo enviar la notificación. [Código de error: ${twilioError.code || 'desconocido'}]` };
    }
}