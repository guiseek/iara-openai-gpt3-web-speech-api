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

const prompt = (input: string) => {
  return `
Human: ${input}
AI:`
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
  let voice: SpeechSynthesisVoice

  speechSynthesis.onvoiceschanged = () => {
    Array.from(select.children).forEach((child) => child.remove())

    voices = speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang === 'pt-BR')

    voices.forEach((v, i) => {
      select.add(new Option(v.name, `${i}`, v.default))
      if (v.default) voice = v
    })
  }

  select.onchange = () => {
    voice = voices[+select.value]

    const utter = new SpeechSynthesisUtterance(voice.name)
    utter.voice = voice
    utter.lang = voice.lang

    speechSynthesis.speak(utter)
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
    speechRecognition.lang = 'pt-BR'
    speechRecognition.continuous = false
    speechRecognition.start()

    speechRecognition.onspeechstart = () => {
      button.innerText = 'Estou te ouvindo'
      button.disabled = true
      button.ariaBusy = 'true'
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
        output.innerHTML = output.innerHTML + ` ${text}  <hr />`
        localStorage.setItem('conversation', output.innerHTML)

        const lastHR = output.querySelector('hr:last-of-type')
        if (lastHR) lastHR.scrollIntoView({behavior: 'smooth'})

        const utter = new SpeechSynthesisUtterance(text)
        utter.voice = voice
        utter.lang = voice.lang

        window.speechSynthesis.speak(utter)

        utter.onstart = () => {
          button.innerText = 'Seja educado e termine de ouvir'
        }

        utter.onend = () => {
          button.disabled = false
          button.ariaBusy = 'false'
          button.innerText = 'Clique para começar a falar'
        }
      }
    }
  }
}
