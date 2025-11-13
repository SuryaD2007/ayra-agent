# Ayra Desktop App

This directory contains the Electron configuration for building Ayra as a native desktop application for Mac and Windows.

## ✅ Setup Complete

All configuration files are ready:
- ✅ Electron main process (`main.ts`)
- ✅ Secure preload script (`preload.ts`)
- ✅ Build configuration (`builder.config.js`)
- ✅ Mac entitlements for code signing
- ✅ Updated Vite config for Electron support
- ✅ App icon (`icon.png`) created

## 🚀 Quick Start

### Step 1: Add Scripts to package.json

Open your `package.json` and add these scripts (after line 11):

```json
"electron:compile": "tsc -p electron/tsconfig.json",
"electron:dev": "npm run electron:compile && concurrently \"vite\" \"wait-on tcp:8080 && electron .\"",
"electron:build": "npm run electron:compile && vite build && electron-builder",
"electron:build:mac": "npm run electron:compile && vite build && electron-builder --mac",
"electron:build:win": "npm run electron:compile && vite build && electron-builder --win"
```

Also add this to the root of package.json:
```json
"main": "electron/main.js"
```

### Step 2: Convert Icon (Mac & Windows Only)

The Linux icon (icon.png) is ready! For Mac and Windows, convert it using:

**Mac (.icns):**
- Use https://cloudconvert.com/png-to-icns
- Upload `electron/resources/icon.png`
- Download and save as `electron/resources/icon.icns`

**Windows (.ico):**
- Use https://icoconvert.com
- Upload `electron/resources/icon.png`
- Download and save as `electron/resources/icon.ico`

### Step 3: Run Development Build

```bash
npm run electron:dev
```

This will open Ayra as a desktop app!

## Development

To run the desktop app in development mode:

```bash
npm run electron:dev
```

This will:
1. Compile TypeScript files in the electron folder
2. Start the Vite dev server
3. Launch Electron pointing to localhost:8080
4. Open DevTools automatically

## Building for Production

### Build for Current Platform
```bash
npm run electron:build
```

### Build for Mac
```bash
npm run electron:build:mac
```

### Build for Windows
```bash
npm run electron:build:win
```

Built applications will be in the `dist-electron` folder.

## 📦 Distribution

### Mac (.dmg)
- Universal binary (Intel + Apple Silicon)
- Drag-to-install DMG
- Size: ~120-150MB

### Windows (.exe)
- NSIS installer with setup wizard
- Desktop + Start Menu shortcuts
- Size: ~100-130MB

## ✨ Features Implemented

### Window Management
- Persistent window size/position
- Minimum window size: 1024x768
- Single instance (prevents multiple app windows)
- Native title bar (macOS style)

### Security
- Context isolation enabled
- Node integration disabled
- Sandbox mode enabled
- Secure IPC communication

### Native Menus
- Mac: Standard macOS menu with app name
- Windows: Traditional File/Edit/View/Window/Help menus
- Keyboard shortcuts (Cmd/Ctrl+N for new item)

### Deep Links
- Protocol handler for `ayra://` URLs
- Open Ayra from browser links

### Platform Detection
- Accessible via `window.electron.platform()`
- Returns 'darwin', 'win32', or 'linux'

## 🔒 Code Signing (Optional - For Distribution)

### For Mac:
1. Join Apple Developer Program ($99/year)
2. Create certificates in Xcode
3. Add to `builder.config.js`:
```js
mac: {
  identity: "Developer ID Application: Your Name (TEAM_ID)",
}
```

### For Windows:
1. Purchase code signing certificate (~$100-300/year)
2. Add to `builder.config.js`:
```js
win: {
  certificateFile: "path/to/certificate.pfx",
  certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
}
```

## 🎯 Next Steps

1. ✅ Electron files configured
2. ✅ App icon created (icon.png)
3. ⬜ Add scripts to package.json (see above)
4. ⬜ Convert icon to .icns (Mac) and .ico (Windows)
5. ⬜ Run `npm run electron:dev` to test
6. ⬜ Build production app with `npm run electron:build`

## Troubleshooting

### "Cannot find module 'electron'"
Run: `npm install`

### TypeScript compilation errors
Make sure all dependencies are installed: `npm install`

### Build fails on Mac
You may need Xcode Command Line Tools: `xcode-select --install`

### Build fails on Windows
You may need Visual Studio Build Tools or Windows SDK.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build)
- [Ayra Web Version](https://useayra.com)
