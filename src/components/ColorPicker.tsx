interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker-container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        className="color-preview"
        style={{
          background: color,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: 'none', background: 'none', cursor: 'pointer', width: 48, height: 28 }}
      />
      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
        {color.toUpperCase()}
      </span>
    </div>
  )
}
