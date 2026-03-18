export function delay(amount: number) {
  return new Promise((res) => {
    setTimeout(res, amount)
  })
}
