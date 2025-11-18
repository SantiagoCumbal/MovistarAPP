import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ContratacionesScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#00AEEF', dark: '#0A6B86' }}
      headerImage={
        <View style={styles.headerBox}>
          <Text style={styles.headerBoxText}>Contrataciones</Text>
        </View>
      }>
      <ThemedView style={{ padding: 16 }}>
        <ThemedText type="title">Contrataciones</ThemedText>
        <ThemedText type="subtitle">Aquí verás tus contrataciones pendientes y su estado</ThemedText>

        <View style={styles.empty}>
          <Text>No hay contrataciones para mostrar.</Text>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
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
});
