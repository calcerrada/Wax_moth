import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import StatsBar from './StatsBar'

describe('StatsBar', () => {
  test('muestra totales y etiquetas de estadisticas', () => {
    render(<StatsBar totalFiles={12} dupCount={3} extensionCount={5} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('stats.files')).toBeInTheDocument()
    expect(screen.getByText('stats.duplicateGroups')).toBeInTheDocument()
    expect(screen.getByText('stats.formats')).toBeInTheDocument()
  })
})
