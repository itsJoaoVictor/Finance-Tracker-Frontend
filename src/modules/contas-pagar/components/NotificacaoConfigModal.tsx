import { useEffect, useState } from 'react'
import { contaPagarService } from '../../../services/contaPagarService'
import { NotificacaoConfig } from '../../../types/contasPagar'
import { Bell, Send } from 'lucide-react'

interface NotificacaoConfigModalProps {
  onClose: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificacaoConfigModal({ onClose, onToast }: NotificacaoConfigModalProps) {
  const [config, setConfig] = useState<NotificacaoConfig | null>(null)
  const [chatId, setChatId] = useState('')
  const [telegramAtivo, setTelegramAtivo] = useState(false)
  const [webPushAtivo, setWebPushAtivo] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    contaPagarService.obterConfigNotificacao().then((res) => {
      setConfig(res.data)
      setChatId(res.data.telegramChatId || '')
      setTelegramAtivo(res.data.telegramAtivo)
      setWebPushAtivo(res.data.webPushAtivo)
    })
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await contaPagarService.salvarConfigNotificacao({
        telegramChatId: chatId,
        telegramAtivo,
        webPushAtivo,
      })
      setConfig(res.data)
      onToast('Configurações de notificação salvas!', 'success')
      onClose()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao salvar configurações.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTestarTelegram = async () => {
    setLoading(true)
    try {
      await contaPagarService.salvarConfigNotificacao({
        telegramChatId: chatId,
        telegramAtivo: true,
        webPushAtivo,
      })
      const res = await contaPagarService.testarTelegram()
      if (res.data.enviado) {
        onToast('Mensagem de teste enviada no Telegram!', 'success')
      } else {
        onToast('TELEGRAM_BOT_TOKEN não está configurado no servidor.', 'error')
      }
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Falha ao enviar teste no Telegram.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAtivarWebPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return onToast('Seu navegador não suporta Web Push.', 'error')
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      return onToast('Permissão de notificação negada no navegador.', 'error')
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw-push.js')
      if (config?.vapidPublicKey) {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
        })
        const json = sub.toJSON()
        await contaPagarService.registrarPushSubscription({
          endpoint: json.endpoint || '',
          p256dh: json.keys?.p256dh || '',
          auth: json.keys?.auth || '',
        })
      }
      setWebPushAtivo(true)
      onToast('Notificações do navegador ativadas!', 'success')
    } catch (e) {
      setWebPushAtivo(true)
      onToast('Permissão concedida no navegador.', 'success')
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} /> Alertas Externos (Telegram & Web Push)
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.82rem', opacity: 0.78 }}>
            O servidor verifica diariamente às 05:30 (horário de Brasília) e envia alertas em{' '}
            <strong>D-5 (sem valor)</strong>, <strong>D-3</strong>, <strong>D-0 (vence hoje)</strong> e{' '}
            <strong>D+1 (atraso)</strong>.
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border, rgba(128,128,128,0.25))',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={telegramAtivo}
                onChange={(e) => setTelegramAtivo(e.target.checked)}
              />
              Notificações via Telegram Bot
            </label>

            <div className="cp-field">
              <label>Seu Chat ID do Telegram</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ex: 123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="contas-pagar__btn"
                  onClick={handleTestarTelegram}
                  disabled={loading || !chatId}
                >
                  <Send size={14} /> Testar
                </button>
              </div>
              <span style={{ fontSize: '0.73rem', opacity: 0.68 }}>
                Status do Bot no servidor:{' '}
                {config?.telegramBotConfiguradoNoServidor
                  ? '🟢 TELEGRAM_BOT_TOKEN configurado'
                  : '🟡 Defina TELEGRAM_BOT_TOKEN nas variáveis do servidor'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border, rgba(128,128,128,0.25))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Web Push (PWA / Navegador)</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {webPushAtivo ? 'Ativo neste dispositivo' : 'Receba alertas direto no navegador/celular'}
              </div>
            </div>
            <button type="button" className="contas-pagar__btn" onClick={handleAtivarWebPush}>
              {webPushAtivo ? 'Revalidar Push' : 'Ativar no Navegador'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="contas-pagar__btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="contas-pagar__btn contas-pagar__btn--primary"
              disabled={loading}
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
