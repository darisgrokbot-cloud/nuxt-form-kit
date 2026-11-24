export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const search = String(q.search ?? '').trim()
  const page = Number(q.page ?? 1)
  const limit = Number(q.limit ?? 20)
  const ids = String(q.ids ?? '').split(',').filter(Boolean)
  await sleep(250)
  const filtered = departments.filter(d => !search || d.name.includes(search) || d.code.includes(search.toUpperCase()))
  const result = paginate(filtered, page, limit)
  // คืนรายการที่ถูกเลือกอยู่ด้วย เพื่อให้แสดง label ได้ (เช่นตอน edit)
  if (page === 1 && ids.length) {
    const selected = departments.filter(d => ids.includes(String(d.id)) && !result.items.some(i => i.id === d.id))
    result.items = [...result.items, ...selected]
  }
  return result
})
