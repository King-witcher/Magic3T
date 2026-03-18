export function formatMinutes(timestamp: number) {
  // Cria um objeto Date usando o timestamp
  const date = new Date(timestamp)
  const hours = date.getHours()
  const mins = date.getMinutes()

  // Cria a string formatada
  return `${hours}:${mins.toString().padStart(2, '0')}`
}
