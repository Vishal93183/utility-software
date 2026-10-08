import Icon from './Icon.jsx'

export default function BuilderPanel({ form, setForm, onSend, onClear, sending, errors }) {
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const isWrite = form.opType === 'WRITE'

  return (
    <section className="card builder-card" id="request-builder">
      <div className="card-head">
        <h2><Icon name="code" size={28} /> Request Builder</h2>
        <button className="btn-soft" onClick={onClear}>
          <Icon name="refresh" size={18} /> Clear
        </button>
      </div>

      <div className="form">
        <label>
          Message ID
          <input value={form.messageId} onChange={set('messageId')} placeholder="device/naineet/res" />
          {errors.messageId && <small className="field-error">{errors.messageId}</small>}
        </label>

        <label>
          Operation Type
          <div className="select-wrap">
            <select value={form.opType} onChange={set('opType')}>
              <option value="READ">READ</option>
              <option value="WRITE">WRITE</option>
            </select>
            <Icon name="chevron" size={18} />
          </div>
          {errors.opType && <small className="field-error">{errors.opType}</small>}
        </label>

        <label>
          Meter ID
          <input type="number" min="1" value={form.meterId} onChange={set('meterId')} placeholder="2" />
          {errors.meterId && <small className="field-error">{errors.meterId}</small>}
        </label>

        <label>
          IP Address
          <input value={form.ipAddress} onChange={set('ipAddress')} placeholder="192.168.1.100:100" />
          {errors.ipAddress && <small className="field-error">{errors.ipAddress}</small>}
        </label>

        {isWrite && (
          <fieldset className="write-box">
            <legend>Values to update (optional)</legend>
            <div className="write-grid">
              <label>Meter Type ID<input type="number" value={form.meterTypeId} onChange={set('meterTypeId')} /></label>
              <label>Reading (kWh)<input type="number" step="any" value={form.reading} onChange={set('reading')} /></label>
              <label>Voltage (V)<input type="number" step="any" value={form.voltage} onChange={set('voltage')} /></label>
              <label>Current (A)<input type="number" step="any" value={form.current} onChange={set('current')} /></label>
              <label>Power (W)<input type="number" step="any" value={form.power} onChange={set('power')} /></label>
            </div>
          </fieldset>
        )}

        <button className="btn-primary" onClick={onSend} disabled={sending}>
          <Icon name="send" size={20} /> {sending ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </section>
  )
}
