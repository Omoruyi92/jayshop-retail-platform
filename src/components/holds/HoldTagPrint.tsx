'use client'
import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { formatCAD } from '@/lib/utils'

interface Props {
  format: 'label' | 'receipt'
  reservationCode: string
  customerFullName: string
  customerPhone: string
  productName: string
  productBrand: string
  size: string | null
  holdQuantity: number
  totalPriceCents: number
  expiryStr: string
  pickupEtaStr: string | null
  isStadiumHold: boolean
  queuePosition: number | null
  appUrl: string
}

const LABEL_PRINT_CSS = `
  @media print {
    @page { size: 2.25in 1.25in; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body * { visibility: hidden !important; }
    .print-root, .print-root * { visibility: visible !important; }
    .print-root {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 2.25in !important;
      height: 1.25in !important;
    }
    .label {
      width: 2.25in;
      height: 1.25in;
      display: flex;
      flex-direction: row;
      align-items: center;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      padding: 0.05in;
      gap: 0.05in;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .label-qr { flex-shrink: 0; }
    .label-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    .label-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      font-weight: bold;
      color: #134A8E;
      letter-spacing: 0.5px;
    }
    .label-product {
      font-size: 7pt;
      font-weight: bold;
      color: #1a1a1a;
      line-height: 1.2;
      word-break: break-word;
    }
    .label-brand { font-size: 6pt; color: #555; }
    .label-row { font-size: 6.5pt; color: #333; }
    .label-expiry {
      font-size: 6pt;
      color: #555;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .label-stadium {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #F59E0B;
      color: #451a03;
      font-size: 5.5pt;
      font-weight: bold;
      padding: 1px 3px;
      border-radius: 2px;
      margin-top: 1px;
    }
    .label-policy { font-size: 5pt; color: #C41230; font-weight: bold; }
  }
`

const RECEIPT_PRINT_CSS = `
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body * { visibility: hidden !important; }
    .print-root, .print-root * { visibility: visible !important; }
    .print-root {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
    }
    .receipt {
      max-width: 4in;
      margin: 0 auto;
      color: #1a1a1a;
      font-family: Arial, Helvetica, sans-serif;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .receipt-header {
      background: #134A8E;
      color: #fff;
      text-align: center;
      padding: 12pt 16pt 10pt;
      border-radius: 4pt 4pt 0 0;
    }
    .receipt-store { font-size: 11pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
    .receipt-title { font-size: 8pt; color: #93c5fd; text-transform: uppercase; letter-spacing: 1px; margin-top: 2pt; }
    .receipt-body { border: 1pt solid #e5e7eb; border-top: 0; padding: 12pt 14pt; }
    .receipt-code {
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 22pt;
      font-weight: bold;
      color: #134A8E;
      letter-spacing: 2px;
      margin: 8pt 0;
    }
    .receipt-qr { text-align: center; margin: 10pt 0; }
    .receipt-divider { border: none; border-top: 1pt solid #e5e7eb; margin: 8pt 0; }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8.5pt;
      margin-bottom: 5pt;
    }
    .receipt-label { color: #6b7280; }
    .receipt-value { font-weight: 600; color: #1a1a1a; text-align: right; }
    .receipt-total { font-size: 10pt; font-weight: bold; color: #C41230; }
    .receipt-product { font-size: 10pt; font-weight: bold; color: #134A8E; text-transform: uppercase; }
    .stadium-box {
      border: 1.5pt solid #F59E0B;
      border-radius: 4pt;
      background: #fffbeb;
      padding: 8pt 10pt;
      margin-top: 10pt;
    }
    .stadium-title { font-size: 9pt; font-weight: bold; color: #92400e; margin-bottom: 4pt; }
    .stadium-row { font-size: 8pt; color: #78350f; margin-bottom: 2pt; }
    .policy-badge {
      display: inline-block;
      background: #C41230;
      color: #fff;
      font-size: 7pt;
      font-weight: bold;
      padding: 2pt 5pt;
      border-radius: 2pt;
      margin-top: 4pt;
      letter-spacing: 0.5px;
    }
    .receipt-footer {
      text-align: center;
      font-size: 7.5pt;
      color: #6b7280;
      margin-top: 10pt;
      border-top: 1pt solid #e5e7eb;
      padding-top: 8pt;
    }
  }
`

