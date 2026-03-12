import { http } from './http'

export async function listRecords() {
  const { data } = await http.get('/records')
  return data
}

export async function createRecord(payload) {
  const { data } = await http.post('/records', payload)
  return data
}

export async function updateRecord(id, payload) {
  const { data } = await http.put(`/records/${id}`, payload)
  return data
}

export async function deleteRecord(id) {
  const { data } = await http.delete(`/records/${id}`)
  return data
}

