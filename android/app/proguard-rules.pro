# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in getDefaultProguardFile("proguard-android-optimize.txt")

# 1. React Native Core & JNI
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }

# 2. SQLite Storage
-keep class org.pgsqlite.** { *; }

# 3. Reanimated, Gesture Handler & Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.worklets.** { *; }

# 4. MMKV & Nitro Modules
-keep class com.tencent.mmkv.** { *; }
-keep class com.margelo.nitro.** { *; }

# 5. Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# 6. General Safety
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-dontwarn com.facebook.react.**
-dontwarn okhttp3.**
-dontwarn okio.**
