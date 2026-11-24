export default defineEventHandler(async (event) => {
  const { district_id } = getQuery(event)
  await sleep(200)
  return subdistricts.filter(d => String(d.district_id) === String(district_id))
})
