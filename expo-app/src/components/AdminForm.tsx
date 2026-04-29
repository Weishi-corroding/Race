import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '@/lib/supabaseClient'
import { Match, Team, Result } from '@/lib/types'
import { useQualifiedTeams } from '@/hooks/useQualifiedTeams'
import { colors, borderRadius, spacing } from '@/theme'

interface AdminFormProps {
  match: Match
  onSaved: () => void
}

export default function AdminForm({ match, onSaved }: AdminFormProps) {
  const [results, setResults] = useState<Result[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [timeInput, setTimeInput] = useState<string>('')
  const [resultType, setResultType] = useState<'time' | 'dnf' | 'dns' | 'dq' | 'withdrawn'>('time')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { qualifiedTeams, loading: teamsLoading, error: teamsError } = useQualifiedTeams(match.group_name, match.stage)

  useEffect(() => {
    loadResults()
  }, [match])

  useEffect(() => {
    if (qualifiedTeams.length > 0) {
      loadAvailableTeams()
    }
  }, [qualifiedTeams, results])

  async function loadResults() {
    const { data, error } = await supabase
      .from('results')
      .select('*, teams(*)')
      .eq('match_id', match.id)
      .order('time_seconds', { ascending: true })
    if (error) return
    setResults(data || [])
  }

  async function loadAvailableTeams() {
    const selectedTeamIds = results.map(r => r.team_id).filter(Boolean)
    const available = qualifiedTeams.filter(team => !selectedTeamIds.includes(team.id))
    setAvailableTeams(available)
    if (available.length > 0 && !selectedTeamId) {
      setSelectedTeamId(available[0].id)
    }
  }

  function getResultTypeText(rt: string): string {
    switch (rt) {
      case 'dnf': return '未完成'
      case 'dns': return '未出发'
      case 'dq': return '弃权'
      case 'withdrawn': return '退赛'
      default: return '比赛用时'
    }
  }

  function validateTime(time: string): boolean {
    if (resultType !== 'time') return true
    const timeRegex = /^(\d{1,2}):([0-5]\d)(\.\d{1,2})?$/
    return timeRegex.test(time)
  }

  function timeToSeconds(time: string): number {
    const [minutes, secondsPart] = time.split(':')
    const [seconds, hundredths = '00'] = secondsPart.split('.')
    return parseInt(minutes) * 60 + parseInt(seconds) + parseInt(hundredths.padEnd(2, '0')) / 100
  }

  function autoCompleteTime(time: string): string {
    if (!time.includes(':')) return time
    const [minutes, secondsPart] = time.split(':')
    if (!secondsPart.includes('.')) {
      return `${minutes}:${secondsPart.padEnd(2, '0')}.00`
    } else {
      const [seconds, hundredths = ''] = secondsPart.split('.')
      return `${minutes}:${seconds.padStart(2, '0')}.${hundredths.padEnd(2, '0')}`
    }
  }

  async function calculateAndUpdateRanks() {
    const { data: allResults, error } = await supabase
      .from('results')
      .select('*')
      .eq('match_id', match.id)
    if (error) throw error

    const sortedResults = [...allResults].sort((a, b) => {
      if (a.time_seconds !== null && b.time_seconds !== null) return a.time_seconds - b.time_seconds
      if (a.time_seconds !== null && b.time_seconds === null) return -1
      if (a.time_seconds === null && b.time_seconds !== null) return 1
      const typeOrder: Record<string, number> = { 'time': 0, 'dnf': 1, 'withdrawn': 2, 'dq': 3, 'dns': 4 }
      return (typeOrder[a.result_type] || 999) - (typeOrder[b.result_type] || 999)
    })

    const updatePromises = sortedResults.map((result, index) =>
      supabase.from('results').update({ rank: index + 1 }).eq('id', result.id)
    )
    await Promise.all(updatePromises)
  }

  async function submitSingleResult() {
    if (!selectedTeamId) {
      setMessage('请选择队伍')
      return
    }
    setSubmitting(true)
    setMessage('')

    try {
      const selectedTeam = qualifiedTeams.find(team => team.id === selectedTeamId)
      if (!selectedTeam) throw new Error('选择的队伍不存在')

      let timeSeconds: number | null = null
      let displayTime = ''

      switch (resultType) {
        case 'time':
          if (!timeInput) { setMessage('请输入比赛用时'); return }
          if (!validateTime(timeInput)) { setMessage('时间格式不正确，请使用 mm:ss 或 mm:ss.ss 格式'); return }
          const completedTime = autoCompleteTime(timeInput)
          timeSeconds = timeToSeconds(completedTime)
          displayTime = completedTime
          break
        case 'dnf': displayTime = 'DNF'; break
        case 'dns': displayTime = 'DNS'; break
        case 'dq': displayTime = '弃权'; break
        case 'withdrawn': displayTime = '退赛'; break
      }

      const { error: insertError } = await supabase.from('results').insert({
        match_id: match.id,
        team_id: selectedTeamId,
        team_name: selectedTeam.name,
        time_seconds: timeSeconds,
        display_time: displayTime,
        result_type: resultType,
        rank: 0,
        status: 'completed',
      })
      if (insertError) throw insertError

      await calculateAndUpdateRanks()
      setMessage(`✅ ${selectedTeam.name} 的成绩已录入：${displayTime}`)
      setTimeInput('')
      setResultType('time')
      await loadResults()
    } catch (error: any) {
      setMessage('录入失败: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function completeMatch() {
    setLoading(true)
    try {
      const { error } = await supabase.from('matches').update({ status: 'completed' }).eq('id', match.id)
      if (error) throw error
      setMessage('🎉 比赛成绩录入完成！')
      onSaved()
    } catch (error: any) {
      setMessage('完成比赛失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteResult(resultId: string) {
    Alert.alert('确认删除', '确定要删除这个成绩记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('results').delete().eq('id', resultId)
            if (error) throw error
            setMessage('成绩记录已删除')
            await loadResults()
          } catch (error: any) {
            setMessage('删除失败: ' + error.message)
          }
        },
      },
    ])
  }

  const getRankStyle = (rank: number) => {
    if (match.stage === '预赛') return rank <= 8 ? { backgroundColor: colors.green50, borderColor: colors.green200 } : undefined
    if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return { backgroundColor: colors.yellow50, borderColor: colors.yellow300 }
      if (rank === 3 || rank === 4) return { backgroundColor: colors.gray200, borderColor: colors.gray300 }
      if (rank === 5 || rank === 6) return { backgroundColor: colors.orange50, borderColor: colors.orange200 }
      if (rank <= 8) return { backgroundColor: colors.blue50, borderColor: colors.blue200 }
    }
    return undefined
  }

  const getRankTextColor = (rank: number) => {
    if (match.stage === '预赛') return rank <= 8 ? colors.green700 : undefined
    if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return colors.yellow700
      if (rank === 3 || rank === 4) return colors.gray700
      if (rank === 5 || rank === 6) return colors.orange700
      if (rank <= 8) return colors.blue700
    }
    return undefined
  }

  const getRankBadge = (rank: number) => {
    if (match.stage === '预赛' && rank <= 8) return '🏆'
    if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return '🥇'
      if (rank === 3 || rank === 4) return '🥈'
      if (rank === 5 || rank === 6) return '🥉'
    }
    return ''
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {message ? (
        <View style={[styles.messageBar, message.includes('✅') || message.includes('🎉') ? styles.messageSuccess : styles.messageError]}>
          <Text style={[styles.messageText, { color: message.includes('✅') || message.includes('🎉') ? colors.green700 : colors.red700 }]}>
            {message}
          </Text>
        </View>
      ) : null}

      {teamsError ? (
        <View style={[styles.messageBar, styles.messageError]}>
          <Text style={[styles.messageText, { color: colors.red700 }]}>加载队伍失败: {teamsError}</Text>
        </View>
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>队伍选择说明</Text>
        <Text style={styles.infoText}>
          {match.stage === '预赛' ? '预赛：可选择所有报名队伍' : '决赛：仅显示预赛前8名晋级队伍'}
        </Text>
        {match.stage === '决赛' && availableTeams.length === 0 && !teamsLoading && (
          <Text style={[styles.infoText, { color: colors.orange700, marginTop: 4 }]}>
            提示：请先完成对应组别的预赛成绩录入
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>录入单个队伍成绩</Text>

        <Text style={styles.label}>选择队伍</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedTeamId}
            onValueChange={setSelectedTeamId}
            enabled={!submitting && availableTeams.length > 0 && !teamsLoading}
            mode="dropdown"
          >
            <Picker.Item label="请选择队伍" value="" />
            {availableTeams.map(team => (
              <Picker.Item key={team.id} label={team.name} value={team.id} />
            ))}
          </Picker>
        </View>
        {teamsLoading && <Text style={styles.hint}>加载队伍中...</Text>}

        <Text style={[styles.label, { marginTop: 12 }]}>结果类型</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={resultType}
            onValueChange={(val) => setResultType(val as any)}
            enabled={!submitting}
            mode="dropdown"
          >
            <Picker.Item label="比赛用时" value="time" />
            <Picker.Item label="DNF (未完成)" value="dnf" />
            <Picker.Item label="DNS (未出发)" value="dns" />
            <Picker.Item label="弃权" value="dq" />
            <Picker.Item label="退赛" value="withdrawn" />
          </Picker>
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>
          {resultType === 'time' ? '比赛用时' : '结果说明'}
        </Text>
        {resultType === 'time' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="mm:ss.ss (如 02:30 或 02:30.45)"
              value={timeInput}
              onChangeText={setTimeInput}
              editable={!submitting}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>支持格式：02:30（自动补全为02:30.00）或 02:30.45</Text>
          </>
        ) : (
          <View style={[styles.input, { backgroundColor: colors.gray200, justifyContent: 'center' }]}>
            <Text style={{ color: colors.gray500 }}>
              {resultType === 'dnf' && 'DNF (未完成)'}
              {resultType === 'dns' && 'DNS (未出发)'}
              {resultType === 'dq' && '弃权'}
              {resultType === 'withdrawn' && '退赛'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (submitting || !selectedTeamId || (resultType === 'time' && !timeInput)) && styles.submitBtnDisabled]}
          onPress={submitSingleResult}
          disabled={submitting || !selectedTeamId || (resultType === 'time' && !timeInput)}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? '录入中...' : '确认录入'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { marginTop: 8 }]}>
          {availableTeams.length > 0
            ? `还有 ${availableTeams.length} 支队伍待录入成绩`
            : teamsLoading
              ? '加载队伍中...'
              : '所有队伍成绩已录入完成'
          }
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>已录入成绩</Text>
          {results.length > 0 && availableTeams.length === 0 && (
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={completeMatch}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? '处理中...' : '完成比赛录入'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {results.length === 0 ? (
          <Text style={styles.emptyText}>暂无成绩记录</Text>
        ) : (
          [...results]
            .sort((a, b) => (a.rank || 999) - (b.rank || 999))
            .map((result) => {
              const rowStyle = getRankStyle(result.rank)
              const textColor = getRankTextColor(result.rank)
              return (
                <View key={result.id} style={[styles.resultRow, rowStyle]}>
                  <View style={styles.resultInfo}>
                    <View style={styles.rankCircle}>
                      <Text style={[styles.rankText, textColor ? { color: textColor } : undefined]}>
                        {result.rank}{getRankBadge(result.rank)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.teamName, textColor ? { color: textColor } : undefined]}>
                        {result.team_name}
                      </Text>
                      <Text style={[styles.resultTime, textColor ? { color: textColor } : undefined, result.result_type !== 'time' ? { color: colors.red600, fontWeight: '600' } : undefined]}>
                        成绩: {result.display_time}
                        {result.result_type !== 'time' ? ` (${getResultTypeText(result.result_type)})` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteResult(result.id)}
                  >
                    <Text style={styles.deleteBtnText}>删除</Text>
                  </TouchableOpacity>
                </View>
              )
            })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageBar: {
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  messageSuccess: {
    backgroundColor: colors.green50,
    borderColor: colors.green200,
  },
  messageError: {
    backgroundColor: colors.red50,
    borderColor: colors.red200,
  },
  messageText: {
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontWeight: '500',
    color: colors.blue700,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.blue700,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
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
    marginBottom: spacing.sm,
    overflow: 'hidden',
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
    minHeight: 42,
  },
  hint: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: colors.brand,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray500,
    paddingVertical: 20,
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultTime: {
    fontSize: 13,
    fontFamily: undefined,
    marginTop: 2,
  },
  deleteBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.red200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    color: colors.red600,
  },
})
