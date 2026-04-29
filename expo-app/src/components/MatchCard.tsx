import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Match, Result } from '@/lib/types'
import { formatDisplayTime } from '@/lib/utils'
import { colors, borderRadius, spacing } from '@/theme'

interface MatchCardProps {
  match: Match
  results: Result[]
  isExpanded: boolean
  onToggle: (matchId: string) => void
}

export default function MatchCard({ match, results, isExpanded, onToggle }: MatchCardProps) {
  const hasResults = results && results.length > 0

  const getRankStyle = (rank: number, stage: string) => {
    if (stage === '预赛') {
      return rank <= 8 ? { backgroundColor: colors.green50, borderColor: colors.green200 } : undefined
    } else if (stage === '决赛') {
      if (rank === 1) return { backgroundColor: colors.yellow50, borderColor: colors.yellow300 }
      if (rank === 2) return { backgroundColor: colors.gray200, borderColor: colors.gray300 }
      if (rank === 3) return { backgroundColor: colors.orange50, borderColor: colors.orange200 }
      if (rank <= 8) return { backgroundColor: colors.blue50, borderColor: colors.blue200 }
    }
    return undefined
  }

  const getRankTextColor = (rank: number, stage: string) => {
    if (stage === '预赛') return rank <= 8 ? colors.green700 : undefined
    if (stage === '决赛') {
      if (rank === 1) return colors.yellow700
      if (rank === 2) return colors.gray700
      if (rank === 3) return colors.orange700
      if (rank <= 8) return colors.blue700
    }
    return undefined
  }

  const getRankBadge = (rank: number, stage: string) => {
    if (stage === '预赛' && rank <= 8) return '🏆'
    if (stage === '决赛') {
      if (rank === 1) return '🥇'
      if (rank === 2) return '🥈'
      if (rank === 3) return '🥉'
    }
    return ''
  }

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    [results]
  )

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onToggle(match.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>{match.stage} · {match.group_name}</Text>
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>
            {hasResults ? `${results.length} 条成绩` : '暂无成绩'}
          </Text>
          <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expanded}>
          {hasResults ? (
            <View style={styles.innerTable}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { flex: 0.5 }]}>排名</Text>
                <Text style={[styles.th, { flex: 1 }]}>队伍名称</Text>
                <Text style={[styles.th, { flex: 0.75 }]}>成绩</Text>
              </View>
              {sortedResults.map((result) => {
                const rowStyle = getRankStyle(result.rank, match.stage)
                const textColor = getRankTextColor(result.rank, match.stage)
                return (
                  <View
                    key={result.id}
                    style={[styles.tr, rowStyle]}
                  >
                    <View style={{ flex: 0.5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                      <Text style={[styles.td, textColor && { color: textColor }, styles.tdBold]}>
                        {result.rank}
                      </Text>
                      <Text style={{ fontSize: 12 }}>{getRankBadge(result.rank, match.stage)}</Text>
                    </View>
                    <Text style={[styles.td, textColor && { color: textColor }, { flex: 1 }]} numberOfLines={1}>
                      {result.team_name}
                    </Text>
                    <Text style={[styles.td, styles.tdMono, textColor && { color: textColor }, { flex: 0.75 }]}>
                      {formatDisplayTime(result.display_time)}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <Text style={styles.noResults}>暂无成绩记录</Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  resultCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultCountText: {
    fontSize: 13,
    color: colors.gray500,
  },
  chevron: {
    fontSize: 10,
    color: colors.gray500,
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    padding: spacing.md,
  },
  innerTable: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  td: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  tdBold: {
    fontWeight: '700',
  },
  tdMono: {
    fontFamily: undefined,
  },
  noResults: {
    textAlign: 'center',
    color: colors.gray500,
    paddingVertical: 16,
    fontSize: 14,
  },
})
