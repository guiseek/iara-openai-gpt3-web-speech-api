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

if (button && output) {
  output.innerHTML = localStorage.getItem('conversation') ?? ''

  button.onclick = () => {
    speechRecognition.start()
    speechRecognition.lang = 'pt-BR'
    speechRecognition.continuous = false

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

      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'pt-BR'

      speechSynthesis.speak(utter)

      output.innerHTML = output.innerHTML + ` ${text}  <hr />`

      utter.onstart = () => {
        button.innerText = 'Seja educado e termine de ouvir'
      }

      utter.onend = () => {
        button.disabled = false
        button.innerText = 'Clique para começar a falar'
        localStorage.setItem('conversation', output.innerHTML)
      }
    }
  }
}
