// @/app/admin/orders/multiple-status-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Función para obtener estados activos de una orden
export async function getOrderActiveStatuses(orderId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('order_statuses')
        .select('status')
        .eq('order_id', orderId)
        .eq('is_active', true);

    if (error) {
        return { success: false, message: error.message, statuses: [] };
    }

    return {
        success: true,
        statuses: data?.map(row => row.status) || []
    };
}

// Función para actualizar múltiples estados de una orden
export async function updateOrderMultipleStatuses(
    orderId: string, 
    statuses: string[], 
    createdBy?: string
) {
    const supabase = await createClient();
    
    try {
        const { data, error } = await supabase.rpc('update_order_statuses', {
            p_order_id: orderId,
            p_statuses: statuses,
            p_created_by: createdBy || 'system'
        });

        if (error) throw error;

        // También actualizar el campo status principal con el primer estado (para compatibilidad)
        if (statuses.length > 0) {
            const primaryStatus = statuses.includes('COMPLETED') ? 'COMPLETED' : 
                                statuses.includes('READY_FOR_PICKUP') ? 'READY_FOR_PICKUP' : 
                                statuses.includes('PENDING_EMBROIDERY') ? 'PENDING_EMBROIDERY' :
                                statuses.includes('PENDING_SUPPLIER') ? 'PENDING_SUPPLIER' :
                                statuses.includes('PENDING_PAYMENT') ? 'PENDING_PAYMENT' :
                                statuses[0];

            await supabase
                .from('orders')
                .update({ status: primaryStatus })
                .eq('id', orderId);
        }

        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath(`/admin/orders/${orderId}/manage`);
        revalidatePath('/admin/dashboard');
        
        return {
            success: true,
            message: 'Estados actualizados exitosamente',
            data
        };
    } catch (error) {
        console.error('Error updating multiple statuses:', error);
        return {
            success: false,
            message: 'Error al actualizar los estados'
        };
    }
}

// Función para agregar un estado individual
export async function addOrderStatus(
    orderId: string, 
    status: string, 
    createdBy?: string,
    notes?: string
) {
    const supabase = await createClient();
    
    try {
        const { data, error } = await supabase.rpc('add_order_status', {
            p_order_id: orderId,
            p_status: status,
            p_created_by: createdBy || 'system',
            p_notes: notes
        });

        if (error) throw error;

        revalidatePath('/admin/orders');
        
        return {
            success: data.success,
            message: data.message
        };
    } catch (error) {
        console.error('Error adding status:', error);
        return {
            success: false,
            message: 'Error al agregar el estado'
        };
    }
}

// Función para remover un estado individual
export async function removeOrderStatus(orderId: string, status: string) {
    const supabase = await createClient();
    
    try {
        const { data, error } = await supabase.rpc('remove_order_status', {
            p_order_id: orderId,
            p_status: status
        });

        if (error) throw error;

        revalidatePath('/admin/orders');
        
        return {
            success: data.success,
            message: data.message
        };
    } catch (error) {
        console.error('Error removing status:', error);
        return {
            success: false,
            message: 'Error al remover el estado'
        };
    }
}
