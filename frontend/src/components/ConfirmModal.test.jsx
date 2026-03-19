import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ConfirmModal from './ConfirmModal'

describe('ConfirmModal', () => {
  test('renderiza los textos y dispara onCancel/onConfirm', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(<ConfirmModal count={3} onCancel={onCancel} onConfirm={onConfirm} />)

    expect(screen.getByText('confirm.title')).toBeInTheDocument()
    expect(screen.getByText('confirm.body')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'confirm.cancel' }))
    await user.click(screen.getByRole('button', { name: 'confirm.delete' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
