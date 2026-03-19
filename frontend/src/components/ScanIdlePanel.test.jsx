import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ScanIdlePanel from './ScanIdlePanel'

describe('ScanIdlePanel', () => {
  test('permite cambiar carpeta, toggle de duplicados y lanzar escaneo', async () => {
    const user = userEvent.setup()
    const onFolderChange = vi.fn()
    const onDetectDupsChange = vi.fn()
    const onScan = vi.fn()

    render(
      <ScanIdlePanel
        folder="/music"
        detectDups={true}
        onFolderChange={onFolderChange}
        onDetectDupsChange={onDetectDupsChange}
        onScan={onScan}
      />
    )

    const input = screen.getByPlaceholderText('scan.folderPlaceholder')
    await user.type(input, '/new{enter}')

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    await user.click(screen.getByRole('button', { name: 'scan.start' }))

    expect(onFolderChange).toHaveBeenCalled()
    expect(onDetectDupsChange).toHaveBeenCalledWith(false)
    expect(onScan).toHaveBeenCalledTimes(2)
  })

  test('deshabilita boton iniciar cuando la carpeta esta vacia', () => {
    render(
      <ScanIdlePanel
        folder="   "
        detectDups={true}
        onFolderChange={vi.fn()}
        onDetectDupsChange={vi.fn()}
        onScan={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'scan.start' })).toBeDisabled()
  })
})