export default function HoldTagPrint({
  format,
  reservationCode,
  customerFullName,
  customerPhone,
  productName,
  productBrand,
  size,
  holdQuantity,
  totalPriceCents,
  expiryStr,
  pickupEtaStr,
  isStadiumHold,
  queuePosition,
  appUrl,
}: Props) {
  useEffect(() => {
    console.log('[HoldTagPrint] useEffect fired — scheduling window.print()')

    const doPrint = () => {
      const root = document.querySelector('.print-root')
      console.log('[HoldTagPrint] .print-root element:', root)
      console.log('[HoldTagPrint] .print-root innerHTML length:', root ? root.innerHTML.length : 'NOT FOUND')
      if (root) {
        const rect = (root as HTMLElement).getBoundingClientRect()
        console.log('[HoldTagPrint] .print-root bounding rect:', JSON.stringify(rect))
        const style = window.getComputedStyle(root as HTMLElement)
        console.log('[HoldTagPrint] .print-root computed display:', style.display, '| visibility:', style.visibility, '| opacity:', style.opacity)
      }
      console.log('[HoldTagPrint] calling window.print() now')
      window.print()
    }

    // Use double-rAF + delay to ensure paint is complete before printing
    // First rAF: layout committed; second rAF + timeout: paint flushed
    const t = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doPrint()
        })
      })
    }, 500)

    return () => clearTimeout(t)
  }, [])

  const qrValue = `${appUrl}/holds/${reservationCode}`
  const css = format === 'label' ? LABEL_PRINT_CSS : RECEIPT_PRINT_CSS

  if (format === 'label') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* Screen preview wrapper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f0f0f0',
          }}
        >
          <div
            className="label print-root"
            style={{
              width: '2.25in',
              height: '1.25in',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'hidden',
              fontFamily: 'Arial, Helvetica, sans-serif',
              padding: '0.05in',
              gap: '0.05in',
              boxSizing: 'border-box',
              boxShadow: '0 1px 8px rgba(0,0,0,0.15)',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#fff',
            }}
          >
            <div className="label-qr" style={{ flexShrink: 0 }}>
              <QRCodeSVG value={qrValue} size={64} level="M" fgColor="#134A8E" />
            </div>
            <div
              className="label-info"
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                overflow: 'hidden',
              }}
            >
              <div className="label-code" style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '9pt', fontWeight: 'bold', color: '#134A8E', letterSpacing: '0.5px' }}>{reservationCode}</div>
              <div className="label-product" style={{ fontSize: '7pt', fontWeight: 'bold', color: '#1a1a1a', lineHeight: 1.2, wordBreak: 'break-word' }}>{productName}</div>
              {productBrand && <div className="label-brand" style={{ fontSize: '6pt', color: '#555' }}>{productBrand}</div>}
              <div className="label-row" style={{ fontSize: '6.5pt', color: '#333' }}>
                {size && <>Size: <strong>{size}</strong> &nbsp;</>}
                Qty: <strong>{holdQuantity}</strong>
              </div>
              <div className="label-expiry" style={{ fontSize: '6pt', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pickup by: {expiryStr}</div>
              {isStadiumHold && (
                <>
                  <div className="label-stadium" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#F59E0B', color: '#451a03', fontSize: '5.5pt', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px', marginTop: '1px' }}>
                    ⚾ Stadium{queuePosition != null ? ` · #${queuePosition}` : ''}
                    {pickupEtaStr ? ` · ETA ${pickupEtaStr}` : ''}
                  </div>
                  <div className="label-policy" style={{ fontSize: '5pt', color: '#C41230', fontWeight: 'bold' }}>24-HOUR HOLD</div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Receipt format
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* Screen preview wrapper */}
      <div
        style={{
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '24px',
          minHeight: '100vh',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          className="receipt print-root"
          style={{
            maxWidth: '4in',
            width: '100%',
            margin: '0 auto',
            color: '#1a1a1a',
            boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
            borderRadius: '6pt',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <div className="receipt-header" style={{ background: '#134A8E', color: '#fff', textAlign: 'center', padding: '12pt 16pt 10pt' }}>
            <div className="receipt-store" style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Jays Shop</div>
            <div className="receipt-title" style={{ fontSize: '8pt', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2pt' }}>Hold Receipt</div>
          </div>
          <div className="receipt-body" style={{ border: '1pt solid #e5e7eb', borderTop: 0, padding: '12pt 14pt' }}>
            <div className="receipt-code" style={{ textAlign: 'center', fontFamily: 'Courier New, Courier, monospace', fontSize: '22pt', fontWeight: 'bold', color: '#134A8E', letterSpacing: '2px', margin: '8pt 0' }}>{reservationCode}</div>
            <div className="receipt-qr" style={{ textAlign: 'center', margin: '10pt 0' }}>
              <QRCodeSVG value={qrValue} size={130} level="M" fgColor="#134A8E" />
            </div>
            <hr className="receipt-divider" style={{ border: 'none', borderTop: '1pt solid #e5e7eb', margin: '8pt 0' }} />
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Customer</span>
              <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{customerFullName}</span>
            </div>
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Phone</span>
              <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{customerPhone}</span>
            </div>
            <hr className="receipt-divider" style={{ border: 'none', borderTop: '1pt solid #e5e7eb', margin: '8pt 0' }} />
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Product</span>
              <span className="receipt-product" style={{ fontSize: '10pt', fontWeight: 'bold', color: '#134A8E', textTransform: 'uppercase' }}>{productName}</span>
            </div>
            {productBrand && (
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
                <span className="receipt-label" style={{ color: '#6b7280' }}>Brand</span>
                <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{productBrand}</span>
              </div>
            )}
            {size && (
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
                <span className="receipt-label" style={{ color: '#6b7280' }}>Size</span>
                <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{size}</span>
              </div>
            )}
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Quantity</span>
              <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{holdQuantity}</span>
            </div>
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Total</span>
              <span className="receipt-total" style={{ fontSize: '10pt', fontWeight: 'bold', color: '#C41230' }}>{formatCAD(totalPriceCents)}</span>
            </div>
            <hr className="receipt-divider" style={{ border: 'none', borderTop: '1pt solid #e5e7eb', margin: '8pt 0' }} />
            <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '8.5pt', marginBottom: '5pt' }}>
              <span className="receipt-label" style={{ color: '#6b7280' }}>Hold expires</span>
              <span className="receipt-value" style={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{expiryStr}</span>
            </div>

            {isStadiumHold && (
              <div className="stadium-box" style={{ border: '1.5pt solid #F59E0B', borderRadius: '4pt', background: '#fffbeb', padding: '8pt 10pt', marginTop: '10pt' }}>
                <div className="stadium-title" style={{ fontSize: '9pt', fontWeight: 'bold', color: '#92400e', marginBottom: '4pt' }}>⚾ Stadium Priority Hold</div>
                {queuePosition != null && (
                  <div className="stadium-row" style={{ fontSize: '8pt', color: '#78350f', marginBottom: '2pt' }}>Queue position: <strong>#{queuePosition}</strong></div>
                )}
                {pickupEtaStr && (
                  <div className="stadium-row" style={{ fontSize: '8pt', color: '#78350f', marginBottom: '2pt' }}>Pickup ETA: <strong>{pickupEtaStr}</strong></div>
                )}
                <div>
                  <span className="policy-badge" style={{ display: 'inline-block', background: '#C41230', color: '#fff', fontSize: '7pt', fontWeight: 'bold', padding: '2pt 5pt', borderRadius: '2pt', marginTop: '4pt', letterSpacing: '0.5px' }}>⚠ 24-HOUR HOLD POLICY</span>
                </div>
              </div>
            )}

            <div className="receipt-footer" style={{ textAlign: 'center', fontSize: '7.5pt', color: '#6b7280', marginTop: '10pt', borderTop: '1pt solid #e5e7eb', paddingTop: '8pt' }}>
              Show this receipt at pickup.<br />
              Jays Shop · Rogers Centre
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
