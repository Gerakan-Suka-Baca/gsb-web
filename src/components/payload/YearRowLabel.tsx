'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

const YearRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ year?: string }>()

  const customLabel = data?.year
    ? `Tahun ${data.year}`
    : `Data Metrik ${String(rowNumber).padStart(2, '0')}`

  return React.createElement('div', null, customLabel)
}

export { YearRowLabel }
export default YearRowLabel
