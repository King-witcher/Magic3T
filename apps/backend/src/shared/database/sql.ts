/** biome-ignore-all lint/suspicious/noExplicitAny: Many things can really be anything */

export function sql(
  strings: TemplateStringsArray,
  ...values: any[]
): { text: string; values: any[] } {
  let text = ''
  for (let i = 0; i < values.length; i++) {
    text += `${strings.raw[i]}$${i + 1}`
  }
  text += strings.raw[values.length]

  return { text, values }
}

export function prepared(name: string): {
  sql: (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => {
    name: string
    text: string
    values: any[]
  }
} {
  return {
    sql: (strings: TemplateStringsArray, ...values: any[]) => {
      return {
        name,
        ...sql(strings, ...values),
      }
    },
  }
}
