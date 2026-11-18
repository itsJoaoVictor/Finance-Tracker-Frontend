self.addEventListener('push', function (event) {
  let payload = { title: 'Finance Tracker - Contas a Pagar', body: 'Você tem contas próximas do vencimento.' }
  if (event.data) {
    try {
      payload = event.data.json()
    } catch (e) {
      payload.body = event.data.text()
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Finance Tracker', {
      body: payload.body,
      icon: '/assets/images/favicon.ico',
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/contas-pagar'))
})
