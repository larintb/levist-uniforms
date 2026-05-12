import toast from 'react-hot-toast';

export async function runAction<T extends { success: boolean; message?: string }>(
  fn: () => Promise<T>,
  opts?: { successMessage?: string; errorMessage?: string }
): Promise<T | null> {
  try {
    const result = await fn();
    if (!result.success) {
      toast.error(result.message || opts?.errorMessage || 'Ocurrió un error inesperado');
    } else if (opts?.successMessage) {
      toast.success(opts.successMessage);
    }
    return result;
  } catch (err) {
    console.error(err);
    toast.error(opts?.errorMessage || 'Ocurrió un error inesperado');
    return null;
  }
}
