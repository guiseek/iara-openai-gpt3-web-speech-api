import {Configuration, OpenAIApi} from 'openai'
import {speechRecognition} from './types.d'
import './style.scss'

const configuration = new Configuration({
  apiKey: import.meta.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const talkButton = document.querySelector<HTMLButtonElement>('#talk')
const transcriptOutput =
  document.querySelector<HTMLOutputElement>('#transcript')

function generatePrompt(input: string) {
  return `
  Human: ${input}
  AI:`
}

if (talkButton && transcriptOutput) {
  transcriptOutput.innerHTML = localStorage.getItem('conversation') ?? ''

  const recognition = speechRecognition
  const synthesis = speechSynthesis

  talkButton.onclick = () => {
    recognition.start()
    recognition.lang = 'pt-BR'
    recognition.continuous = false

    recognition.onspeechstart = () => {
      talkButton.innerText = 'Estou te ouvindo'
      talkButton.disabled = true
    }

    recognition.onspeechend = () => {
      talkButton.innerText = 'Enviando pergunta'
    }

    recognition.onresult = async (ev) => {
      const {transcript} = ev.results[0][0]

      transcriptOutput.innerHTML =
        transcriptOutput.innerHTML + generatePrompt(transcript)

      const completion = await openai.createCompletion({
        model: 'text-davinci-003',
        temperature: 0.9,
        max_tokens: 3000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.9,
        stop: [' Human:', ' AI:'],
        prompt: generatePrompt(transcript),
      })

      const {text} = completion.data.choices[0]
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'pt-BR'
      synthesis.speak(utter)

      transcriptOutput.innerHTML =
        transcriptOutput.innerHTML + ` ${text}  <hr />`

      utter.onstart = () => {
        talkButton.innerText = 'Seja educado e termine de ouvir'
      }

      utter.onend = () => {
        talkButton.disabled = false
        talkButton.innerText = 'Clique para começar a falar'
        localStorage.setItem('conversation', transcriptOutput.innerHTML)
      }
    }
  }
}
