import ReactGA from 'react-ga4'

const GA_ID = import.meta.env.VITE_GA_ID

export function initGA() {
  if (GA_ID) ReactGA.initialize(GA_ID)
}

export function trackPage(path) {
  if (GA_ID) ReactGA.send({ hitType: 'pageview', page: path })
}
