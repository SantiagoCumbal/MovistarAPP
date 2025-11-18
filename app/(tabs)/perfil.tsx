import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/src/data/services/supabaseClient';
import { globalStyles } from '@/src/styles/globalStyles';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = userData.user;
        if (!user) return;
        setEmail(user.email ?? '');
        const { data, error: qError } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
        if (qError) throw qError;
        setNombre(data?.nombre ?? '');
        setTelefono(data?.telefono ?? '');
      } catch (e: any) {
        console.log('perfil load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    // basic validation
    const phoneRegex = /^\+?[0-9\s-]{7,}$/;
    if (telefono && !phoneRegex.test(telefono)) {
      Alert.alert('Teléfono inválido', 'Introduce un número de teléfono válido.');
      return;
    }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        Alert.alert('No autenticado');
        return;
      }
      // Ensure email is provided when inserting a new usuarios row to satisfy NOT NULL constraint
      if (!email) {
        Alert.alert('Error', 'No se ha obtenido el email de tu cuenta. No se puede guardar el perfil.');
        setLoading(false);
        return;
      }

      // Ensure we preserve an existing role if present; otherwise default to 'usuario'
      const { data: existing, error: existingErr } = await supabase.from('usuarios').select('rol').eq('id', user.id).single();
      let rolToSave = 'usuario';
      if (!existingErr && existing?.rol) {
        rolToSave = existing.rol;
      }

      const upsertPayload: any = {
        id: user.id,
        email: email,
        nombre: nombre || null,
        telefono: telefono || null,
        rol: rolToSave,
      };

      const { error } = await supabase.from('usuarios').upsert(upsertPayload, { onConflict: 'id' });
      if (error) throw error;
      Alert.alert('Perfil actualizado');
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('logout error', e);
    } finally {
      router.replace('/splash');
    }
  }

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#6B7280',
  },
  infoCard: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBox: {
    width: '100%',
    height: 60,
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerBoxText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
});

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#00AEEF', dark: '#0A6B86' }}
      headerImage={
        <View style={styles.headerBox}>
          <Text style={styles.headerBoxText}>Mi Perfil</Text>
        </View>
      }>
      <ThemedView style={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View>
            {/* Profile card */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(nombre?.trim()?.[0] ?? 'U').toUpperCase()}</Text>
              </View>
              {!editing ? (
                <>
                  <Text style={styles.profileName}>{nombre || 'Usuario'}</Text>
                  <Text style={styles.profileEmail}>{email}</Text>
                </>
              ) : (
                <>
                  <TextInput
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Nombre"
                    style={styles.input}
                    accessibilityLabel="Nombre"
                  />
                  <Text style={styles.profileEmail}>{email}</Text>
                </>
              )}
            </View>

            {/* Info boxes */}
            <View style={[globalStyles.card, styles.infoCard]}>
              <View style={styles.infoRow}>
                <IconSymbol name="paperplane.fill" size={20} color="#00AEEF" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: '#6B7280', marginBottom: 4 }}>Email</Text>
                  <Text style={{ fontWeight: '600' }}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={[globalStyles.card, styles.infoCard]}> 
              <View style={styles.infoRow}>
                <IconSymbol name="chevron.right" size={20} color="#00AEEF" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: '#6B7280', marginBottom: 4 }}>Teléfono</Text>
                  {!editing ? (
                    <Text style={{ fontWeight: '600' }}>{telefono || '-'}</Text>
                  ) : (
                    <TextInput
                      value={telefono}
                      onChangeText={setTelefono}
                      placeholder="Teléfono"
                      keyboardType="phone-pad"
                      style={styles.input}
                      accessibilityLabel="Teléfono"
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Action buttons */}
            {!editing ? (
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: 16 }]} onPress={() => setEditing(true)}>
                <Text style={globalStyles.buttonText}>Editar Perfil</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave} disabled={loading}>
                  <Text style={globalStyles.buttonText}>{loading ? 'Guardando...' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#E5E7EB', flex: 1 }]} onPress={() => { setEditing(false); /* optionally reload to discard local changes */ }} disabled={loading}>
                  <Text style={[globalStyles.buttonText, { color: '#111827' }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonDanger, { marginTop: 12 }]} onPress={handleLogout}>
              <Text style={globalStyles.buttonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}
