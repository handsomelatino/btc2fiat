// Constants
const BITCOIN_API = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd,eur&ids=bitcoin';
const SATS_PER_BTC = 100000000;
const BTC_PRECISION = Math.pow(10*8);
const B2F_URL = "https://btc2fiat.me";
const NON_BREAKING_SPACE = '\xa0';
const COMPARE_FETCH_TIME = 30 * 1000;

const validFloat = new RegExp(/^\d*\.?\d*$/);
const validInteger = new RegExp(/^\d*$/);

let copyLinkTimer;
let timeCompareInterval = null;
let currentPrice = null;
let lastFetchTime = null;

// sets which is the last input that got changed, which stays static
// when refetching the exchange rate. Values can be ['btc' or 'fiat']:
let lastEditedInput = null;

let lastFetched = null;

// Saved query selectors on init:
let btcInput = null;
let satsInput = null;
let btcAmount = null;
let satsAmount = null;

let usdInput = null;
let usdAmount = null;
let eurInput = null;
let eurAmount = null;

let btcSatsToggle = null;
let btcToggle = null;
let satsToggle = null;

let usdEurToggle = null;
let usdToggle = null;
let eurToggle = null;

let shareInput = null;

window.addEventListener('load', initialize);

async function initialize() {
  try {
    const response = await fetch(BITCOIN_API);
    
    if (!response.ok) {
      throw new Error(response.status);
    }

    const data = await response.json();
    currentPrice = data.bitcoin;
  }
  catch (error) {
    console.log(error);
    showFetchingError();
  }

  if (currentPrice !== null) {
    btcInput = document.getElementById('btc-input');
    satsInput = document.getElementById('sats-input');
    btcAmount = document.getElementById('btc-amount');
    satsAmount = document.getElementById('sats-amount');

    usdInput = document.getElementById('usd-input');
    eurInput = document.getElementById('eur-input');
    usdAmount = document.getElementById('usd-amount');
    eurAmount = document.getElementById('eur-amount');

    lastFetched = document.getElementById('last-fetched');
    
    btcSatsToggle = document.getElementById('btc-sats-toggle');
    btcToggle = document.getElementById('btc-toggle');
    satsToggle = document.getElementById('sats-toggle');

    usdEurToggle = document.getElementById('usd-eur-toggle');
    usdToggle = document.getElementById('usd-toggle');
    eurToggle = document.getElementById('eur-toggle');

    shareInput = document.getElementById('share-input');

    btcInput.addEventListener('input', handleBtcInput);
    satsInput.addEventListener('input', handleSatsInput);
    usdInput.addEventListener('input', handleUsdInput);
    eurInput.addEventListener('input', handleEurInput);

    btcToggle.addEventListener('click', handleToggleUnit);
    satsToggle.addEventListener('click', handleToggleUnit);

    usdToggle.addEventListener('click', handleToggleFiat);
    eurToggle.addEventListener('click', handleToggleFiat);
    
    document.getElementById('share-button').addEventListener('click', handleClickShareButton);
    document.getElementById('share-button-close').addEventListener('click', handleClickShareClose);
    document.getElementById('share-copy-link').addEventListener('click', handleClickCopyLink);

    document.getElementById('link-button').addEventListener('click', handleShowAbout);

    document.getElementById('refetch-exchange').addEventListener('click', handleFetchExchange);

    setInitialValues();

    lastFetchTime = Date.now();
    // test against different times
    // lastFetchTime = newDateObj = new Date(Date.now() - 5*60000);
    timeCompareInterval = setInterval(compareFetchTime, COMPARE_FETCH_TIME);
  
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.parentElement.removeChild(loadingOverlay);

    document.getElementsByTagName('main')[0].classList.add('main-fade-in');

    const params = new URLSearchParams(window.location.search);

    // if ?show-about=true -> scroll to the section:
    if (params.get('show-about')?.toLowerCase() === 'true') {
      handleShowAbout();
    }

    if (params.get('show-share')?.toLowerCase() === 'true') {
      handleClickShareButton();
    }
  }
  else {
    showFetchingError();
  }

}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    clearInterval(timeCompareInterval);
  }

  else if (document.visibilityState === 'visible') {
    compareFetchTime();
    timeCompareInterval = setInterval(compareFetchTime, COMPARE_FETCH_TIME);
  }
}

