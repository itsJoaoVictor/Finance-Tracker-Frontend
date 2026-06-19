interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const DEFAULT_COLORS = [
  '#f05a3c', // Cor padrão laranja/coral do app
  '#8A05BE', // Roxo/Nubank
  '#FFC107', // Amarelo/XP
  '#00AD30', // Verde/PicPay
  '#2C90FC', // Azul/Mercado Pago
  '#1C1A17', // Grafite Escuro
  '#E63946', // Vermelho Coral
  '#457B9D', // Azul Aço
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {DEFAULT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className="color-picker-badge"
            style={{
              background: c,
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: color === c ? '2px solid var(--ink)' : '2px solid transparent',
              cursor: 'pointer',
              boxShadow: color === c ? '0 0 6px rgba(0,0,0,0.2)' : 'none',
              transition: 'border 0.1s',
            }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
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
    </div>
  )
}
