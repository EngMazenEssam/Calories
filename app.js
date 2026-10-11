/**
 * حاسبة أكلي - Nutrition Calculator Engine
 * Mobile-First, Offline-First Egyptian Arabic Nutrition Calculator for Pancake & Chicken Paneh
 */

// ==========================================================================
// 1. NUTRITION DATASET & CONSTANTS
// ==========================================================================

const NUTRITION_DATA = {
  // Pancake ingredients nutrition reference
  pancake: {
    oats: {
      name: 'شوفان',
      unit: 'جم',
      calPer100: 389.0,
      proteinPer100: 16.9,
      carbsPer100: 66.3,
      fatPer100: 6.9
    },
    yogurt: {
      regular: {
        id: 'regular',
        name: 'زبادي سادة عادي',
        calPer100: 61.0,
        proteinPer100: 3.5,
        carbsPer100: 4.7,
        fatPer100: 3.3
      },
      greek: {
        id: 'greek',
        name: 'زبادي يوناني سادة',
        calPer100: 97.0,
        proteinPer100: 9.0,
        carbsPer100: 3.6,
        fatPer100: 5.0
      },
      sweetened: {
        id: 'sweetened',
        name: 'زبادي محلى',
        calPer100: 102.0,
        proteinPer100: 3.2,
        carbsPer100: 17.5,
        fatPer100: 2.0
      }
    },
    egg: {
      name: 'بيض',
      unit: 'بيضة',
      calPerUnit: 72.0,
      proteinPerUnit: 6.3,
      carbsPerUnit: 0.4,
      fatPerUnit: 4.8
    },
    milk: {
      skim: {
        id: 'skim',
        name: 'لبن خالي الدسم',
        calPer100: 35.0,
        proteinPer100: 3.4,
        carbsPer100: 5.0,
        fatPer100: 0.1
      },
      lowFat: {
        id: 'lowFat',
        name: 'لبن قليل الدسم',
        calPer100: 46.0,
        proteinPer100: 3.3,
        carbsPer100: 4.8,
        fatPer100: 1.5
      },
      whole: {
        id: 'whole',
        name: 'لبن كامل الدسم',
        calPer100: 62.0,
        proteinPer100: 3.2,
        carbsPer100: 4.8,
        fatPer100: 3.5
      }
    },
    vanilla: {
      name: 'فانيليا',
      unit: 'مل',
      calPerUnit: 3.0,
      proteinPerUnit: 0.01,
      carbsPerUnit: 0.5,
      fatPerUnit: 0.0
    },
    bakingPowder: {
      name: 'بيكنج بودر',
      unit: 'جم',
      calPerUnit: 0.533, // ~1.6 kcal per 3g
      proteinPerUnit: 0.0,
      carbsPerUnit: 0.28, // ~0.84g carbs per 3g
      fatPerUnit: 0.0
    },
    oil: {
      name: 'زيت تسوية',
      unit: 'جم',
      calPer100: 884.0, // 8.84 kcal / g
      proteinPer100: 0.0,
      carbsPer100: 0.0,
      fatPer100: 100.0 // 1g fat / g
    }
  },

  // Chicken Paneh standard reference & calculations
  chicken: {
    // 1,000 g raw boneless, skinless chicken breast = 1,200 kcal & 225 g protein
    rawReferenceWeight: 1000,
    rawCalories: 1200.0,
    rawProtein: 225.0,
    rawCarbs: 0.0,
    rawFat: 33.33,

    // Cooking oil options for entire batch
    oilOptions: {
      none: { id: 'none', grams: 0, calories: 0.0, fat: 0.0, label: 'بدون زيت' },
      oil15: { id: 'oil15', grams: 15, calories: 133.0, fat: 15.0, label: '15 جم زيت' },
      oil20: { id: 'oil20', grams: 20, calories: 177.0, fat: 20.0, label: '20 جم زيت' }
    },

    // Boiled basmati rice per 100g cooked
    basmatiRicePer100gCooked: {
      calories: 130.0,
      protein: 2.7,
      carbs: 28.0,
      fat: 0.3
    }
  }
};

const STORAGE_KEY = 'akli_calc_meals_db_v1';

// Exact default state specs
const DEFAULT_PANCAKE_INPUTS = {
  oats: 60,
  yogurtType: 'regular',
  yogurtGrams: 100,
  egg: 1,
  milkType: 'skim',
  milkMl: 100,
  vanilla: 1,
  bakingPowder: 3,
  sweetenerHasCals: false,
  sweetenerCals: 0,
  oil: 0
};

const DEFAULT_CHICKEN_INPUTS = {
  rawWeight: 1000,
  cookedTotal: 620,
  oilOpt: 'none',
  portionWeight: 200,
  riceWeight: 150
};

// Default Quick Presets for 1-Click Logging (Meal Prep)
const DEFAULT_PRESETS = [
  {
    id: 'preset_chicken_5days',
    recipeType: 'chicken',
    mealType: 'lunch',
    title: 'وجبة بانيه وأرز (تجهيز 5 أيام)',
    snapshot: {
      calories: 582.1,
      protein: 76.6,
      carbs: 42.0,
      fat: 11.2
    },
    details: {
      rawWeight: 1000,
      cookedTotal: 620,
      oilOpt: 'none',
      portionWeight: 200,
      riceWeight: 150
    }
  },
  {
    id: 'preset_pancake_classic',
    recipeType: 'pancake',
    mealType: 'breakfast',
    title: 'بانكيك شوفان صحي كلاسيكي',
    snapshot: {
      calories: 406.0,
      protein: 23.3,
      carbs: 51.2,
      fat: 12.3
    },
    details: {
      oats: 60,
      yogurtType: 'regular',
      yogurtGrams: 100,
      egg: 1,
      milkType: 'skim',
      milkMl: 100,
      vanilla: 1,
      bakingPowder: 3,
      sweetenerHasCals: false,
      sweetenerCals: 0,
      oil: 0
    }
  }
];

// ==========================================================================
// 2. STATE MANAGEMENT & LOCAL STORAGE
// ==========================================================================

let activeDate = getTodayDateString();
let activeView = 'home';
let editingMealId = null; // null when creating, string ID when updating

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: 1,
        meals: [],
        presets: [...DEFAULT_PRESETS],
        settings: { dailyCalorieGoal: 2000 }
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.meals)) {
      return {
        version: 1,
        meals: [],
        presets: [...DEFAULT_PRESETS],
        settings: { dailyCalorieGoal: 2000 }
      };
    }
    if (!Array.isArray(parsed.presets) || parsed.presets.length === 0) {
      parsed.presets = [...DEFAULT_PRESETS];
    }
    if (!parsed.settings || typeof parsed.settings.dailyCalorieGoal !== 'number') {
      parsed.settings = { dailyCalorieGoal: 2000 };
    }
    return parsed;
  } catch (err) {
    console.warn('Error reading localStorage data, initializing empty database:', err);
    return {
      version: 1,
      meals: [],
      presets: [...DEFAULT_PRESETS],
      settings: { dailyCalorieGoal: 2000 }
    };
  }
}

function saveDatabase(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    showToast('فشل في حفظ البيانات في ذاكرة الهاتف!', 'danger');
    return false;
  }
}

// ==========================================================================
// 3. PANCAKE CALCULATIONS
// ==========================================================================

