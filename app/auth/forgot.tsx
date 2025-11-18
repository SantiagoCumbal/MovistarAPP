import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/presentation/hooks/useAuth';
import { globalStyles } from '../../src/styles/globalStyles';
import { colors, fontSize, spacing } from '../../src/styles/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }
    setSending(true);
    const res = await resetPassword(email);
    setSending(false);
    if (res.success) {
      Alert.alert('Enviado', 'Revisa tu correo para las instrucciones de restablecimiento');
      router.replace('/auth/login');
    } else {
      Alert.alert('Error', res.error || 'No se pudo enviar el correo');
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <Text style={styles.titulo}>Recuperar Contraseña</Text>
        <Text style={styles.subtitulo}>Introduce tu correo y te enviaremos un enlace para restablecerla</Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary]} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Enviar enlace</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={styles.linkVolver}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xxl * 2,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  linkVolver: {
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: fontSize.sm,
  },
});
