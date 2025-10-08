// Hierarchical location data for dependent dropdowns
// Extendable: add more countries, provinces/states, cities, and zip/postal codes

import ncZips from './zips/US-NC.json';

export const locationData = [
  {
    code: 'US',
    name: 'United States',
    provinces: [
      {
        code: 'NC',
        name: 'North Carolina',
        zips: ncZips,
        cities: [
          { name: 'Raleigh', zips: ['27601', '27603', '27606', '27609'] },
          { name: 'Durham', zips: ['27701', '27703', '27707'] },
          { name: 'Charlotte', zips: ['28202', '28203', '28205'] }
        ]
      },
      {
        code: 'NY',
        name: 'New York',
        cities: [
          { name: 'New York', zips: ['10001', '10002', '10003', '11201'] },
          { name: 'Buffalo', zips: ['14201', '14202'] },
          { name: 'Rochester', zips: ['14604', '14607'] }
        ]
      },
      {
        code: 'CA',
        name: 'California',
        cities: [
          { name: 'Los Angeles', zips: ['90001', '90002', '90003'] },
          { name: 'San Francisco', zips: ['94102', '94103', '94107'] },
          { name: 'San Diego', zips: ['92101', '92103'] }
        ]
      }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    provinces: [
      {
        code: 'ON',
        name: 'Ontario',
        cities: [
          { name: 'Toronto', zips: ['M4B 1B3', 'M5H 2N2', 'M5V 2T6'] },
          { name: 'Ottawa', zips: ['K1A 0B1', 'K1P 1J1'] }
        ]
      },
      {
        code: 'BC',
        name: 'British Columbia',
        cities: [
          { name: 'Vancouver', zips: ['V5K 0A1', 'V6B 1A1'] },
          { name: 'Victoria', zips: ['V8W 1L6', 'V9A 1J9'] }
        ]
      }
    ]
  }
];

export const findCountry = (codeOrName) => {
  if (!codeOrName) return undefined;
  const norm = String(codeOrName).toLowerCase();
  return locationData.find(c => c.code.toLowerCase() === norm || c.name.toLowerCase() === norm);
};

export const findProvince = (country, codeOrName) => {
  if (!country || !codeOrName) return undefined;
  const norm = String(codeOrName).toLowerCase();
  return country.provinces?.find(p => p.code.toLowerCase() === norm || p.name.toLowerCase() === norm);
};

export const findCity = (province, name) => {
  if (!province || !name) return undefined;
  const norm = String(name).toLowerCase();
  return province.cities?.find(c => c.name.toLowerCase() === norm);
};
