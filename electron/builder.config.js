/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.ayra.app',
  productName: 'Ayra',
  directories: {
    output: 'dist-electron',
    buildResources: 'electron/resources',
  },
  files: [
    'dist/**/*',
    'electron/main.cjs',
    'electron/preload.cjs',
    'package.json',
  ],
  mac: {
    category: 'public.app-category.productivity',
    target: [
      {
        target: 'dmg',
        arch: ['universal'],
      },
    ],
    icon: 'electron/resources/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'electron/resources/entitlements.mac.plist',
    entitlementsInherit: 'electron/resources/entitlements.mac.plist',
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'electron/resources/icon.ico',
    publisherName: 'Ayra',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Ayra',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
    icon: 'electron/resources/icon.png',
  },
  publish: {
    provider: 'github',
    owner: 'your-github-username',
    repo: 'ayra-desktop',
  },
};
