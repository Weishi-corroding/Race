import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '@/lib/supabaseClient'
import { Match, Result } from '@/lib/types'
import MatchCard from '@/components/MatchCard'
import { colors, borderRadius, spacing } from '@/theme'

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [allResults, setAllResults] = useState<Result[]>([])
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  const [group, setGroup] = useState<'男双' | '女双' | '混双'>('男双')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadMatches()
    loadAllResults()
  }, [])

  useEffect(() => {
    const filtered = matches.filter(m => m.group_name === group)
    setFilteredMatches(filtered)
  }, [matches, group])

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
    setMatches(data || [])
  }

  async function loadAllResults() {
    const { data } = await supabase
      .from('results')
      .select('*, teams(*)')
    setAllResults(data || [])
  }

  function getMatchResults(matchId: string): Result[] {
    return allResults.filter(result => result.match_id === matchId)
  }

  function handleToggleMatch(matchId: string) {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadMatches(), loadAllResults()])
    setRefreshing(false)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.filterCard}>
        <Text style={styles.filterLabel}>比赛组别</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={group}
            onValueChange={(val) => setGroup(val as any)}
            mode="dropdown"
          >
            <Picker.Item label="男双" value="男双" />
            <Picker.Item label="女双" value="女双" />
            <Picker.Item label="混双" value="混双" />
          </Picker>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{group}比赛 ({filteredMatches.length})</Text>
        {expandedMatchId && (
          <Text style={styles.collapseBtn} onPress={() => setExpandedMatchId(null)}>
            收起所有
          </Text>
        )}
      </View>

      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            results={getMatchResults(item.id)}
            isExpanded={expandedMatchId === item.id}
            onToggle={handleToggleMatch}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无{group}比赛</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  collapseBtn: {
    fontSize: 14,
    color: colors.brand,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray500,
  },
})
