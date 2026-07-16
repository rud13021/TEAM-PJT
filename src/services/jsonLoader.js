// 데이터를 직접 가져옵니다. 
// Vite 환경에서는 JSON 파일을 import하면 자동으로 객체로 변환됩니다.
import placesData from '@/data/서울_관광지.json';
import restaurantsData from '@/data/서울_레포츠.json';
import festivalsData from '@/data/서울_축제공연행사.json';
import hotelsData from '@/data/서울_숙박.json';
import shoppingData from '@/data/서울_쇼핑.json';

// 데이터 구조를 표준화하는 함수
const normalize = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
};

export async function loadAllDatasets() {
    // 모든 데이터를 병렬로 정규화하여 반환
    return {
        places: normalize(placesData),
        restaurants: normalize(restaurantsData),
        festivals: normalize(festivalsData),
        hotels: normalize(hotelsData),
        shopping: normalize(shoppingData),
    };

	// 이 줄을 추가해서 데이터가 로드되었는지 브라우저 콘솔에서 확인하세요
    console.log('데이터 로드 완료:', data);

	return data;
}

// 기존 코드와의 호환성을 위한 함수들 (필요 시 유지)
export const loadPlaces = async () => normalize(placesData);
export const loadRestaurants = async () => normalize(restaurantsData);
export const loadFestivals = async () => normalize(festivalsData);
export const loadHotels = async () => normalize(hotelsData);
export const loadShopping = async () => normalize(shoppingData);