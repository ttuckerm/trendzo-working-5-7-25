/**
 * v12 Sandbox — Step 2: Train + Evaluate (Node.js implementation)
 * 
 * Implements XGBoost-compatible gradient boosting with histogram-based splits.
 * Uses the same hyperparameters as v10 (Optuna-optimized).
 * 
 * SANDBOX ONLY — does NOT overwrite v10.
 * Usage: node scripts/v12-step2-train.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.dirname(__dirname);
const SANDBOX_DIR = path.join(PROJECT_ROOT, 'data', 'sandbox');
const INPUT_PATH = path.join(SANDBOX_DIR, 'v12-training-data.json');
const V10_META_PATH = path.join(PROJECT_ROOT, 'models', 'xgboost-v10-metadata.json');

const PARAMS = {
  maxDepth: 8,
  learningRate: 0.025847050593221715,
  minChildWeight: 5,
  subsample: 0.7064306141071703,
  colsampleBytree: 0.716878246792974,
  regAlpha: 0.6170624733980454,
  regLambda: 4.9455883361853195,
  numRounds: 413,
  seed: 42,
  numBins: 256,
};

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Utility ──────────────────────────────────────────────────────────────────
function classifyTier(dps) {
  if (dps >= 90) return 'mega-viral';
  if (dps >= 70) return 'viral';
  if (dps >= 60) return 'good';
  if (dps >= 40) return 'average';
  return 'low';
}

function rankArray(arr) {
  const n = arr.length;
  const indexed = arr.map((v, i) => [v, i]);
  indexed.sort((a, b) => a[0] - b[0]);
  const ranks = new Float64Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1][0] === indexed[j][0]) j++;
    const avgRank = (i + j) / 2.0 + 1.0;
    for (let k = i; k <= j; k++) ranks[indexed[k][1]] = avgRank;
    i = j + 1;
  }
  return ranks;
}

function spearmanRho(x, y) {
  const rx = rankArray(x);
  const ry = rankArray(y);
  const n = x.length;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += rx[i]; my += ry[i]; }
  mx /= n; my /= n;
  let cov = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - mx, dy = ry[i] - my;
    cov += dx * dy;
    sx += dx * dx;
    sy += dy * dy;
  }
  sx = Math.sqrt(sx);
  sy = Math.sqrt(sy);
  if (sx === 0 || sy === 0) return 0;
  return cov / (sx * sy);
}

function evaluate(yTrue, yPred) {
  const n = yTrue.length;
  let sumAE = 0, sumSE = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumAE += Math.abs(yTrue[i] - yPred[i]);
    sumSE += (yTrue[i] - yPred[i]) ** 2;
    sumY += yTrue[i];
  }
  const mae = sumAE / n;
  const rmse = Math.sqrt(sumSE / n);
  const meanY = sumY / n;
  let ssTot = 0;
  for (let i = 0; i < n; i++) ssTot += (yTrue[i] - meanY) ** 2;
  const r2 = ssTot > 0 ? 1 - sumSE / ssTot : 0;
  const rho = spearmanRho(yTrue, yPred);

  let w5 = 0, w10 = 0;
  for (let i = 0; i < n; i++) {
    const diff = Math.abs(yTrue[i] - yPred[i]);
    if (diff <= 5) w5++;
    if (diff <= 10) w10++;
  }

  let tierCorrect = 0;
  for (let i = 0; i < n; i++) {
    if (classifyTier(yTrue[i]) === classifyTier(yPred[i])) tierCorrect++;
  }

  return {
    rho, mae, rmse, r2,
    w5: (w5 / n) * 100,
    w10: (w10 / n) * 100,
    tier: (tierCorrect / n) * 100,
  };
}

// ── Histogram-based Gradient Boosted Tree ────────────────────────────────────
class HistBin {
  constructor(X, numBins) {
    this.numFeatures = X[0].length;
    this.numBins = numBins;
    this.binEdges = [];
    this.binnedX = [];

    for (let f = 0; f < this.numFeatures; f++) {
      const vals = X.map(row => row[f]).filter(v => !isNaN(v));
      vals.sort((a, b) => a - b);
      const edges = [];
      for (let b = 1; b < numBins; b++) {
        const idx = Math.floor((b / numBins) * vals.length);
        const edge = vals[Math.min(idx, vals.length - 1)];
        if (edges.length === 0 || edge > edges[edges.length - 1]) {
          edges.push(edge);
        }
      }
      this.binEdges.push(edges);
    }

    for (let i = 0; i < X.length; i++) {
      const binned = new Uint16Array(this.numFeatures);
      for (let f = 0; f < this.numFeatures; f++) {
        binned[f] = this._binValue(f, X[i][f]);
      }
      this.binnedX.push(binned);
    }
  }

  _binValue(f, v) {
    const edges = this.binEdges[f];
    let lo = 0, hi = edges.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (v <= edges[mid]) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
}

function buildTree(binner, indices, grads, hessians, params, rng, featureGains) {
  const { maxDepth, minChildWeight, regAlpha, regLambda, colsampleBytree } = params;
  const numFeatures = binner.numFeatures;
  const numActiveFeat = Math.max(1, Math.floor(numFeatures * colsampleBytree));
  const featIndices = [];
  for (let i = 0; i < numFeatures; i++) featIndices.push(i);
  for (let i = numFeatures - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [featIndices[i], featIndices[j]] = [featIndices[j], featIndices[i]];
  }
  const activeFeats = featIndices.slice(0, numActiveFeat);

  function leafWeight(idxList) {
    let G = 0, H = 0;
    for (const i of idxList) { G += grads[i]; H += hessians[i]; }
    const absG = Math.abs(G);
    const shrunk = Math.max(0, absG - regAlpha) * Math.sign(G);
    return -shrunk / (H + regLambda);
  }

  function splitNode(idxList, depth) {
    let G = 0, H = 0;
    for (const i of idxList) { G += grads[i]; H += hessians[i]; }

    if (depth >= maxDepth || idxList.length < 2 * minChildWeight || H < minChildWeight) {
      return { leaf: true, weight: leafWeight(idxList) };
    }

    let bestGain = 0;
    let bestFeat = -1;
    let bestBin = -1;

    const parentScore = G * G / (H + regLambda);

    for (const f of activeFeats) {
      const numBins = binner.binEdges[f].length + 1;
      const binG = new Float64Array(numBins);
      const binH = new Float64Array(numBins);

      for (const i of idxList) {
        const b = binner.binnedX[i][f];
        binG[b] += grads[i];
        binH[b] += hessians[i];
      }

      let GL = 0, HL = 0;
      for (let b = 0; b < numBins - 1; b++) {
        GL += binG[b];
        HL += binH[b];
        if (HL < minChildWeight) continue;
        const GR = G - GL;
        const HR = H - HL;
        if (HR < minChildWeight) break;

        const gain = 0.5 * (GL * GL / (HL + regLambda) + GR * GR / (HR + regLambda) - parentScore);
        if (gain > bestGain) {
          bestGain = gain;
          bestFeat = f;
          bestBin = b;
        }
      }
    }

    if (bestFeat === -1) {
      return { leaf: true, weight: leafWeight(idxList) };
    }

    if (featureGains) {
      featureGains[bestFeat] = (featureGains[bestFeat] || 0) + bestGain;
    }

    const leftIdx = [], rightIdx = [];
    for (const i of idxList) {
      if (binner.binnedX[i][bestFeat] <= bestBin) leftIdx.push(i);
      else rightIdx.push(i);
    }

    if (leftIdx.length < minChildWeight || rightIdx.length < minChildWeight) {
      return { leaf: true, weight: leafWeight(idxList) };
    }

    return {
      leaf: false,
      feature: bestFeat,
      bin: bestBin,
      gain: bestGain,
      left: splitNode(leftIdx, depth + 1),
      right: splitNode(rightIdx, depth + 1),
    };
  }

  return splitNode(indices, 0);
}

function predictTree(tree, binnedRow) {
  let node = tree;
  while (!node.leaf) {
    if (binnedRow[node.feature] <= node.bin) node = node.left;
    else node = node.right;
  }
  return node.weight;
}

function trainGBM(X, y, params, binner) {
  const { learningRate, numRounds, subsample, seed } = params;
  const n = X.length;
  const rng = mulberry32(seed);
  const preds = new Float64Array(n);
  const grads = new Float64Array(n);
  const hessians = new Float64Array(n).fill(1.0);
  const trees = [];
  const featureGains = {};

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < n; i++) grads[i] = preds[i] - y[i];

    const numSample = Math.max(1, Math.floor(n * subsample));
    const allIdx = [];
    for (let i = 0; i < n; i++) allIdx.push(i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allIdx[i], allIdx[j]] = [allIdx[j], allIdx[i]];
    }
    const sampledIdx = allIdx.slice(0, numSample);

    const tree = buildTree(binner, sampledIdx, grads, hessians, params, rng, featureGains);
    trees.push(tree);

    for (let i = 0; i < n; i++) {
      preds[i] += learningRate * predictTree(tree, binner.binnedX[i]);
    }

    if ((round + 1) % 100 === 0 || round === numRounds - 1) {
      process.stdout.write(`    Round ${round + 1}/${numRounds}\r`);
    }
  }
  console.log('');

  return { trees, featureGains };
}

function predictAll(trees, binner, indices, learningRate) {
  const preds = new Float64Array(indices.length);
  for (const tree of trees) {
    for (let i = 0; i < indices.length; i++) {
      preds[i] += learningRate * predictTree(tree, binner.binnedX[indices[i]]);
    }
  }
  return preds;
}

function clip(arr, lo, hi) {
  return arr.map(v => Math.max(lo, Math.min(hi, v)));
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const t0 = Date.now();
  console.log('='.repeat(66));
  console.log('  v12 SANDBOX — Step 2: Train + Evaluate (Node.js GBM)');
  console.log('='.repeat(66));

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const meta = data.metadata;
  const featureNames = meta.feature_names;

  console.log(`\n  Loaded ${meta.total_rows} rows, ${meta.feature_count} features`);
  console.log(`  Train: ${meta.train_rows}, Holdout: ${meta.holdout_rows}`);
  console.log(`  v10 had: ${meta.v10_had} rows (delta: +${meta.total_rows - meta.v10_had})`);

  const trainRows = data.rows.filter(r => !r.is_holdout);
  const holdoutRows = data.rows.filter(r => r.is_holdout);

  const buildMatrix = (rows) => {
    const X = rows.map(r => featureNames.map(f => r.features[f] ?? 0));
    const y = rows.map(r => r.dps_score);
    return { X, y };
  };

  const train = buildMatrix(trainRows);
  const holdout = buildMatrix(holdoutRows);

  console.log(`  X_train: [${train.X.length}, ${featureNames.length}], X_holdout: [${holdout.X.length}, ${featureNames.length}]`);

  const yArr = new Float64Array(train.y);
  let yMin = Infinity, yMax = -Infinity, ySum = 0;
  for (let i = 0; i < yArr.length; i++) {
    if (yArr[i] < yMin) yMin = yArr[i];
    if (yArr[i] > yMax) yMax = yArr[i];
    ySum += yArr[i];
  }
  const yStd = Math.sqrt(yArr.reduce((s, v) => s + (v - ySum / yArr.length) ** 2, 0) / yArr.length);
  console.log(`  Target: min=${yMin.toFixed(1)}, max=${yMax.toFixed(1)}, mean=${(ySum / yArr.length).toFixed(1)}, std=${yStd.toFixed(1)}`);

  // === TRAIN FINAL MODEL ===
  console.log(`\n  Building histogram bins (${PARAMS.numBins} bins)...`);
  const trainBinner = new HistBin(train.X, PARAMS.numBins);

  console.log(`  Training final model (${PARAMS.numRounds} rounds)...`);
  const tTrain = Date.now();
  const trainResult = trainGBM(train.X, train.y, PARAMS, trainBinner);
  console.log(`  Trained in ${((Date.now() - tTrain) / 1000).toFixed(1)}s`);

  // Predict on train
  const trainPredIndices = [];
  for (let i = 0; i < train.X.length; i++) trainPredIndices.push(i);
  const yPredTrain = clip(predictAll(trainResult.trees, trainBinner, trainPredIndices, PARAMS.learningRate), 0, 100);

  // For holdout: need to bin holdout data using the training binner
  // We'll create a combined binner for prediction
  const holdoutBinnedX = holdout.X.map(row => {
    const binned = new Uint16Array(featureNames.length);
    for (let f = 0; f < featureNames.length; f++) {
      binned[f] = trainBinner._binValue(f, row[f]);
    }
    return binned;
  });

  const yPredHoldout = new Float64Array(holdout.y.length);
  for (const tree of trainResult.trees) {
    for (let i = 0; i < holdout.y.length; i++) {
      yPredHoldout[i] += PARAMS.learningRate * predictTree(tree, holdoutBinnedX[i]);
    }
  }
  const yPredHoldoutClipped = clip(Array.from(yPredHoldout), 0, 100);

  const mTrain = evaluate(train.y, Array.from(yPredTrain));
  const mHoldout = evaluate(holdout.y, yPredHoldoutClipped);

  console.log(`  Train:   rho=${mTrain.rho.toFixed(4)}, MAE=${mTrain.mae.toFixed(2)}`);
  console.log(`  Holdout: rho=${mHoldout.rho.toFixed(4)}, MAE=${mHoldout.mae.toFixed(2)}`);

  // === 5-FOLD CV ===
  console.log(`\n  5-fold cross-validation...`);
  const n = train.y.length;
  const rng = mulberry32(42);
  const shuffled = [];
  for (let i = 0; i < n; i++) shuffled.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const cvRhos = [], cvMaes = [], cvW10s = [];
  const foldSize = Math.floor(n / 5);

  for (let fold = 0; fold < 5; fold++) {
    const foldStart = fold * foldSize;
    const foldEnd = fold < 4 ? foldStart + foldSize : n;
    const valIdx = shuffled.slice(foldStart, foldEnd);
    const trIdx = [...shuffled.slice(0, foldStart), ...shuffled.slice(foldEnd)];

    const foldTrainX = trIdx.map(i => train.X[i]);
    const foldTrainY = trIdx.map(i => train.y[i]);
    const foldValX = valIdx.map(i => train.X[i]);
    const foldValY = valIdx.map(i => train.y[i]);

    const foldBinner = new HistBin(foldTrainX, PARAMS.numBins);
    const foldResult = trainGBM(foldTrainX, foldTrainY, PARAMS, foldBinner);

    const foldValBinned = foldValX.map(row => {
      const binned = new Uint16Array(featureNames.length);
      for (let f = 0; f < featureNames.length; f++) {
        binned[f] = foldBinner._binValue(f, row[f]);
      }
      return binned;
    });

    const foldPreds = new Float64Array(foldValY.length);
    for (const tree of foldResult.trees) {
      for (let i = 0; i < foldValY.length; i++) {
        foldPreds[i] += PARAMS.learningRate * predictTree(tree, foldValBinned[i]);
      }
    }
    const foldPredsClipped = clip(Array.from(foldPreds), 0, 100);

    const foldMetrics = evaluate(foldValY, foldPredsClipped);
    cvRhos.push(foldMetrics.rho);
    cvMaes.push(foldMetrics.mae);
    cvW10s.push(foldMetrics.w10);
    console.log(`    Fold ${fold + 1}: rho=${foldMetrics.rho.toFixed(4)}, MAE=${foldMetrics.mae.toFixed(2)}, +/-10=${foldMetrics.w10.toFixed(1)}%`);
  }

  const cvRhoMean = cvRhos.reduce((a, b) => a + b, 0) / 5;
  const cvRhoStd = Math.sqrt(cvRhos.reduce((a, b) => a + (b - cvRhoMean) ** 2, 0) / 5);
  const cvMaeMean = cvMaes.reduce((a, b) => a + b, 0) / 5;
  const cvMaeStd = Math.sqrt(cvMaes.reduce((a, b) => a + (b - cvMaeMean) ** 2, 0) / 5);
  const cvW10Mean = cvW10s.reduce((a, b) => a + b, 0) / 5;

  console.log(`\n  CV Summary: rho=${cvRhoMean.toFixed(4)}+/-${cvRhoStd.toFixed(4)}, MAE=${cvMaeMean.toFixed(2)}+/-${cvMaeStd.toFixed(2)}, +/-10=${cvW10Mean.toFixed(1)}%`);

  // === FEATURE IMPORTANCE ===
  // featureGains keys are numeric indices; map to feature names
  const gains = trainResult.featureGains;
  const totalGain = Object.values(gains).reduce((a, b) => a + b, 0) || 1;
  const importances = featureNames
    .map((f, idx) => [f, (gains[idx] || 0) / totalGain])
    .sort((a, b) => b[1] - a[1]);

  // Load v10 baselines
  const v10Meta = JSON.parse(fs.readFileSync(V10_META_PATH, 'utf8'));
  const v10CvRho = v10Meta.performance.cv_5fold.spearman_mean;
  const v10CvStd = v10Meta.performance.cv_5fold.spearman_std;
  const v10CvMae = v10Meta.performance.cv_5fold.mae_mean;
  const v10HoRho = v10Meta.performance.holdout.spearman_rho;
  const v10HoMae = v10Meta.performance.holdout.mae;
  const v10HoW10 = v10Meta.performance.holdout.within_10_dps_pct;
  const v10HoTier = v10Meta.performance.holdout.tier_accuracy_pct;
  const v10Top = v10Meta.top_features || [];
  const v10Rank = {};
  const v10Imp = {};
  v10Top.forEach((f, i) => { v10Rank[f.feature] = i + 1; v10Imp[f.feature] = f.importance; });
  const v10NewFeats = new Set(v10Meta.new_features_added || []);

  // === COMPARISON TABLE ===
  const pad = (s, w) => String(s).padEnd(w);
  const padr = (s, w) => String(s).padStart(w);

  console.log(`\n${'='.repeat(66)}`);
  console.log(`  COMPARISON: v12-sandbox vs v10`);
  console.log(`${'='.repeat(66)}`);
  console.log(`  ${pad('Metric', 28)} ${pad('v10 (prod)', 18)} ${pad('v12 (sandbox)', 18)} ${'Delta'}`);
  console.log(`  ${'='.repeat(74)}`);
  console.log(`  ${pad('Training rows', 28)} ${pad(meta.v10_had, 18)} ${pad(meta.total_rows, 18)} +${meta.total_rows - meta.v10_had}`);
  console.log(`  ${pad('CV Spearman rho', 28)} ${pad(v10CvRho.toFixed(4), 18)} ${pad(cvRhoMean.toFixed(4), 18)} ${(cvRhoMean - v10CvRho >= 0 ? '+' : '') + (cvRhoMean - v10CvRho).toFixed(4)}`);
  console.log(`  ${pad('CV Spearman std', 28)} ${pad(v10CvStd.toFixed(4), 18)} ${pad(cvRhoStd.toFixed(4), 18)}`);
  console.log(`  ${pad('CV MAE', 28)} ${pad(v10CvMae.toFixed(2), 18)} ${pad(cvMaeMean.toFixed(2), 18)} ${(cvMaeMean - v10CvMae >= 0 ? '+' : '') + (cvMaeMean - v10CvMae).toFixed(2)}`);
  console.log(`  ${pad('Holdout Spearman rho', 28)} ${pad(v10HoRho.toFixed(4), 18)} ${pad(mHoldout.rho.toFixed(4), 18)} ${(mHoldout.rho - v10HoRho >= 0 ? '+' : '') + (mHoldout.rho - v10HoRho).toFixed(4)}`);
  console.log(`  ${pad('Holdout MAE', 28)} ${pad(v10HoMae.toFixed(2), 18)} ${pad(mHoldout.mae.toFixed(2), 18)} ${(mHoldout.mae - v10HoMae >= 0 ? '+' : '') + (mHoldout.mae - v10HoMae).toFixed(2)}`);
  console.log(`  ${pad('Holdout +/-10 DPS', 28)} ${pad(v10HoW10.toFixed(1) + '%', 18)} ${pad(mHoldout.w10.toFixed(1) + '%', 18)} ${(mHoldout.w10 - v10HoW10 >= 0 ? '+' : '') + (mHoldout.w10 - v10HoW10).toFixed(1)}%`);
  console.log(`  ${pad('Holdout Tier Accuracy', 28)} ${pad(v10HoTier.toFixed(1) + '%', 18)} ${pad(mHoldout.tier.toFixed(1) + '%', 18)} ${(mHoldout.tier - v10HoTier >= 0 ? '+' : '') + (mHoldout.tier - v10HoTier).toFixed(1)}%`);

  // === TOP 15 FEATURES ===
  console.log(`\n  Top 15 Features (v12-sandbox)`);
  console.log(`  ${pad('Rank', 6)} ${pad('Feature', 38)} ${pad('Import.', 10)} ${'v10 Rank'}`);
  console.log(`  ${'-'.repeat(64)}`);
  for (let i = 0; i < 15 && i < importances.length; i++) {
    const [feat, imp] = importances[i];
    const v10r = v10Rank[feat] ? String(v10Rank[feat]) : '-';
    const marker = v10NewFeats.has(feat) ? ' *v10-NEW*' : '';
    console.log(`  ${pad(i + 1, 6)} ${pad(feat + marker, 38)} ${pad(imp.toFixed(4), 10)} ${v10r}`);
  }

  // Dropped from v10 top 20
  const v12Top15 = new Set(importances.slice(0, 15).map(x => x[0]));
  const v10Top20 = new Set(v10Top.slice(0, 20).map(f => f.feature));
  const dropped = [...v10Top20].filter(f => !v12Top15.has(f));
  console.log(`\n  Dropped from v10 top-20:`);
  if (dropped.length > 0) {
    dropped.sort((a, b) => (v10Rank[a] || 99) - (v10Rank[b] || 99));
    for (const feat of dropped) {
      const v12Entry = importances.find(x => x[0] === feat);
      const v12r = v12Entry ? importances.indexOf(v12Entry) + 1 : '-';
      console.log(`    ${feat}: v10 #${v10Rank[feat]} -> v12 #${v12r}`);
    }
  } else {
    console.log(`    (none)`);
  }

  const emerged = [...v12Top15].filter(f => !v10Top20.has(f));
  console.log(`\n  Emerged in v12 top-15:`);
  if (emerged.length > 0) {
    emerged.sort((a, b) => {
      const ai = importances.findIndex(x => x[0] === a);
      const bi = importances.findIndex(x => x[0] === b);
      return ai - bi;
    });
    for (const feat of emerged) {
      const v12r = importances.findIndex(x => x[0] === feat) + 1;
      console.log(`    ${feat}: v12 #${v12r}`);
    }
  } else {
    console.log(`    (none)`);
  }

  // === SAVE ARTIFACTS ===
  console.log(`\n  Saving artifacts...`);

  const metadata = {
    model_version: 'v12-sandbox',
    implementation: 'Node.js histogram-based GBM (XGBoost-compatible)',
    trained_at: new Date().toISOString(),
    WARNING: 'SANDBOX ONLY. Do NOT overwrite v10.',
    feature_count: featureNames.length,
    feature_names: featureNames,
    dataset: {
      total_rows: meta.total_rows,
      train_rows: meta.train_rows,
      holdout_rows: meta.holdout_rows,
      v10_had: meta.v10_had,
    },
    performance: {
      train: mTrain,
      holdout: mHoldout,
      cv_5fold: {
        spearman_mean: cvRhoMean,
        spearman_std: cvRhoStd,
        mae_mean: cvMaeMean,
        mae_std: cvMaeStd,
        within_10_mean: cvW10Mean,
        per_fold: cvRhos.map((r, i) => ({ rho: r, mae: cvMaes[i], w10: cvW10s[i] })),
      },
    },
    comparison_vs_v10: {
      v10_cv_rho: v10CvRho,
      v12_cv_rho: cvRhoMean,
      delta_cv: cvRhoMean - v10CvRho,
      v10_holdout_rho: v10HoRho,
      v12_holdout_rho: mHoldout.rho,
      delta_holdout: mHoldout.rho - v10HoRho,
      v10_rows: meta.v10_had,
      v12_rows: meta.total_rows,
    },
    hyperparameters: {
      ...PARAMS,
      note: 'Same Optuna-optimized hyperparameters as v10',
    },
    top_features: importances.slice(0, 20).map(([f, imp]) => ({ feature: f, importance: parseFloat(imp.toFixed(6)) })),
  };

  fs.writeFileSync(
    path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  fs.writeFileSync(
    path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-features.json'),
    JSON.stringify(featureNames, null, 2)
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(66)}`);
  console.log(`  SANDBOX SUMMARY`);
  console.log(`${'='.repeat(66)}`);
  console.log(`  Training set: ${meta.total_rows} rows (v10 had ${meta.v10_had}, delta: +${meta.total_rows - meta.v10_had})`);
  console.log(`  CV Spearman rho: ${cvRhoMean.toFixed(4)} (v10: ${v10CvRho.toFixed(4)}, delta: ${(cvRhoMean - v10CvRho >= 0 ? '+' : '') + (cvRhoMean - v10CvRho).toFixed(4)})`);
  console.log(`  Holdout Spearman rho: ${mHoldout.rho.toFixed(4)} (v10: ${v10HoRho.toFixed(4)}, delta: ${(mHoldout.rho - v10HoRho >= 0 ? '+' : '') + (mHoldout.rho - v10HoRho).toFixed(4)})`);
  console.log(`  v10 NOT touched. All artifacts in data/sandbox/.`);
  console.log(`  Total time: ${elapsed}s`);
  console.log(`${'='.repeat(66)}`);
}

main();
