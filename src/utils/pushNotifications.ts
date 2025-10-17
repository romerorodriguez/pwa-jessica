// src/utils/pushNotifications.ts - CORREGIDO
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Convertir clave base64 a Uint8Array - CORREGIDO
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Definir tipo para PushSubscription JSON
interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Solicitar permisos y suscribir al usuario
export async function subscribeToPushNotifications(): Promise<PushSubscriptionJSON | null> {
  try {
    // Verificar si el navegador soporta notificaciones push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('❌ Notificaciones push no soportadas');
      return null;
    }

    // Solicitar permiso para notificaciones
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ Permiso de notificaciones denegado');
      return null;
    }

    // Obtener el service worker registration
    const registration = await navigator.serviceWorker.ready;
    // Suscribir al usuario - CORREGIDO
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Usuario suscrito a notificaciones push:', subscription);
    
    // Convertir a JSON para almacenar
    const subscriptionJSON: PushSubscriptionJSON = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      }
    };
    // Guardar la suscripción
    localStorage.setItem('push-subscription', JSON.stringify(subscriptionJSON));
    return subscriptionJSON;
  } catch (error) {
    console.error('❌ Error suscribiendo a notificaciones push:', error);
    return null;
  }
}

// Verificar si el usuario ya está suscrito - CORREGIDO
export async function getPushSubscription(): Promise<PushSubscriptionJSON | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return null;
    }
    // Convertir a JSON
    const subscriptionJSON: PushSubscriptionJSON = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      }
    };
    return subscriptionJSON;
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    return null;
  }
}

// Cancelar suscripción - CORREGIDO
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem('push-subscription');
      console.log('✅ Usuario desuscrito de notificaciones push');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error desuscribiendo:', error);
    return false;
  }
}

// Enviar notificación de prueba (simulación) - CORREGIDO
export async function sendTestNotification(): Promise<void> {
  const subscription = await getPushSubscription();
  
  if (!subscription) {
    alert('Primero debes activar las notificaciones push');
    return;
  }

  console.log('📤 Datos para enviar notificación de prueba:');
  console.log('Endpoint:', subscription.endpoint);
  console.log('Keys:', subscription.keys);
  
  alert(`Notificación de prueba configurada. En un entorno real, enviarías:\n\nEndpoint: ${subscription.endpoint}\n\nUsa https://web-push-codelab.glitch.me/ para pruebas.`);
}

// Verificar el estado de las notificaciones - CORREGIDO
export async function checkNotificationStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window;
  const permission = Notification.permission;
  
  // Verificar suscripción de manera más simple
  let subscribed = false;
  if (supported) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      subscribed = !!subscription;
    } catch (error) {
      console.error('Error verificando suscripción:', error);
    }
  }

  return {
    supported,
    permission,
    subscribed
  };
}