// Wakha in Expo Go: the whole app is one web page, shown full-screen in a WebView.
// wakha-html.js is generated from the built app (npm run sync) so it works offline once loaded.
import { useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, Platform, BackHandler } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useEffect } from "react";
import WAKHA_HTML from "./wakha-html";

export default function App() {
  const web = useRef(null);
  // Android Back goes to the app's own Back handling (closes the top sheet, lesson or tab)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { web.current && web.current.goBack(); return true; });
    return () => sub.remove();
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="auto" />
        <View style={styles.root}>
          <WebView
            ref={web}
            source={{ html: WAKHA_HTML, baseUrl: "https://wakha.app/" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            setSupportMultipleWindows={false}
            bounces={false}
            overScrollMode="never"
            style={styles.root}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: "#FFFFFF" } });
