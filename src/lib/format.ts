/** 13500000 -> "13.500.000 ₫", the old site's format */
export const formatPrice = (value: number | null | undefined): string =>
  typeof value === 'number' ? `${new Intl.NumberFormat('vi-VN').format(value)} ₫` : ''
