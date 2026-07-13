import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return android;
    }
    throw UnsupportedError('Bu platform için Firebase seçenekleri tanımlı değil.');
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBz4vsA4SDK1RY_dv83PJx4crSjmra2JGo',
    appId: '1:396631375701:android:8ffdbb02d51f89603339dc',
    messagingSenderId: '396631375701',
    projectId: 'adausta-33166',
    storageBucket: 'adausta-33166.firebasestorage.app',
  );
}
