import { StyleSheet, ViewStyle, TextStyle } from 'react-native'

export const colors = {
  brand: '#2563eb',
  blue600: '#2563eb',
  blue50: '#eff6ff',
  blue200: '#bfdbfe',
  blue700: '#1d4ed8',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  white: '#ffffff',
  background: '#f3f4f6',
  text: '#111827',
  green50: '#f0fdf4',
  green200: '#bbf7d0',
  green700: '#15803d',
  yellow50: '#fffbeb',
  yellow300: '#fcd34d',
  yellow700: '#a16207',
  orange50: '#fff7ed',
  orange200: '#fed7aa',
  orange700: '#c2410c',
  red50: '#fef2f2',
  red200: '#fecaca',
  red600: '#dc2626',
  red700: '#b91c1c',
}

export const borderRadius = {
  md: 6,
  lg: 12,
  xl: 16,
  round: 9999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
}

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  btnOutline: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
  },
  btnOutlineText: {
    color: colors.gray700,
    fontSize: 14,
    fontWeight: '500' as const,
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
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray700,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    fontSize: 14,
    fontWeight: '500' as const,
    overflow: 'hidden' as const,
  },
  statusBlue: {
    backgroundColor: colors.blue50,
    color: colors.blue700,
  },
  statusYellow: {
    backgroundColor: colors.yellow50,
    color: colors.yellow700,
  },
  statusWhite: {
    backgroundColor: colors.white,
    color: colors.green700,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textMuted: {
    fontSize: 14,
    color: colors.gray500,
  },
})
