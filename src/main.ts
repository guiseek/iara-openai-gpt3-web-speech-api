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
  <hr />
  Human: ${input}
  AI:`
}

if (talkButton && transcriptOutput) {
  const recognition = speechRecognition
  const synthesis = speechSynthesis

  talkButton.onclick = () => {
    recognition.start()
    recognition.lang = 'pt-BR'
    recognition.continuous = false

    recognition.onresult = async (ev) => {
      const {transcript} = ev.results[0][0]

      transcriptOutput.innerText =
        transcriptOutput.innerText + generatePrompt(transcript)

      const completion = await openai.createCompletion({
        model: 'text-davinci-003',
        temperature: 0.9,
        max_tokens: 150,
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

      transcriptOutput.innerText = transcriptOutput.innerText + ` ${text}`
    }
  }
}
