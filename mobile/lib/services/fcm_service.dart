import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

// Background handler — top-level, minimal work
@pragma('vm:entry-point')
Future<void> _bgHandler(RemoteMessage message) async {}

class FCMService {
  FCMService._();
  static final FCMService instance = FCMService._();

  final _messaging = FirebaseMessaging.instance;
  final _local = FlutterLocalNotificationsPlugin();

  static const _channelId = 'adausta_kanal';
  static const _channelName = 'AdaUsta Bildirimleri';

  Map<String, dynamic>? _pendingRoute;

  // Returns and clears pending deep-link route (called by navigation layer)
  Map<String, dynamic>? consumePendingRoute() {
    final r = _pendingRoute;
    _pendingRoute = null;
    return r;
  }

  Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(_bgHandler);

    await _messaging.requestPermission(alert: true, badge: true, sound: true);

    // Local notification channel (Android 8+)
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _local.initialize(
      const InitializationSettings(android: androidInit),
      onDidReceiveNotificationResponse: _onTap,
    );
    await _local
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          _channelId,
          _channelName,
          description: 'AdaUsta uygulama bildirimleri',
          importance: Importance.high,
        ));

    // Foreground message display
    FirebaseMessaging.onMessage.listen(_onForeground);

    // Opened from background
    FirebaseMessaging.onMessageOpenedApp.listen((msg) => _routeFromData(msg.data));

    // Opened from terminated state
    final initial = await _messaging.getInitialMessage();
    if (initial != null) _routeFromData(initial.data);

    // Auto-refresh token
    _messaging.onTokenRefresh.listen(_refreshToken);

    // Debug: log token on app start (debug builds only)
    if (kDebugMode) {
      try {
        final token = await _messaging.getToken();
        if (token != null) {
          debugPrint('FCM_TEST_TOKEN=$token');
        } else {
          debugPrint('FCM_TEST_TOKEN=NULL — initialize sirasinda token alinamadi');
        }
      } catch (e) {
        debugPrint('FCM_TEST_TOKEN_ERROR=$e');
      }
    }
  }

  void _onForeground(RemoteMessage msg) {
    final n = msg.notification;
    if (n == null) return;
    _local.show(
      n.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId, _channelName,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: json.encode(msg.data),
    );
  }

  void _onTap(NotificationResponse r) {
    try {
      _routeFromData(json.decode(r.payload ?? '{}') as Map<String, dynamic>);
    } catch (_) {}
  }

  void _routeFromData(Map<String, dynamic> data) {
    if (data['ekran'] != null) {
      _pendingRoute = Map<String, dynamic>.from(data);
    }
  }

  // Called from ApiService after successful login
  Future<void> tokenKaydet(String sessionCookie) async {
    try {
      final token = await _messaging.getToken();
      if (kDebugMode) {
        if (token != null) {
          debugPrint('FCM_TEST_TOKEN=$token');
        } else {
          debugPrint('FCM_TEST_TOKEN=NULL — token alinamadi');
        }
      }
      if (token == null) return;

      final prefs = await SharedPreferences.getInstance();
      final old = prefs.getString('fcm_token');
      if (old == token) return; // no change

      await http
          .post(
            Uri.parse(ApiConfig.fcmToken),
            headers: {
              'Content-Type': 'application/json',
              'Cookie': sessionCookie,
            },
            body: json.encode({'token': token, 'platform': 'android'}),
          )
          .timeout(const Duration(seconds: 10));

      await prefs.setString('fcm_token', token);
    } catch (_) {}
  }

  // Called from ApiService before logout
  Future<void> tokenSil(String sessionCookie) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('fcm_token');
      if (token == null) return;

      await http
          .delete(
            Uri.parse(ApiConfig.fcmToken),
            headers: {
              'Content-Type': 'application/json',
              'Cookie': sessionCookie,
            },
            body: json.encode({'token': token}),
          )
          .timeout(const Duration(seconds: 5));

      await prefs.remove('fcm_token');
      await _messaging.deleteToken();
    } catch (_) {}
  }

  Future<void> _refreshToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cookie = prefs.getString('session_cookie');
      if (cookie == null) return;
      await prefs.remove('fcm_token'); // force re-send
      await tokenKaydet(cookie);
    } catch (_) {}
  }
}
