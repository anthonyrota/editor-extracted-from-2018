import isBrowser from 'is-in-browser'

const BROWSER_RULES: Array<[string, RegExp]> = [
  ['edge', /Edge\/([0-9\._]+)/],
  ['chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
  ['firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
  ['opera', /Opera\/([0-9\.]+)(?:\s|$)/],
  ['opera', /OPR\/([0-9\.]+)(:?\s|$)$/],
  ['ie', /Trident\/7\.0.*rv\:([0-9\.]+)\).*Gecko$/],
  ['ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
  ['ie', /MSIE\s(7\.0)/],
  ['android', /Android\s([0-9\.]+)/],
  ['safari', /Version\/([0-9\._]+).*Safari/]
]

let browser

if (isBrowser) {
  for (const [name, regexp] of BROWSER_RULES) {
    if (regexp.test(window.navigator.userAgent)) {
      browser = name
      break
    }
  }
}

export const isChrome = browser === 'chrome'
export const isOpera = browser === 'opera'
export const isFirefox = browser === 'firefox'
export const isSafari = browser === 'safari'
export const isIE = browser === 'ie'
export const isEdge = browser === 'edge'

const OS_RULES: Array<[string, RegExp]> = [
  ['ios', /os ([\.\_\d]+) like mac os/i],
  ['macos', /mac os x/i],
  ['android', /android/i],
  ['firefoxos', /mozilla\/[a-z\.\_\d]+ \((?:mobile)|(?:tablet)/i],
  ['windows', /windows\s*(?:nt)?\s*([\.\_\d]+)/i]
]

let os

if (isBrowser) {
  for (const [name, regexp] of OS_RULES) {
    if (regexp.test(window.navigator.userAgent)) {
      os = name
      break
    }
  }
}

export const isAndroid = os === 'android'
export const isIOS = os === 'ios'
export const isMac = os === 'macos'
export const isWindows = os === 'windows'

export let hasInputEventsLevel1 = false
export let hasInputEventsLevel2 = false

if (isBrowser) {
  hasInputEventsLevel1 =
    'InputEvent' in window &&
    'inputType' in new (window as any).InputEvent('input')

  const element = window.document.createElement('div')
  element.contentEditable = 'true'
  hasInputEventsLevel2 = 'onbeforeinput' in element
}
