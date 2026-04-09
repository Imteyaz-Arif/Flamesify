export function calculateFlamesTimeline(name1, name2) {
  let arr1 = name1.toLowerCase().split('');
  let arr2 = name2.toLowerCase().split('');

  let strike1 = [];
  let strike2 = [];

  let used2 = new Set();

  for (let i = 0; i < arr1.length; i++) {
    let char = arr1[i];
    if (char === ' ') continue;
    for (let j = 0; j < arr2.length; j++) {
      if (arr2[j] === char && arr2[j] !== ' ' && !used2.has(j)) {
        strike1.push(i);
        strike2.push(j);
        used2.add(j);
        break;
      }
    }
  }

  let spaces1 = arr1.filter(c => c === ' ').length;
  let spaces2 = arr2.filter(c => c === ' ').length;
  let remainingCount = (arr1.length - spaces1 - strike1.length) + (arr2.length - spaces2 - strike2.length);

  if (remainingCount === 0) remainingCount = 1;

  let flamesAvailable = [0, 1, 2, 3, 4, 5];
  let flamesNames = ['F', 'L', 'A', 'M', 'E', 'S'];
  let eliminationSteps = [];

  let startIndex = 0;

  while (flamesAvailable.length > 1) {
    let removeIdx = (startIndex + remainingCount - 1) % flamesAvailable.length;
    let actualLetterIdx = flamesAvailable[removeIdx];

    let hops = [];
    for (let i = 0; i < remainingCount; i++) {
      let hopIdx = (startIndex + i) % flamesAvailable.length;
      hops.push(flamesAvailable[hopIdx]);
    }

    eliminationSteps.push({
      eliminatedIndex: actualLetterIdx,
      hops: hops
    });

    flamesAvailable.splice(removeIdx, 1);
    startIndex = removeIdx;
  }

  let finalIndex = flamesAvailable[0];
  const outcomes = {
    0: 'Friend',
    1: 'Love',
    2: 'Affection',
    3: 'Marriage',
    4: 'Enemy',
    5: 'Sibling'
  };

  return {
    arr1,
    arr2,
    strike1,
    strike2,
    remainingCount,
    eliminationSteps,
    finalIndex,
    finalResult: outcomes[finalIndex]
  };
}