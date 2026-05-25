'use client'

// Entry button shown 3s after the loader becomes visible. Small, neumorphic,
// crimson on hover. Fades in via the parent's CSS class.

import styles from './StepOffGame.module.css'

interface Props {
  onClick: () => void
}

export function PlayButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.playButton}
      aria-label="Open mini-game while assessment generates"
    >
      <span>Play while you wait</span>
      <span className={styles.playButtonArrow} aria-hidden>→</span>
    </button>
  )
}
