'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

const ProgramRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>()

  const customLabel = data?.name
    ? `${data.name}`
    : `Program Studi ${String(rowNumber).padStart(2, '0')}`

  return React.createElement('div', null, customLabel)
}

export { ProgramRowLabel }
export default ProgramRowLabel
