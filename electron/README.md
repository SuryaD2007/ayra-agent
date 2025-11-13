# Ayra Desktop App

This directory contains the Electron configuration for building Ayra as a native desktop application for Mac and Windows.

## Setup Complete ✅

The following have been configured:
- Electron main process (`main.ts`)
- Secure preload script (`preload.ts`)
- Build configuration (`builder.config.js`)
- Mac entitlements for code signing
- Updated Vite config for Electron support

## Required Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "electron:compile": "tsc -p electron/tsconfig.json",
    "electron:dev": "npm run electron:compile && concurrently \"vite\" \"wait-on tcp:8080 && electron .\"",
    "electron:build": "npm run electron:compile && vite build && electron-builder",
    "electron:build:mac": "npm run electron:compile && vite build && electron-builder --mac",
    "electron:build:win": "npm run electron:compile && vite build && electron-builder --win"
  },
  "main": "electron/main.js"
}
```

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

### Build for Mac Only
```bash
npm run electron:build:mac
```

### Build for Windows Only
```bash
npm run electron:build:win
```

Built applications will be in the `dist-electron` folder.

## App Icons

You need to create app icons from your Ayra logo:

### Required Icon Files:
- `electron/resources/icon.icns` - Mac icon (1024x1024)
- `electron/resources/icon.ico` - Windows icon (256x256)
- `electron/resources/icon.png` - Linux icon (512x512)

You can use online tools or:
- **Mac**: Use `iconutil` or https://cloudconvert.com/png-to-icns
- **Windows**: Use https://icoconvert.com or https://convertio.co/png-ico/

Place the generated icons in `electron/resources/`.

## Features Implemented

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

## Code Signing (Optional but Recommended)

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

## Distribution

### Mac (.dmg)
- Universal binary (Intel + Apple Silicon)
- Drag-to-install DMG
- Size: ~120-150MB

### Windows (.exe)
- NSIS installer with setup wizard
- Desktop + Start Menu shortcuts
- Size: ~100-130MB

## Next Steps

1. **Add package.json scripts** (see above)
2. **Create app icons** in `electron/resources/`
3. **Test development**: Run `npm run electron:dev`
4. **Test production build**: Run `npm run electron:build`
5. **Set up code signing** (optional but recommended for distribution)

## Troubleshooting

### "Cannot find module 'electron'"
Run: `npm install`

### "Command not found: electron"
Electron may not be installed globally. Use `npm run electron:dev` instead.

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
