import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import WelcomeScreen from './WelcomeScreen'

function renderWelcomeScreen() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/scan" element={<div>scan-page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WelcomeScreen', () => {
  test('renderiza el logo con el src correcto y alt no vacio', () => {
    renderWelcomeScreen()

    const logo = screen.getByRole('img')

    expect(logo).toHaveAttribute('src', '/logo.png')
    expect(logo).toHaveAttribute('alt')
    expect(logo.getAttribute('alt')).not.toBe('')
  })

  test('renderiza el nombre de la app', () => {
    renderWelcomeScreen()

    expect(screen.getByRole('heading', { name: /welcome\.(title|appName)|Audio Manager/i })).toBeInTheDocument()
  })

  test('el boton Get Started existe y esta habilitado', () => {
    renderWelcomeScreen()

    const startButton = screen.getByRole('button', { name: /welcome\.getStarted|Get Started/i })

    expect(startButton).toBeInTheDocument()
    expect(startButton).toBeEnabled()
  })

  test('al hacer click en el boton navega a /scan', async () => {
    const user = userEvent.setup()
    renderWelcomeScreen()

    const startButton = screen.getByRole('button', { name: /welcome\.getStarted|Get Started/i })
    await user.click(startButton)

    expect(screen.getByText('scan-page')).toBeInTheDocument()
  })
})
