import { useEffect, useState } from "react";
import { Platform } from "react-native";
import WebView from "react-native-webview"
import RNFS from 'react-native-fs';

export const SdkWebView = () => {
    const [uri,setUri] = useState<string>("")
    useEffect(() => {
        let basePath: string = "";
        if (Platform.OS === 'android') {
            basePath = 'file:///android_asset/www/index.html';
        } else if (Platform.OS === 'ios') {
            // iOS bundles files inside main bundle path
            basePath = `${RNFS.MainBundlePath}/www/index.html`;
        }
        setUri(basePath)
    },[]);
      const handleMessage = (event: any) => {
    const message = event.nativeEvent.data;
    console.log("📩 Message from HTML:", message);

    // if JSON, you can parse:
    try {
      const parsed = JSON.parse(message);
      console.log("✅ Parsed object:", parsed);
    } catch {
      // not JSON, just plain text
    }
  };
    return (
        <WebView
        source={{uri}}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        javaScriptEnabled={true}
        onMessage={handleMessage}
        originWhitelist={['*']}
        />
    )
}