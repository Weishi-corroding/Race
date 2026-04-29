export function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}
export function formatDisplayTime(displayTime: string): string {
  // 如果是特殊结果（DNF、DNS等），直接返回
  if (['DNF', 'DNS', '弃权', '退赛'].includes(displayTime)) {
    return displayTime
  }
  
  // 处理时间格式
  if (displayTime.includes('.')) {
    // 已经是带小数的格式，确保显示一致
    const [minutes, secondsPart] = displayTime.split(':')
    const [seconds, hundredths] = secondsPart.split('.')
    return `${minutes}:${seconds}.${hundredths.padEnd(2, '0')}`
  } else if (displayTime.includes(':')) {
    // 没有小数部分，显示为整秒
    return `${displayTime}.00`
  }
  
  return displayTime
}
export function getMatchStatus(matchStartISO: string | undefined, hasResults: boolean) {
  if (!matchStartISO) return '信息不全'
  const now = new Date()
  const start = new Date(matchStartISO)
  if (now < start) return '比赛未开始'
  if (!hasResults) return '成绩未录入'
  return '已完赛'
}
