import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { Result } from '@/lib/types'
import { formatDisplayTime } from '@/lib/utils'
import { colors, borderRadius } from '@/theme'

export default function ResultsTable({ results }: { results: Result[] }) {
  if (!results || results.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无成绩 — 管理员尚未录入。</Text>
      </View>
    )
  }

  const sorted = [...results].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: colors.blue50, color: colors.blue700 }
      case 'in_progress': return { backgroundColor: colors.yellow50, color: colors.yellow700 }
      default: return { backgroundColor: colors.white, color: colors.green700 }
    }
  }

  const getBadgeText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '进行中'
      default: return '待开始'
    }
  }

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { flex: 0.5 }]}>排名</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>队伍名称</Text>
        <Text style={[styles.headerCell, { flex: 0.75 }]}>成绩</Text>
        <Text style={[styles.headerCell, { flex: 0.75 }]}>状态</Text>
      </View>
      {sorted.map(r => {
        const badge = getBadgeStyle(r.status)
        return (
          <View key={r.id} style={styles.row}>
            <Text style={[styles.cell, { flex: 0.5 }]}>{r.rank ?? '-'}</Text>
            <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{r.team_name}</Text>
            <Text style={[styles.cell, { flex: 0.75 }]}>{formatDisplayTime(r.display_time)}</Text>
            <View style={{ flex: 0.75, alignItems: 'center' }}>
              <Text style={[styles.badge, { backgroundColor: badge.backgroundColor, color: badge.color }]}>
                {getBadgeText(r.status)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  cell: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray500,
  },
})
