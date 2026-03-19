import { describe, expect, test } from 'vitest'
import { formatDuration, formatSize } from './formatters'

describe('formatSize', () => {
  test('devuelve bytes cuando el valor es menor que 1024', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(1023)).toBe('1023 B')
  })

  test('devuelve KB con un decimal desde 1024 hasta antes de 1 MB', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
    expect(formatSize(1536)).toBe('1.5 KB')
    expect(formatSize(1048575)).toBe('1024.0 KB')
  })

  test('devuelve MB con un decimal desde 1 MB', () => {
    expect(formatSize(1048576)).toBe('1.0 MB')
    expect(formatSize(1572864)).toBe('1.5 MB')
  })
})

describe('formatDuration', () => {
  test('formatea la duracion como mm:ss', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(125)).toBe('2:05')
  })

  test("devuelve '—' cuando recibe null", () => {
    expect(formatDuration(null)).toBe('—')
  })
})
