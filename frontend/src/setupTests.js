import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ i18nKey }) => React.createElement(React.Fragment, null, i18nKey),
}))

globalThis.fetch = vi.fn()
