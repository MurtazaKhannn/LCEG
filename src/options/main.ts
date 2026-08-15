import { getSettings, setSettings } from '@/lib/cache'
import { testGeminiConnection } from '@/lib/ai/gemini'
import './styles.css'

const form = document.getElementById('settings-form') as HTMLFormElement
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement
const modelSelect = document.getElementById('model') as HTMLSelectElement
const testBtn = document.getElementById('test-btn') as HTMLButtonElement
const statusEl = document.getElementById('status')!

function showStatus(message: string, type: 'success' | 'error') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
  statusEl.classList.remove('hidden')
}

async function loadSettings() {
  const settings = await getSettings()
  apiKeyInput.value = settings.geminiApiKey
  const optionValues = Array.from(modelSelect.options).map(o => o.value)
  if (optionValues.includes(settings.geminiModel)) {
    modelSelect.value = settings.geminiModel
  }
  else {
    modelSelect.selectedIndex = 0
    await setSettings({ geminiModel: modelSelect.value })
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  await setSettings({
    geminiApiKey: apiKeyInput.value.trim(),
    geminiModel: modelSelect.value,
  })
  showStatus('Settings saved.', 'success')
})

testBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim()
  if (!apiKey) {
    showStatus('Enter an API key first.', 'error')
    return
  }

  testBtn.disabled = true
  testBtn.textContent = 'Testing...'

  try {
    const ok = await testGeminiConnection(apiKey, modelSelect.value)
    showStatus(ok ? 'Connection successful!' : 'Unexpected response from Gemini.', ok ? 'success' : 'error')
  }
  catch (err) {
    showStatus(err instanceof Error ? err.message : 'Connection failed', 'error')
  }
  finally {
    testBtn.disabled = false
    testBtn.textContent = 'Test Connection'
  }
})

loadSettings()
