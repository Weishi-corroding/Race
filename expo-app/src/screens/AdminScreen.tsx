import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '@/lib/supabaseClient'
import { Match } from '@/lib/types'
import AdminForm from '@/components/AdminForm'
import { colors, borderRadius, spacing } from '@/theme'

export default function AdminScreen() {
  const [user, setUser] = useState<any>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [group, setGroup] = useState<'男双' | '女双' | '混双'>('男双')

  useEffect(() => {
    supabase.auth.getSession().then(r => {
      setUser(r.data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    loadMatches()
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const filtered = matches.filter(m => m.group_name === group)
    setFilteredMatches(filtered)
    if (filtered.length > 0 && !selectedMatch) {
      setSelectedMatch(filtered[0])
    }
  }, [matches, group])

  async function loadMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
    if (error) return
    setMatches(data || [])
  }

  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>比赛组别</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={group} onValueChange={(val) => setGroup(val as any)} mode="dropdown">
              <Picker.Item label="男双" value="男双" />
              <Picker.Item label="女双" value="女双" />
              <Picker.Item label="混双" value="混双" />
            </Picker>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{group}比赛列表</Text>
        {filteredMatches.length === 0 ? (
          <Text style={styles.emptyText}>暂无{group}比赛</Text>
        ) : (
          filteredMatches.map(match => (
            <View key={match.id} style={styles.matchItem}>
              <View>
                <Text style={styles.matchName}>{match.stage} · {match.group_name}</Text>
                <Text style={styles.matchStatus}>
                  状态: {match.status === 'completed' ? '已完成' : match.status === 'in_progress' ? '进行中' : '未开始'}
                </Text>
              </View>
              <View style={[
                styles.badge,
                match.status === 'completed' ? { backgroundColor: colors.blue50 } :
                match.status === 'in_progress' ? { backgroundColor: colors.yellow50 } :
                { backgroundColor: colors.white }
              ]}>
                <Text style={[
                  styles.badgeText,
                  match.status === 'completed' ? { color: colors.blue700 } :
                  match.status === 'in_progress' ? { color: colors.yellow700 } :
                  { color: colors.green700 }
                ]}>
                  {match.status === 'completed' ? '已完成' : match.status === 'in_progress' ? '进行中' : '未开始'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.filterCard}>
        <Text style={styles.filterLabel}>比赛筛选</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={group} onValueChange={(val) => setGroup(val as any)} mode="dropdown">
            <Picker.Item label="男双" value="男双" />
            <Picker.Item label="女双" value="女双" />
            <Picker.Item label="混双" value="混双" />
          </Picker>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{group}比赛列表</Text>
      {filteredMatches.length === 0 ? (
        <Text style={styles.emptyText}>暂无{group}比赛</Text>
      ) : (
        filteredMatches.map(match => (
          <TouchableOpacity
            key={match.id}
            style={[
              styles.matchItem,
              selectedMatch?.id === match.id && { borderColor: colors.brand, backgroundColor: colors.blue50 }
            ]}
            onPress={() => setSelectedMatch(match)}
          >
            <View>
              <Text style={styles.matchName}>{match.stage} · {match.group_name}</Text>
              <Text style={styles.matchStatus}>
                状态: {match.status === 'completed' ? '已完成' : match.status === 'in_progress' ? '进行中' : '未开始'}
              </Text>
            </View>
            <View style={[
              styles.badge,
              match.status === 'completed' ? { backgroundColor: colors.blue50 } :
              match.status === 'in_progress' ? { backgroundColor: colors.yellow50 } :
              { backgroundColor: colors.white }
            ]}>
              <Text style={[
                styles.badgeText,
                match.status === 'completed' ? { color: colors.blue700 } :
                match.status === 'in_progress' ? { color: colors.yellow700 } :
                { color: colors.green700 }
              ]}>
                {match.status === 'completed' ? '已完成' : match.status === 'in_progress' ? '进行中' : '未开始'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {selectedMatch && (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>成绩录入</Text>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>当前选择:</Text>
            <Text style={styles.selectedValue}>{selectedMatch.stage} · {selectedMatch.group_name}</Text>
          </View>
          <AdminForm match={selectedMatch} onSaved={loadMatches} />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  filterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 4,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray500,
    paddingVertical: 32,
    fontSize: 15,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  matchStatus: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formSection: {
    marginTop: spacing.md,
    marginBottom: 32,
  },
  selectedInfo: {
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectedLabel: {
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 2,
  },
  selectedValue: {
    fontSize: 14,
    color: colors.text,
  },
})
