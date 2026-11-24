export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const search = String(q.search ?? '').trim()
  await sleep(200)
  return employees
    .filter(e => !q.department_id || String(e.department_id) === String(q.department_id))
    .filter(e => !search || e.full_name.includes(search) || e.email.includes(search))
})
