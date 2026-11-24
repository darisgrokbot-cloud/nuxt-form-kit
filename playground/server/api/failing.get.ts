export default defineEventHandler(async () => {
  await sleep(100)
  throw createError({ statusCode: 500, statusMessage: 'boom' })
})
