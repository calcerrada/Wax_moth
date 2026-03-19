import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  test('calcula porcentaje y actualiza ancho visual', () => {
    const { container } = render(<ProgressBar progress={25} total={100} />)

    expect(screen.getByText('progress.files')).toBeInTheDocument()
    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle('width: 25%')
  })

  test('usa 0 por ciento cuando total es cero', () => {
    const { container } = render(<ProgressBar progress={3} total={0} />)

    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle('width: 0%')
  })
})
