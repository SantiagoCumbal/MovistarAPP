import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../src/presentation/hooks/useAuth";

export default function RootLayout() {
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Esperar a que termine de cargar y que el navegador raíz esté listo
    if (cargando || !rootNavigationState?.key) return;

    // Determinar si estamos en rutas de auth
    const enAuth = segments[0] === "auth";
    const enSplash = segments[0] === "splash";

    // REGLA 1: Si NO hay usuario y NO está en auth ni en splash → Redirigir a splash
    if (!usuario && !enAuth && !enSplash) {
      // Mostrar la pantalla de bienvenida/splash antes de ir al login
      router.replace("/splash");
    }
    // REGLA 2: Si HAY usuario y está en auth → Redirigir a tabs
    else if (usuario && enAuth) {
      router.replace("/(tabs)");
    }
  }, [usuario, segments, cargando, rootNavigationState?.key]);

  return (
    <Stack>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
