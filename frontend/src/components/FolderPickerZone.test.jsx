import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import FolderPickerZone from './FolderPickerZone'

const useFolderPickerMock = vi.fn()

vi.mock('../hooks/useFolderPicker', () => ({
  useFolderPicker: onFolderSelected => useFolderPickerMock(onFolderSelected),
}))

describe('FolderPickerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useFolderPickerMock.mockReturnValue({
      canUsePicker: true,
      openFolderPicker: vi.fn().mockResolvedValue(undefined),
      dragHandlers: {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      },
      isDragOver: false,
    })
  })

  test('renderiza texto de drop zone y boton browse cuando canUsePicker es true', () => {
    render(<FolderPickerZone onFolderSelected={vi.fn()} disabled={false} />)

    expect(screen.getByText('scan.dropZone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'scan.browseFolder' })).toBeInTheDocument()
  })

  test('renderiza texto alternativo cuando canUsePicker es false', () => {
    useFolderPickerMock.mockReturnValue({
      canUsePicker: false,
      openFolderPicker: vi.fn(),
      dragHandlers: {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      },
      isDragOver: false,
    })

    render(<FolderPickerZone onFolderSelected={vi.fn()} disabled={false} />)

    expect(screen.getByText('scan.dropZone')).toBeInTheDocument()
    expect(screen.getByText('scan.browseNotSupported')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'scan.browseFolder' })).not.toBeInTheDocument()
  })

  test('al hacer click en browse llama a openFolderPicker', async () => {
    const user = userEvent.setup()
    const openFolderPicker = vi.fn().mockResolvedValue(undefined)

    useFolderPickerMock.mockReturnValue({
      canUsePicker: true,
      openFolderPicker,
      dragHandlers: {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      },
      isDragOver: false,
    })

    render(<FolderPickerZone onFolderSelected={vi.fn()} disabled={false} />)

    await user.click(screen.getByRole('button', { name: 'scan.browseFolder' }))
    expect(openFolderPicker).toHaveBeenCalledTimes(1)
  })

  test('cuando isDragOver es true muestra texto activo', () => {
    useFolderPickerMock.mockReturnValue({
      canUsePicker: true,
      openFolderPicker: vi.fn(),
      dragHandlers: {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      },
      isDragOver: true,
    })

    render(<FolderPickerZone onFolderSelected={vi.fn()} disabled={false} />)

    expect(screen.getByText('scan.dropZoneActive')).toBeInTheDocument()
  })

  test('aplica dragHandlers al contenedor', () => {
    const onDragOver = vi.fn()
    const onDragLeave = vi.fn()
    const onDrop = vi.fn()

    useFolderPickerMock.mockReturnValue({
      canUsePicker: true,
      openFolderPicker: vi.fn(),
      dragHandlers: {
        onDragOver,
        onDragLeave,
        onDrop,
      },
      isDragOver: false,
    })

    const { container } = render(<FolderPickerZone onFolderSelected={vi.fn()} disabled={false} />)
    const region = container.querySelector('.folder-picker-zone')

    expect(region).toBeInTheDocument()
    fireEvent.dragOver(region)
    fireEvent.drop(region)

    expect(onDragOver).toHaveBeenCalledTimes(1)
    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(onDragLeave).not.toHaveBeenCalled()
  })
})
