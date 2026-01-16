import '@testing-library/jest-dom'

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock IntersectionObserver for lazy loading components
class MockIntersectionObserver {
  constructor() {
    this.observe = () => {}
    this.unobserve = () => {}
    this.disconnect = () => {}
  }
}
window.IntersectionObserver = MockIntersectionObserver

// Mock scrollTo
window.scrollTo = () => {}
