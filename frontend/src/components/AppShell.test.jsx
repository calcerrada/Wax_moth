import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import AppShell from './AppShell'

function renderAppShell(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/scan" element={<div>scan-page</div>} />
          <Route path="/services" element={<div>services-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  test('renderiza los dos enlaces de navegacion', () => {
    renderAppShell('/scan')

    expect(screen.getByRole('link', { name: 'nav.scan' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'nav.services' })).toBeInTheDocument()
  })

  test('el enlace de la ruta activa recibe la clase nav-link-active', () => {
    renderAppShell('/services')

    const servicesLink = screen.getByRole('link', { name: 'nav.services' })
    const scanLink = screen.getByRole('link', { name: 'nav.scan' })

    expect(servicesLink).toHaveClass('nav-link-active')
    expect(scanLink).not.toHaveClass('nav-link-active')
  })

  test('el lang-switch EN y ES sigue presente en el header', () => {
    renderAppShell('/scan')

    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument()
  })
})
