import {Configuration, OpenAIApi} from 'openai'
import {speechRecognition} from './types.d'
import './style.scss'

const configuration = new Configuration({
  apiKey: import.meta.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const createConfig = (prompt: string) => ({
  model: 'text-davinci-003',
  frequency_penalty: 0.0,
  presence_penalty: 0.9,
  temperature: 0.9,
  max_tokens: 3000,
  stop: [' Human:', ' AI:'],
  top_p: 1.0,
  prompt,
})

speechRecognition.lang = 'pt-BR'
speechRecognition.continuous = false

const prompt = (input: string) => {
  return `
Human: ${input}
AI:`
}

const speak = (message: string, voice?: SpeechSynthesisVoice) => {
  const utter = new SpeechSynthesisUtterance(message)
  if (voice) utter.voice = voice
  utter.lang = 'pt-BR'
  speechSynthesis.speak(utter)
  return utter
}

const button = document.querySelector('button')
const output = document.querySelector('output')
const select = document.querySelector('select')
const form = document.querySelector('form')

if (button && output && select && form) {
  output.innerHTML = localStorage.getItem('conversation') ?? ''
  const lastHR = output.querySelector('hr:last-of-type')
  if (lastHR) lastHR.scrollIntoView()

  let voices: SpeechSynthesisVoice[] = []

  speechSynthesis.onvoiceschanged = () => {
    Array.from(select.children).forEach((child) => child.remove())

    voices = speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang === 'pt-BR')

    voices.forEach((voice, index) => {
      select.add(new Option(voice.name, `${index}`, voice.default))
    })
  }

  select.oninput = () => {
    const voice = voices[select.selectedIndex]
    speak(voice.name, voice)
  }

  form.onsubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)
    const message = data.get('message')

    if (message) {
      output.innerHTML = output.innerHTML + prompt(message.toString())

      const {text} = await openai
        .createCompletion(createConfig(prompt(message.toString())))
        .then(({data}) => data.choices[0])

      output.innerHTML = output.innerHTML + ` ${text}  <hr />`

      localStorage.setItem('conversation', output.innerHTML)

      form.reset()
    }
  }

  button.onclick = () => {
    speechRecognition.start()

    speechRecognition.onspeechstart = () => {
      button.innerText = 'Estou te ouvindo'
      button.disabled = true
    }

    speechRecognition.onspeechend = () => {
      button.innerText = 'Enviando pergunta'
    }

    speechRecognition.onresult = async (ev) => {
      const {transcript} = ev.results[0][0]

      output.innerHTML = output.innerHTML + prompt(transcript)

      const {text} = await openai
        .createCompletion(createConfig(prompt(transcript)))
        .then(({data}) => data.choices[0])

      if (text) {
        const voice = voices[select.selectedIndex]
        const utter = speak(text, voice)

        output.innerHTML = output.innerHTML + ` ${text}  <hr />`

        utter.onstart = () => {
          button.innerText = 'Seja educado e termine de ouvir'

          const lastHR = output.querySelector('hr:last-of-type')
          if (lastHR) lastHR.scrollIntoView({behavior: 'smooth'})
        }

        utter.onend = () => {
          button.disabled = false
          button.innerText = 'Clique para começar a falar'
          localStorage.setItem('conversation', output.innerHTML)
        }
      }
    }
  }
}
