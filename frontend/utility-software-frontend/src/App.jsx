import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './lib/api.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import BuilderPanel from './components/BuilderPanel.jsx'
import ResponsePanel from './components/ResponsePanel.jsx'
import DataPanel from './components/DataPanel.jsx'

const DEFAULT_FORM = {
  messageId: 'device/naineet/res',
  opType: 'READ',
  meterId: '2',
  ipAddress: '192.168.1.100:100',
  meterTypeId: '',
  reading: '',
  voltage: '',
  current: '',
  power: '',
}

const EMPTY_FORM = { ...DEFAULT_FORM, messageId: '', meterId: '', ipAddress: '' }
const POLL_MS = 5000

function buildPayload(f) {
  const payload = {
    messageId: f.messageId.trim(),
    opType: f.opType,
    meterId: f.meterId === '' ? null : Number(f.meterId),
    ipAddress: f.ipAddress.trim(),
  }
  if (f.opType === 'WRITE') {
    if (f.meterTypeId !== '') payload.meterTypeId = Number(f.meterTypeId)
    const data = {}
    ;['reading', 'voltage', 'current', 'power'].forEach((k) => {
      if (f[k] !== '') data[k] = Number(f[k])
    })
    if (Object.keys(data).length) payload.data = data
  }
  return payload
}

export default function App() {
  const [active, setActive] = useState('home')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [response, setResponse] = useState(null)
  const [responseIsError, setResponseIsError] = useState(false)
  const [meters, setMeters] = useState([])
  const [dataError, setDataError] = useState('')
  const [live, setLive] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.getHistory())
    } catch (e) {
      showToast(e.message)
    }
  }, [])

  const loadMeters = useCallback(async () => {
    try {
      setMeters(await api.getMeters())
      setDataError('')
    } catch (e) {
      setDataError(e.message)
    }
  }, [])

  // first load
  useEffect(() => {
    loadHistory()
    loadMeters()
  }, [loadHistory, loadMeters])

  // live polling
  useEffect(() => {
    if (!live) return
    const id = setInterval(loadMeters, POLL_MS)
    return () => clearInterval(id)
  }, [live, loadMeters])

  const handleSend = async () => {
    setErrors({})
    setSending(true)
    try {
      const res = await api.sendRequest(buildPayload(form))
      setResponse(res)
      setResponseIsError(!res.ipStatus)
      setSelectedId(null)
      loadMeters()
    } catch (e) {
      setResponse(e.body ?? { status: e.status, message: e.message })
      setResponseIsError(true)
      if (e.fieldErrors) setErrors(e.fieldErrors)
    } finally {
      setSending(false)
      loadHistory()
    }
  }

  const handleClear = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setResponse(null)
    setResponseIsError(false)
    setSelectedId(null)
  }

  const handleSelectHistory = async (id) => {
    try {
      const item = await api.getHistoryItem(id)
      setSelectedId(id)
      if (item.requestJson) {
        const r = JSON.parse(item.requestJson)
        setForm({
          ...EMPTY_FORM,
          messageId: r.messageId ?? '',
          opType: r.opType ?? 'READ',
          meterId: r.meterId != null ? String(r.meterId) : '',
          ipAddress: r.ipAddress ?? '',
          meterTypeId: r.meterTypeId != null ? String(r.meterTypeId) : '',
          reading: r.data?.reading != null ? String(r.data.reading) : '',
          voltage: r.data?.voltage != null ? String(r.data.voltage) : '',
          current: r.data?.current != null ? String(r.data.current) : '',
          power: r.data?.power != null ? String(r.data.power) : '',
        })
      }
      if (item.responseJson) {
        setResponse(JSON.parse(item.responseJson))
        setResponseIsError(!item.success)
      } else {
        setResponse({ message: 'This request failed and has no response body.' })
        setResponseIsError(true)
      }
      setErrors({})
    } catch (e) {
      showToast(e.message)
    }
  }

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteHistory(id)
      if (selectedId === id) setSelectedId(null)
      loadHistory()
    } catch (e) {
      showToast(e.message)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      setMeters(await api.refreshMeters())
      setDataError('')
    } catch (e) {
      setDataError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  const handleNavigate = (key) => {
    setActive(key)
    const target = {
      home: 'top',
      'request-builder': 'request-builder',
      'data-view': 'data-view',
      'meter-reading': 'data-view',
    }[key]
    if (target === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app">
      <Sidebar active={active} onNavigate={handleNavigate} />
      <div className="main">
        <Topbar />
        <main className="content">
          <div className="top-grid">
            <HistoryPanel
              items={history}
              selectedId={selectedId}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
            />
            <BuilderPanel
              form={form}
              setForm={setForm}
              onSend={handleSend}
              onClear={handleClear}
              sending={sending}
              errors={errors}
            />
            <ResponsePanel response={response} isError={responseIsError} />
          </div>

          <DataPanel
            meters={meters}
            live={live}
            onToggleLive={() => setLive((v) => !v)}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            error={dataError}
          />
        </main>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
