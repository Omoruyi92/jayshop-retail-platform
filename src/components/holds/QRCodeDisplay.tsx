'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
      <QRCodeSVG
        value={value}
        size={200}
        level="M"
        includeMargin={false}
        fgColor="#134A8E"
      />
    </div>
  )
}
