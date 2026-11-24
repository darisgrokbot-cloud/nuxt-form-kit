export default defineNuxtPlugin(() => {
  useFormKitRegistry().register({
    sources: {
      provinces: () => $fetch('/api/provinces'),
      districts: ({ params, signal }) => $fetch('/api/districts', { query: params, signal }),
      subdistricts: ({ params, signal }) => $fetch('/api/subdistricts', { query: params, signal }),
      departments: ({ search, page, pageSize, selected, signal }) => $fetch('/api/departments', {
        query: { search, page, limit: pageSize, ids: selected.join(',') },
        signal,
      }),
      employees: ({ search, params, signal }) => $fetch('/api/employees', { query: { search, ...params }, signal }),
      failing: () => $fetch('/api/failing'),
    },
    rules: {
      uniqueCode: async (value: string) => {
        const res = await $fetch<{ available: boolean }>('/api/check-code', { query: { code: value } })
        return res.available || 'รหัสนี้ถูกใช้แล้ว'
      },
    },
  })
})
