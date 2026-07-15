import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', {
  state: () => ({
    startLocations: [
      {
        name: '강남역',
        address: '서울 강남구 강남대로 396',
        lat: 37.4979,
        lng: 127.0276,
      },
      {
        name: '홍대입구역',
        address: '서울 마포구 양화로 165',
        lat: 37.5572,
        lng: 126.9245,
      },
      {
        name: '노원역',
        address: '서울 노원구 노해로 490',
        lat: 37.6544,
        lng: 127.0601,
      },
    ],
  }),
  actions: {
    setStartLocations(locations) {
      this.startLocations = locations
    },
    updateLocation(index, payload) {
      if (!this.startLocations[index]) return
      this.startLocations[index] = {
        ...this.startLocations[index],
        ...payload,
      }
    },
    addLocation(payload = {}) {
      this.startLocations.push({
        name: payload.name || '새 출발지',
        address: payload.address || '',
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
      })
    },
    removeLocation(index) {
      if (this.startLocations.length > 2) {
        this.startLocations.splice(index, 1)
      }
    },
  },
})