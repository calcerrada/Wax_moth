import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ExternalServicesScreen from './ExternalServicesScreen'

describe('ExternalServicesScreen', () => {
  test('renderiza el titulo de la seccion', () => {
    render(<ExternalServicesScreen />)

    expect(screen.getByRole('heading', { name: 'externalServices.title' })).toBeInTheDocument()
  })

  test('renderiza el texto placeholder', () => {
    render(<ExternalServicesScreen />)

    expect(screen.getByText('externalServices.placeholder')).toBeInTheDocument()
  })
})
