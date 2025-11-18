import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/src/data/services/supabaseClient';
import { globalStyles } from '@/src/styles/globalStyles';
import { colors } from '@/src/styles/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/presentation/hooks/useAuth';

// Oculta la cabecera nativa generada por Expo Router para esta ruta
export const options = {
  headerShown: false,
};

export default function InvitadoIndex() {
  const { esInvitado, cerrarSesion } = useAuth();
  const router = useRouter();
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPlan, setModalPlan] = useState<any | null>(null);

  async function load(query?: string) {
    setLoading(true);
    setError(null);
    try {
      let builder: any = supabase.from('planes_moviles').select('*').order('created_at', { ascending: false });
      const q = (query ?? '').trim();
      if (q) builder = builder.ilike('titulo', `%${q}%`);
      const { data, error } = await builder;
      if (error) throw error;
      setPlanes(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = (window as any).setTimeout(() => {
      load(search);
      searchDebounceRef.current = null;
    }, 300) as unknown as number;
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  function renderPlan({ item }: { item: any }) {
    const precio = typeof item.precio === 'string' ? parseFloat(item.precio).toFixed(2) : (item.precio ?? 0).toFixed(2);
    return (
      <View style={[globalStyles.card, styles.planCard]}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { justifyContent: 'center', alignItems: 'center' }]}>
            <IconSymbol name="photo" size={48} color="#A1CEDC" />
          </View>
        )}

        <View style={{ marginTop: 12, width: '100%' }}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.title, styles.titleSmall]}>{item.titulo}</Text>
            </View>
            <Text style={[globalStyles.title, styles.priceHighlight]}>${precio}</Text>
          </View>

          {item.descripcion ? <Text style={[globalStyles.textPrimary, styles.descSmall]}>{item.descripcion}</Text> : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📶</Text>
              <Text style={styles.metaText}>{item.datos_gb ?? '—'} GB</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📞</Text>
              <Text style={styles.metaText}>{item.minutos ?? '—'} min</Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[globalStyles.button, styles.buttonFull, styles.buttonDetails]}
              onPress={() => {
                setModalPlan(item);
                setModalVisible(true);
              }}
            >
              <Text style={globalStyles.buttonText}>Detalle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>

      <View style={styles.headerBox}>
        <Text style={styles.headerBoxText}>Explorar Planes</Text>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={async () => {
            try { await cerrarSesion(); } catch { }
            router.replace('/splash');
          }}
        >
          <Text style={styles.headerBackText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ThemedView style={{ padding: 16, flex: 1 }}>
        {/* Tarjeta de invitado - similar al 'crear plan' pero para CTA registro/login */}
        <View style={[globalStyles.card, styles.createPrompt]}> 
          <View style={styles.createSquare}>
            <Text style={styles.createSquareText}>+</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.createTitle}>¿Quieres contratar un plan?</Text>
            <Text style={styles.createSubtitle}>Regístrate o inicia sesión para contratar, guardar favoritos y obtener seguimiento personalizado.</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginRight: 8 }]} onPress={() => router.push('/auth/login')}>
                <Text style={globalStyles.buttonText}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary]} onPress={() => router.push('/auth/registro')}>
                <Text style={globalStyles.buttonText}>Registrarse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.searchBox}>
          <TextInput
            style={[globalStyles.input, styles.searchInput]}
            placeholder="Buscar planes por nombre"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => load(search)}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700' }}>Planes Disponibles</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
        ) : planes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={globalStyles.emptyState}>No hay planes disponibles</Text>
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: 12 }]} onPress={() => load()}>
              <Text style={globalStyles.buttonText}>Refrescar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={planes}
            keyExtractor={(p: any) => p.id}
            renderItem={renderPlan}
            style={{ marginTop: 12 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <ThemedView style={{ flex: 1, padding: 16 }}>
            <ScrollView>
              {modalPlan ? (
                <View style={[globalStyles.card, { padding: 12 }]}> 
                  {modalPlan.imagen_url ? <Image source={{ uri: modalPlan.imagen_url }} style={{ width: '100%', height: 200, borderRadius: 8 }} /> : null}
                  <Text style={[globalStyles.title, { fontSize: 20, marginTop: 12 }]}>{modalPlan.titulo}</Text>
                  {modalPlan.promocion ? <View style={[styles.promoBadge, { alignSelf: 'flex-start', marginTop: 8 }]}><Text style={styles.promoText}>{modalPlan.promocion}</Text></View> : null}
                  <Text style={{ marginTop: 12, color: '#374151' }}>{modalPlan.descripcion}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <Text style={{ fontWeight: '700', fontSize: 18 }}>${typeof modalPlan.precio === 'string' ? parseFloat(modalPlan.precio).toFixed(2) : (modalPlan.precio ?? 0).toFixed(2)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ marginRight: 8 }}>{modalPlan.datos_gb ?? '—'} GB</Text>
                      <Text>{modalPlan.minutos ?? '—'} min</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginBottom: 8 }]} onPress={() => router.push('/auth/login')}>
                <Text style={globalStyles.buttonText}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, { marginBottom: 8 }]} onPress={() => router.push('/auth/registro')}>
                <Text style={globalStyles.buttonText}>Registrarse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 }]} onPress={() => setModalVisible(false)}>
                <Text style={[globalStyles.buttonText, { color: '#111827' }]}>Volver</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </Modal>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  headerBox: {
    width: '100%',
    height: 80,
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
  headerBackButton: {
    position: 'absolute',
    right: 12,
    top: 22,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  headerBackText: {
    color: '#fff',
    fontWeight: '600'
  },
  createPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  createSquare: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#00AEEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSquareText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  createSubtitle: {
    marginTop: 6,
    color: '#334155',
    fontSize: 13,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSmall: {
    fontSize: 18,
    marginBottom: 4,
  },
  descSmall: {
    fontSize: 14,
    color: '#374151',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 20,
    minWidth: 64,
  },
  metaIcon: {
    fontSize: 18,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'center',
  },
  buttonFull: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 100,
    borderRadius: 8,
  },
  priceHighlight: {
    color: '#00AEEF',
    fontSize: 20,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.6,
    borderColor: '#00AEEF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 6,
    textAlignVertical: 'center',
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: { fontSize: 16, color: '#fff' },
  thumb: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  promoBadge: {
    marginTop: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDetails: {
    backgroundColor: '#6B7280',
    flex: 1,
  },
});
