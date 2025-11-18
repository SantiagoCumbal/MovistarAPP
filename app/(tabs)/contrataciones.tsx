import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import useContrataciones from '@/src/presentation/hooks/useContrataciones';
import { globalStyles } from '@/src/styles/globalStyles';
import { colors } from '@/src/styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ContratacionesScreen() {
  const { usuario } = useAuth();
  const { items, loading, listarPorUsuario, listarTodos, cambiarEstado } = useContrataciones();

  useFocusEffect(
    useCallback(() => {
      if (!usuario) return;
      if (usuario.rol === 'asesor') return void listarTodos();
      return void listarPorUsuario(usuario.id);
    }, [usuario])
  );

  function renderItem({ item }: { item: any }) {
    const plan = item.planes_moviles;
    const fecha = new Date(item.created_at).toISOString().split('T')[0];
    const clienteNombre = (item.usuarios && (item.usuarios.nombre ?? (Array.isArray(item.usuarios) ? item.usuarios[0]?.nombre : undefined))) ?? 'Cliente';
    return (
      <View style={[globalStyles.card, styles.card]}> 
        {plan?.imagen_url ? <Image source={{ uri: plan.imagen_url }} style={styles.thumb} /> : null}
        <View style={{ paddingTop: 8 }}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              {usuario?.rol === 'asesor' ? <Text style={[styles.title, { marginBottom: 2 }]}>{clienteNombre}</Text> : null}
              <Text style={styles.title}>{plan?.titulo}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <View style={getStatusBadgeStyle(item.estado)}>
                <Text style={styles.statusText}>{item.estado === 'pendiente' ? 'PENDIENTE' : item.estado === 'aceptada' ? 'APROBADO' : 'RECHAZADO'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.date}>Fecha: {fecha}</Text>

          <View style={[styles.buttonsRow, { marginTop: 8 }]}> 
            {usuario?.rol === 'asesor' ? (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[globalStyles.button, { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 }]}
                  onPress={async () => {
                    const res = await cambiarEstado(item.id, 'aceptada');
                    if (!res.success) return Alert.alert('Error', res.error ?? 'No se pudo aprobar');
                    await listarTodos();
                  }}
                >
                  <Text style={globalStyles.buttonText}>✓ Aprobar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.button, { backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 }]}
                  onPress={async () => {
                    const res = await cambiarEstado(item.id, 'rechazada');
                    if (!res.success) return Alert.alert('Error', res.error ?? 'No se pudo rechazar');
                    await listarTodos();
                  }}
                >
                  <Text style={globalStyles.buttonText}>✕ Rechazar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[globalStyles.button, styles.chatButton]} onPress={() => Alert.alert('Chat', 'Funcionalidad pendiente')}>
                  <Text style={globalStyles.buttonText}>💬</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[globalStyles.button, styles.chatButton]} onPress={() => Alert.alert('Chat', 'Funcionalidad pendiente')}>
                <Text style={globalStyles.buttonText}>💬 Chat con Asesor</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={styles.headerBox}>
        <Text style={styles.headerBoxText}>Contrataciones</Text>
      </View>

      <ThemedView style={{ padding: 16, flex: 1 }}>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text>No hay contrataciones para mostrar.</Text>
          </View>
        ) : (
          <FlatList data={items} keyExtractor={(i: any) => String(i.id)} renderItem={renderItem} />
        )}
      </ThemedView>
    </ThemedView>
  );
}

function getStatusBadgeStyle(estado: string) {
  return {
    backgroundColor: estado === 'pendiente' ? '#FDE68A' : estado === 'aceptada' ? '#D1FAE5' : '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  } as any;
}

const styles = StyleSheet.create({
  empty: {
    marginTop: 24,
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
  card: {
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: { color: '#6B7280', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontWeight: '700', color: '#062C3B' },
  chatButton: { backgroundColor: colors.primaryDark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
