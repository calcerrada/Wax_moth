import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import Badge from './Badge'

describe('Badge', () => {
  test('muestra la extension en mayusculas sin punto', () => {
    render(<Badge ext=".mp3" />)

    expect(screen.getByText('MP3')).toBeInTheDocument()
  })

  test('usa color por defecto cuando la extension no existe en el mapa', () => {
    const { container } = render(<Badge ext=".unknown" />)

    const badge = container.querySelector('.badge')
    expect(badge).toHaveStyle('--badge-color: #6b7280')
  })
})