function compareFetchTime() {
  const fetchTime = document.getElementById('fetch-time');
  const secondsElapsed = Math.floor((new Date() - lastFetchTime) / 1000);

  console.log('secondsElapsed:', secondsElapsed)

  const timeTiers = [
    { divider: 'day',    plural: 'days',    seconds: 60 * 60 * 24, },
    { divider: 'hour',   plural: 'hours',   seconds: 60 * 60, },
    { divider: 'minute', plural: 'minutes', seconds: 60, },
  ];

  const tier = timeTiers.find(tier => tier.seconds < secondsElapsed);
  
  if (tier) {
    lastFetched.classList.remove('invisible');
    const timeDiff = Math.floor(secondsElapsed / tier.seconds);
    fetchTime.title = lastFetchTime.toLocaleString();
    fetchTime.innerText = `${timeDiff} ${timeDiff > 1 ? tier.plural : tier.divider}`;
  }  
}

async function handleFetchExchange() {

  lastFetched.classList.add('invisible');
  clearInterval(timeCompareInterval);

  try {
    const response = await fetch(BITCOIN_API);
    
    if (!response.ok) {
      throw new Error(response.status);
    }

    const data = await response.json();
    currentPrice = data.bitcoin;

    if (currentPrice) {
      const btcOrSatsInput = btcSatsToggle.dataset.selected === 'btc' ? btcInput : satsInput
      const usdOrEurInput = usdEurToggle.dataset.selected === 'usd' ? usdInput : eurInput;
      const input = lastEditedInput === 'btc' ? btcOrSatsInput : usdOrEurInput;
      input.dispatchEvent(new Event('input'));

      lastFetchTime = Date.now();
      timeCompareInterval = setInterval(compareFetchTime, COMPARE_FETCH_TIME);
    }
  }

  catch (error) {
    console.log(error);
    showFetchingError();
  }
}

function showFetchingError() {
  const loadingOverlay = document.getElementById('loading-overlay');

  loadingOverlay.getElementsByClassName('loading-subtitle')[0].classList.add('hidden');
  loadingOverlay.getElementsByClassName('loading-error')[0].classList.remove('hidden');
}

function setInitialValues() {
  const params = new URLSearchParams(window.location.search);

  let amount = 1;
  let input = btcInput;

  if (params.get('q') !== null) {
    const query = params.get('q').toLowerCase();

    if (!Number.isNaN(parseFloat(query))) {
      amount = parseFloat(query);
    }

    if (query.includes("btc")) {
      input = btcInput;
      lastEditedInput = 'btc';
    }
    else if (query.includes("sat")) {
      input = satsInput;
      lastEditedInput = 'btc';
      handleToggleUnit({ target: satsToggle });
    }
    else if (query.includes("usd")) {
      input = usdInput;
      lastEditedInput = 'fiat';
    }
    else if (query.includes("eur")) {
      input = eurInput;
      lastEditedInput = 'fiat';
      handleToggleFiat({ target: eurToggle });
    }
  }

  const cur = params.get('cur')?.toLowerCase();

  if (cur === 'eur') {
    handleToggleFiat({ target: eurToggle });
  }

  input.value = amount;
  input.dispatchEvent(new Event('input'));
}

function handleToggleUnit(e, unit) {
  const { value } = unit || e.target.dataset;

  if (btcSatsToggle.dataset.selected !== value) {
    btcSatsToggle.dataset.selected = value;
    
    e.target.classList.add('selected');

    const btcInputContainer = document.getElementById('btc-input-container');
    const satsInputContainer = document.getElementById('sats-input-container');

    if (value === 'btc') {
      satsToggle.classList.remove('selected');

      btcInputContainer.classList.remove('hidden');
      satsInputContainer.classList.add('hidden');

      satsAmount.classList.remove('hidden');
      btcAmount.classList.add('hidden');

      if (shareInput.value.endsWith('sats')) {
        updateShareURL(btcInput.value, 'btc');
      }
    }
    else {
      btcToggle.classList.remove('selected');

      satsInputContainer.classList.remove('hidden');
      btcInputContainer.classList.add('hidden');

      btcAmount.classList.remove('hidden');
      satsAmount.classList.add('hidden');

      if (shareInput.value.endsWith('btc')) {
        updateShareURL(satsInput.value, 'sats');
      }
    }
  }
}

function handleToggleFiat(e, unit) {

  const { value } = unit || e.target.dataset;

  if (usdEurToggle.dataset.selected !== value) {
    usdEurToggle.dataset.selected = value;
    
    e.target.classList.add('selected');

    const usdInputContainer = document.getElementById('usd-input-container');
    const eurInputContainer = document.getElementById('eur-input-container');

    if (value === 'usd') {
      eurToggle.classList.remove('selected');

      usdInputContainer.classList.remove('hidden');
      eurInputContainer.classList.add('hidden');

      if (shareInput.value.endsWith('usd')) {
        updateShareURL(eurInput.value, 'eur');
      }
    }
    else {
      usdToggle.classList.remove('selected');

      eurInputContainer.classList.remove('hidden');
      usdInputContainer.classList.add('hidden');

      if (shareInput.value.endsWith('eur')) {
        updateShareURL(usdInput.value, 'usd');
      }
    }
  }
}