function getPancakeFormValues() {
  const oats = parseFloat(document.getElementById('pc-oats').value) || 0;
  const yogurtTypeRadio = document.querySelector('input[name="pc-yogurt-type"]:checked');
  const yogurtType = yogurtTypeRadio ? yogurtTypeRadio.value : 'regular';
  const yogurtGrams = parseFloat(document.getElementById('pc-yogurt').value) || 0;
  const egg = parseFloat(document.getElementById('pc-egg').value) || 0;
  const milkTypeRadio = document.querySelector('input[name="pc-milk-type"]:checked');
  const milkType = milkTypeRadio ? milkTypeRadio.value : 'skim';
  const milkMl = parseFloat(document.getElementById('pc-milk').value) || 0;
  const vanilla = parseFloat(document.getElementById('pc-vanilla').value) || 0;
  const bakingPowder = parseFloat(document.getElementById('pc-bp').value) || 0;
  const sweetenerHasCals = document.getElementById('pc-sweetener-has-cals').checked;
  const sweetenerCals = sweetenerHasCals ? (parseFloat(document.getElementById('pc-sweetener-cals').value) || 0) : 0;
  const oil = parseFloat(document.getElementById('pc-oil').value) || 0;

  return {
    oats,
    yogurtType,
    yogurtGrams,
    egg,
    milkType,
    milkMl,
    vanilla,
    bakingPowder,
    sweetenerHasCals,
    sweetenerCals,
    oil
  };
}

function calculatePancakeNutrition(vals) {
  const pData = NUTRITION_DATA.pancake;

  // 1. Oats
  const oatsFactor = vals.oats / 100;
  const oatsCals = oatsFactor * pData.oats.calPer100;
  const oatsP = oatsFactor * pData.oats.proteinPer100;
  const oatsC = oatsFactor * pData.oats.carbsPer100;
  const oatsF = oatsFactor * pData.oats.fatPer100;

  // 2. Yogurt
  const yogRef = pData.yogurt[vals.yogurtType] || pData.yogurt.regular;
  const yogFactor = vals.yogurtGrams / 100;
  const yogCals = yogFactor * yogRef.calPer100;
  const yogP = yogFactor * yogRef.proteinPer100;
  const yogC = yogFactor * yogRef.carbsPer100;
  const yogF = yogFactor * yogRef.fatPer100;

  // 3. Egg
  const eggCals = vals.egg * pData.egg.calPerUnit;
  const eggP = vals.egg * pData.egg.proteinPerUnit;
  const eggC = vals.egg * pData.egg.carbsPerUnit;
  const eggF = vals.egg * pData.egg.fatPerUnit;

  // 4. Milk
  const milkRef = pData.milk[vals.milkType] || pData.milk.skim;
  const milkFactor = vals.milkMl / 100;
  const milkCals = milkFactor * milkRef.calPer100;
  const milkP = milkFactor * milkRef.proteinPer100;
  const milkC = milkFactor * milkRef.carbsPer100;
  const milkF = milkFactor * milkRef.fatPer100;

  // 5. Vanilla
  const vanCals = vals.vanilla * pData.vanilla.calPerUnit;
  const vanP = vals.vanilla * pData.vanilla.proteinPerUnit;
  const vanC = vals.vanilla * pData.vanilla.carbsPerUnit;
  const vanF = 0;

  // 6. Baking Powder
  const bpCals = vals.bakingPowder * pData.bakingPowder.calPerUnit;
  const bpP = 0;
  const bpC = vals.bakingPowder * pData.bakingPowder.carbsPerUnit;
  const bpF = 0;

  // 7. Diet sweetener
  const swCals = vals.sweetenerHasCals ? vals.sweetenerCals : 0;

  // 8. Oil
  const oilFactor = vals.oil / 100;
  const oilCals = oilFactor * pData.oil.calPer100;
  const oilP = 0;
  const oilC = 0;
  const oilF = vals.oil * 1.0;

  // Aggregated totals
  const totalCals = oatsCals + yogCals + eggCals + milkCals + vanCals + bpCals + swCals + oilCals;
  const totalP = oatsP + yogP + eggP + milkP + vanP + bpP;
  const totalC = oatsC + yogC + eggC + milkC + vanC + bpC;
  const totalF = oatsF + yogF + eggF + milkF + vanF + bpF + oilF;

  return {
    total: {
      calories: Math.round(totalCals * 10) / 10,
      protein: Math.round(totalP * 10) / 10,
      carbs: Math.round(totalC * 10) / 10,
      fat: Math.round(totalF * 10) / 10
    },
    items: {
      oats: { cals: oatsCals, p: oatsP, c: oatsC, f: oatsF },
      yogurt: { cals: yogCals, p: yogP, c: yogC, f: yogF, name: yogRef.name },
      egg: { cals: eggCals, p: eggP, c: eggC, f: eggF },
      milk: { cals: milkCals, p: milkP, c: milkC, f: milkF, name: milkRef.name },
      vanilla: { cals: vanCals, p: vanP, c: vanC, f: vanF },
      bakingPowder: { cals: bpCals, p: bpP, c: bpC, f: bpF },
      sweetener: { cals: swCals },
      oil: { cals: oilCals, f: oilF }
    }
  };
}

function updatePancakeUI() {
  const vals = getPancakeFormValues();
  const res = calculatePancakeNutrition(vals);

  // Update sticky header
  document.getElementById('pc-live-cals').textContent = Math.round(res.total.calories);
  document.getElementById('pc-live-p').textContent = res.total.protein.toFixed(1);
  document.getElementById('pc-live-c').textContent = res.total.carbs.toFixed(1);
  document.getElementById('pc-live-f').textContent = res.total.fat.toFixed(1);

  // Update item badges
  document.getElementById('pc-oats-info').textContent = 
    `${Math.round(res.items.oats.cals)} ك | ${res.items.oats.p.toFixed(1)} بروتين`;

  document.getElementById('pc-yogurt-info').textContent = 
    `${Math.round(res.items.yogurt.cals)} ك | ${res.items.yogurt.p.toFixed(1)} بروتين`;

  document.getElementById('pc-egg-info').textContent = 
    `${Math.round(res.items.egg.cals)} ك | ${res.items.egg.p.toFixed(1)} بروتين`;

  document.getElementById('pc-milk-info').textContent = 
    `${Math.round(res.items.milk.cals)} ك | ${res.items.milk.p.toFixed(1)} بروتين`;

  document.getElementById('pc-vanilla-info').textContent = 
    `${res.items.vanilla.cals.toFixed(1)} ك`;

  document.getElementById('pc-bp-info').textContent = 
    `${res.items.bakingPowder.cals.toFixed(1)} ك`;

  document.getElementById('pc-sweetener-info').textContent = 
    vals.sweetenerHasCals ? `${Math.round(vals.sweetenerCals)} ك` : '0 ك';

  document.getElementById('pc-oil-info').textContent = 
    `${Math.round(res.items.oil.cals)} ك | ${res.items.oil.f.toFixed(1)} دهون`;

  // Render breakdown details accordion
  const breakdownContainer = document.getElementById('pc-breakdown-details');
  if (breakdownContainer) {
    breakdownContainer.innerHTML = `
      <div class="detail-line">
        <span>🌾 الشوفان (${vals.oats} جم):</span>
        <strong>${Math.round(res.items.oats.cals)} ك (بروتين ${res.items.oats.p.toFixed(1)}g | كارب ${res.items.oats.c.toFixed(1)}g)</strong>
      </div>
      <div class="detail-line">
        <span>🥛 ${res.items.yogurt.name} (${vals.yogurtGrams} جم):</span>
        <strong>${Math.round(res.items.yogurt.cals)} ك (بروتين ${res.items.yogurt.p.toFixed(1)}g | كارب ${res.items.yogurt.c.toFixed(1)}g)</strong>
      </div>
      <div class="detail-line">
        <span>🥚 البيض (${vals.egg} بيضة):</span>
        <strong>${Math.round(res.items.egg.cals)} ك (بروتين ${res.items.egg.p.toFixed(1)}g | دهون ${res.items.egg.f.toFixed(1)}g)</strong>
      </div>
      <div class="detail-line">
        <span>🥛 ${res.items.milk.name} (${vals.milkMl} مل):</span>
        <strong>${Math.round(res.items.milk.cals)} ك (بروتين ${res.items.milk.p.toFixed(1)}g | كارب ${res.items.milk.c.toFixed(1)}g)</strong>
      </div>
      <div class="detail-line">
        <span>🌿 فانيليا (${vals.vanilla} مل):</span>
        <strong>${res.items.vanilla.cals.toFixed(1)} ك</strong>
      </div>
      <div class="detail-line">
        <span>🥄 بيكنج بودر (${vals.bakingPowder} جم):</span>
        <strong>${res.items.bakingPowder.cals.toFixed(1)} ك (كارب ${res.items.bakingPowder.c.toFixed(1)}g)</strong>
      </div>
      <div class="detail-line">
        <span>✨ سكر دايت:</span>
        <strong>${res.items.sweetener.cals} ك</strong>
      </div>
      <div class="detail-line">
        <span>🫒 زيت تسوية (${vals.oil} جم):</span>
        <strong>${Math.round(res.items.oil.cals)} ك (دهون ${res.items.oil.f.toFixed(1)}g)</strong>
      </div>
    `;
  }

  // Update preset chip states
  updateChipActiveState('pc-oats', vals.oats);
  updateChipActiveState('pc-yogurt', vals.yogurtGrams);
  updateChipActiveState('pc-egg', vals.egg);
  updateChipActiveState('pc-milk', vals.milkMl);
  updateChipActiveState('pc-oil', vals.oil);
}

