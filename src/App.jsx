import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Modal from './components/Modal'
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from './api/records'
import {
  englishToTamil,
  tamilToEnglish,
  isMostlyTamil,
} from './utils/transliterate'

function toMoney(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(2)
}

const emptyDraft = {
  title: '',
  husbandName: '',
  wifeName: '',
  amount: '',
  totalAmount: '',
  dynamicData: {},
}

export default function App() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // record or null
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  const [extraColumns, setExtraColumns] = useState([])
  const [newColName, setNewColName] = useState('')

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState('excel') // 'excel' or 'word'
  const [exportConfig, setExportConfig] = useState({
    title: 'User Management Records',
    rangeSelection: 'all', // 'all', 'custom'
    fromRow: 1,
    toRow: 10,
    selectedColumns: [], // will be initialized when opening modal
  })

  const allColumns = useMemo(() => {
    const cols = new Set(extraColumns)
    rows.forEach(r => {
      if (r.dynamicData) {
        Object.keys(r.dynamicData).forEach(k => cols.add(k))
      }
    })
    return Array.from(cols)
  }, [rows, extraColumns])

  function addDynamicColumn() {
    const name = newColName.trim()
    if (!name) return
    if (!extraColumns.includes(name)) {
      setExtraColumns([...extraColumns, name])
    }
    setNewColName('')
  }

  function asPlainRows() {
    if (!rows.length) return []
    return rows.map((r, index) => {
      const base = {
        'S.No': index + 1,
        Title: r.title ?? '',
        'Husband Name': r.husbandName ?? '',
        'Wife Name': r.wifeName ?? '',
      }
      allColumns.forEach(col => {
        base[col] = r.dynamicData?.[col] ?? ''
      })
      base.Amount = Number(r.amount ?? 0)
      base['Total Amount'] = Number(r.totalAmount ?? 0)
      return base
    })
  }

  function openExportModal(type) {
    const baseColumns = ['S.No', 'Title', 'Husband Name', 'Wife Name', ...allColumns, 'Amount', 'Total Amount']
    setExportType(type)
    setExportConfig({
      title: 'User Management Records',
      rangeSelection: 'all',
      fromRow: 1,
      toRow: rows.length || 1,
      selectedColumns: baseColumns,
    })
    setExportModalOpen(true)
  }

  function handleExport() {
    let exportRows = rows

    if (exportConfig.rangeSelection === 'custom') {
      const fromIndices = Math.max(0, exportConfig.fromRow - 1)
      const toIndices = Math.min(rows.length, exportConfig.toRow)
      exportRows = rows.slice(fromIndices, toIndices)
    }

    if (!exportRows.length) {
      alert('No records to export in the selected range.')
      return
    }

    const plain = exportRows.map((r, index) => {
      const base = {
        'S.No': exportConfig.rangeSelection === 'custom' ? exportConfig.fromRow + index : index + 1,
        Title: r.title ?? '',
        'Husband Name': r.husbandName ?? '',
        'Wife Name': r.wifeName ?? '',
      }
      allColumns.forEach(col => {
        base[col] = r.dynamicData?.[col] ?? ''
      })
      base.Amount = Number(r.amount ?? 0)
      base['Total Amount'] = Number(r.totalAmount ?? 0)

      const filteredBase = {}
      exportConfig.selectedColumns.forEach(col => {
        if (base[col] !== undefined) {
          filteredBase[col] = base[col]
        }
      })
      return filteredBase
    })

    const sumAmount = exportRows.reduce((s, r) => s + (Number(r.amount ?? 0) || 0), 0)
    const finalTotalAmount = exportRows.reduce((s, r) => s + (Number(r.totalAmount ?? 0) || 0), 0)

    if (exportType === 'excel') {
      const wb = XLSX.utils.book_new()

      const ws = XLSX.utils.json_to_sheet([])

      // Add custom title in A1
      XLSX.utils.sheet_add_aoa(ws, [[exportConfig.title]], { origin: 'A1' })

      // Add records starting at A2
      XLSX.utils.sheet_add_json(ws, plain, { origin: 'A2' })

      const headers = Object.keys(plain[0] || {})

      if (exportConfig.selectedColumns.includes('Amount') || exportConfig.selectedColumns.includes('Total Amount')) {
        const sumRow = []
        const finalRow = []

        headers.forEach(h => {
          if (h === 'Amount') {
            sumRow.push(sumAmount)
            finalRow.push('')
          } else if (h === 'Total Amount') {
            sumRow.push('')
            finalRow.push(finalTotalAmount)
          } else if (sumRow.length === Math.max(0, headers.indexOf('Amount') - 1) && exportConfig.selectedColumns.includes('Amount')) {
            sumRow.push('Total Amount (Sum)')
            finalRow.push('Final Total Amount')
          }
          else {
            sumRow.push('')
            finalRow.push('')
          }
        })

        if (!sumRow.includes('Total Amount (Sum)')) {
          const idx = Math.max(0, headers.length - 2)
          sumRow[idx] = 'Total Amount (Sum)'
          finalRow[idx] = 'Final Total Amount'
        }

        XLSX.utils.sheet_add_aoa(
          ws,
          [[], sumRow, finalRow],
          { origin: -1 },
        )
      }

      // Merge title row
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, headers.length - 1) } });

      XLSX.utils.book_append_sheet(wb, ws, 'Records')
      XLSX.writeFile(wb, `${exportConfig.title || 'records'}.xlsx`)

    } else if (exportType === 'word') {
      const header = Object.keys(plain[0] || {})
      const footerStyle = 'border:1px solid #0f172a;padding:8px 10px;font-size:11px;font-weight:bold;background:#e2e8f0;text-align:right;'
      const footerLabelStyle = 'border:1px solid #0f172a;padding:8px 10px;font-size:11px;font-weight:bold;background:#e2e8f0;text-align:right;'

      const htmlRows = [
        `<tr>${header.map(h => `<th style="border:1px solid #cbd5e1;padding:6px 10px;text-align:left;background:#0f172a;color:#f8fafc;font-size:11px;">${h}</th>`).join('')}</tr>`,
        ...plain.map(r => `<tr>${header.map(h => {
          const val = (h === 'Amount' || h === 'Total Amount') ? toMoney(r[h]) : r[h];
          const align = (h === 'Amount' || h === 'Total Amount') ? 'right' : 'left';
          return `<td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:11px;text-align:${align};">${val}</td>`;
        }).join('')}</tr>`),
      ]

      if (exportConfig.selectedColumns.includes('Amount') || exportConfig.selectedColumns.includes('Total Amount')) {
        const hasAmount = exportConfig.selectedColumns.includes('Amount')
        const hasTotal = exportConfig.selectedColumns.includes('Total Amount')

        const sumCols = []
        const finalCols = []

        let sumSet = false

        header.forEach((h, i) => {
          if (h === 'Amount') {
            sumCols.push(`<td style="${footerStyle}">${toMoney(sumAmount)}</td>`)
            finalCols.push(`<td style="${footerStyle}"></td>`)
            sumSet = true
          } else if (h === 'Total Amount') {
            sumCols.push(`<td style="${footerStyle}"></td>`)
            finalCols.push(`<td style="${footerStyle}">${toMoney(finalTotalAmount)}</td>`)
            sumSet = true
          } else if (!sumSet && i === header.length - (hasAmount ? 2 : 1) - (hasTotal ? 1 : 0)) {
            sumCols.push(`<td style="${footerLabelStyle}">Total Amount (Sum)</td>`)
            finalCols.push(`<td style="${footerLabelStyle}">Final Total Amount</td>`)
            sumSet = true
          } else {
            sumCols.push(`<td style="${footerStyle}"></td>`)
            finalCols.push(`<td style="${footerStyle}"></td>`)
          }
        })

        htmlRows.push(`<tr>${sumCols.join('')}</tr>`)
        htmlRows.push(`<tr>${finalCols.join('')}</tr>`)
      }

      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8" />
            <title>${exportConfig.title}</title>
          </head>
          <body>
            <h2>${exportConfig.title}</h2>
            <table style="border-collapse:collapse;margin-top:12px;">
              ${htmlRows.join('')}
            </table>
          </body>
        </html>`

      const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportConfig.title || 'records'}.doc`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }

    setExportModalOpen(false)
  }

  async function refresh() {
    setError('')
    setLoading(true)
    try {
      const data = await listRecords()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const modalTitle = useMemo(() => {
    if (editing?.id) return `Edit Record (S.No ${editing.id})`
    return 'Add Record'
  }, [editing])

  const totals = useMemo(() => {
    let sumAmount = 0
    let sumTotalAmount = 0
    for (const r of rows) {
      sumAmount += Number(r.amount ?? 0) || 0
      sumTotalAmount += Number(r.totalAmount ?? 0) || 0
    }
    return {
      sumAmount,
      sumTotalAmount,
      finalTotalAmount: sumTotalAmount,
    }
  }, [rows])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  function openEdit(record) {
    setEditing(record)
    setDraft({
      title: record?.title ?? '',
      husbandName: record?.husbandName ?? '',
      wifeName: record?.wifeName ?? '',
      amount: record?.amount ?? '',
      totalAmount: record?.totalAmount ?? '',
      dynamicData: record?.dynamicData ?? {},
    })
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      title: String(draft.title || '').trim(),
      husbandName: String(draft.husbandName || '').trim(),
      wifeName: String(draft.wifeName || '').trim(),
      amount: draft.amount === '' ? null : Number(draft.amount),
      totalAmount: draft.totalAmount === '' ? null : Number(draft.totalAmount),
      dynamicData: draft.dynamicData || {},
    }

    if (!payload.husbandName || !payload.wifeName) {
      setError('Husband Name and Wife Name are required.')
      return
    }
    if (
      payload.amount === null ||
      Number.isNaN(payload.amount) ||
      payload.totalAmount === null ||
      Number.isNaN(payload.totalAmount)
    ) {
      setError('Amount and Total Amount must be valid numbers.')
      return
    }

    setSaving(true)
    try {
      if (editing?.id) {
        await updateRecord(editing.id, payload)
      } else {
        await createRecord(payload)
      }
      setModalOpen(false)
      await refresh()
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id) {
    const ok = window.confirm(`Delete record S.No ${id}?`)
    if (!ok) return

    setError('')
    try {
      await deleteRecord(id)
      await refresh()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-violet-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <input
            className="text-xl font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-violet-500 rounded px-2 w-[350px]"
            value={exportConfig.title}
            onChange={(e) => setExportConfig(c => ({ ...c, title: e.target.value }))}
            placeholder="Dashboard Title"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md"
              type="button"
              onClick={() => openExportModal('excel')}
            >
              <span className="text-xs">⬇</span>
              <span>Export Excel</span>
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-md"
              type="button"
              onClick={() => openExportModal('word')}
            >
              <span className="text-xs">⬇</span>
              <span>Export Word</span>
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
              onClick={refresh}
              disabled={loading}
            >
              <span className="text-base" aria-hidden>↻</span>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/40 active:translate-y-0"
              onClick={openCreate}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-base leading-none">+</span>
              Add Details
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-200/60 transition hover:shadow-md" style={{ animationDelay: '0ms' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Amount (Sum)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                {toMoney(totals.sumAmount)}
              </p>
            </div>
            <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 shadow-sm ring-1 ring-emerald-200/60 transition hover:shadow-md" style={{ animationDelay: '80ms' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Final Total Amount
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                {toMoney(totals.finalTotalAmount)}
              </p>
            </div>
            <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-sm ring-1 ring-slate-200/60 sm:col-span-2 lg:col-span-1" style={{ animationDelay: '160ms' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Records
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                {rows.length}
              </p>
            </div>
          </div>
        ) : null}

        {rows.length === 0 && !loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-16 shadow-sm ring-1 ring-slate-200/60">
            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-slate-800">No records yet</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
              Get started by adding your first record. Click the button below to add details.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/40"
              onClick={openCreate}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-base leading-none">+</span>
              Add Details
            </button>
          </div>
        ) : rows.length === 0 && loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-16 shadow-sm ring-1 ring-slate-200/60">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-600">Loading records…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-md ring-1 ring-slate-200/60 transition hover:shadow-lg hover:ring-slate-300/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Husband Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Wife Name
                    </th>
                    {allColumns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {
                    rows.map((r, index) => (
                      <tr
                        key={r.id ?? index}
                        className="transition-colors hover:bg-sky-50/80"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {r.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {r.husbandName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {r.wifeName}
                        </td>
                        {allColumns.map((col) => (
                          <td key={col} className="px-4 py-3 text-sm text-slate-700">
                            {r.dynamicData?.[col] ?? ''}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                          {toMoney(r.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                          {toMoney(r.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <button
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                              onClick={() => onDelete(r.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {rows.length > 0 ? (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100/90">
                    <tr>
                      <td
                        colSpan={4 + allColumns.length}
                        className="px-4 py-3 text-right text-sm font-semibold text-slate-700"
                      >
                        Final Total Amount
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-800">
                        {toMoney(totals.sumAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-emerald-800">
                        {toMoney(totals.finalTotalAmount)}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal
        title={modalTitle}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-violet-500" />
              Name details
            </h3>
            <div className="mb-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Title
                </span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Mr. / Mrs. / etc."
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Husband Name
                </span>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    value={draft.husbandName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, husbandName: e.target.value }))
                    }
                    placeholder="English or Tamil"
                    required
                  />
                  <div className="flex gap-2 sm:shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-amber-600 hover:shadow"
                      title="Convert to Tamil"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          husbandName: englishToTamil(d.husbandName) || d.husbandName,
                        }))
                      }
                    >
                      <span className="text-sm">த</span>
                      Tamil
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-400 bg-slate-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-700 hover:shadow"
                      title="Convert to English"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          husbandName: isMostlyTamil(d.husbandName)
                            ? tamilToEnglish(d.husbandName)
                            : d.husbandName,
                        }))
                      }
                    >
                      <span className="text-sm">A</span>
                      English
                    </button>
                  </div>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Wife Name
                </span>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    value={draft.wifeName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, wifeName: e.target.value }))
                    }
                    placeholder="English or Tamil"
                    required
                  />
                  <div className="flex gap-2 sm:shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-amber-600 hover:shadow"
                      title="Convert to Tamil"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          wifeName: englishToTamil(d.wifeName) || d.wifeName,
                        }))
                      }
                    >
                      <span className="text-sm">த</span>
                      Tamil
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-400 bg-slate-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-700 hover:shadow"
                      title="Convert to English"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          wifeName: isMostlyTamil(d.wifeName)
                            ? tamilToEnglish(d.wifeName)
                            : d.wifeName,
                        }))
                      }
                    >
                      <span className="text-sm">A</span>
                      English
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-violet-500" />
              Amount details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Amount</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm tabular-nums outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Total Amount
                </span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm tabular-nums outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  value={draft.totalAmount}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, totalAmount: e.target.value }))
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  required
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-violet-500" />
              Dynamic Fields
            </h3>
            <div className="mb-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="New Column Name"
              />
              <button
                type="button"
                className="rounded-xl border border-violet-200 bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-200"
                onClick={addDynamicColumn}
              >
                Add Column
              </button>
            </div>
            {allColumns.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {allColumns.map((col) => (
                  <label key={col} className="block">
                    <span className="text-sm font-medium text-slate-700">{col}</span>
                    <input
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                      value={draft.dynamicData?.[col] || ''}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          dynamicData: { ...d.dynamicData, [col]: e.target.value },
                        }))
                      }
                      placeholder="..."
                    />
                  </label>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl disabled:opacity-60"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title={`Export to ${exportType === 'excel' ? 'Excel' : 'Word'}`}
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Report Detail
            </h3>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Document Title</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                value={exportConfig.title}
                onChange={(e) => setExportConfig(c => ({ ...c, title: e.target.value }))}
                placeholder="Title..."
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Rows to Export
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rangeSelection"
                  value="all"
                  checked={exportConfig.rangeSelection === 'all'}
                  onChange={() => setExportConfig(c => ({ ...c, rangeSelection: 'all' }))}
                  className="text-emerald-500"
                />
                <span className="text-sm text-slate-700">All Rows</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rangeSelection"
                  value="custom"
                  checked={exportConfig.rangeSelection === 'custom'}
                  onChange={() => setExportConfig(c => ({ ...c, rangeSelection: 'custom' }))}
                  className="text-emerald-500"
                />
                <span className="text-sm text-slate-700">Custom Range</span>
              </label>
            </div>

            {exportConfig.rangeSelection === 'custom' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">From Row</span>
                  <input
                    type="number"
                    min="1"
                    max={rows.length}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    value={exportConfig.fromRow}
                    onChange={(e) => setExportConfig(c => ({ ...c, fromRow: parseInt(e.target.value) || 1 }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">To Row</span>
                  <input
                    type="number"
                    min="1"
                    max={rows.length}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    value={exportConfig.toRow}
                    onChange={(e) => setExportConfig(c => ({ ...c, toRow: parseInt(e.target.value) || 1 }))}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Columns to Export
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {['S.No', 'Title', 'Husband Name', 'Wife Name', ...allColumns, 'Amount', 'Total Amount'].map(col => (
                <label key={col} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportConfig.selectedColumns.includes(col)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExportConfig(c => ({ ...c, selectedColumns: [...c.selectedColumns, col] }))
                      } else {
                        setExportConfig(c => ({ ...c, selectedColumns: c.selectedColumns.filter(x => x !== col) }))
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">{col}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
              onClick={() => setExportModalOpen(false)}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl"
            >
              Export
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
