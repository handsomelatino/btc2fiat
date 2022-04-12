// Constants
const BITCOIN_API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin';
const SATS_PER_BTC = 100000000;
const BTC_PRECISION = Math.pow(10*8);
const B2F_URL = "https://btc2fiat.me";
const NON_BREAKING_SPACE = '\xa0';

const validFloat = new RegExp(/^\d*\.?\d*$/);
const validInteger = new RegExp(/^\d*$/);

let copyLinkTimer;

// Saved query selectors on init:
let currentPrice = null;
let btcInput = null;
let satsInput = null;
let btcAmount = null;
let satsAmount = null;
let fiatAmount = null;
let btcSatsToggle = null;
let btcToggle = null;
let satsToggle = null;
let shareInput = null;

window.addEventListener('load', initialize);

async function initialize() {
  try {
    const response = await fetch(BITCOIN_API);
    
    if (!response.ok) {
      throw new Error(response.status);
    }

    const data = await response.json();
    currentPrice = data[0].current_price;
  }
  catch (error) {
    console.log(error);
    showFetchingError();
  }

  if (currentPrice !== null) {
    btcInput = document.getElementById('btc-input');
    satsInput = document.getElementById('sats-input');
    fiatInput = document.getElementById('fiat-input');
    btcAmount = document.getElementById('btc-amount');
    satsAmount = document.getElementById('sats-amount');
    fiatAmount = document.getElementById('fiat-amount');
    
    btcSatsToggle = document.getElementById('btc-sats-toggle');
    btcToggle = document.getElementById('btc-toggle');
    satsToggle = document.getElementById('sats-toggle');

    shareInput = document.getElementById('share-input');

    btcInput.addEventListener('input', handleBtcInput);
    satsInput.addEventListener('input', handleSatsInput);
    fiatInput.addEventListener('input', handleFiatInput);

    btcToggle.addEventListener('click', handleToggleUnit);
    satsToggle.addEventListener('click', handleToggleUnit);

    document.getElementById('share-button').addEventListener('click', handleClickShareButton);
    document.getElementById('share-button-close').addEventListener('click', handleClickShareClose);
    document.getElementById('share-copy-link').addEventListener('click', handleClickCopyLink);

    document.getElementById('link-button').addEventListener('click', handleShowAbout);

    setInitialValues();

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.parentElement.removeChild(loadingOverlay);

    document.getElementsByTagName('main')[0].classList.add('main-fade-in');
  }
  else {
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
    }
    else if (query.includes("sat")) {
      input = satsInput;
      handleToggleUnit({ target: satsToggle });
    }
    else if (query.includes("usd")) {
      input = fiatInput;
    }
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

function handleBtcInput(e) {
  const { value } = e.target;

  if (validFloat.test(value)) {
    btcInput.dataset.previousValid = value;
    const btc = parseFloat(value);

    if (btc) {
      satsInput.value = btc * SATS_PER_BTC;
      const usd = (btc * currentPrice).toFixed(btc >= 1 ? 0 : 2);
      fiatInput.value = usd;

      satsAmount.innerText = `${(btc * SATS_PER_BTC).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Sats`;
      btcAmount.innerText = `${value} BTC`;
      fiatAmount.innerText = fiatNumberFormat(usd);

      updateShareURL(btc, 'btc');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      fiatAmount.innerText = NON_BREAKING_SPACE;

      fiatInput.value = '';
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

  if (validInteger.test(value)) {
    satsInput.dataset.previousValid = value;
    const sats = parseInt(value, 10);

    if (sats) {
      const btc = sats / SATS_PER_BTC;

      const btcDigits = Math.max(-Math.log10(btc).toFixed() + 2, 2);
      const fiat = (btc * currentPrice).toFixed(btc >= 1 ? 0 : 2);

      btcInput.value = btc.toFixed(btcDigits);
      fiatInput.value = fiat;

      btcAmount.innerText = `${btc.toLocaleString(undefined, { minimumFractionDigits: btcDigits, maximumFractionDigits: btcDigits })} BTC`;
      satsAmount.innerText = `${value} Sats`;
      fiatAmount.innerText = fiatNumberFormat(fiat);

      updateShareURL(sats, 'sats');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      fiatAmount.innerText = NON_BREAKING_SPACE;

      fiatInput.value = '';
      updateShareURL(null);
    }
  }
  
  else {
    satsInput.value = satsInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}

function handleFiatInput(e) {
  const { value } = e.target;

  if (validFloat.test(value)) {
    fiatInput.dataset.previousValid = value;
    const fiat = parseFloat(value);

    if (fiat) {
      const btc = fiat / currentPrice;
      const btcDigits = Math.max(-Math.log10(btc).toFixed() + 2, 2);
      btcInput.value = btc.toFixed(btcDigits);
      satsInput.value = (btc * SATS_PER_BTC).toFixed(0);

      satsAmount.innerText = `${(btc * SATS_PER_BTC).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Sats`;
      btcAmount.innerText = `${btc.toLocaleString(undefined, { minimumFractionDigits: btcDigits, maximumFractionDigits: btcDigits })} BTC`;
      fiatAmount.innerText = fiatNumberFormat(fiat);

      updateShareURL(parseFloat(value), 'usd');
    }
    else {
      satsAmount.innerText = NON_BREAKING_SPACE;
      btcAmount.innerText = NON_BREAKING_SPACE;
      fiatAmount.innerText = NON_BREAKING_SPACE;

      satsInput.value = '';
      btcInput.value = '';
      updateShareURL(null);
    }
  }
  else {
    fiatInput.value = fiatInput.dataset.previousValid || '';
  }

  checkInputLargeNumbers();
}


function checkInputLargeNumbers() {
  const inputs = [satsInput, btcInput, fiatInput];
  
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
 * @returns {string} - Formatted amount or non-breaking space if amount does not exceed required value
 */
function fiatNumberFormat(fiat) {

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
      
      return `≈ $${dividedValue} ${tier.denomination}`;
    }
  }

  return `∞`;
}

function handleShowAbout() {
  const belowTheFold = document.getElementById('below-the-fold');
  belowTheFold.classList.remove('hidden');

  const resize = new ResizeObserver(() => {
    belowTheFold.scrollIntoView({ behavior: 'smooth' });
    resize.disconnect();
  });

  resize.observe(belowTheFold);
}

function updateShareURL(value, currency) {
  const query = value ? `/?q=${value}+${currency}` : '';
  shareInput.value = `${B2F_URL}${query}`;
}

function handleClickShareButton() {
  const sectionShare = document.getElementById('section-share');
  sectionShare.classList.add('section-share-reveal')
  sectionShare.style.maxHeight = 280;
}

function handleClickShareClose() {
  const sectionShare = document.getElementById('section-share');
  sectionShare.classList.remove('section-share-reveal')
}

function handleClickCopyLink() {
  const linkCopied = document.getElementById('share-link-copied');

  navigator.clipboard.writeText(shareInput.value).then(() => {
    linkCopied.classList.add('link-copied-reveal');
    clearTimeout(copyLinkTimer);
    copyLinkTimer = setTimeout(() => linkCopied.classList.remove('link-copied-reveal'), 1500);
  });
}