function handleBtcInput(e) {
  const { value } = e.target;
  lastEditedInput = 'btc';

  if (validFloat.test(value)) {
    btcInput.dataset.previousValid = value;
    const btc = parseFloat(value);

    if (btc) {
      satsInput.value = btc * SATS_PER_BTC;
      const usd = (btc * currentPrice.usd).toFixed(btc >= 1 ? 0 : 2);
      const eur = (btc * currentPrice.eur).toFixed(btc >= 1 ? 0 : 2);
      
      satsAmount.innerText = `${(btc * SATS_PER_BTC).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Sats`;
      btcAmount.innerText = `${value} BTC`;
      
      usdInput.value = usd;
      usdAmount.innerText = fiatNumberFormat(usd, '$');
      
      eurInput.value = eur;
      eurAmount.innerText = fiatNumberFormat(eur, '€');

      updateShareURL(btc, 'btc');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      usdAmount.innerText = NON_BREAKING_SPACE;
      eurAmount.innerText = NON_BREAKING_SPACE;

      eurInput.value = '';
      usdInput.value = '';
      updateShareURL(null);
    }
  }
  
  else {
    btcInput.value = btcInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}

function handleSatsInput(e) {
  const { value } = e.target;
  lastEditedInput = 'btc';

  if (validInteger.test(value)) {
    satsInput.dataset.previousValid = value;
    const sats = parseInt(value, 10);

    if (sats) {
      const btc = sats / SATS_PER_BTC;

      const btcDigits = Math.max(-Math.log10(btc).toFixed() + 2, 2);
      const usd = (btc * currentPrice.usd).toFixed(btc >= 1 ? 0 : 2);
      const eur = (btc * currentPrice.eur).toFixed(btc >= 1 ? 0 : 2);

      btcInput.value = btc.toFixed(btcDigits);
      usdInput.value = usd;
      eurInput.value = eur;
      
      btcAmount.innerText = `${btc.toLocaleString(undefined, { minimumFractionDigits: btcDigits, maximumFractionDigits: btcDigits })} BTC`;
      satsAmount.innerText = `${value} Sats`;
      usdAmount.innerText = fiatNumberFormat(usd, '$');
      eurAmount.innerText = fiatNumberFormat(eur, '€');

      updateShareURL(sats, 'sats');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      usdAmount.innerText = NON_BREAKING_SPACE;
      eurAmount.innerText = NON_BREAKING_SPACE;

      usdInput.value = '';
      eurInput.value = '';
      updateShareURL(null);
    }
  }
  
  else {
    satsInput.value = satsInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}

function handleUsdInput(e) {
  const { value } = e.target;
  lastEditedInput = 'fiat';

  if (validFloat.test(value)) {
    usdInput.dataset.previousValid = value;
    const usd = parseFloat(value);

    if (usd) {
      const btc = usd / currentPrice.usd;
      const eur = usd * currentPrice.eur / currentPrice.usd;
      const btcDigits = Math.max(-Math.log10(btc).toFixed() + 2, 2);
      btcInput.value = btc.toFixed(btcDigits);
      satsInput.value = (btc * SATS_PER_BTC).toFixed(0);
      eurInput.value = eur.toFixed(2);

      satsAmount.innerText = `${(btc * SATS_PER_BTC).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Sats`;
      btcAmount.innerText = `${btc.toLocaleString(undefined, { minimumFractionDigits: btcDigits, maximumFractionDigits: btcDigits })} BTC`;
      usdAmount.innerText = fiatNumberFormat(usd, '$');
      eurAmount.innerText = fiatNumberFormat(eur, '€');
      updateShareURL(parseFloat(value), 'usd');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      usdAmount.innerText = NON_BREAKING_SPACE;
      eurAmount.innerText = NON_BREAKING_SPACE;

      satsInput.value = '';
      btcInput.value = '';
      eurInput.value = '';

      updateShareURL(null);
    }
  }
  else {
    usdInput.value = usdInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}

function handleEurInput(e) {
  const { value } = e.target;
  lastEditedInput = 'fiat';

  if (validFloat.test(value)) {
    eurInput.dataset.previousValid = value;
    const eur = parseFloat(value);

    if (eur) {
      const btc = eur / currentPrice.eur;
      const usd = eur * currentPrice.usd / currentPrice.eur;
      const btcDigits = Math.max(-Math.log10(btc).toFixed() + 2, 2);
      btcInput.value = btc.toFixed(btcDigits);
      satsInput.value = (btc * SATS_PER_BTC).toFixed(0);
      usdInput.value = usd.toFixed(2);

      satsAmount.innerText = `${(btc * SATS_PER_BTC).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Sats`;
      btcAmount.innerText = `${btc.toLocaleString(undefined, { minimumFractionDigits: btcDigits, maximumFractionDigits: btcDigits })} BTC`;
      usdAmount.innerText = fiatNumberFormat(usd, '$');
      eurAmount.innerText = fiatNumberFormat(eur, '€');
      updateShareURL(parseFloat(value), 'eur');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      usdAmount.innerText = NON_BREAKING_SPACE;
      eurAmount.innerText = NON_BREAKING_SPACE;

      satsInput.value = '';
      btcInput.value = '';
      eurInput.value = '';

      updateShareURL(null);
    }
  }
  else {
    eurInput.value = eurInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}

function checkInputLargeNumbers() {
  const inputs = [satsInput, btcInput, usdInput, eurInput];
  
  for (let input of inputs) {
    if (input.value.length > 8) {
      input.classList.add('large-numbers');
    }
    else {
      input.classList.remove('large-numbers');
    }
  }
}

/**
 * Convert large fiat numbers into readable units, IE: 4200000 -> $4.2 million
 * @param {float} fiat - Fiat amount in USD
 * @param {(usd|eur)} symbol - Currency Symbol
 * @returns {string} - Formatted amount or non-breaking space if amount does not exceed required value
 */
function fiatNumberFormat(fiat, symbol) {

  const tiers = [
    { max: 1000000000,       divider: 1000000,       denomination: "Million" },
    { max: 1000000000000,    divider: 1000000000,    denomination: "Billion" },
    { max: 1000000000000000, divider: 1000000000000, denomination: "Trillion" },
  ];

  if (fiat < 1000000) {
    return NON_BREAKING_SPACE;
  }

  for (let tier of tiers) {
    if (fiat < tier.max) {
      let dividedValue = (fiat / tier.divider).toFixed(2);

      if (dividedValue.endsWith('.0') || dividedValue.endsWith('.00')) {
        dividedValue = dividedValue.split('.')[0];
      }
      else if (dividedValue.endsWith('0')) {
        dividedValue = dividedValue.slice(0, -1);
      }
      
      return `≈ ${symbol}${dividedValue} ${tier.denomination}`;
    }
  }

  return `∞`;
}

function handleShowAbout() {
  const belowTheFold = document.getElementById('below-the-fold');
  belowTheFold.classList.remove('hidden');

  const resize = new ResizeObserver(() => {
    // -> On mobile Chrome, when the keyboard is open (ie: the BTC input is active), the element won't be visible
    // since the touch keyboard closing prevents the scrolling to happen without a timeout
    // (0 was tested, but if "share" is open, it will still not scroll into view)
    setTimeout(() => belowTheFold.scrollIntoView({ behavior: 'smooth' }), 100);
    resize.disconnect();
  });

  // Do not scroll until the observer sees the element.
  resize.observe(belowTheFold);
}

function updateShareURL(value, currency) {
  const query = value ? `/?q=${value}+${currency}` : '';
  shareInput.value = `${B2F_URL}${query}`;
}

function handleClickShareButton() {
  const sectionShare = document.getElementById('section-share');
  sectionShare.classList.add('section-share-reveal');

  document.getElementById('above-the-fold').classList.add('sharing-visible');

  // if the display is too small to show 'share' above the fold, scroll to share after animation: (arbitrary magic numbers)
  if (document.documentElement.clientHeight <= 600) {
    setTimeout(() => sectionShare.scrollIntoView({ behavior: 'smooth' }), 300);
  }

  // when below the fold, scroll all the way to the top:
  else if (window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth'});
  }
}

function handleClickShareClose() {
  const sectionShare = document.getElementById('section-share');
  sectionShare.classList.remove('section-share-reveal');

  document.getElementById('above-the-fold').classList.remove('sharing-visible');
}

function handleClickCopyLink() {
  const linkCopied = document.getElementById('share-link-copied');

  navigator.clipboard.writeText(shareInput.value).then(() => {
    linkCopied.classList.add('link-copied-reveal');
    clearTimeout(copyLinkTimer);
    copyLinkTimer = setTimeout(() => linkCopied.classList.remove('link-copied-reveal'), 1500);
  });
}
