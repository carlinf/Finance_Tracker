// Currency formatting utility
export const formatCurrency = (amount, currency = 'USD') => {
  const currencyMap = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    INR: { symbol: '₹', locale: 'en-IN' }
  }

  const config = currencyMap[currency] || currencyMap.USD
  
  // For JPY, don't show decimals
  const options = currency === 'JPY' 
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }

  return {
    formatted: amount.toLocaleString(config.locale, options),
    symbol: config.symbol,
    formattedWithSymbol: `${config.symbol}${amount.toLocaleString(config.locale, options)}`
  }
}

