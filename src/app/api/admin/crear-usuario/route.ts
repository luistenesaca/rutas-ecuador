// app/api/admin/crear-usuario/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, nombre, rol, cooperativa_id } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Creamos el usuario enviando TODO en los metadatos
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        nombre_completo: nombre,
        rol: rol,
        cooperativa_id: cooperativa_id || null
      }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    return NextResponse.json({ message: 'Usuario creado exitosamente' });
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}