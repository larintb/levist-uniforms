'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface School {
  id: string;
  name: string;
  logo_filename: string | null;
  created_at: string;
}

export async function getSchools(): Promise<School[]> {
  const supabase = await createClient();
  
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching schools:', error);
    throw new Error('Failed to fetch schools');
  }

  return schools || [];
}

export async function createSchool(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const logoFile = formData.get('logo') as File;
  
  if (!name) {
    throw new Error('Name is required');
  }

  let logoFilename = null;
  
  // Upload logo if provided
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('school-logos')
      .upload(fileName, logoFile);
    
    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw new Error('Failed to upload logo');
    }
    
    logoFilename = fileName;
  }

  const { error } = await supabase
    .from('schools')
    .insert({
      name,
      logo_filename: logoFilename,
    });

  if (error) {
    console.error('Error creating school:', error);
    throw new Error('Failed to create school');
  }

  revalidatePath('/admin/schools');
  redirect('/admin/schools');
}

export async function updateSchool(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const logoFile = formData.get('logo') as File;
  
  if (!name) {
    throw new Error('Name is required');
  }

  let logoFilename = null;
  
  // Upload new logo if provided
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('school-logos')
      .upload(fileName, logoFile);
    
    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw new Error('Failed to upload logo');
    }
    
    logoFilename = fileName;
  }

  const updateData: Partial<Pick<School, 'name' | 'logo_filename'>> = { name };
  if (logoFilename) {
    updateData.logo_filename = logoFilename;
  }

  const { error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating school:', error);
    throw new Error('Failed to update school');
  }

  revalidatePath('/admin/schools');
  redirect('/admin/schools');
}

export async function deleteSchool(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting school:', error);
    throw new Error('Failed to delete school');
  }

  revalidatePath('/admin/schools');
}