function resetPancakeDefaults() {
  document.getElementById('pc-oats').value = DEFAULT_PANCAKE_INPUTS.oats;
  const yogRadio = document.querySelector(`input[name="pc-yogurt-type"][value="${DEFAULT_PANCAKE_INPUTS.yogurtType}"]`);
  if (yogRadio) yogRadio.checked = true;
  document.getElementById('pc-yogurt').value = DEFAULT_PANCAKE_INPUTS.yogurtGrams;
  document.getElementById('pc-egg').value = DEFAULT_PANCAKE_INPUTS.egg;
  const milkRadio = document.querySelector(`input[name="pc-milk-type"][value="${DEFAULT_PANCAKE_INPUTS.milkType}"]`);
  if (milkRadio) milkRadio.checked = true;
  document.getElementById('pc-milk').value = DEFAULT_PANCAKE_INPUTS.milkMl;
  document.getElementById('pc-vanilla').value = DEFAULT_PANCAKE_INPUTS.vanilla;
  document.getElementById('pc-bp').value = DEFAULT_PANCAKE_INPUTS.bakingPowder;
  document.getElementById('pc-sweetener-has-cals').checked = DEFAULT_PANCAKE_INPUTS.sweetenerHasCals;
  document.getElementById('pc-sweetener-cals').value = DEFAULT_PANCAKE_INPUTS.sweetenerCals;
  document.getElementById('pc-sweetener-custom-box').style.display = 'none';
  document.getElementById('pc-oil').value = DEFAULT_PANCAKE_INPUTS.oil;

  updatePancakeUI();
  showToast('تمت إعادة ضبط مقادير البانكيك للقيم الأصلية');
}

// ==========================================================================
// 4. CHICKEN PANEH & BASMATI RICE CALCULATIONS
// ==========================================================================

function getChickenFormValues() {
  const rawWeight = parseFloat(document.getElementById('ck-raw-weight').value) || 0;
  const cookedTotal = parseFloat(document.getElementById('ck-cooked-total').value) || 0;
  const oilRadio = document.querySelector('input[name="ck-oil-opt"]:checked');
  const oilOpt = oilRadio ? oilRadio.value : 'none';
  const portionWeight = parseFloat(document.getElementById('ck-portion-weight').value) || 0;
  const riceWeight = parseFloat(document.getElementById('ck-rice-weight').value) || 0;

  return {
    rawWeight,
    cookedTotal,
    oilOpt,
    portionWeight,
    riceWeight
  };
}

function calculateChickenNutrition(vals) {
  const ckData = NUTRITION_DATA.chicken;

  // 1. Raw chicken batch totals
  // 1,000 g raw = 1,200 kcal & 225 g protein
  const rawFactor = vals.rawWeight / 1000;
  const batchChickenCals = rawFactor * ckData.rawCalories;
  const batchChickenProtein = rawFactor * ckData.rawProtein;
  const batchChickenCarbs = 0;
  const batchChickenFat = rawFactor * ckData.rawFat;

  // 2. Batch oil totals
  const oilRef = ckData.oilOptions[vals.oilOpt] || ckData.oilOptions.none;
  const batchOilCals = oilRef.calories;
  const batchOilFat = oilRef.fat;
  const batchOilGrams = oilRef.grams;

  // 3. Proportion of portion from total cooked weight
  // If user cooked 620g and eats 200g, portion ratio = 200 / 620
  const portionRatio = vals.cookedTotal > 0 ? (vals.portionWeight / vals.cookedTotal) : 0;

  // 4. Portion Chicken Nutrition
  const portionChickenCals = batchChickenCals * portionRatio;
  const portionChickenProtein = batchChickenProtein * portionRatio;
  const portionChickenCarbs = 0;
  const portionChickenFat = batchChickenFat * portionRatio;

  // 5. Portion Proportional Oil Allocation
  const portionOilCals = batchOilCals * portionRatio;
  const portionOilFat = batchOilFat * portionRatio;
  const portionOilGrams = batchOilGrams * portionRatio;

  // 6. Basmati Rice Nutrition (independent cooked weight)
  // Per 100g cooked: 130 kcal, 2.7g P, 28g C, 0.3g F
  const riceFactor = vals.riceWeight / 100;
  const riceCals = riceFactor * ckData.basmatiRicePer100gCooked.calories;
  const riceProtein = riceFactor * ckData.basmatiRicePer100gCooked.protein;
  const riceCarbs = riceFactor * ckData.basmatiRicePer100gCooked.carbs;
  const riceFat = riceFactor * ckData.basmatiRicePer100gCooked.fat;

  // 7. Combined Meal Totals
  const totalCals = portionChickenCals + portionOilCals + riceCals;
  const totalProtein = portionChickenProtein + riceProtein;
  const totalCarbs = portionChickenCarbs + riceCarbs;
  const totalFat = portionChickenFat + portionOilFat + riceFat;

  // Yield info
  const yieldPercent = vals.rawWeight > 0 ? ((vals.cookedTotal / vals.rawWeight) * 100) : 0;
  const rawEquivForPortion = portionRatio * vals.rawWeight;

  return {
    total: {
      calories: Math.round(totalCals * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    },
    chicken: {
      calories: Math.round(portionChickenCals * 10) / 10,
      protein: Math.round(portionChickenProtein * 10) / 10,
      fat: Math.round(portionChickenFat * 10) / 10,
      rawEquiv: Math.round(rawEquivForPortion)
    },
    oil: {
      calories: Math.round(portionOilCals * 10) / 10,
      fat: Math.round(portionOilFat * 10) / 10,
      grams: Math.round(portionOilGrams * 10) / 10
    },
    rice: {
      calories: Math.round(riceCals * 10) / 10,
      protein: Math.round(riceProtein * 10) / 10,
      carbs: Math.round(riceCarbs * 10) / 10,
      fat: Math.round(riceFat * 10) / 10
    },
    meta: {
      portionRatio: (portionRatio * 100).toFixed(1),
      yieldPercent: yieldPercent.toFixed(1),
      batchTotalCals: Math.round(batchChickenCals + batchOilCals)
    }
  };
}

function updateChickenUI() {
  const vals = getChickenFormValues();
  const res = calculateChickenNutrition(vals);

  // Update sticky live header
  document.getElementById('ck-live-cals').textContent = Math.round(res.total.calories);
  document.getElementById('ck-live-p').textContent = res.total.protein.toFixed(1);
  document.getElementById('ck-live-c').textContent = res.total.carbs.toFixed(1);
  document.getElementById('ck-live-f').textContent = res.total.fat.toFixed(1);

  // Update batch info badges
  document.getElementById('ck-raw-info').textContent = 
    `${Math.round(vals.rawWeight * 1.2)} ك إجمالي النيء`;

  document.getElementById('ck-yield-badge').textContent = 
    `نسبة الاستواء: ${res.meta.yieldPercent}%`;

  const oilRef = NUTRITION_DATA.chicken.oilOptions[vals.oilOpt] || NUTRITION_DATA.chicken.oilOptions.none;
  document.getElementById('ck-oil-info').textContent = 
    `${oilRef.calories} ك إجمالي الزيت للطبخة`;

  // Update portion badges
  document.getElementById('ck-portion-ratio-badge').textContent = 
    `نصيبك: ${res.meta.portionRatio}% من الطبخة`;

  document.getElementById('ck-rice-info').textContent = 
    `${Math.round(res.rice.calories)} ك | ${res.rice.carbs.toFixed(1)} كارب`;

  // Update 3 Output Breakdown Cards
  document.getElementById('ck-out-chicken-cals').textContent = `${Math.round(res.chicken.calories)} ك`;
  document.getElementById('ck-out-chicken-raw-equiv').textContent = `تعادل ~${res.chicken.rawEquiv} جم نيء`;

  document.getElementById('ck-out-oil-cals').textContent = `${Math.round(res.oil.calories)} ك`;
  document.getElementById('ck-out-oil-grams').textContent = `نصيبك: ~${res.oil.grams} جم زيت`;

  document.getElementById('ck-out-rice-cals').textContent = `${Math.round(res.rice.calories)} ك`;
  document.getElementById('ck-out-rice-carbs').textContent = `كارب الأرز: ${res.rice.carbs.toFixed(1)} جم`;

  document.getElementById('ck-out-total-cals').textContent = `${Math.round(res.total.calories)} ك`;

  // Update Total Macros Row
  document.getElementById('ck-out-protein').textContent = res.total.protein.toFixed(1);
  document.getElementById('ck-out-carbs').textContent = res.total.carbs.toFixed(1);
  document.getElementById('ck-out-fat').textContent = res.total.fat.toFixed(1);

  // Update preset chip states
  updateChipActiveState('ck-raw-weight', vals.rawWeight);
  updateChipActiveState('ck-portion-weight', vals.portionWeight);
  updateChipActiveState('ck-rice-weight', vals.riceWeight);
}

function resetChickenDefaults() {
  document.getElementById('ck-raw-weight').value = DEFAULT_CHICKEN_INPUTS.rawWeight;
  document.getElementById('ck-cooked-total').value = DEFAULT_CHICKEN_INPUTS.cookedTotal;
  const oilRadio = document.querySelector(`input[name="ck-oil-opt"][value="${DEFAULT_CHICKEN_INPUTS.oilOpt}"]`);
  if (oilRadio) oilRadio.checked = true;
  document.getElementById('ck-portion-weight').value = DEFAULT_CHICKEN_INPUTS.portionWeight;
  document.getElementById('ck-rice-weight').value = DEFAULT_CHICKEN_INPUTS.riceWeight;

  updateChickenUI();
  showToast('تمت إعادة ضبط حاسبة البانيه للقيم الأصلية');
}

// ==========================================================================
// 5. VIEW MANAGEMENT & ROUTING
// ==========================================================================

function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.remove('active');
  });

  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.add('active');
  }

  // Scroll smoothly to top on view change
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'home') {
    renderDailyHistory();
  } else if (viewName === 'pancake') {
    updatePancakeUI();
    document.getElementById('pc-save-date').value = activeDate;
  } else if (viewName === 'chicken') {
    updateChickenUI();
    document.getElementById('ck-save-date').value = activeDate;
  }
}

