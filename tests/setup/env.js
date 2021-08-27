import './window.js' // Should be imported before vue
import { createApp } from 'vue'

export function reset() {
  window.document.title = ''
  window.document.head.outerHTML = ''
}

/**
 * @typedef RenderOutput
 * @property container {HTMLElement}
 * @property component {import('svelte').SvelteComponent}
 */

/**
 * @return {RenderOutput}
 */
export function render(component, props = {}) {
  const container = window.document.body
  const app = createApp(component, props).mount(container)
  return { container }
}

/**
 * @param {HTMLElement} elem
 * @param {String} event
 * @param {any} [details]
 * @returns Promise<void>
 */
export function fire(elem, event, details) {
  let evt = new window.Event(event, details)
  elem.dispatchEvent(evt)
  //return nextTick()
}
