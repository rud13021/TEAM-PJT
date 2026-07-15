import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataRoot = path.resolve(__dirname, '../../public/data')

async function readJsonDataset(fileName) {
  const filePath = path.join(dataRoot, fileName)

  try {
    const data = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

// The public/data files in this project use Korean filenames.
// Map the expected dataset functions to the actual filenames where available.
export async function getPlacesData() {
  return readJsonDataset('서울_관광지.json')
}

export async function getRestaurantsData() {
  // No explicit restaurants file available; try common alternatives, fallback to empty
  const alternatives = ['서울_음식점.json', '서울_레포츠.json', '서울_여행코스.json']
  for (const f of alternatives) {
    const data = await readJsonDataset(f)
    if (data.length) return data
  }
  return []
}

export async function getFestivalsData() {
  return readJsonDataset('서울_축제공연행사.json')
}

export async function getHotelsData() {
  return readJsonDataset('서울_숙박.json')
}

export async function getShoppingData() {
  return readJsonDataset('서울_쇼핑.json')
}
