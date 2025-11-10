import { useEffect, useState } from "react";
import { Platform } from "react-native";
import StaticServer from 'react-native-static-server';
import WebView from "react-native-webview"
import RNFS from 'react-native-fs';

export const SdkWebView = () => {
    const [uri, setUri] = useState<string | null>(null)
    useEffect(() => {
        const webRoot = RNFS.DocumentDirectoryPath + "/www"
        const server = new StaticServer(2000, webRoot, { localOnly: true })
        server.start().then(origin => {
            setUri(origin + "/index.html")
        });
        return () => {
            server.stop()
        }
    }, []);

    if (!uri) return null;

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
            source={{ uri }}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptEnabled={true}
            onMessage={handleMessage}
            originWhitelist={['*']}
        />
    )
}