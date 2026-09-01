const ones = [
  '',
  'یک',
  'دو',
  'سه',
  'چهار',
  'پنج',
  'شش',
  'هفت',
  'هشت',
  'نه',
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];

const tens = [
  '',
  '',
  'بیست',
  'سی',
  'چهل',
  'پنجاه',
  'شصت',
  'هفتاد',
  'هشتاد',
  'نود',
];

const hundreds = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
];

const scales = [
  '',
  'هزار',
  'میلیون',
  'میلیارد',
  'تریلیون',
];


function threeDigitsToWords(num: number): string {

  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const rest = num % 100;


  if (h) {
    parts.push(hundreds[h]);
  }


  if (rest) {

    if (rest < 20) {
      parts.push(ones[rest]);

    } else {

      const t = Math.floor(rest / 10);
      const o = rest % 10;

      parts.push(tens[t]);

      if (o) {
        parts.push(ones[o]);
      }

    }

  }


  return parts.join(' و ');

}



export function numberToWords(
  value: number
): string {

  if (!value) {
    return 'صفر';
  }


  const groups: string[] = [];

  let num = Math.floor(value);

  let index = 0;


  while (num > 0) {

    const group = num % 1000;


    if (group) {

      let text = threeDigitsToWords(group);


      if (scales[index]) {
        text += ' ' + scales[index];
      }


      groups.unshift(text);

    }


    num = Math.floor(num / 1000);
    index++;

  }


  return groups.join(' و ');

}