import { useAuth } from '@/src/presentation/hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, spacing } from '../src/styles/theme';

export default function SplashScreen() {
    const router = useRouter();
    const { iniciarComoInvitado } = useAuth();

    return (
        <View style={styles.container}>
        <Image source={require('../assets/images/splash-icon.png')} style={styles.logo} />
        <Text style={styles.title}>Bienvenido a Tigo</Text>
        <Text style={styles.subtitle}>Descubre nuestros planes móviles</Text>

        <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
                try {
                    iniciarComoInvitado();
                } catch {
                    // ignore — still navigate
                }
                router.replace('/index_invitado');
            }}
        >
            <Text style={styles.buttonText}>Explorar como Invitado</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => router.push('/auth/login')}>
            <Text style={styles.buttonOutlineText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/auth/registro')}>
            <Text style={styles.buttonSecondaryText}>Registrarse</Text>
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.primary,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: spacing.lg,
        resizeMode: 'contain',
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        color: '#fff',
        fontSize: 14,
        marginBottom: spacing.lg,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonPrimary: {
        backgroundColor: '#fff',
    },
    buttonText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: fontSize.md,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#fff',
    },
    buttonOutlineText: {
        color: '#fff',
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: '#f0f0f0',
    },
    buttonSecondaryText: {
        color: '#333',
        fontWeight: '600',
    },
});
