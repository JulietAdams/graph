import * as PIXI from 'pixi.js'


export class Drag {

  private container: HTMLDivElement
  private parent: PIXI.Container
  private onContainerDrag: (x: number, y: number) => void
  private paused = false
  private last?: { x: number, y: number }
  private current?: number
  private moved = false

  constructor(container: HTMLDivElement, parent: PIXI.Container, onContainerDrag: (x: number, y: number) => void) {
    this.container = container
    this.parent = parent
    this.onContainerDrag = onContainerDrag
  }

  down = (event: PIXI.InteractionEvent) => {
    if (this.paused) {
      return
    }

    this.container.style.cursor = 'move'
    this.last = { x: event.data.global.x, y: event.data.global.y }
    this.current = event.data.pointerId
  }

  move = (event: PIXI.InteractionEvent) => {
    if (this.paused) {
      return
    }

    if (this.last && this.current === event.data.pointerId) {
      const x = event.data.global.x
      const y = event.data.global.y

      const distX = x - this.last.x
      const distY = y - this.last.y
      if (this.moved || Math.abs(distX) >= 5 || Math.abs(distY) >= 5) {
        const centerX = this.parent.x + (x - this.last.x)
        const centerY = this.parent.y + (y - this.last.y)
        this.last = { x, y }
        this.moved = true

        this.onContainerDrag(centerX, centerY) // TODO - expose this as a more generic function
      }
    }
  }

  up = () => {
    if (this.paused) {
      return
    }

    this.container.style.cursor = 'auto'

    this.last = undefined
    this.moved = false
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
  }
}