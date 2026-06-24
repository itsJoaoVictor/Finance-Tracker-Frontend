import { useState } from 'react'
import { Download, FileText, Table } from 'lucide-react'

interface ExportarDropdownProps {
  onExportar: (formato: 'pdf' | 'csv') => void
  loading: boolean
}

export function ExportarDropdown({ onExportar, loading }: ExportarDropdownProps) {
  const [open, setOpen] = useState(false)

  const handleClick = (formato: 'pdf' | 'csv') => {
    setOpen(false)
    onExportar(formato)
  }

  return (
    <div className="exportar-dropdown">
      <button
        className="exportar-dropdown__btn"
        disabled={loading}
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      >
        <Download size={16} />
        {loading ? 'Exportando...' : 'Exportar'}
      </button>
      {open && !loading && (
        <div className="exportar-dropdown__menu">
          <button
            className="exportar-dropdown__item"
            onClick={() => handleClick('pdf')}
          >
            <FileText size={16} />
            Baixar PDF
          </button>
          <button
            className="exportar-dropdown__item"
            onClick={() => handleClick('csv')}
          >
            <Table size={16} />
            Baixar CSV
          </button>
        </div>
      )}
    </div>
  )
}
