import os
import logging

logger = logging.getLogger(__name__)
_firebase_app = None


def _get_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        sa_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT', '')
        if not sa_path or not os.path.exists(sa_path):
            logger.warning('FCM: FIREBASE_SERVICE_ACCOUNT yolu bulunamadi — bildirimler devre disi')
            return None
        cred = credentials.Certificate(sa_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info('FCM: Firebase Admin SDK baslatildi')
        return _firebase_app
    except Exception as e:
        logger.error(f'FCM init hatasi: {e}')
        return None


def bildirim_gonder(token: str, baslik: str, icerik: str, data: dict = None) -> bool:
    try:
        if _get_app() is None:
            return False
        from firebase_admin import messaging
        msg = messaging.Message(
            notification=messaging.Notification(title=baslik, body=icerik),
            data={str(k): str(v) for k, v in (data or {}).items()},
            android=messaging.AndroidConfig(priority='high'),
            token=token,
        )
        messaging.send(msg)
        return True
    except Exception as e:
        logger.error(f'FCM bildirim gonderme hatasi: {e}')
        return False


def toplu_bildirim_gonder(tokenlar: list, baslik: str, icerik: str, data: dict = None) -> dict:
    bos = {'basarili': 0, 'basarisiz': 0, 'gecersiz': []}
    if not tokenlar:
        return bos
    try:
        if _get_app() is None:
            return {**bos, 'basarisiz': len(tokenlar)}
        from firebase_admin import messaging
        msgs = [
            messaging.Message(
                notification=messaging.Notification(title=baslik, body=icerik),
                data={str(k): str(v) for k, v in (data or {}).items()},
                android=messaging.AndroidConfig(priority='high'),
                token=t,
            )
            for t in tokenlar
        ]
        batch = messaging.send_each(msgs)
        gecersiz = []
        for i, r in enumerate(batch.responses):
            if not r.success and r.exception:
                err = str(r.exception)
                if 'registration-token-not-registered' in err or 'invalid-argument' in err:
                    gecersiz.append(tokenlar[i])
        return {
            'basarili': batch.success_count,
            'basarisiz': batch.failure_count,
            'gecersiz': gecersiz,
        }
    except Exception as e:
        logger.error(f'FCM toplu gonderme hatasi: {e}')
        return {**bos, 'basarisiz': len(tokenlar)}
