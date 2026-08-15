import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'LCEG - LeetCode Example Generator',
  version: pkg.version,
  description: 'Get clearer, walkthrough-style examples for LeetCode problems',
  icons: {
    16: 'public/logo.png',
    48: 'public/logo.png',
    128: 'public/logo.png',
  },
  action: {
    default_icon: {
      16: 'public/logo.png',
      48: 'public/logo.png',
      128: 'public/logo.png',
    },
    default_title: 'LCEG - Better Examples',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  options_page: 'src/options/index.html',
  permissions: ['storage', 'sidePanel', 'tabs'],
  host_permissions: ['https://leetcode.com/*', 'https://generativelanguage.googleapis.com/*'],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
