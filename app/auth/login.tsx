import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function LoginScreen() {
  // ESTADO LOCAL
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  // HOOKS
  const { iniciarSesion, cerrarSesion, iniciarComoInvitado } = useAuth();
  const router = useRouter();

  /**
   * Manejar inicio de sesión
   */
  const handleLogin = async (expectedRole: "asesor" | "usuario") => {
    // Si el usuario pulsa 'Iniciar como Usuario' sin credenciales,
    // permitir entrada como invitado localmente (demo/QA).
    if (expectedRole === "usuario" && !email && !password) {
      iniciarComoInvitado();
      router.replace("/(tabs)");
      return;
    }

    // VALIDACIÓN: Campos vacíos
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    // INICIO DE SESIÓN
    setCargando(true);
    const resultado = await iniciarSesion(email, password);
    setCargando(false);

    // MANEJO DE RESULTADO: comprobar rol en la tabla `perfiles`
    if (resultado.success && resultado.user) {
      const usuario = resultado.user;
      // Validar rol exactamente según el modelo simplificado
      if (usuario.rol === expectedRole) {
        // Rol coincide: navegar a la app
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 50);
      } else {
        // Rol no coincide: cerrar sesión y mostrar mensaje
        await cerrarSesion();
        Alert.alert(
          "Acceso denegado",
          `Tu cuenta tiene el rol "${usuario.rol}" y no puede iniciar como "${expectedRole}".`
        );
      }
    } else {
      Alert.alert("Error", resultado.error || "No se pudo iniciar sesión");
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <Text style={styles.titulo}>Iniciar Sesión</Text>
        <Text style={styles.subtitulo}>Inicia sesión para continuar</Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"        // No capitalizar
          keyboardType="email-address" // Teclado de email
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // Ocultar texto
        />

        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            styles.botonLogin,
          ]}
          onPress={() => handleLogin("asesor")}
          disabled={cargando} // Deshabilitar mientras carga
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Iniciar como Asesor</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonSecondary,
            styles.botonLogin,
          ]}
          onPress={() => handleLogin("usuario")}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Iniciar como Usuario</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/registro")}>
          <Text style={styles.linkRegistro}>
            ¿No tienes cuenta? Regístrate aquí
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/forgot')}>
          <Text style={styles.linkRegistro}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/splash')}>
          <Text style={styles.linkVolver}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: fontSize.xxxl,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xxl * 2,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: fontSize.md,
    textAlign: "center",
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  botonLogin: {
    marginTop: spacing.sm,
  },
  linkRegistro: {
    textAlign: "center",
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  linkVolver: {
    textAlign: "center",
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});

