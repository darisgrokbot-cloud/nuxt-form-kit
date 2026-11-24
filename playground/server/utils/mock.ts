export const provinces = [
  { id: 10, name: 'กรุงเทพมหานคร' },
  { id: 50, name: 'เชียงใหม่' },
  { id: 83, name: 'ภูเก็ต' },
]

export const districts = [
  { id: 1001, province_id: 10, name: 'พระนคร' },
  { id: 1002, province_id: 10, name: 'ดุสิต' },
  { id: 1003, province_id: 10, name: 'บางรัก' },
  { id: 5001, province_id: 50, name: 'เมืองเชียงใหม่' },
  { id: 5002, province_id: 50, name: 'แม่ริม' },
  { id: 8301, province_id: 83, name: 'เมืองภูเก็ต' },
]

export const subdistricts = [
  { id: 100101, district_id: 1001, name: 'พระบรมมหาราชวัง' },
  { id: 100102, district_id: 1001, name: 'วังบูรพาภิรมย์' },
  { id: 100201, district_id: 1002, name: 'ดุสิต' },
  { id: 100301, district_id: 1003, name: 'มหาพฤฒาราม' },
  { id: 500101, district_id: 5001, name: 'ศรีภูมิ' },
  { id: 500201, district_id: 5002, name: 'ริมใต้' },
  { id: 830101, district_id: 8301, name: 'ตลาดใหญ่' },
]

export const departments = Array.from({ length: 95 }, (_, i) => ({
  id: i + 1,
  name: `ฝ่าย ${String(i + 1).padStart(3, '0')}${i % 7 === 0 ? ' (บริหารความเสี่ยง)' : ''}`,
  code: `D${String(i + 1).padStart(3, '0')}`,
}))

export const employees = Array.from({ length: 60 }, (_, i) => ({
  id: 1000 + i,
  full_name: `พนักงาน ${i + 1}`,
  email: `emp${i + 1}@example.com`,
  department_id: (i % 5) + 1,
}))

export function paginate<T>(list: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  const items = list.slice(start, start + limit)
  return { items, hasMore: start + limit < list.length, total: list.length }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
