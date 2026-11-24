export default defineEventHandler(async (event) => {
  const { province_id } = getQuery(event)
  await sleep(200)
  return districts.filter(d => String(d.province_id) === String(province_id))
})
