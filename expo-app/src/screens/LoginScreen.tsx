import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { colors, borderRadius } from '@/theme'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigation = useNavigation<Nav>()

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('提示', '请输入邮箱和密码')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      Alert.alert('登录失败', error.message)
      return
    }
    navigation.replace('Admin')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>管理员登录</Text>
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            <Text style={styles.btnText}>{submitting ? '登录中...' : '登录'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: borderRadius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
})
