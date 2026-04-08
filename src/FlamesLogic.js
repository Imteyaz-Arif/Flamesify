export function calculateFlamesTimeline(name1, name2) {
  // 1. Process matching letters
  let arr1 = name1.toLowerCase().split('');
  let arr2 = name2.toLowerCase().split('');

  // Finding common letters to strike out
  // We need to strike exact occurrences. e.g. "a" in name1 strikes one "a" in name2.
  let strike1 = []; // indicies in arr1
  let strike2 = []; // indicies in arr2

  let used2 = new Set();

  for (let i = 0; i < arr1.length; i++) {
    let char = arr1[i];
    if (char === ' ') continue; // do not try to match or strike spaces
    for (let j = 0; j < arr2.length; j++) {
      if (arr2[j] === char && arr2[j] !== ' ' && !used2.has(j)) {
        strike1.push(i);
        strike2.push(j);
        used2.add(j);
        break; // matched this char once, move to next char in arr1
      }
    }
  }

  // Calculate remaining count (excluding spaces)
  let spaces1 = arr1.filter(c => c === ' ').length;
  let spaces2 = arr2.filter(c => c === ' ').length;
  let remainingCount = (arr1.length - spaces1 - strike1.length) + (arr2.length - spaces2 - strike2.length);

  // If no remaining count, it's 0. Technically FLAMES needs N>0.
  // If N=0 (identical names), usually results in 'S' (or 0 logic, we can say N=1).
  if (remainingCount === 0) remainingCount = 1;

  // 2. Process FLAMES elimination
  let flamesAvailable = [0, 1, 2, 3, 4, 5]; // F L A M E S indices
  let flamesNames = ['F', 'L', 'A', 'M', 'E', 'S'];
  let eliminationSteps = [];

  let startIndex = 0;

  while (flamesAvailable.length > 1) {
    let removeIdx = (startIndex + remainingCount - 1) % flamesAvailable.length;
    let actualLetterIdx = flamesAvailable[removeIdx];

    // Compute the path of the underscore indicator to simulate hopping
    // It hops 'remainingCount' times
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
    startIndex = removeIdx; // Start from next element
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