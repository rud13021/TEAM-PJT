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

export async function getPlacesData() {
  return readJsonDataset('places.json')
}

export async function getRestaurantsData() {
  return readJsonDataset('restaurants.json')
}

export async function getFestivalsData() {
  return readJsonDataset('festivals.json')
}

export async function getHotelsData() {
  return readJsonDataset('hotels.json')
}

export async function getShoppingData() {
  return readJsonDataset('shopping.json')
}
