const pdfParse = require('pdf-parse');

console.log('--- PDF PARSE DEBUG ---');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('Is it a function?', typeof pdfParse === 'function');
console.log('Keys:', Object.keys(pdfParse));

if (pdfParse.default) {
    console.log('Type of pdfParse.default:', typeof pdfParse.default);
}

try {
    const fresh = require('pdf-parse/lib/pdf-parse');
    console.log('Fresh require successful. Type:', typeof fresh);
} catch (e) {
    console.log('Fresh require failed:', e.message);
}
console.log('-----------------------');
