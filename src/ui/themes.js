export const THEME_NAMES = ['default', 'dark', 'light', 'mono'];

export const THEMES = {
  default: {
    label: 'Default',
    palette: {
      primary: '#4C8DFF',
      primarySoft: '#7FB0FF',
      accent: '#F5C542',
      success: '#3FB950',
      warning: '#E3B341',
      error: '#F85149',
      info: '#58A6FF',
      purple: '#BC8CFF',
      muted: '#8B949E',
      dim: '#6E7681',
      text: '#E6EDF3',
      white: '#FFFFFF',
      border: '#30363D',
    },
    border: 'blue',
  },
  dark: {
    label: 'Dark',
    palette: {
      primary: '#58A6FF',
      primarySoft: '#79C0FF',
      accent: '#D29922',
      success: '#3FB950',
      warning: '#D29922',
      error: '#F85149',
      info: '#58A6FF',
      purple: '#BC8CFF',
      muted: '#7D8590',
      dim: '#545D68',
      text: '#C9D1D9',
      white: '#F0F6FC',
      border: '#21262D',
    },
    border: 'blue',
  },
  light: {
    label: 'Light',
    palette: {
      primary: '#0550AE',
      primarySoft: '#0969DA',
      accent: '#9A6700',
      success: '#1A7F37',
      warning: '#9A6700',
      error: '#CF222E',
      info: '#0550AE',
      purple: '#8250DF',
      muted: '#57606A',
      dim: '#8C959F',
      text: '#24292F',
      white: '#1F2328',
      border: '#D0D7DE',
    },
    border: 'blue',
  },
  mono: {
    label: 'Mono',
    palette: {
      primary: '#D0D0D0',
      primarySoft: '#C0C0C0',
      accent: '#FFFFFF',
      success: '#E8E8E8',
      warning: '#C8C8C8',
      error: '#FFFFFF',
      info: '#D0D0D0',
      purple: '#B0B0B0',
      muted: '#909090',
      dim: '#686868',
      text: '#E0E0E0',
      white: '#FFFFFF',
      border: '#505050',
    },
    border: 'gray',
  },
};

export function getThemeDefinition(name) {
  return THEMES[name] ?? THEMES.default;
}
