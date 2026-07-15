export const getBestLocation = (candidates, middlePoint) => {
  // 조건 1: 45분 이상 걸리는 후보 제거 (timeA, timeB는 각자 이동 시간)
  const filtered = candidates.filter(c => c.timeA <= 45 && c.timeB <= 45);

  return filtered.map(c => {
    // 제시하신 가중치 기반 Score 계산
    const score = (c.timeA + c.timeB) + 0.8 * Math.abs(c.timeA - c.timeB);
    return { ...c, score };
  }).sort((a, b) => {
    // 점수가 다르면 점수순 (낮을수록 좋음)
    if (a.score !== b.score) return a.score - b.score;
    
    // 점수가 같을 때 1) 도착 시간 차이가 적은 순
    const diffA = Math.abs(a.timeA - a.timeB);
    const diffB = Math.abs(b.timeA - b.timeB);
    if (diffA !== diffB) return diffA - diffB;
    
    // 2) 총 이동시간이 적은 순
    if ((a.timeA + a.timeB) !== (b.timeA + b.timeB)) 
        return (a.timeA + a.timeB) - (b.timeA + b.timeB);
        
    // 3) 중간지점과의 거리순 (직선거리 계산 로직 필요)
    return a.distToMiddle - b.distToMiddle;
  });
};