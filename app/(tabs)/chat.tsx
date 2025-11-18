import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/data/services/supabaseClient';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import { useChat } from '@/src/presentation/hooks/useChat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { userId, nombre } = params as { userId?: string; nombre?: string };

  const { conversacion, cargarConversacionCon, currentReceiver, cargando, mensajes, enviarMensaje, usuariosEscribiendo, notificarEscribiendo, cerrarConversacion } = useChat();
  const { usuario } = useAuth();
  const [texto, setTexto] = useState('');
  const [directOpened, setDirectOpened] = useState(false);
  const typingTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Si recibimos userId desde params abrimos esa conversación
    if (userId) {
      cargarConversacionCon(String(userId));
      return;
    }

    // Si no hay userId y soy cliente (no asesor), abrimos chat directo con asesor
    if (usuario && usuario.rol !== 'asesor' && !directOpened) {
      (async () => {
        try {
          const { data: asesor, error } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('rol', 'asesor')
            .limit(1)
            .single();

          if (!error && asesor) {
            await cargarConversacionCon(String(asesor.id));
            setDirectOpened(true);
          }
        } catch (e) {
          console.warn('No se pudo abrir chat con asesor automáticamente', e);
        }
      })();
    }
  }, [userId, usuario]);

  const inbox = useMemo(() => {
    // derive conversations (last message) grouped by interlocutor
    const meId = usuario?.id;
    const map = new Map<string, any>();
    (mensajes || []).forEach((m: any) => {
      const other = m.sender_id === meId ? m.receiver : m.sender;
      const otherId = other?.id ?? (m.sender_id === meId ? m.receiver_id : m.sender_id);
      const existing = map.get(otherId);
      if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
        map.set(String(otherId), { other, last: m });
      }
    });
    return Array.from(map.values());
  }, [mensajes, usuario]);

  const isAdvisor = usuario?.rol === 'asesor';
  const activeReceiver = currentReceiver ?? (userId ? String(userId) : null);
  const someoneTyping = usuariosEscribiendo?.find((e: any) => e.usuario_id === activeReceiver);
  const otherMsg = conversacion.find((m: any) => m.sender_id !== usuario?.id);
  const otherName = nombre ?? otherMsg?.sender?.nombre ?? otherMsg?.usuario?.email ?? 'Usuario';

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={styles.headerBox}>
        <Text style={styles.headerBoxText}>{usuario?.rol === 'asesor' ? 'Conversaciones' : (nombre ?? '')}</Text>
        {usuario?.rol === 'asesor' ? (
          <TouchableOpacity
            style={styles.exitButton}
            onPress={async () => {
              try {
                // limpiar suscripción y estado de conversación
                cerrarConversacion();
                // limpiar timeout de typing local si existe
                try {
                  if (typingTimeout.current) {
                    clearTimeout(typingTimeout.current);
                    typingTimeout.current = null;
                  }
                } catch {}
                // navegar a la ruta del tab chat sin params para mostrar inbox
                await router.replace('/(tabs)/chat');
              } catch (err) {
                console.warn('Error al salir de la conversación', err);
              }
            }}
          >
            <Text style={{ color: '#fff' }}>Salir</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ThemedView style={{ padding: 16, flex: 1 }}>
        {/* main title removed per UX */}

        {/* Conversation view when we have an active receiver */}
        {activeReceiver ? (
          cargando ? (
            <Text>Cargando conversación...</Text>
          ) : (
            <>
              <FlatList
                data={[...conversacion].slice().reverse()}
                inverted
                keyExtractor={(m: any) => String(m.id)}
                renderItem={({ item }) => {
                  const isMe = item.sender_id === usuario?.id;
                  return (
                    <View style={[styles.messageRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}> 
                      <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={{ color: isMe ? '#fff' : '#062C3B' }}>{item.contenido}</Text>
                        <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </View>
                  );
                }}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            </>
          )
        ) : (
          // No activeReceiver: advisor sees inbox; client sees prompt to start chat
          isAdvisor ? (
            inbox.length === 0 ? (
              <View style={styles.empty}>
                <Text>No hay conversaciones aún.</Text>
              </View>
            ) : (
              <FlatList
                data={inbox}
                keyExtractor={(c: any) => String(c.other?.id ?? c.last.sender_id)}
                renderItem={({ item }: any) => (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/chat', params: { userId: String(item.other?.id ?? item.last.sender_id), nombre: item.other?.nombre ?? 'Usuario' } })}
                    style={[styles.conversationCard, { marginBottom: 12 }]}
                  >
                    <View style={styles.avatar}><Text style={styles.avatarText}>{(item.other?.nombre ?? 'U').charAt(0)}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700' }}>{item.other?.nombre ?? 'Usuario'}</Text>
                      <Text numberOfLines={1} style={{ color: '#6B7280' }}>{item.last.contenido}</Text>
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{new Date(item.last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )
          ) : (
            <View style={styles.empty}>
              <Text>Comienza la conversación con tu asesor escribiendo abajo.</Text>
            </View>
          )
        )}

        {activeReceiver ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
            {/* Indicador de escribiendo justo encima del input (donde aparecerá el próximo mensaje) */}
            {someoneTyping ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>{otherName + ' está escribiendo...'}</Text>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                value={texto}
                onChangeText={(t) => {
                  setTexto(t);
                  // Notificar escribiendo (debounced) para no spammear el canal
                  try {
                    if (typingTimeout.current) clearTimeout(typingTimeout.current);
                    notificarEscribiendo();
                    typingTimeout.current = setTimeout(() => {
                      // al pasar 1200ms sin escribir dejamos de notificar (server-side timeout handles it)
                      if (typingTimeout.current) {
                        clearTimeout(typingTimeout.current);
                        typingTimeout.current = null;
                      }
                    }, 1200);
                  } catch (err) {
                    // ignore
                  }
                }}
                placeholder="Escribe tu mensaje"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.sendButton]}
                onPress={async () => {
                  if (!texto.trim()) return;
                  const targetId = String(activeReceiver);
                  const res = await enviarMensaje(texto.trim(), targetId);
                  if (res.success) {
                    setTexto('');
                    // reload conversation silently
                    await cargarConversacionCon(targetId);
                  } else {
                    Alert.alert('Error', res.error ?? 'No se pudo enviar');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </ThemedView>
    </ThemedView>
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
  exitButton: {
    position: 'absolute',
    right: 12,
    top: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A6B86',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    marginRight: 12,
    fontWeight: '700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#00AEEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 6,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bubbleLeft: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#00AEEF',
    borderTopRightRadius: 4,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  typingIndicator: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  typingText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
