import JSConfetti from 'js-confetti'

// make confetti a global singleton on window
declare global {
  interface Window {
    confetti: JSConfetti
  }
}
const confetti = typeof document !== 'undefined' ? window.confetti || new JSConfetti() : null

export const celebrate = () => {
  confetti?.addConfetti()
  setTimeout(() => {
    confetti?.addConfetti({
      emojis: ['🎉', '🐣', '🐥', '🥳'],
    })
  }, 800)
}
