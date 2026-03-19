import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ScanErrorPanel from './ScanErrorPanel'

describe('ScanErrorPanel', () => {
  test('muestra el error y ejecuta reintento al hacer click', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<ScanErrorPanel error="fallo de red" onRetry={onRetry} />)

    expect(screen.getByText('fallo de red')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'scan.retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
