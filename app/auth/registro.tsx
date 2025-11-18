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
import { supabase } from "../../src/data/services/supabaseClient";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function RegistroScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  // El rol ahora se asigna por defecto desde la base de datos (registro sólo para usuarios)
  const [cargando, setCargando] = useState(false);
  const { registrar } = useAuth();
  const router = useRouter();

  const handleRegistro = async () => {
    // VALIDACIÓN 1: Campos vacíos
    if (!email || !password || !nombre || !telefono) {
      Alert.alert("Error", "Completa todos los campos (nombre y teléfono requeridos)");
      return;
    }

    // VALIDACIÓN 2: Longitud de contraseña
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // VALIDACIÓN 3: Formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Introduce un email válido");
      return;
    }

    // REGISTRO
    setCargando(true);
    const resultado = await registrar(email, password, nombre, telefono);
    setCargando(false);

    if (resultado.success) {
      // Éxito: Redirigir a login
      Alert.alert("Éxito", "Cuenta creada correctamente", [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } else {
      // Si falló por un problema de NULL en email, intentar un upsert de recuperación
      const errMsg = resultado.error || "No se pudo crear la cuenta";
      if (/null value.*email|email.*null|null.*email|NOT NULL/i.test(errMsg)) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const user = userData.user;
          if (user) {
            const { error: upsertErr } = await supabase.from('usuarios').upsert({ id: user.id, email, rol: 'usuario' }, { onConflict: 'id' });
            if (!upsertErr) {
              Alert.alert('Recuperado', 'Se ha registrado el email en tu perfil. Revisa tu correo para confirmar.');
              router.replace('/auth/login');
              return;
            }
          }
        } catch (e) {
          // ignore, will show original error below
          console.log('Recovery upsert error', e);
        }
      }

      Alert.alert("Error", errMsg || "No se pudo crear la cuenta");
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <Text style={styles.titulo}>Crear Cuenta</Text>
        <Text style={styles.subtitulo}>Regístrate para acceder a más opciones</Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* El rol se asigna por defecto en la base de datos; el selector fue eliminado */}

        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={handleRegistro}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Registrarse</Text>
          )}
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
  labelRol: {
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  contenedorRoles: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  botonRol: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  botonRolActivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  textoRol: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  textoRolActivo: {
    color: colors.primary,
    fontWeight: "bold",
  },
  linkVolver: {
    textAlign: "center",
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: fontSize.sm,
  },
});