// ==========================================================================
// 6. DAILY LOGGING, SUMMARY & DATE NAVIGATION
// ==========================================================================

function formatArabicDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);

  const todayStr = getTodayDateString();
  if (dateStr === todayStr) {
    return 'النهاردة 📅';
  }

  const daysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthsArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return `${daysArabic[dateObj.getDay()]}، ${day} ${monthsArabic[month]}`;
}

function setActiveDate(newDateStr) {
  activeDate = newDateStr;
  document.getElementById('date-picker-input').value = activeDate;
  document.getElementById('date-display-text').textContent = formatArabicDate(activeDate);

  const todayStr = getTodayDateString();
  document.getElementById('date-display-label').textContent = 
    (activeDate === todayStr) ? 'سجل النهاردة' : 'سجل يوم';

  renderDailyHistory();
}

function shiftActiveDate(days) {
  const parts = activeDate.split('-');
  const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  dateObj.setDate(dateObj.getDate() + days);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  setActiveDate(`${year}-${month}-${day}`);
}

function getMealsForActiveDate() {
  const db = loadDatabase();
  return db.meals.filter((m) => m.date === activeDate);
}

function renderDailyHistory() {
  const db = loadDatabase();
  const dayMeals = db.meals.filter((m) => m.date === activeDate);

  // Calculate Daily Totals
  let totalCals = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;

  dayMeals.forEach((meal) => {
    totalCals += meal.snapshot.calories;
    totalP += meal.snapshot.protein;
    totalC += meal.snapshot.carbs;
    totalF += meal.snapshot.fat;
  });

  // Render Daily Totals in Hero Donut Chart
  document.getElementById('summary-total-cals').textContent = Math.round(totalCals).toLocaleString('en-US');
  document.getElementById('summary-total-protein').textContent = totalP.toFixed(1);
  document.getElementById('summary-total-carbs').textContent = totalC.toFixed(1);
  document.getElementById('summary-total-fat').textContent = totalF.toFixed(1);
  document.getElementById('summary-meal-count').textContent = `${dayMeals.length} ${getArabicMealCount(dayMeals.length)}`;

  // Update Macro Ratio Bar Visual
  const pCals = totalP * 4;
  const cCals = totalC * 4;
  const fCals = totalF * 9;
  const sumMacroCals = pCals + cCals + fCals;

  const barP = document.getElementById('ratio-protein-bar');
  const barC = document.getElementById('ratio-carbs-bar');
  const barF = document.getElementById('ratio-fat-bar');

  if (sumMacroCals > 0) {
    barP.style.width = `${((pCals / sumMacroCals) * 100).toFixed(1)}%`;
    barC.style.width = `${((cCals / sumMacroCals) * 100).toFixed(1)}%`;
    barF.style.width = `${((fCals / sumMacroCals) * 100).toFixed(1)}%`;
  } else {
    barP.style.width = '33.3%';
    barC.style.width = '33.3%';
    barF.style.width = '33.4%';
  }

  // Render Interactive Macro Donut Chart
  const dailyGoal = (db.settings && db.settings.dailyCalorieGoal) || 2000;
  renderMacroChart(totalCals, totalP, totalC, totalF, dailyGoal);

  // Render 1-Click Quick Add Presets (Meal Prep)
  renderQuickPresets();

  // Render Meals List
  const mealsListEl = document.getElementById('meals-list');
  if (dayMeals.length === 0) {
    mealsListEl.innerHTML = `
      <div class="empty-meals-card">
        <span class="empty-icon">🍽️</span>
        <strong style="color: var(--text-primary);">مفيش وجبات متسجلة لتاريخ اليوم</strong>
        <p>اضغط على كارت البانكيك أو البانيه فوق، أو استخدم أزرار "الإضافة السريعة بنقرة واحدة" فوق لإضافة وجبتك فوراً.</p>
      </div>
    `;
    document.getElementById('meals-status-text').textContent = '';
  } else {
    document.getElementById('meals-status-text').textContent = `${dayMeals.length} وجبات مسجلة`;
    mealsListEl.innerHTML = dayMeals.map((meal) => {
      const recipeIcon = meal.recipeType === 'pancake' ? '🥞' : '🍗';
      const mealTypeLabels = {
        breakfast: 'فطار',
        lunch: 'غداء',
        dinner: 'عشاء',
        snack: 'سناك'
      };
      const typeLabel = mealTypeLabels[meal.mealType] || 'وجبة';

      let detailsHtml = '';
      if (meal.recipeType === 'pancake') {
        detailsHtml = `شوفان: ${meal.details.oats} جم • زبادي: ${meal.details.yogurtGrams} جم • بيض: ${meal.details.egg} • لبن: ${meal.details.milkMl} مل`;
      } else {
        detailsHtml = `فراخ مستوية: ${meal.details.portionWeight} جم • أرز بسمتي: ${meal.details.riceWeight} جم`;
      }

      return `
        <div class="meal-entry-card" data-id="${meal.id}">
          <div class="meal-entry-top">
            <div class="meal-entry-title-wrap">
              <span class="meal-recipe-tag">${recipeIcon}</span>
              <div>
                <div class="meal-title-text">${escapeHtml(meal.title)}</div>
                <div class="meal-time-tag">${meal.time || ''}</div>
              </div>
            </div>
            <div class="meal-entry-actions">
              <span class="meal-type-pill ${meal.mealType}">${typeLabel}</span>
              <button class="btn-icon-action btn-star-preset" data-id="${meal.id}" title="حفظ في قائمة الوجبات السريعة (Meal Prep)">⭐</button>
              <button class="btn-icon-action btn-edit-meal" data-id="${meal.id}" title="تعديل الوجبة">✏️</button>
              <button class="btn-icon-action delete btn-delete-meal" data-id="${meal.id}" title="حذف الوجبة">🗑️</button>
            </div>
          </div>

          <div class="meal-details-snippet">${detailsHtml}</div>

          <div class="meal-entry-macros">
            <div class="macro-metric metric-cal">
              <span>سعرات:</span>
              <strong>${Math.round(meal.snapshot.calories)} ك</strong>
            </div>
            <div class="macro-metric metric-p">
              <span>بروتين:</span>
              <strong>${meal.snapshot.protein.toFixed(1)}g</strong>
            </div>
            <div class="macro-metric metric-c">
              <span>كارب:</span>
              <strong>${meal.snapshot.carbs.toFixed(1)}g</strong>
            </div>
            <div class="macro-metric metric-f">
              <span>دهون:</span>
              <strong>${meal.snapshot.fat.toFixed(1)}g</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render recent dates chips
  renderRecentDatesChips(db);
}

// ==========================================================================
// 6.1 MACRO DONUT CHART & PRESETS LOGIC
// ==========================================================================

function renderMacroChart(cals, p, c, f, goal = 2000) {
  // Update goal value on top button
  const goalEl = document.getElementById('summary-goal-val');
  if (goalEl) goalEl.textContent = goal.toLocaleString('en-US');

  // Outer Goal Ring (Radius 70, Circumference = 2 * PI * 70 = 439.82)
  const goalRing = document.getElementById('donut-goal-ring');
  const goalPercentText = document.getElementById('donut-goal-percent-text');
  const cGoal = 439.82;
  const goalRatio = goal > 0 ? (cals / goal) : 0;
  const clampedGoalRatio = Math.min(goalRatio, 1.0);
  const goalOffset = cGoal - (clampedGoalRatio * cGoal);

  if (goalRing) {
    goalRing.style.strokeDasharray = `${cGoal} ${cGoal}`;
    goalRing.style.strokeDashoffset = `${goalOffset}`;
  }

  if (goalPercentText) {
    const pct = Math.round(goalRatio * 100);
    goalPercentText.textContent = `${pct}% من الهدف`;
  }

  // Inner Macro Donut (Radius 57, Circumference = 2 * PI * 57 = 358.14)
  const cMacro = 358.14;
  const segP = document.getElementById('donut-seg-protein');
  const segC = document.getElementById('donut-seg-carbs');
  const segF = document.getElementById('donut-seg-fat');

  const pCals = p * 4;
  const cCals = c * 4;
  const fCals = f * 9;
  const totalMacroCals = pCals + cCals + fCals;

  let pctP = 0, pctC = 0, pctF = 0;
  let lenP = 0, lenC = 0, lenF = 0;

  if (totalMacroCals > 0) {
    const shareP = pCals / totalMacroCals;
    const shareC = cCals / totalMacroCals;
    const shareF = fCals / totalMacroCals;

    pctP = Math.round(shareP * 100);
    pctC = Math.round(shareC * 100);
    pctF = Math.round(shareF * 100);

    lenP = shareP * cMacro;
    lenC = shareC * cMacro;
    lenF = shareF * cMacro;

    if (segP) {
      segP.style.strokeDasharray = `${lenP} ${cMacro}`;
      segP.style.strokeDashoffset = `0`;
    }
    if (segC) {
      segC.style.strokeDasharray = `${lenC} ${cMacro}`;
      segC.style.strokeDashoffset = `${-lenP}`;
    }
    if (segF) {
      segF.style.strokeDasharray = `${lenF} ${cMacro}`;
      segF.style.strokeDashoffset = `${-(lenP + lenC)}`;
    }
  } else {
    if (segP) segP.style.strokeDasharray = `0 ${cMacro}`;
    if (segC) segC.style.strokeDasharray = `0 ${cMacro}`;
    if (segF) segF.style.strokeDasharray = `0 ${cMacro}`;
  }

  // Legend percentages & values
  const pctElP = document.getElementById('pct-protein');
  const pctElC = document.getElementById('pct-carbs');
  const pctElF = document.getElementById('pct-fat');
  if (pctElP) pctElP.textContent = `${pctP}%`;
  if (pctElC) pctElC.textContent = `${pctC}%`;
  if (pctElF) pctElF.textContent = `${pctF}%`;

  const legValP = document.getElementById('legend-val-protein');
  const legValC = document.getElementById('legend-val-carbs');
  const legValF = document.getElementById('legend-val-fat');
  if (legValP) legValP.textContent = `${p.toFixed(1)} جم`;
  if (legValC) legValC.textContent = `${c.toFixed(1)} جم`;
  if (legValF) legValF.textContent = `${f.toFixed(1)} جم`;
}

function renderQuickPresets() {
  const container = document.getElementById('presets-list');
  if (!container) return;

  const db = loadDatabase();
  const presets = db.presets || [];

  if (presets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 12px; background: var(--bg-card); border-radius: var(--radius-md);">
        مفيش وجبات مجهزة محفوظة حالياً. احسب أي وجبة واضغط "حفظ كوجبة سريعة" لتظهر هنا!
      </div>
    `;
    return;
  }

  container.innerHTML = presets.map((preset) => {
    const isChicken = preset.recipeType === 'chicken';
    const icon = isChicken ? '🍗' : '🥞';

    let subtitle = '';
    if (isChicken) {
      subtitle = `${preset.details.portionWeight} جم دجاج مستوي • ${preset.details.riceWeight} جم أرز بسمتي`;
    } else {
      subtitle = `${preset.details.oats} جم شوفان • ${preset.details.yogurtGrams} جم زبادي • ${preset.details.milkMl} مل لبن`;
    }

    return `
      <div class="preset-card" data-id="${preset.id}">
        <div class="preset-card-top">
          <div class="preset-title-wrap">
            <span class="preset-badge-icon">${icon}</span>
            <div>
              <div class="preset-title-text">${escapeHtml(preset.title)}</div>
              <div class="preset-subtitle-text">${subtitle}</div>
            </div>
          </div>
          <div class="preset-card-actions">
            <button class="preset-delete-btn" data-id="${preset.id}" title="حذف هذه الوجبة المجهزة">✕</button>
          </div>
        </div>

        <div class="preset-macros-row">
          <div class="macro-metric metric-cal">
            <span>سعرات:</span>
            <strong>${Math.round(preset.snapshot.calories)} ك</strong>
          </div>
          <div class="macro-metric metric-p">
            <span>بروتين:</span>
            <strong>${preset.snapshot.protein.toFixed(1)}g</strong>
          </div>
          <div class="macro-metric metric-c">
            <span>كارب:</span>
            <strong>${preset.snapshot.carbs.toFixed(1)}g</strong>
          </div>
          <div class="macro-metric metric-f">
            <span>دهون:</span>
            <strong>${preset.snapshot.fat.toFixed(1)}g</strong>
          </div>
        </div>

        <button class="btn-quick-add" data-id="${preset.id}" type="button">
          <span>⚡ + أضف لليوم بنقرة واحدة (${formatArabicDate(activeDate)})</span>
        </button>
      </div>
    `;
  }).join('');
}

function quickAddPreset(presetId) {
  const db = loadDatabase();
  const preset = (db.presets || []).find((p) => p.id === presetId);
  if (!preset) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newMeal = {
    id: `${preset.recipeType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: activeDate,
    time: timeStr,
    recipeType: preset.recipeType,
    mealType: preset.mealType || (preset.recipeType === 'pancake' ? 'breakfast' : 'lunch'),
    title: preset.title,
    snapshot: { ...preset.snapshot },
    details: { ...preset.details }
  };

  db.meals.push(newMeal);
  saveDatabase(db);
  renderDailyHistory();
  showToast(`✓ تم إضافة "${preset.title}" لسجل اليوم بنقرة واحدة!`);
}

function saveCurrentAsPreset(recipeType) {
  const db = loadDatabase();
  if (recipeType === 'pancake') {
    const vals = getPancakeFormValues();
    const res = calculatePancakeNutrition(vals);
    const customName = document.getElementById('pc-custom-name').value.trim() || 'بانكيك شوفان صحي';
    const mealTypeRadio = document.querySelector('input[name="pc-meal-type"]:checked');
    const mealType = mealTypeRadio ? mealTypeRadio.value : 'breakfast';

    const newPreset = {
      id: `preset_pc_${Date.now()}`,
      recipeType: 'pancake',
      mealType: mealType,
      title: `${customName} (Meal Prep)`,
      snapshot: res.total,
      details: vals
    };
    db.presets = db.presets || [];
    db.presets.push(newPreset);
    saveDatabase(db);
    showToast(`⭐ تم حفظ البانكيك كوجبة سريعة بنقرة واحدة في الصفحة الرئيسية!`);
  } else if (recipeType === 'chicken') {
    const vals = getChickenFormValues();
    const res = calculateChickenNutrition(vals);
    const customName = document.getElementById('ck-custom-name').value.trim() || 'وجبة بانيه وأرز';
    const mealTypeRadio = document.querySelector('input[name="ck-meal-type"]:checked');
    const mealType = mealTypeRadio ? mealTypeRadio.value : 'lunch';

    const newPreset = {
      id: `preset_ck_${Date.now()}`,
      recipeType: 'chicken',
      mealType: mealType,
      title: `${customName} (Meal Prep)`,
      snapshot: res.total,
      details: vals
    };
    db.presets = db.presets || [];
    db.presets.push(newPreset);
    saveDatabase(db);
    showToast(`⭐ تم حفظ البانيه والأرز كوجبة سريعة بنقرة واحدة في الصفحة الرئيسية!`);
  }
  renderQuickPresets();
}

function saveMealAsPreset(mealId) {
  const db = loadDatabase();
  const meal = db.meals.find((m) => m.id === mealId);
  if (!meal) return;

  const newPreset = {
    id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipeType: meal.recipeType,
    mealType: meal.mealType,
    title: `${meal.title} (Meal Prep)`,
    snapshot: { ...meal.snapshot },
    details: { ...meal.details }
  };

  db.presets = db.presets || [];
  db.presets.push(newPreset);
  saveDatabase(db);
  renderQuickPresets();
  showToast(`⭐ تم حفظ الوجبة في قائمة "الإضافة السريعة بنقرة واحدة"!`);
}

function deletePreset(presetId) {
  openConfirmModal(
    'حذف الوجبة المجهزة',
    'هل تريد إزالة هذه الوجبة من قائمة الإضافة السريعة بنقرة واحدة؟',
    () => {
      const db = loadDatabase();
      db.presets = (db.presets || []).filter((p) => p.id !== presetId);
      saveDatabase(db);
      renderQuickPresets();
      showToast('تمت إزالة الوجبة المجهزة');
    }
  );
}

function openGoalModal() {
  const db = loadDatabase();
  const currentGoal = (db.settings && db.settings.dailyCalorieGoal) || 2000;
  document.getElementById('goal-input-modal').value = currentGoal;
  document.getElementById('goal-modal').classList.add('active');
}

function closeGoalModal() {
  document.getElementById('goal-modal').classList.remove('active');
}

function saveGoalModal() {
  const goalVal = parseFloat(document.getElementById('goal-input-modal').value) || 2000;
  const db = loadDatabase();
  db.settings = db.settings || {};
  db.settings.dailyCalorieGoal = goalVal;
  saveDatabase(db);
  closeGoalModal();
  renderDailyHistory();
  showToast(`🎯 تم تحديث هدف السعرات اليومي إلى ${goalVal.toLocaleString('en-US')} ك`);
}

function getArabicMealCount(count) {
  if (count === 1) return 'وجبة واحدة';
  if (count === 2) return 'وجبتين';
  if (count >= 3 && count <= 10) return 'وجبات';
  return 'وجبة';
}

function renderRecentDatesChips(db) {
  const container = document.getElementById('recent-dates-chips');
  if (!container) return;

  const datesWithMeals = Array.from(new Set(db.meals.map((m) => m.date)))
    .filter((d) => d)
    .sort()
    .reverse();

  if (datesWithMeals.length === 0) {
    container.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">لا توجد تواريخ سابقة مسجلة بعد.</span>`;
    return;
  }

  container.innerHTML = datesWithMeals.map((dateStr) => {
    const isActive = dateStr === activeDate;
    const label = formatArabicDate(dateStr);
    const count = db.meals.filter((m) => m.date === dateStr).length;
    return `
      <button class="date-chip-btn ${isActive ? 'active' : ''}" data-date="${dateStr}">
        ${label} (${count})
      </button>
    `;
  }).join('');
}

// ==========================================================================
// 7. SAVE MEAL, EDIT & DELETE ACTIONS
// ==========================================================================

function savePancakeMeal() {
  const vals = getPancakeFormValues();
  const res = calculatePancakeNutrition(vals);

  const saveDate = document.getElementById('pc-save-date').value || activeDate;
  const customNameInput = document.getElementById('pc-custom-name').value.trim();
  const mealTitle = customNameInput || 'بانكيك شوفان صحي';

  const mealTypeRadio = document.querySelector('input[name="pc-meal-type"]:checked');
  const mealType = mealTypeRadio ? mealTypeRadio.value : 'breakfast';

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const db = loadDatabase();

  if (editingMealId) {
    // Update existing meal snapshot
    const mealIndex = db.meals.findIndex((m) => m.id === editingMealId);
    if (mealIndex !== -1) {
      db.meals[mealIndex].date = saveDate;
      db.meals[mealIndex].mealType = mealType;
      db.meals[mealIndex].title = mealTitle;
      db.meals[mealIndex].snapshot = res.total;
      db.meals[mealIndex].details = vals;
      saveDatabase(db);
      showToast('تم تحديث وجبة البانكيك بنجاح!');
    }
    editingMealId = null;
    resetSaveButtonLabels();
  } else {
    // Save new meal entry snapshot
    const newMeal = {
      id: `pc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: saveDate,
      time: timeStr,
      recipeType: 'pancake',
      mealType: mealType,
      title: mealTitle,
      snapshot: res.total,
      details: vals
    };
    db.meals.push(newMeal);
    saveDatabase(db);
    showToast('تم حفظ وجبة البانكيك بنجاح!');
  }

  setActiveDate(saveDate);
  switchView('home');
}

function saveChickenMeal() {
  const vals = getChickenFormValues();
  const res = calculateChickenNutrition(vals);

  const saveDate = document.getElementById('ck-save-date').value || activeDate;
  const customNameInput = document.getElementById('ck-custom-name').value.trim();
  const mealTitle = customNameInput || 'وجبة بانيه وأرز بسمتي';

  const mealTypeRadio = document.querySelector('input[name="ck-meal-type"]:checked');
  const mealType = mealTypeRadio ? mealTypeRadio.value : 'lunch';

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const db = loadDatabase();

  if (editingMealId) {
    // Update existing meal snapshot
    const mealIndex = db.meals.findIndex((m) => m.id === editingMealId);
    if (mealIndex !== -1) {
      db.meals[mealIndex].date = saveDate;
      db.meals[mealIndex].mealType = mealType;
      db.meals[mealIndex].title = mealTitle;
      db.meals[mealIndex].snapshot = res.total;
      db.meals[mealIndex].details = vals;
      saveDatabase(db);
      showToast('تم تحديث وجبة البانيه بنجاح!');
    }
    editingMealId = null;
    resetSaveButtonLabels();
  } else {
    // Save new meal entry snapshot
    const newMeal = {
      id: `ck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: saveDate,
      time: timeStr,
      recipeType: 'chicken',
      mealType: mealType,
      title: mealTitle,
      snapshot: res.total,
      details: vals
    };
    db.meals.push(newMeal);
    saveDatabase(db);
    showToast('تم حفظ وجبة البانيه بنجاح!');
  }

  setActiveDate(saveDate);
  switchView('home');
}

function startEditMeal(mealId) {
  const db = loadDatabase();
  const meal = db.meals.find((m) => m.id === mealId);
  if (!meal) return;

  editingMealId = meal.id;

  if (meal.recipeType === 'pancake') {
    // Restore pancake inputs
    const d = meal.details || DEFAULT_PANCAKE_INPUTS;
    document.getElementById('pc-oats').value = d.oats || 60;
    const yogRadio = document.querySelector(`input[name="pc-yogurt-type"][value="${d.yogurtType || 'regular'}"]`);
    if (yogRadio) yogRadio.checked = true;
    document.getElementById('pc-yogurt').value = d.yogurtGrams || 100;
    document.getElementById('pc-egg').value = d.egg || 1;
    const milkRadio = document.querySelector(`input[name="pc-milk-type"][value="${d.milkType || 'skim'}"]`);
    if (milkRadio) milkRadio.checked = true;
    document.getElementById('pc-milk').value = d.milkMl || 100;
    document.getElementById('pc-vanilla').value = d.vanilla || 1;
    document.getElementById('pc-bp').value = d.bakingPowder || 3;
    document.getElementById('pc-sweetener-has-cals').checked = !!d.sweetenerHasCals;
    document.getElementById('pc-sweetener-cals').value = d.sweetenerCals || 0;
    document.getElementById('pc-sweetener-custom-box').style.display = d.sweetenerHasCals ? 'block' : 'none';
    document.getElementById('pc-oil').value = d.oil || 0;

    document.getElementById('pc-save-date').value = meal.date;
    document.getElementById('pc-custom-name').value = meal.title;
    const mTypeRadio = document.querySelector(`input[name="pc-meal-type"][value="${meal.mealType}"]`);
    if (mTypeRadio) mTypeRadio.checked = true;

    document.getElementById('btn-save-pancake').innerHTML = '<span>✓ تحديث وحفظ تعديلات الوجبة</span>';
    switchView('pancake');
  } else if (meal.recipeType === 'chicken') {
    // Restore chicken inputs
    const d = meal.details || DEFAULT_CHICKEN_INPUTS;
    document.getElementById('ck-raw-weight').value = d.rawWeight || 1000;
    document.getElementById('ck-cooked-total').value = d.cookedTotal || 620;
    const oilRadio = document.querySelector(`input[name="ck-oil-opt"][value="${d.oilOpt || 'none'}"]`);
    if (oilRadio) oilRadio.checked = true;
    document.getElementById('ck-portion-weight').value = d.portionWeight || 200;
    document.getElementById('ck-rice-weight').value = d.riceWeight || 150;

    document.getElementById('ck-save-date').value = meal.date;
    document.getElementById('ck-custom-name').value = meal.title;
    const mTypeRadio = document.querySelector(`input[name="ck-meal-type"][value="${meal.mealType}"]`);
    if (mTypeRadio) mTypeRadio.checked = true;

    document.getElementById('btn-save-chicken').innerHTML = '<span>✓ تحديث وحفظ تعديلات الوجبة</span>';
    switchView('chicken');
  }
}

function resetSaveButtonLabels() {
  document.getElementById('btn-save-pancake').innerHTML = '<span>✓ احفظ وجبة البانكيك في السجل</span>';
  document.getElementById('btn-save-chicken').innerHTML = '<span>✓ احفظ وجبة البانيه في السجل</span>';
}

function deleteMeal(mealId) {
  openConfirmModal(
    'حذف الوجبة',
    'هل أنت متأكد من حذف هذه الوجبة نهائياً من سجل اليوم؟',
    () => {
      const db = loadDatabase();
      db.meals = db.meals.filter((m) => m.id !== mealId);
      saveDatabase(db);
      renderDailyHistory();
      showToast('تم حذف الوجبة بنجاح');
    }
  );
}

// ==========================================================================
// 8. BACKUP EXPORT, IMPORT & CLEAR ALL DATA
// ==========================================================================

function exportBackup() {
  const db = loadDatabase();
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `akli-nutrition-backup-${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('تم تصدير نسخة احتياطية بنجاح 📥');
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      if (!parsed || !Array.isArray(parsed.meals)) {
        throw new Error('تنسيق الملف غير صالح!');
      }

      openConfirmModal(
        'استيراد نسخة احتياطية',
        `تم العثور على ${parsed.meals.length} وجبة في الملف. هل تريد استبدال سجلاتك الحالية بهذه النسخة؟`,
        () => {
          saveDatabase(parsed);
          renderDailyHistory();
          showToast(`تم استيراد ${parsed.meals.length} وجبة بنجاح!`);
        }
      );
    } catch (err) {
      console.error('Import error:', err);
      showToast('خطأ: الملف غير صالح أو تالف!', 'danger');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

function clearAllData() {
  openConfirmModal(
    'مسح جميع البيانات',
    'تحذير! هذا الإجراء سيقوم بمسح كل سجلاتك وتاريخ الوجبات بالكامل من هذا المتصفح. لا يمكن التراجع عن هذا الإجراء.',
    () => {
      localStorage.removeItem(STORAGE_KEY);
      renderDailyHistory();
      showToast('تم مسح جميع السجلات بالكامل', 'danger');
    }
  );
}

// ==========================================================================
// 9. UI HELPERS: MODALS, TOASTS & STEPPERS
// ==========================================================================

let activeConfirmCallback = null;

function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-body').textContent = message;
  activeConfirmCallback = onConfirm;

  const modal = document.getElementById('confirm-modal');
  modal.classList.add('active');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  modal.classList.remove('active');
  activeConfirmCallback = null;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'danger' ? 'danger' : ''}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2600);
}

function updateChipActiveState(inputId, currentValue) {
  const chips = document.querySelectorAll(`.chip-btn[data-target="${inputId}"]`);
  chips.forEach((chip) => {
    const val = parseFloat(chip.getAttribute('data-val'));
    if (val === currentValue) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// ==========================================================================
// 10. EVENT LISTENERS SETUP
// ==========================================================================

function initEventListeners() {
  // Navigation between views
  document.getElementById('card-open-pancake').addEventListener('click', () => {
    editingMealId = null;
    resetSaveButtonLabels();
    switchView('pancake');
  });

  document.getElementById('card-open-chicken').addEventListener('click', () => {
    editingMealId = null;
    resetSaveButtonLabels();
    switchView('chicken');
  });

  document.getElementById('btn-back-from-pancake').addEventListener('click', () => {
    editingMealId = null;
    resetSaveButtonLabels();
    switchView('home');
  });

  document.getElementById('btn-back-from-chicken').addEventListener('click', () => {
    editingMealId = null;
    resetSaveButtonLabels();
    switchView('home');
  });

  // Reset Defaults Buttons
  document.getElementById('btn-reset-pancake').addEventListener('click', resetPancakeDefaults);
  document.getElementById('btn-reset-chicken').addEventListener('click', resetChickenDefaults);

  // Save Buttons
  document.getElementById('btn-save-pancake').addEventListener('click', savePancakeMeal);
  document.getElementById('btn-save-chicken').addEventListener('click', saveChickenMeal);

  // Save As 1-Click Preset Buttons (From Calculators)
  const btnPresetPc = document.getElementById('btn-preset-pancake');
  if (btnPresetPc) {
    btnPresetPc.addEventListener('click', () => saveCurrentAsPreset('pancake'));
  }

  const btnPresetCk = document.getElementById('btn-preset-chicken');
  if (btnPresetCk) {
    btnPresetCk.addEventListener('click', () => saveCurrentAsPreset('chicken'));
  }

  // 1-Click Quick Presets List Delegation (Home View)
  const presetsContainer = document.getElementById('presets-list');
  if (presetsContainer) {
    presetsContainer.addEventListener('click', (e) => {
      const quickAddBtn = e.target.closest('.btn-quick-add');
      if (quickAddBtn && quickAddBtn.dataset.id) {
        quickAddPreset(quickAddBtn.dataset.id);
        return;
      }

      const delPresetBtn = e.target.closest('.preset-delete-btn');
      if (delPresetBtn && delPresetBtn.dataset.id) {
        deletePreset(delPresetBtn.dataset.id);
        return;
      }
    });
  }

  // Goal Setting Modal Listeners
  const btnSetGoal = document.getElementById('btn-set-goal');
  if (btnSetGoal) {
    btnSetGoal.addEventListener('click', openGoalModal);
  }
  const btnSaveGoal = document.getElementById('goal-modal-save');
  if (btnSaveGoal) {
    btnSaveGoal.addEventListener('click', saveGoalModal);
  }
  const btnCancelGoal = document.getElementById('goal-modal-cancel');
  if (btnCancelGoal) {
    btnCancelGoal.addEventListener('click', closeGoalModal);
  }

  // Date Navigator Controls
  document.getElementById('btn-prev-day').addEventListener('click', () => shiftActiveDate(-1));
  document.getElementById('btn-next-day').addEventListener('click', () => shiftActiveDate(1));

  const datePickerInput = document.getElementById('date-picker-input');
  datePickerInput.addEventListener('change', (e) => {
    if (e.target.value) {
      setActiveDate(e.target.value);
    }
  });

  document.getElementById('date-picker-trigger').addEventListener('click', () => {
    // Open native date picker
    try {
      datePickerInput.showPicker();
    } catch (_) {
      datePickerInput.focus();
    }
  });

  // Recent Dates Chips Delegation
  document.getElementById('recent-dates-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.date-chip-btn');
    if (chip && chip.dataset.date) {
      setActiveDate(chip.dataset.date);
    }
  });

  // Meals List Delegation (Edit, Star Preset & Delete)
  document.getElementById('meals-list').addEventListener('click', (e) => {
    const starBtn = e.target.closest('.btn-star-preset');
    if (starBtn && starBtn.dataset.id) {
      saveMealAsPreset(starBtn.dataset.id);
      return;
    }

    const editBtn = e.target.closest('.btn-edit-meal');
    if (editBtn && editBtn.dataset.id) {
      startEditMeal(editBtn.dataset.id);
      return;
    }

    const delBtn = e.target.closest('.btn-delete-meal');
    if (delBtn && delBtn.dataset.id) {
      deleteMeal(delBtn.dataset.id);
      return;
    }
  });

  // Pancake Form Inputs & Radios
  const pcInputs = [
    'pc-oats', 'pc-yogurt', 'pc-egg', 'pc-milk',
    'pc-vanilla', 'pc-bp', 'pc-sweetener-cals', 'pc-oil'
  ];
  pcInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updatePancakeUI);
      el.addEventListener('change', updatePancakeUI);
    }
  });

  document.querySelectorAll('input[name="pc-yogurt-type"]').forEach((radio) => {
    radio.addEventListener('change', updatePancakeUI);
  });

  document.querySelectorAll('input[name="pc-milk-type"]').forEach((radio) => {
    radio.addEventListener('change', updatePancakeUI);
  });

  const swToggle = document.getElementById('pc-sweetener-has-cals');
  swToggle.addEventListener('change', (e) => {
    const customBox = document.getElementById('pc-sweetener-custom-box');
    customBox.style.display = e.target.checked ? 'block' : 'none';
    updatePancakeUI();
  });

  // Chicken Form Inputs & Radios
  const ckInputs = [
    'ck-raw-weight', 'ck-cooked-total', 'ck-portion-weight', 'ck-rice-weight'
  ];
  ckInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateChickenUI);
      el.addEventListener('change', updateChickenUI);
    }
  });

  document.querySelectorAll('input[name="ck-oil-opt"]').forEach((radio) => {
    radio.addEventListener('change', updateChickenUI);
  });

  // Generic Steppers & Quick Chips Delegation
  document.body.addEventListener('click', (e) => {
    // Stepper buttons (+ / -)
    const stepBtn = e.target.closest('.btn-step');
    if (stepBtn) {
      const targetId = stepBtn.dataset.target;
      const action = stepBtn.dataset.action;
      const step = parseFloat(stepBtn.dataset.step) || 1;
      const input = document.getElementById(targetId);
      if (input) {
        let val = parseFloat(input.value) || 0;
        const min = parseFloat(input.min) !== undefined ? parseFloat(input.min) : 0;
        const max = parseFloat(input.max) !== undefined ? parseFloat(input.max) : 99999;

        if (action === 'inc') {
          val += step;
        } else if (action === 'dec') {
          val -= step;
        }

        if (val < min) val = min;
        if (val > max) val = max;

        // Clean floating point rounding
        input.value = Math.round(val * 10) / 10;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }

    // Preset Chip Buttons
    const chipBtn = e.target.closest('.chip-btn');
    if (chipBtn && chipBtn.dataset.target && chipBtn.dataset.val !== undefined) {
      const targetId = chipBtn.dataset.target;
      const targetVal = parseFloat(chipBtn.dataset.val);
      const input = document.getElementById(targetId);
      if (input) {
        input.value = targetVal;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
  });

  // Confirmation Modal buttons
  document.getElementById('confirm-modal-ok').addEventListener('click', () => {
    if (typeof activeConfirmCallback === 'function') {
      activeConfirmCallback();
    }
    closeConfirmModal();
  });

  document.getElementById('confirm-modal-cancel').addEventListener('click', closeConfirmModal);

  // Backup & Restore
  document.getElementById('btn-export-backup').addEventListener('click', exportBackup);
  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('file-import-input').click();
  });
  document.getElementById('file-import-input').addEventListener('change', handleImportFile);
  document.getElementById('btn-clear-all').addEventListener('click', clearAllData);

  // Online / Offline status listener
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
  const badge = document.getElementById('connection-status');
  if (!badge) return;
  if (navigator.onLine) {
    badge.innerHTML = `<span class="dot"></span><span>أونلاين ومحفوظ</span>`;
  } else {
    badge.innerHTML = `<span class="dot" style="background:#F59E0B;box-shadow:0 0 8px #F59E0B;"></span><span>أوفلاين بالكامل</span>`;
  }
}

// ==========================================================================
// 11. PWA SERVICE WORKER REGISTRATION
// ==========================================================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('ServiceWorker registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed (requires HTTPS or localhost):', err);
        });
    });
  }
}

// ==========================================================================
// 12. INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Set initial date picker values
  document.getElementById('date-picker-input').value = activeDate;
  document.getElementById('pc-save-date').value = activeDate;
  document.getElementById('ck-save-date').value = activeDate;
  document.getElementById('date-display-text').textContent = formatArabicDate(activeDate);

  // Initialize listeners
  initEventListeners();

  // Initial calculations
  updatePancakeUI();
  updateChickenUI();

  // Initial render of home view
  renderDailyHistory();

  // Register PWA service worker
  registerServiceWorker();
  updateOnlineStatus();
});
