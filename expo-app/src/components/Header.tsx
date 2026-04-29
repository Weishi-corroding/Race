import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { colors, sharedStyles } from '@/theme'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const navigation = useNavigation<Nav>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.title}>🏆 2025长三角高校赛艇邀请赛</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={user ? [sharedStyles.btn, sharedStyles.btnPrimary] : [sharedStyles.btn, sharedStyles.btnOutline]}
        onPress={() => navigation.navigate(user ? 'Admin' : 'Login')}
      >
        <Text style={user ? sharedStyles.btnPrimaryText : sharedStyles.btnOutlineText}>
          {user ? '管理' : '登录'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
})
