const colors = {
  reset: (s: string) => `\x1b[0m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  italic: (s: string) => `\x1b[3m${s}\x1b[23m`,
  underline: (s: string) => `\x1b[4m${s}\x1b[24m`,
  inverse: (s: string) => `\x1b[7m${s}\x1b[27m`,
  hidden: (s: string) => `\x1b[8m${s}\x1b[28m`,
  strikethrough: (s: string) => `\x1b[9m${s}\x1b[29m`,
  black: (s: string) => `\x1b[30m${s}\x1b[39m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[39m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[39m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
  white: (s: string) => `\x1b[37m${s}\x1b[39m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[39m`,
  bgBlack: (s: string) => `\x1b[40m${s}\x1b[49m`,
  bgRed: (s: string) => `\x1b[41m${s}\x1b[49m`,
  bgGreen: (s: string) => `\x1b[42m${s}\x1b[49m`,
  bgYellow: (s: string) => `\x1b[43m${s}\x1b[49m`,
  bgBlue: (s: string) => `\x1b[44m${s}\x1b[49m`,
  bgMagenta: (s: string) => `\x1b[45m${s}\x1b[49m`,
  bgCyan: (s: string) => `\x1b[46m${s}\x1b[49m`,
  bgWhite: (s: string) => `\x1b[47m${s}\x1b[49m`,
};

export const color = (colorType: keyof typeof colors) => {
  if (colors[colorType]) {
    return colors[colorType];
  } else {
    return (text: string) => text;
  }
};
