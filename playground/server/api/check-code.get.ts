export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  await sleep(150)
  return { available: !['TAK-001', 'ADM-001'].includes(String(code).toUpperCase()) }
})
