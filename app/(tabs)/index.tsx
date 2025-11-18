import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Replaced ParallaxScrollView to avoid nesting a FlatList inside a ScrollView.
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/src/data/services/supabaseClient';
import { PlansUseCase } from '@/src/domain/useCases/plans/PlansUseCase';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import { globalStyles } from '@/src/styles/globalStyles';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('planes_moviles').select('*').order('created_at', { ascending: false });
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
          <Text style={[globalStyles.title, styles.titleSmall]}>{item.titulo}</Text>
          {item.descripcion ? <Text style={[globalStyles.textPrimary, styles.descSmall]}>{item.descripcion}</Text> : null}
          <Text style={[globalStyles.title, styles.priceSmall]}>${precio}</Text>

          <View style={styles.buttonsContainer}>
            {usuario?.rol === 'asesor' ? (
              <>
                <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.buttonFull, { marginHorizontal: 6 }]} onPress={() => router.push({ pathname: '/plan/editar', params: { id: String(item.id) } })}>
                  <Text style={globalStyles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonDanger, styles.buttonFull, { marginHorizontal: 6 }]}
                  onPress={() => {
                    Alert.alert('Confirmar', '¿Eliminar este plan?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const useCase = new PlansUseCase();
                            const result = await useCase.eliminarPlan(String(item.id));
                            if (!result.success) throw new Error(result.error ?? 'Error desconocido');
                            await load();
                          } catch (e: any) {
                            Alert.alert('Error', e?.message ?? String(e));
                          }
                        },
                      },
                    ]);
                  }}>
                  <Text style={globalStyles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, styles.buttonFull, { marginHorizontal: 6 }]} onPress={() => router.push({ pathname: '/plan/crear', params: { id: String(item.id) } })}>
                  <Text style={globalStyles.buttonText}>Detalles</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.buttonFull, { marginHorizontal: 6 }]} onPress={() => Alert.alert('Contratación', 'Funcionalidad de contratación pendiente')}>
                  <Text style={globalStyles.buttonText}>Contratar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Static header box (keeps visual identity, avoids nested scrolls) */}
      <View style={styles.headerBox}>
        <Text style={styles.headerBoxText}>{usuario?.rol === 'asesor' ? 'Panel de Asesor' : 'Bienvenido a Tigo'}</Text>
      </View>

      <ThemedView style={{ padding: 16, flex: 1 }}>
        {/* Principal box: distinto contenido/colores para asesor vs usuario */}
        {usuario?.rol === 'asesor' ? (
          <View style={[styles.mainBox, styles.mainBoxAsesor]}>
            <Text style={styles.mainBoxTitle}>Gestión de Planes</Text>
            <Text style={styles.mainBoxSubtitle}>Administra el catálogo de planes móviles</Text>
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: 12 }]} onPress={() => router.push('/plan/crear')}>
              <Text style={globalStyles.buttonText}>+ Crear Nuevo Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.mainBox, styles.darkMainBox]}>
            <Text style={styles.mainBoxTitle}>Nuevos Planes Tigo</Text>
            <Text style={styles.mainBoxSubtitle}>Descubre nuestros planes móviles</Text>
          </View>
        )}

        <ThemedText type="subtitle" style={{ marginTop: 12 }}>{usuario?.rol === 'asesor' ? 'Planes Activos' : 'Planes Disponibles'}</ThemedText>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
        ) : planes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={globalStyles.emptyState}>No hay planes disponibles</Text>
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: 12 }]} onPress={load}>
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
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -50,
    left: -10,
    position: 'absolute',
  },
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
  mainBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  mainBoxAsesor: {
    backgroundColor: '#10B981',
  },
  mainBoxUsuario: {
    backgroundColor: '#06B6D4',
  },
  darkMainBox: {
    backgroundColor: '#0A6B86',
    borderRadius: 12,
    // small shadow to match appearance
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  mainBoxTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  mainBoxSubtitle: {
    color: '#E6F9F2',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  price: {
    marginTop: 6,
  },
  titleSmall: {
    fontSize: 18,
    marginBottom: 4,
  },
  descSmall: {
    fontSize: 14,
    color: '#374151',
  },
  priceSmall: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonEdit: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  buttonDelete: {
    backgroundColor: '#EF4444',
    flex: 1,
  },
  buttonDetails: {
    backgroundColor: '#6B7280',
    flex: 1,
  },
  thumb: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
