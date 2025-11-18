import { PlansUseCase } from '@/src/domain/useCases/plans/PlansUseCase';
import { usePlans } from '@/src/presentation/hooks/usePlans';
import { globalStyles } from '@/src/styles/globalStyles';
import { borderRadius, colors, fontSize, spacing } from '@/src/styles/theme';
import * as ExpoRouter from 'expo-router';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditarPlanScreen() {
  const { actualizar, seleccionarImagen } = usePlans();
  const router = (ExpoRouter as any).useRouter();

  const rawSearchParams = (() => {
    try {
      const fn = (ExpoRouter as any).useSearchParams;
      if (typeof fn === 'function') return fn();
      const alt = (ExpoRouter as any).useLocalSearchParams;
      if (typeof alt === 'function') return alt();
    } catch {
      // ignore
    }
    return {} as Record<string, any>;
  })();
  const id = rawSearchParams?.id;

  const [isNewImage, setIsNewImage] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [precio, setPrecio] = useState('');
  const [datosGb, setDatosGb] = useState('');
  const [minutos, setMinutos] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [promocion, setPromocion] = useState('');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const useCase = new PlansUseCase();
      const plan = await useCase.obtenerPlanPorId(String(id));
      if (!plan) {
        Alert.alert('Error', 'No se encontró el plan');
        router.replace('/(tabs)');
        return;
      }
      setTitulo(plan.titulo ?? '');
      setPrecio(String(plan.precio ?? ''));
      setDatosGb(String(plan.datos_gb ?? ''));
      setMinutos(String(plan.minutos ?? ''));
      setDescripcion(plan.descripcion ?? '');
      setPromocion(plan.promocion ?? '');
      setImagenUri(plan.imagen_url ?? null);
      setIsNewImage(false);
    };
    load();
  }, [id]);

  const handleSeleccionarImagen = async () => {
    const uri = await seleccionarImagen();
    if (uri) setImagenUri(uri);
    if (uri) setIsNewImage(true);
  };

  const handleGuardar = async () => {
    if (!id) {
      Alert.alert('Error', 'ID de plan inválido');
      return;
    }
    if (!titulo || !precio || !datosGb || !minutos) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }
    setCargando(true);
    try {
      const resultado = await actualizar(
        String(id),
        titulo,
        parseFloat(precio.replace(',', '.')) || 0,
        parseFloat(datosGb.replace(',', '.')) || 0,
        parseInt(minutos, 10) || 0,
        descripcion || null,
        promocion || null,
        isNewImage ? imagenUri ?? undefined : undefined
      );

      if (resultado && (resultado as any).success) {
        Alert.alert('Listo', 'Plan actualizado correctamente');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', (resultado as any).error || 'No se pudo actualizar el plan');
      }
    } catch (err) {
      console.error('Error actualizar plan:', err);
      Alert.alert('Error', 'Ocurrió un error al actualizar el plan');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Plan', headerTitleAlign: 'center' }} />
      <ScrollView style={globalStyles.container}>
        <View style={globalStyles.contentPadding}>
          <View style={styles.card}>
            <Text style={styles.label}>Nombre del Plan</Text>
            <TextInput style={globalStyles.input} placeholder="Ej: Plan Smart 10GB" value={titulo} onChangeText={setTitulo} />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.labelSmall}>Precio Mensual ($)</Text>
                <TextInput style={globalStyles.input} placeholder="19.99" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
              </View>
              <View style={styles.col}>
                <Text style={styles.labelSmall}>Gigas de Datos</Text>
                <TextInput style={globalStyles.input} placeholder="10" keyboardType="numeric" value={datosGb} onChangeText={setDatosGb} />
              </View>
            </View>

            <Text style={styles.labelSmall}>Minutos de Llamadas</Text>
            <TextInput style={globalStyles.input} placeholder="200" keyboardType="numeric" value={minutos} onChangeText={setMinutos} />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[globalStyles.input, globalStyles.inputMultiline]} placeholder="Describe las características del plan..." multiline value={descripcion} onChangeText={setDescripcion} />

            <Text style={styles.label}>Promoción (Opcional)</Text>
            <TextInput style={globalStyles.input} placeholder="Ej: ¡Primer mes gratis!" value={promocion} onChangeText={setPromocion} />

            <Text style={styles.label}>Imagen del Plan</Text>
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, styles.selectButton]} onPress={handleSeleccionarImagen}>
              <Text style={globalStyles.buttonText}>{imagenUri ? 'Cambiar imagen' : 'Seleccionar imagen'}</Text>
            </TouchableOpacity>

            {imagenUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imagenUri }} style={styles.vistaPrevia} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setImagenUri(null)}>
                  <Text style={{ color: colors.white, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}><Text style={styles.placeholderText}>No hay imagen seleccionada</Text></View>
            )}

            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.botonCrearFull]} onPress={handleGuardar} disabled={cargando}>
              {cargando ? <ActivityIndicator color={colors.white} /> : <Text style={globalStyles.buttonText}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  botonVolver: { fontSize: fontSize.md, color: colors.primary, marginBottom: spacing.sm },
  selectButton: { marginTop: spacing.sm, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  previewContainer: { marginTop: spacing.sm, position: 'relative' },
  vistaPrevia: { width: '100%', height: 180, borderRadius: borderRadius.md, marginVertical: spacing.md },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: '#00000066', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  botonCrearFull: { marginTop: spacing.sm, padding: spacing.lg, alignSelf: 'stretch' },

  /* New styles for polished layout */
  headerBar: { backgroundColor: colors.background, paddingVertical: spacing.md + 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, position: 'relative' },
  backButton: { position: 'absolute', left: spacing.md, padding: 14, borderRadius: 22, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: fontSize.lg + 4, color: colors.primary, fontWeight: '800' },
  roleBadge: { backgroundColor: colors.primary, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  roleBadgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  headerTitle: { fontSize: fontSize.lg + 4, fontWeight: '800', marginTop: 6 },
  card: { backgroundColor: colors.white || '#fff', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  label: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.xs },
  labelSmall: { fontSize: fontSize.xs, color: '#666', marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  placeholderBox: { height: 140, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm },
  placeholderText: { color: '#999' },
});
