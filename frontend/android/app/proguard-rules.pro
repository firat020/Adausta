# Capacitor WebView JS bridge — obfuscate edilmemeli
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor core
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Cordova plugins (Capacitor compat layer)
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Gson (JSON serialization)
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }

# Stack trace için satır numarası koru
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
