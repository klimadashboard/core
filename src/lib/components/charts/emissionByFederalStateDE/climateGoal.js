const rules = {
  'Deutschland': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 88 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Baden-Württemberg': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 100 }
    ]
  },
  'Bayern': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 100 }
    ]
  },
  'Berlin': {
    type: 'GHG',
    goals: [
      { year: 2020, reduction: 40 },
      { year: 2030, reduction: 70 },
      { year: 2040, reduction: 90 },
      { year: 2045, reduction: 95 }
    ]
  },
  'Brandenburg': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 74 },
      { year: 2040, reduction: 96 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Bremen': {
    type: 'CO2',
    goals: [
      { year: 2023, reduction: 35 },
      { year: 2025, reduction: 41 },
      { year: 2027, reduction: 49 },
      { year: 2029, reduction: 57 },
      { year: 2030, reduction: 60 },
      { year: 2033, reduction: 85 },
      { year: 2038, reduction: 95 }
    ]
  },
  'Hamburg': {
    type: 'CO2',
    goals: [
      { year: 2030, reduction: 70 },
      { year: 2045, reduction: 98 }
    ]
  },
  'Hessen': {
    type: 'GHG',
    goals: [
      { year: 2025, reduction: 40 },
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 88 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Mecklenburg-Vorpommern': {
    type: 'GHG',
    goals: [
      { year: 2040, reduction: 100 }
    ]
  },
  'Niedersachsen': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 75 },
      { year: 2035, reduction: 90 },
      { year: 2040, reduction: 100 }
    ]
  },
  'Nordrhein-Westfalen': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 88 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Rheinland-Pfalz': {
    type: 'GHG',
    goals: [
      { year: 2020, reduction: 40 },
      { year: 2035, reduction: 100 },
      { year: 2040, reduction: 100 }
    ]
  },
  'Saarland': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 55 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Sachsen': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 88 },
      { year: 2045, reduction: 100 }
    ]
  },
  'Sachsen-Anhalt': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 35.7 } // Approximation based on 18 million tons goal
    ]
  },
  'Schleswig-Holstein': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 },
      { year: 2040, reduction: 100 }
    ]
  },
  'Thüringen': {
    type: 'GHG',
    goals: [
      { year: 2030, reduction: 65 }, // Average of 60-70%
      { year: 2040, reduction: 75 }, // Average of 70-80%
      { year: 2050, reduction: 87.5 } // Average of 80-95%
    ]
  }
};

export function getReductionGoal(federalState, year, gasType) {
  console.log(`Searching for: ${federalState}, ${year}, ${gasType}`); // Debug log

  if (!rules[federalState]) {
    return null; // Return null if the federal state is not found
  }

  if (rules[federalState].type !== gasType) {
    return null; // Return null if the gas type doesn't match
  }

  const stateGoals = rules[federalState].goals;
  let closestGoal = null;

  for (let goal of stateGoals) {
    if (goal.year <= year && (!closestGoal || goal.year > closestGoal.year)) {
      closestGoal = goal;
    }
  }

  if (closestGoal) {
    return closestGoal.reduction;
  } else {
    return null; // Return null if no applicable goal is found
  }
}

export function predictEmissionsToTarget(federalState, latestYear, latestValue, value1990, gasType) {
  const currentYear = new Date().getFullYear();
  const targetYear = 2030;
  const reductionGoal = getReductionGoal(federalState, targetYear, gasType);

  if (reductionGoal === null) {
    console.error(`No reduction goal found for ${federalState} in ${targetYear} for ${gasType}`);
    return null;
  }

  // Calculate the target value based on the 1990 value
  const targetValue = value1990 * (1 - reductionGoal / 100);

  // Calculate the total reduction needed from the latest value to the target
  const totalReduction = latestValue - targetValue;

  // Calculate the annual reduction
  const yearDifference = targetYear - latestYear;
  const annualReduction = totalReduction / yearDifference;

  console.log("Target value: ", targetValue, "Latest value: ", latestValue, "1990 value: ", value1990);

  let predictions = [];
  for (let year = latestYear; year <= targetYear; year++) {
    const predictedValue = latestValue - (annualReduction * (year - latestYear));
    const isPrediction = year > currentYear;
    predictions.push({
      year: year,
      value: Math.max(predictedValue, 0),  // Ensure we don't predict negative emissions
      label: year.toString(),
      color: isPrediction ? 'transparent' : 'black', // Transparent for predictions, black for actual data
      stroke: 'black', // Black stroke for all
      strokeWidth: isPrediction ? 2 : 1  // Thicker border for predictions
    });
  }

  return predictions;
}

export function getValue1990(data, selectedRegion, selectedGas) {
  const dataPoint1990 = data.find(d => d.region === selectedRegion && d.gastype === selectedGas && d.year === 1990);
  return dataPoint1990 ? dataPoint1990.value : null;
}

export function createCompleteDataset(rawData, selectedRegion, selectedGas) {
  if (!rawData || !selectedRegion || !selectedGas) return [];
  
  let filteredData = rawData.filter((d) => d.region === selectedRegion && d.gastype === selectedGas && d.sector === 'total');
  
  if (filteredData.length === 0) {
    return [];
  }

  // Rest of the function remains the same
  let years = filteredData.map(d => d.year);
  let minYear = Math.min(...years);
  let maxYear = Math.max(...years);

  let allYears = [];
  for (let year = minYear; year <= maxYear; year++) {
    allYears.push(year);
  }
  let data = filteredData.reduce((acc, e) => {
    acc[e.year] = e.value;
    return acc;
  }, {});

  let result = allYears.map((year) => ({
    label: year.toString(),
    value: data[year] !== undefined ? data[year] : null,
    estimate: "#000000",
    stroke: "#000000"
  }));

  if (selectedRegion === 'Bayern') {
    for (let year = 2021; year <= 2045; year++) {
      if (!result.find(d => d.label === year.toString())) {
        result.push({ label: year.toString(), value: null });
      }
    }
    result = result.map(d => {
      if (d.label === '2030') {
        return { label: '2030', value: 3000, estimate: "#000000", stroke: "#000000"};
      } else if (d.label === '2040') {
        return { label: '2040', value: 0, estimate: "#000000", stroke: "#000000"};
      } else if(d.label === '2045') {
        return { label: '2045', value: 0, estimate: "#000000", stroke: "#000000"};
      }
      return d;
    });
  }

  result.sort((a, b) => parseInt(a.label) - parseInt(b.label));

  return result.filter(d => d.value !== null);
}
