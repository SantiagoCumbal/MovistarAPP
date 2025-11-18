import AsyncStorage from "@react-native-async-storage/async-storage"; // 👈 NUEVA IMPORTACIÓN
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

/**
 * Cliente de Supabase
 * ...
 */

// Obtener credenciales de variables de entorno
// Deben existir en .env como:
// EXPO_PUBLIC_SUPABASE_URL
// EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las credenciales existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "❌ ERROR: Faltan variables de entorno.\n\n" +
    "Asegúrate de tener un archivo .env con:\n" +
    "- EXPO_PUBLIC_SUPABASE_URL\n" +
    "- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n" +
    "Revisa .env.example para ver el formato correcto."
  );
}

/**
 * Crear cliente de Supabase con configuración personalizada
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { 
    // 🔑 USAR ASYNCSTORAGE PARA PERSISTENCIA
    storage: AsyncStorage as any, 
    
    // ✅ ACTIVAR PERSISTENCIA (esto debe ser `true` o simplemente omitirse, ya que `true` es el valor por defecto si se provee un `storage`)
    persistSession: true, 

    // Refrescar token automáticamente cuando expire
    autoRefreshToken: true,

    // NO detectar sesión en URL (para web)
    detectSessionInUrl: false,
  },
});