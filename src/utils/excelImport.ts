import * as XLSX from 'xlsx'

export type ExcelRow = Record<string, unknown>

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')

export const readExcelRows = async (file: File) => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('The workbook does not contain any worksheets.')
  }

  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '', raw: false })
}

export const getExcelCellValue = (row: ExcelRow, keys: string[]) => {
  const normalizedKeys = keys.map(normalizeHeader)

  for (const [key, value] of Object.entries(row)) {
    if (normalizedKeys.includes(normalizeHeader(key))) {
      return value
    }
  }

  return undefined
}

export const getExcelText = (row: ExcelRow, keys: string[]) => {
  const value = getExcelCellValue(row, keys)

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }

  return ''
}

export const getExcelNumber = (row: ExcelRow, keys: string[]) => {
  const value = getExcelCellValue(row, keys)

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/[^0-9.-]/g, ''))
    if (Number.isFinite(numericValue)) {
      return Math.trunc(numericValue)
    }
  }

  return undefined
}