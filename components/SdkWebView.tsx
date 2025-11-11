import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import StaticServer from "react-native-static-server";
import RNFS from "react-native-fs";
import WebView from "react-native-webview";

export const SdkWebView = () => {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        const startServer = async () => {
            try {
                // Define a proper absolute path for the www folder
                const webRoot =
                    Platform.OS === "ios"
                        ? `${RNFS.MainBundlePath}/www` // For iOS
                        : `${RNFS.DocumentDirectoryPath}/www`; // For Android

                // Ensure the directory exists
                const exists = await RNFS.exists(webRoot);
                console.log(webRoot)
                if (!exists) {
                    console.error("❌ Directory not found:", webRoot);
                    return;
                }

                // 2️⃣ Copy index.html from assets to the internal path
                // const assetPath = 'www/index.html'; // relative to android/app/src/main/assets
                // const destPath = `${webRoot}/index.html`;
                // await RNFS.copyFileAssets(assetPath, destPath);
                //await copyFolderFromAssets("www",webRoot)

                // Copy according to platform
                if (Platform.OS === "android") {
                    console.log("Copying Android assets (assets/www) ->", webRoot);
                    await copyFolderFromAssets("www", webRoot);
                } else {
                    console.log("Copying iOS bundle (www) ->", webRoot);
                    await copyFolderFromBundle("www", webRoot);
                }

                // Start static server
                const server = new StaticServer(0, webRoot, { localOnly: true });

                const origin = await server.start();
                console.log("✅ Static server started at:", origin);
                setUri(origin + "/index.html");

                // Stop server on cleanup
                return () => server.stop();
            } catch (err) {
                console.error("🚨 Failed to start StaticServer:", err);
            }
        };

        const cleanupPromise = startServer();
        return () => {
            cleanupPromise.then((cleanup) => cleanup && cleanup());
        };
    }, []);

    // // Recursively copy entire folder from assets to internal storage
    // async function copyFolderFromAssets(assetFolder: string, destFolder: string): Promise<void> {
    //     const items = await RNFS.readDirAssets(assetFolder); // Read directory in assets
    //     await RNFS.mkdir(destFolder);

    //     for (const item of items) {
    //         const assetPath = `${assetFolder}/${item.name}`;
    //         const destPath = `${destFolder}/${item.name}`;

    //         if (item.isDirectory()) {
    //             await copyFolderFromAssets(assetPath, destPath); // recurse
    //         } else {
    //             await RNFS.copyFileAssets(assetPath, destPath);
    //         }
    //     }
    // }

    async function copyFolderFromAssets(assetFolder: string, destFolder: string) {
        // Android-only: recursively copy assets from apk assets/<assetFolder> to destFolder
        const items = await RNFS.readDirAssets(assetFolder);
        await RNFS.mkdir(destFolder);

        for (const item of items) {
            const name = item.name;
            const assetPath = assetFolder ? `${assetFolder}/${name}` : name;
            const destPath = `${destFolder}/${name}`;

            // react-native-fs returns objects that may have .isFile()/.isDirectory() on Android
            // but sometimes properties differ; we detect both ways:
            const isDir =
                typeof item.isDirectory === "function" ? item.isDirectory() : !!(item.isDirectory);

            if (isDir) {
                await copyFolderFromAssets(assetPath, destPath);
            } else {
                // copy single file from assets to dest
                await RNFS.copyFileAssets(assetPath, destPath);
            }
        }
    }

    async function copyFolderFromBundle(bundleFolder: string, destFolder: string) {
        // iOS: copy from RNFS.MainBundlePath + '/' + bundleFolder
        const srcRoot = `${RNFS.MainBundlePath}/${bundleFolder}`;
        const exists = await RNFS.exists(srcRoot);
        if (!exists) throw new Error(`Bundle folder not found: ${srcRoot}`);
        await RNFS.mkdir(destFolder);

        const items = await RNFS.readDir(srcRoot);
        for (const item of items) {
            const srcPath = `${srcRoot}/${item.name}`;
            const destPath = `${destFolder}/${item.name}`;
            if (item.isDirectory()) {
                await copyFolderFromBundle(`${bundleFolder}/${item.name}`, `${destFolder}/${item.name}`);
            } else {
                await RNFS.copyFile(srcPath, destPath);
            }
        }
    }


    if (!uri) return null;

    const handleMessage = (event: any) => {
        const message = event.nativeEvent.data;
        console.log("📩 Message from HTML:", message);
        try {
            const parsed = JSON.parse(message);
            console.log("✅ Parsed object:", parsed);
        } catch { }
    };

    return (
        <WebView
            source={{ uri }}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptEnabled={true}
            onMessage={handleMessage}
            originWhitelist={["*"]}
        />
    );
};
